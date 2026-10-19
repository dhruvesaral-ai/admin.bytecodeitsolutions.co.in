import { prisma } from "@/lib/prisma";
import {
  isNextResponse,
  isPrismaNotFound,
  jsonError,
  jsonOk,
  parseJsonBody,
} from "@/lib/api/http";
import {
  parseCarouselSlideUpdateBody,
  type CarouselSlideWriteBody,
} from "@/lib/carousel-slide";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    const slide = await prisma.carouselSlide.findUnique({ where: { id } });
    if (!slide) {
      return jsonError("Carousel slide not found", 404);
    }
    return jsonOk({ data: slide });
  } catch {
    return jsonError("Failed to fetch carousel slide", 500);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;

  const body = await parseJsonBody<CarouselSlideWriteBody>(request);
  if (isNextResponse(body)) {
    return body;
  }

  const parsed = parseCarouselSlideUpdateBody(body);
  if ("error" in parsed) {
    return jsonError(parsed.error, 400);
  }

  try {
    const slide = await prisma.carouselSlide.update({
      where: { id },
      data: parsed.data,
    });
    return jsonOk({ data: slide });
  } catch (error) {
    if (isPrismaNotFound(error)) {
      return jsonError("Carousel slide not found", 404);
    }
    return jsonError("Failed to update carousel slide", 500);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    await prisma.carouselSlide.delete({ where: { id } });
    return jsonOk({ data: { id } });
  } catch (error) {
    if (isPrismaNotFound(error)) {
      return jsonError("Carousel slide not found", 404);
    }
    return jsonError("Failed to delete carousel slide", 500);
  }
}
