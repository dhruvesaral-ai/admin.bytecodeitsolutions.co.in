import { parse, stringify } from "csv/sync";
import type { Prisma } from "@/generated/prisma/client";
import type { CourseWriteBody } from "@/lib/course";
import { parseCourseCreateBody } from "@/lib/course";
import { prisma } from "@/lib/db";
import {
  isPrismaForeignKeyViolation,
  jsonError,
  jsonOk,
} from "@/lib/api/http";

const csvHeaders = [
  "name",
  "shortDescription",
  "longDescription",
  "originalPrice",
  "discountedPrice",
  "rating",
  "technologyTags",
  "duration",
  "status",
  "courseImgUrl",
  "portraitImgUrl",
  "syllabus",
  "categoryName",
  "isPlacementGurranted",
  "isInSale",
  "moduleTitles",
];

const maxFileSize = 1024 * 1024;
const maxRows = 500;

function splitDelimited(value: string) {
  return value
    .split(";")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseBoolean(value: string, field: string, rowNumber: number) {
  const normalized = value.trim().toLowerCase();
  if (normalized === "") {
    return { value: false } as const;
  }
  if (normalized === "true") {
    return { value: true } as const;
  }
  if (normalized === "false") {
    return { value: false } as const;
  }
  return { error: `Row ${rowNumber}: ${field} must be true or false` } as const;
}

function normalizeName(value: string) {
  return value.trim().toLowerCase();
}

export async function GET() {
  const content = stringify([csvHeaders], { bom: true });
  return new Response(content, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="course-import-template.csv"',
      "Cache-Control": "no-store",
    },
  });
}

