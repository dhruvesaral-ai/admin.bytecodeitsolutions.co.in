import type { Prisma } from "@/generated/prisma/client";

export type PageWriteBody = {
  heading?: string;
  subheading?: string;
  videoUrl?: string | null;
  routeName?: string;
  visits?: number;
};

/**
 * Normalizes user-entered route names:
 * - Trims whitespace
 * - Strips leading/trailing slashes (e.g. "/home/" -> "home")
 * - Converts spaces to hyphens
 * - Converts to lowercase
 * - Strips characters other than letters, numbers, hyphens, and underscores
 */
export function formatRouteName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/^\/+|\/+$/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-_]/g, "");
}

function parseNonEmptyString(
  value: unknown,
  field: string,
): { value: string } | { error: string } {
  if (typeof value !== "string" || value.trim() === "") {
    return { error: `${field} must be a non-empty string` };
  }
  return { value: value.trim() };
}

function parseNullableString(
  value: unknown,
  field: string,
): { value: string | null } | { error: string } {
  if (value === null || value === undefined) {
    return { value: null };
  }
  if (typeof value !== "string") {
    return { error: `${field} must be a string or null` };
  }
  const trimmed = value.trim();
  return { value: trimmed === "" ? null : trimmed };
}

function parseCount(value: unknown): { value: number } | { error: string } {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    return { error: "visits must be a non-negative integer" };
  }
  return { value };
}

export function parsePageCreateBody(
  body: PageWriteBody,
): { data: Prisma.PageCreateInput } | { error: string } {
  const heading = parseNonEmptyString(body.heading, "heading");
  if ("error" in heading) {
    return heading;
  }

  const subheading = parseNonEmptyString(body.subheading, "subheading");
  if ("error" in subheading) {
    return subheading;
  }

  let videoUrl: string | null = null;
  if (body.videoUrl !== undefined && body.videoUrl !== null) {
    const parsedVideoUrl = parseNullableString(body.videoUrl, "videoUrl");
    if ("error" in parsedVideoUrl) {
      return parsedVideoUrl;
    }
    videoUrl = parsedVideoUrl.value;
  }

  const rawRouteName = parseNonEmptyString(body.routeName, "routeName");
  if ("error" in rawRouteName) {
    return rawRouteName;
  }

  const routeName = formatRouteName(rawRouteName.value);
  if (!routeName) {
    return {
      error:
        "routeName must produce a valid non-empty route path (e.g. 'home', 'training')",
    };
  }

  let visits: number | undefined;
  if (body.visits !== undefined) {
    const parsedVisits = parseCount(body.visits);
    if ("error" in parsedVisits) {
      return parsedVisits;
    }
    visits = parsedVisits.value;
  }

  return {
    data: {
      heading: heading.value,
      subheading: subheading.value,
      videoUrl,
      routeName,
      ...(visits !== undefined ? { visits } : {}),
    },
  };
}

export function parsePageUpdateBody(
  body: PageWriteBody,
): { data: Prisma.PageUpdateInput } | { error: string } {
  const data: Prisma.PageUpdateInput = {};

  if (body.heading !== undefined) {
    const heading = parseNonEmptyString(body.heading, "heading");
    if ("error" in heading) {
      return heading;
    }
    data.heading = heading.value;
  }

  if (body.subheading !== undefined) {
    const subheading = parseNonEmptyString(body.subheading, "subheading");
    if ("error" in subheading) {
      return subheading;
    }
    data.subheading = subheading.value;
  }

  if (body.videoUrl !== undefined) {
    const videoUrl = parseNullableString(body.videoUrl, "videoUrl");
    if ("error" in videoUrl) {
      return videoUrl;
    }
    data.videoUrl = videoUrl.value;
  }

  if (body.routeName !== undefined) {
    const rawRouteName = parseNonEmptyString(body.routeName, "routeName");
    if ("error" in rawRouteName) {
      return rawRouteName;
    }
    const routeName = formatRouteName(rawRouteName.value);
    if (!routeName) {
      return {
        error:
          "routeName must produce a valid non-empty route path (e.g. 'home', 'training')",
      };
    }
    data.routeName = routeName;
  }

  if (body.visits !== undefined) {
    const visits = parseCount(body.visits);
    if ("error" in visits) {
      return visits;
    }
    data.visits = visits.value;
  }

  if (Object.keys(data).length === 0) {
    return {
      error:
        "At least one of heading, subheading, videoUrl, routeName, or visits is required",
    };
  }

  return { data };
}
