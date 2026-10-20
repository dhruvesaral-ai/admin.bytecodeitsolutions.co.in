import { prisma } from "@/lib/db";
import {
  isNextResponse,
  jsonError,
  jsonOk,
  parseJsonBody,
} from "@/lib/api/http";
import {
  parseTestimonialCreateBody,
  type TestimonialWriteBody,
} from "@/lib/testimonial";

export async function GET() {
  try {
    const testimonials = await prisma.testimonial.findMany({
      orderBy: { name: "asc" },
    });
    return jsonOk({ data: testimonials });
  } catch (error) {
    return jsonError(error, 500);
  }
}

export async function POST(request: Request) {
  const body = await parseJsonBody<TestimonialWriteBody>(request);
  if (isNextResponse(body)) {
    return body;
  }
  const parsed = parseTestimonialCreateBody(body);
  if ("error" in parsed) {
    return jsonError(parsed.error, 400);
  }

  try {
    const testimonial = await prisma.testimonial.create({ data: parsed.data });
    return jsonOk({ data: testimonial }, 201);
  } catch (error) {
    return jsonError(error, 500);
  }
}