export async function POST(request: Request) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return jsonError("Upload a CSV file using the file field", 400);
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return jsonError("Upload a CSV file using the file field", 400);
  }
  if (file.size === 0) {
    return jsonError("The CSV file is empty", 400);
  }
  if (file.size > maxFileSize) {
    return jsonError("The CSV file must be 1 MB or smaller", 400);
  }

  let records: string[][];
  try {
    records = parse(await file.text(), {
      bom: true,
      skip_empty_lines: true,
      trim: true,
    });
  } catch (error) {
    return jsonError(
      `Unable to parse CSV: ${error instanceof Error ? error.message : String(error)}`,
      400,
    );
  }

  if (records.length < 2) {
    return jsonError("Add at least one course row below the CSV header", 400);
  }
  if (records.length - 1 > maxRows) {
    return jsonError(`A maximum of ${maxRows} courses can be imported at once`, 400);
  }

  const headers = records[0].map((header) => header.trim());
  const missingHeaders = csvHeaders.filter((header) => !headers.includes(header));
  const unexpectedHeaders = headers.filter((header) => !csvHeaders.includes(header));
  if (new Set(headers).size !== headers.length) {
    return jsonError("The CSV contains duplicate column headers", 400);
  }
  if (missingHeaders.length > 0 || unexpectedHeaders.length > 0) {
    return jsonError(
      [
        missingHeaders.length > 0
          ? `Missing columns: ${missingHeaders.join(", ")}`
          : "",
        unexpectedHeaders.length > 0
          ? `Unexpected columns: ${unexpectedHeaders.join(", ")}`
          : "",
      ]
        .filter(Boolean)
        .join(". "),
      400,
    );
  }

  type CsvRow = {
    rowNumber: number;
    values: Record<string, string> | null;
    error: string | null;
  };
  const rows: CsvRow[] = records.slice(1).map((record, index) => {
    if (record.length !== headers.length) {
      return {
        rowNumber: index + 2,
        values: null,
        error: `Row ${index + 2}: expected ${headers.length} columns but found ${record.length}`,
      };
    }
    return {
      rowNumber: index + 2,
      values: Object.fromEntries(
        headers.map((header, column) => [header, record[column]]),
      ) as Record<string, string>,
      error: null,
    };
  });

  let categories: Array<{ id: string; name: string }>;
  let modules: Array<{ id: string; title: string }>;
  try {
    [categories, modules] = await Promise.all([
      prisma.courseCategorie.findMany({
        select: { id: true, name: true },
      }),
      prisma.courseModule.findMany({
        select: { id: true, title: true },
      }),
    ]);
  } catch (error) {
    return jsonError(error, 500);
  }
  const categoriesByName = new Map<string, typeof categories>();
  const modulesByTitle = new Map<string, typeof modules>();

  for (const category of categories) {
    const key = normalizeName(category.name);
    categoriesByName.set(key, [...(categoriesByName.get(key) ?? []), category]);
  }
  for (const courseModule of modules) {
    const key = normalizeName(courseModule.title);
    modulesByTitle.set(key, [
      ...(modulesByTitle.get(key) ?? []),
      courseModule,
    ]);
  }

  const validated: Prisma.CourseUncheckedCreateInput[] = [];
  const errors = rows.flatMap((row) => {
    if (row.error !== null || row.values === null) {
      return [row.error ?? `Row ${row.rowNumber}: invalid data`];
    }

    const values = row.values;
    const categoryName = values.categoryName.trim();
    let courseCategorieId: string | null = null;
    if (categoryName !== "") {
      const matches = categoriesByName.get(normalizeName(categoryName)) ?? [];
      if (matches.length === 0) {
        return [`Row ${row.rowNumber}: category "${categoryName}" was not found`];
      }
      if (matches.length > 1) {
        return [`Row ${row.rowNumber}: category "${categoryName}" is ambiguous`];
      }
      courseCategorieId = matches[0].id;
    }

    const moduleIds: string[] = [];
    for (const title of new Set(splitDelimited(values.moduleTitles))) {
      const matches = modulesByTitle.get(normalizeName(title)) ?? [];
      if (matches.length === 0) {
        return [`Row ${row.rowNumber}: module "${title}" was not found`];
      }
      if (matches.length > 1) {
        return [`Row ${row.rowNumber}: module "${title}" is ambiguous`];
      }
      moduleIds.push(matches[0].id);
    }

    const placement = parseBoolean(
      values.isPlacementGurranted,
      "isPlacementGurranted",
      row.rowNumber,
    );
    const inSale = parseBoolean(values.isInSale, "isInSale", row.rowNumber);
    if ("error" in placement || "error" in inSale) {
      return [
        ...("error" in placement ? [placement.error] : []),
        ...("error" in inSale ? [inSale.error] : []),
      ];
    }

    const rating =
      values.rating.trim() === "" ? null : Number(values.rating.trim());
    if (rating !== null && !Number.isFinite(rating)) {
      return [`Row ${row.rowNumber}: rating must be a valid number`];
    }

    const body: CourseWriteBody = {
      name: values.name,
      shortDescription: values.shortDescription || null,
      longDescription: values.longDescription || null,
      originalPrice: values.originalPrice || null,
      discountedPrice: values.discountedPrice || null,
      rating,
      technologyTags: splitDelimited(values.technologyTags),
      duration: values.duration || null,
      status: (values.status || "active") as CourseWriteBody["status"],
      courseImgUrl: values.courseImgUrl || null,
      portraitImgUrl: values.portraitImgUrl || null,
      syllabus: values.syllabus || null,
      courseCategorieId,
      isPlacementGurranted: placement.value,
      isInSale: inSale.value,
      courseModuleIds: moduleIds,
    };
    const parsed = parseCourseCreateBody(body);
    if ("error" in parsed) {
      return [`Row ${row.rowNumber}: ${parsed.error}`];
    }
    validated.push(parsed.data);
    return [];
  });

  if (errors.length > 0) {
    return jsonError(errors.join("\n"), 400);
  }

  try {
    const result = await prisma.$transaction(
      validated.map((data) =>
        prisma.course.create({
          data,
        }),
      ),
    );
    return jsonOk({ data: { created: result.length } }, 201);
  } catch (error) {
    if (isPrismaForeignKeyViolation(error)) {
      return jsonError("A referenced category no longer exists; no courses were imported", 400);
    }
    return jsonError(error, 500);
  }
}
