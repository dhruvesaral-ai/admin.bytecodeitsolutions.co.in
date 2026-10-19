import type { Prisma } from "@/generated/prisma/client";

export type CarousalWriteBody = {
  position?: number;
  carousalSlideIds?: string[];
};

export function parseCarousalCreateBody(
  body: CarousalWriteBody,
): { data: Prisma.CarousalCreateInput } | { error: string } {
  if (body.position === undefined || body.position === null) {
    return { error: "position is required" };
  }
  if (typeof body.position !== "number" || !Number.isInteger(body.position)) {
    return { error: "position must be an integer" };
  }

  const slideIds = body.carousalSlideIds ?? [];
  if (!Array.isArray(slideIds) || slideIds.some((id) => typeof id !== "string")) {
    return { error: "carousalSlideIds must be an array of strings" };
  }

  return {
    data: {
      position: body.position,
      carousalSlideIds: slideIds,
    },
  };
}

export function parseCarousalUpdateBody(
  body: CarousalWriteBody,
): { data: Prisma.CarousalUpdateInput } | { error: string } {
  const data: Prisma.CarousalUpdateInput = {};

  if (body.position !== undefined) {
    if (typeof body.position !== "number" || !Number.isInteger(body.position)) {
      return { error: "position must be an integer" };
    }
    data.position = body.position;
  }

  if (body.carousalSlideIds !== undefined) {
    if (
      !Array.isArray(body.carousalSlideIds) ||
      body.carousalSlideIds.some((id) => typeof id !== "string")
    ) {
      return { error: "carousalSlideIds must be an array of strings" };
    }
    data.carousalSlideIds = body.carousalSlideIds;
  }

  if (Object.keys(data).length === 0) {
    return { error: "At least one of position or carousalSlideIds is required" };
  }

  return { data };
}
