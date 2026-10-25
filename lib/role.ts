import type { Prisma } from "@/generated/prisma/client";
import { slugify } from "@/lib/slug";

export type RoleWriteBody = {
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

export function parseRoleCreateBody(
  body: RoleWriteBody,
): { data: Prisma.RoleCreateInput } | { error: string } {
  const name = parseNonEmptyString(body.name, "name");
  if ("error" in name) {
    return name;
  }

  let slugValue = body.slug ? slugify(body.slug) : slugify(name.value);
  if (!slugValue) {
    return { error: "name or slug must produce a valid non-empty slug" };
  }

  return {
    data: {
      name: name.value,
      slug: slugValue,
    },
  };
}

export function parseRoleUpdateBody(
  body: RoleWriteBody,
): { data: Prisma.RoleUpdateInput } | { error: string } {
  const data: Prisma.RoleUpdateInput = {};

  if (body.name !== undefined) {
    const name = parseNonEmptyString(body.name, "name");
    if ("error" in name) {
      return name;
    }
    data.name = name.value;
    if (body.slug === undefined) {
      data.slug = slugify(name.value);
    }
  }

  if (body.slug !== undefined) {
    const slug = parseNonEmptyString(body.slug, "slug");
    if ("error" in slug) {
      return slug;
    }
    const slugValue = slugify(slug.value);
    if (!slugValue) {
      return { error: "slug must produce a valid non-empty slug" };
    }
    data.slug = slugValue;
  }

  if (Object.keys(data).length === 0) {
    return { error: "At least one of name or slug is required to update" };
  }

  return { data };
}
