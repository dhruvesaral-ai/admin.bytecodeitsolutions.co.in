import type { Prisma } from "@/generated/prisma/client";
import type { CarousalPosition as PrismaCarousalPosition } from "@/generated/prisma/enums";
import {
  CAROUSAL_POSITIONS,
  type CarousalPosition,
} from "@/lib/carousal-position";

export type CarousalWriteBody = {
  position?: CarousalPosition;
  carousalSlideIds?: string[];
};

const prismaPositionByApiPosition: Record<
  CarousalPosition,
  PrismaCarousalPosition
> = {
  homepage: "homepage",
  "offer-banner": "offer_banner",
  development: "development",
  programs: "programs",
  training: "training",
};

const apiPositionByPrismaPosition: Record<
  PrismaCarousalPosition,
  CarousalPosition
> = {
  homepage: "homepage",
  offer_banner: "offer-banner",
  development: "development",
  programs: "programs",
  training: "training",
};

function parsePosition(
  value: unknown,
): { value: PrismaCarousalPosition } | { error: string } {
  const position = CAROUSAL_POSITIONS.find((candidate) => candidate === value);
  if (!position) {
    return {
      error: `position must be one of: ${CAROUSAL_POSITIONS.join(", ")}`,
    };
  }
  return { value: prismaPositionByApiPosition[position] };
}

export function toApiCarousal<
  T extends { position: PrismaCarousalPosition; slides?: { id: string }[] },
>(
  carousal: T,
): Omit<T, "position"> & { position: CarousalPosition; carousalSlideIds: string[] } {
  return {
    ...carousal,
    position: apiPositionByPrismaPosition[carousal.position],
    carousalSlideIds: carousal.slides ? carousal.slides.map((slide) => slide.id) : [],
  };
}

export function parseCarousalCreateBody(
  body: CarousalWriteBody,
): { data: Prisma.CarousalCreateInput } | { error: string } {
  if (body.position === undefined) {
    return { error: "position is required" };
  }
  const position = parsePosition(body.position);
  if ("error" in position) {
    return position;
  }

  const slideIds = body.carousalSlideIds ?? [];
  if (!Array.isArray(slideIds) || slideIds.some((id) => typeof id !== "string")) {
    return { error: "carousalSlideIds must be an array of strings" };
  }

  return {
    data: {
      position: position.value,
      slides: slideIds.length > 0 ? { connect: slideIds.map((id) => ({ id })) } : undefined,
    },
  };
}

export function parseCarousalUpdateBody(
  body: CarousalWriteBody,
): { data: Prisma.CarousalUpdateInput } | { error: string } {
  const data: Prisma.CarousalUpdateInput = {};

  if (body.position !== undefined) {
    const position = parsePosition(body.position);
    if ("error" in position) {
      return position;
    }
    data.position = position.value;
  }

  if (body.carousalSlideIds !== undefined) {
    if (
      !Array.isArray(body.carousalSlideIds) ||
      body.carousalSlideIds.some((id) => typeof id !== "string")
    ) {
      return { error: "carousalSlideIds must be an array of strings" };
    }
    data.slides = {
      set: body.carousalSlideIds.map((id) => ({ id })),
    };
  }

  if (Object.keys(data).length === 0) {
    return { error: "At least one of position or carousalSlideIds is required" };
  }

  return { data };
}
