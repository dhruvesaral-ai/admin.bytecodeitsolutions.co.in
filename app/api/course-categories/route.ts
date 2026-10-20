import { prisma } from "@/lib/db";
import {
  isNextResponse,
  isPrismaUniqueViolation,
  jsonError,
  jsonOk,
  parseJsonBody,
} from "@/lib/api/http";
import {
  parseCourseCategorieCreateBody,
  type CourseCategorieWriteBody,
} from "@/lib/course-categorie";

export async function GET() {
  try {
    const categories = await prisma.courseCategorie.findMany({
      orderBy: { name: "asc" },
    });
    return jsonOk({ data: categories });
  } catch (error) {
    return jsonError(error, 500);
  }
}

export async function POST(request: Request) {
  const body = await parseJsonBody<CourseCategorieWriteBody>(request);
  if (isNextResponse(body)) {
    return body;
  }

  const parsed = parseCourseCategorieCreateBody(body);
  if ("error" in parsed) {
    return jsonError(parsed.error, 400);
  }

  try {
    const category = await prisma.courseCategorie.create({ data: parsed.data });
    return jsonOk({ data: category }, 201);
  } catch (error) {
    if (isPrismaUniqueViolation(error)) {
      return jsonError("A category with this slug already exists", 409);
    }
    return jsonError(error, 500);
  }
}
