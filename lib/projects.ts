import type { Prisma } from "@/generated/prisma/client";

export type ProjectsWriteBody = {
  name?: string;
  shortDescription?: string | null;
  longDescription?: string | null;
  imgUrl?: string | null;
  videoUrl?: string | null;
};

function parseRequiredString(value: unknown): { value: string } | { error: string } {
  if (typeof value !== "string" || value.trim() === "") {
    return { error: "name must be a non-empty string" };
  }
  return { value: value.trim() };
}

function parseNullableString(
  value: unknown,
  field: string,
): { value: string | null } | { error: string } {
  if (value === null) {
    return { value: null };
  }
  if (typeof value !== "string") {
    return { error: `${field} must be a string or null` };
  }
  const trimmed = value.trim();
  return { value: trimmed === "" ? null : trimmed };
}

export function parseProjectsCreateBody(
  body: ProjectsWriteBody,
): { data: Prisma.ProjectsCreateInput } | { error: string } {
  const name = parseRequiredString(body.name);
  if ("error" in name) {
    return name;
  }

  const data: Prisma.ProjectsCreateInput = { name: name.value };

  if (body.shortDescription !== undefined) {
    const shortDescription = parseNullableString(body.shortDescription, "shortDescription");
    if ("error" in shortDescription) {
      return shortDescription;
    }
    data.shortDescription = shortDescription.value;
  }

  if (body.longDescription !== undefined) {
    const longDescription = parseNullableString(body.longDescription, "longDescription");
    if ("error" in longDescription) {
      return longDescription;
    }
    data.longDescription = longDescription.value;
  }

  if (body.imgUrl !== undefined) {
    const imgUrl = parseNullableString(body.imgUrl, "imgUrl");
    if ("error" in imgUrl) {
      return imgUrl;
    }
    data.imgUrl = imgUrl.value;
  }

  if (body.videoUrl !== undefined) {
    const videoUrl = parseNullableString(body.videoUrl, "videoUrl");
    if ("error" in videoUrl) {
      return videoUrl;
    }
    data.videoUrl = videoUrl.value;
  }

  return { data };
}

export function parseProjectsUpdateBody(
  body: ProjectsWriteBody,
): { data: Prisma.ProjectsUpdateInput } | { error: string } {
  const data: Prisma.ProjectsUpdateInput = {};

  if (body.name !== undefined) {
    const name = parseRequiredString(body.name);
    if ("error" in name) {
      return name;
    }
    data.name = name.value;
  }

  if (body.shortDescription !== undefined) {
    const shortDescription = parseNullableString(body.shortDescription, "shortDescription");
    if ("error" in shortDescription) {
      return shortDescription;
    }
    data.shortDescription = shortDescription.value;
  }

  if (body.longDescription !== undefined) {
    const longDescription = parseNullableString(body.longDescription, "longDescription");
    if ("error" in longDescription) {
      return longDescription;
    }
    data.longDescription = longDescription.value;
  }

  if (body.imgUrl !== undefined) {
    const imgUrl = parseNullableString(body.imgUrl, "imgUrl");
    if ("error" in imgUrl) {
      return imgUrl;
    }
    data.imgUrl = imgUrl.value;
  }

  if (body.videoUrl !== undefined) {
    const videoUrl = parseNullableString(body.videoUrl, "videoUrl");
    if ("error" in videoUrl) {
      return videoUrl;
    }
    data.videoUrl = videoUrl.value;
  }

  if (Object.keys(data).length === 0) {
    return {
      error:
        "At least one of name, shortDescription, longDescription, imgUrl, or videoUrl is required",
    };
  }

  return { data };
}
