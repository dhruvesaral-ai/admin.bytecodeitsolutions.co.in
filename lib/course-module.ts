import type { Prisma } from "@/generated/prisma/client";

export type CourseModuleWriteBody = {
  title?: string;
  description?: string | null;
};

function parseNonEmptyString(
  value: unknown,
  field: string,
): { value: string } | { error: string } {
  if (typeof value !== "string" || value.trim() === "") {
    return { error: `${field} must be a non-empty string` };
  }
  return { value: value.trim() };
}

function parseOptionalDescription(
  value: unknown,
): { value: string | null } | { error: string } {
  if (value === null) {
    return { value: null };
  }
  if (value === undefined) {
    return { error: "description must be a string or null" };
  }
  if (typeof value !== "string") {
    return { error: "description must be a string or null" };
  }
  const trimmed = value.trim();
  return { value: trimmed === "" ? null : trimmed };
}

export function parseCourseModuleCreateBody(
  body: CourseModuleWriteBody,
): { data: Prisma.CourseModuleCreateInput } | { error: string } {
  const title = parseNonEmptyString(body.title, "title");
  if ("error" in title) {
    return title;
  }

  const data: Prisma.CourseModuleCreateInput = { title: title.value };

  if (body.description !== undefined) {
    const description = parseOptionalDescription(body.description);
    if ("error" in description) {
      return description;
    }
    data.description = description.value;
  }

  return { data };
}

export function parseCourseModuleUpdateBody(
  body: CourseModuleWriteBody,
): { data: Prisma.CourseModuleUpdateInput } | { error: string } {
  const data: Prisma.CourseModuleUpdateInput = {};

  if (body.title !== undefined) {
    const title = parseNonEmptyString(body.title, "title");
    if ("error" in title) {
      return title;
    }
    data.title = title.value;
  }

  if (body.description !== undefined) {
    const description = parseOptionalDescription(body.description);
    if ("error" in description) {
      return description;
    }
    data.description = description.value;
  }

  if (Object.keys(data).length === 0) {
    return { error: "At least one of title or description is required" };
  }

  return { data };
}
