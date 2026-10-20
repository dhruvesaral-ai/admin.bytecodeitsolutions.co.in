import type { Prisma } from "@/generated/prisma/client";

export type SuccessStoryWriteBody = {
  videoIds?: string[];
};

function parseVideoIds(value: unknown): { value: string[] } | { error: string } {
  if (
    !Array.isArray(value) ||
    !value.every((id): id is string => typeof id === "string")
  ) {
    return { error: "videoIds must be an array of strings" };
  }
  return {
    value: value.map((id) => id.trim()).filter(Boolean),
  };
}

export function parseSuccessStoryCreateBody(
  body: SuccessStoryWriteBody,
): { data: Prisma.SuccessStoryCreateInput } | { error: string } {
  const videoIds = parseVideoIds(body.videoIds);
  if ("error" in videoIds) {
    return videoIds;
  }
  return { data: { videoIds: videoIds.value } };
}

export function parseSuccessStoryUpdateBody(
  body: SuccessStoryWriteBody,
): { data: Prisma.SuccessStoryUpdateInput } | { error: string } {
  if (body.videoIds === undefined) {
    return { error: "videoIds is required" };
  }
  const videoIds = parseVideoIds(body.videoIds);
  if ("error" in videoIds) {
    return videoIds;
  }
  return { data: { videoIds: videoIds.value } };
}
