import { prisma } from "@/lib/db";
import {
  isNextResponse,
  isPrismaNotFound,
  jsonError,
  jsonOk,
  parseJsonBody,
} from "@/lib/api/http";
import {
  parseSuccessStoryUpdateBody,
  type SuccessStoryWriteBody,
} from "@/lib/success-story";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  try {
    const story = await prisma.successStory.findUnique({ where: { id } });
    if (!story) {
      return jsonError("Success story not found", 404);
    }
    return jsonOk({ data: story });
  } catch (error) {
    return jsonError(error, 500);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const body = await parseJsonBody<SuccessStoryWriteBody>(request);
  if (isNextResponse(body)) {
    return body;
  }
  const parsed = parseSuccessStoryUpdateBody(body);
  if ("error" in parsed) {
    return jsonError(parsed.error, 400);
  }

  try {
    const story = await prisma.successStory.update({
      where: { id },
      data: parsed.data,
    });
    return jsonOk({ data: story });
  } catch (error) {
    if (isPrismaNotFound(error)) {
      return jsonError("Success story not found", 404);
    }
    return jsonError(error, 500);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  try {
    await prisma.successStory.delete({ where: { id } });
    return jsonOk({ data: { id } });
  } catch (error) {
    if (isPrismaNotFound(error)) {
      return jsonError("Success story not found", 404);
    }
    return jsonError(error, 500);
  }
}
