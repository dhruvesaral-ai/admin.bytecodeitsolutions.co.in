import type { Prisma } from "@/generated/prisma/client";

export type CourseCategorieWriteBody = {
  name?: string;
  slug?: string;
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

export function parseCourseCategorieCreateBody(
  body: CourseCategorieWriteBody,
): { data: Prisma.CourseCategorieCreateInput } | { error: string } {
  const name = parseNonEmptyString(body.name, "name");
  if ("error" in name) {
    return name;
  }

  const slug = parseNonEmptyString(body.slug, "slug");
  if ("error" in slug) {
    return slug;
  }

  return {
    data: {
      name: name.value,
      slug: slug.value,
    },
  };
}

export function parseCourseCategorieUpdateBody(
  body: CourseCategorieWriteBody,
): { data: Prisma.CourseCategorieUpdateInput } | { error: string } {
  const data: Prisma.CourseCategorieUpdateInput = {};

  if (body.name !== undefined) {
    const name = parseNonEmptyString(body.name, "name");
    if ("error" in name) {
      return name;
    }
    data.name = name.value;
  }

  if (body.slug !== undefined) {
    const slug = parseNonEmptyString(body.slug, "slug");
    if ("error" in slug) {
      return slug;
    }
    data.slug = slug.value;
  }

  if (Object.keys(data).length === 0) {
    return { error: "At least one of name or slug is required" };
  }

  return { data };
}
