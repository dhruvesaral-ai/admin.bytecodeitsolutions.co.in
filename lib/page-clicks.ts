import type { Prisma } from "@/generated/prisma/client";

export type PageClicksWriteBody = {
  pageId?: string;
  fieldName?: string;
  clicks?: number;
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

function parseCount(value: unknown): { value: number } | { error: string } {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    return { error: "clicks must be a non-negative integer" };
  }
  return { value };
}

export function parsePageClicksCreateBody(
  body: PageClicksWriteBody,
): { data: Prisma.PageClicksCreateInput } | { error: string } {
  const pageId = parseNonEmptyString(body.pageId, "pageId");
  if ("error" in pageId) {
    return pageId;
  }

  const fieldName = parseNonEmptyString(body.fieldName, "fieldName");
  if ("error" in fieldName) {
    return fieldName;
  }

  const data: Prisma.PageClicksCreateInput = {
    fieldName: fieldName.value,
    page: { connect: { id: pageId.value } },
  };

  if (body.clicks !== undefined) {
    const clicks = parseCount(body.clicks);
    if ("error" in clicks) {
      return clicks;
    }
    data.clicks = clicks.value;
  }

  return { data };
}

export function parsePageClicksUpdateBody(
  body: PageClicksWriteBody,
): { data: Prisma.PageClicksUpdateInput } | { error: string } {
  const data: Prisma.PageClicksUpdateInput = {};

  if (body.pageId !== undefined) {
    const pageId = parseNonEmptyString(body.pageId, "pageId");
    if ("error" in pageId) {
      return pageId;
    }
    data.page = { connect: { id: pageId.value } };
  }

  if (body.fieldName !== undefined) {
    const fieldName = parseNonEmptyString(body.fieldName, "fieldName");
    if ("error" in fieldName) {
      return fieldName;
    }
    data.fieldName = fieldName.value;
  }

  if (body.clicks !== undefined) {
    const clicks = parseCount(body.clicks);
    if ("error" in clicks) {
      return clicks;
    }
    data.clicks = clicks.value;
  }

  if (Object.keys(data).length === 0) {
    return { error: "At least one of pageId, fieldName, or clicks is required" };
  }

  return { data };
}

export const pageClicksDetailInclude = {
  page: {
    select: { id: true, routeName: true, heading: true, visits: true },
  },
} as const;
