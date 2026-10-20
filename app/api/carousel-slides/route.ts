import { prisma } from "@/lib/db";
import {
  isNextResponse,
  jsonError,
  jsonOk,
  parseJsonBody,
} from "@/lib/api/http";
import {
  parseCarouselSlideCreateBody,
  type CarouselSlideWriteBody,
} from "@/lib/carousel-slide";

export async function GET() {
  try {
    const slides = await prisma.carouselSlide.findMany({
      orderBy: { order: "asc" },
    });
    return jsonOk({ data: slides });
  } catch (error) {
    return jsonError(error, 500);
  }
}

export async function POST(request: Request) {
  const body = await parseJsonBody<CarouselSlideWriteBody>(request);
  if (isNextResponse(body)) {
    return body;
  }

  const parsed = parseCarouselSlideCreateBody(body);
  if ("error" in parsed) {
    return jsonError(parsed.error, 400);
  }

  try {
    const slide = await prisma.carouselSlide.create({ data: parsed.data });
    return jsonOk({ data: slide }, 201);
  } catch (error) {
    return jsonError(error, 500);
  }
}
