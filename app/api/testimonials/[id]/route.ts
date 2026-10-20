import { prisma } from "@/lib/db";
import {
  isNextResponse,
  isPrismaNotFound,
  jsonError,
  jsonOk,
  parseJsonBody,
} from "@/lib/api/http";
import {
  parseTestimonialUpdateBody,
  type TestimonialWriteBody,
} from "@/lib/testimonial";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  try {
    const testimonial = await prisma.testimonial.findUnique({ where: { id } });
    if (!testimonial) {
      return jsonError("Testimonial not found", 404);
    }
    return jsonOk({ data: testimonial });
  } catch (error) {
    return jsonError(error, 500);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const body = await parseJsonBody<TestimonialWriteBody>(request);
  if (isNextResponse(body)) {
    return body;
  }
  const parsed = parseTestimonialUpdateBody(body);
  if ("error" in parsed) {
    return jsonError(parsed.error, 400);
  }

  try {
    const testimonial = await prisma.testimonial.update({
      where: { id },
      data: parsed.data,
    });
    return jsonOk({ data: testimonial });
  } catch (error) {
    if (isPrismaNotFound(error)) {
      return jsonError("Testimonial not found", 404);
    }
    return jsonError(error, 500);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  try {
    await prisma.testimonial.delete({ where: { id } });
    return jsonOk({ data: { id } });
  } catch (error) {
    if (isPrismaNotFound(error)) {
      return jsonError("Testimonial not found", 404);
    }
    return jsonError(error, 500);
  }
}
