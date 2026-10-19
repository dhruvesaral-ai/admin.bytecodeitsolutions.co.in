import { prisma } from "@/lib/prisma";
import {
  isNextResponse,
  isPrismaNotFound,
  jsonError,
  jsonOk,
  parseJsonBody,
} from "@/lib/api/http";
import {
  parseCarousalUpdateBody,
  type CarousalWriteBody,
} from "@/lib/carousal";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    const carousal = await prisma.carousal.findUnique({ where: { id } });
    if (!carousal) {
      return jsonError("Carousal not found", 404);
    }
    return jsonOk({ data: carousal });
  } catch {
    return jsonError("Failed to fetch carousal", 500);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;

  const body = await parseJsonBody<CarousalWriteBody>(request);
  if (isNextResponse(body)) {
    return body;
  }

  const parsed = parseCarousalUpdateBody(body);
  if ("error" in parsed) {
    return jsonError(parsed.error, 400);
  }

  try {
    const carousal = await prisma.carousal.update({
      where: { id },
      data: parsed.data,
    });
    return jsonOk({ data: carousal });
  } catch (error) {
    if (isPrismaNotFound(error)) {
      return jsonError("Carousal not found", 404);
    }
    return jsonError("Failed to update carousal", 500);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    await prisma.carousal.delete({ where: { id } });
    return jsonOk({ data: { id } });
  } catch (error) {
    if (isPrismaNotFound(error)) {
      return jsonError("Carousal not found", 404);
    }
    return jsonError("Failed to delete carousal", 500);
  }
}
