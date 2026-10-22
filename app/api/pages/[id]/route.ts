import { prisma } from "@/lib/db";
import {
  isNextResponse,
  isPrismaNotFound,
  isPrismaUniqueViolation,
  jsonError,
  jsonOk,
  parseJsonBody,
} from "@/lib/api/http";
import {
  parsePageUpdateBody,
  type PageWriteBody,
} from "@/lib/page";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    const page = await prisma.page.findUnique({ where: { id } });
    if (!page) {
      return jsonError("Page not found", 404);
    }
    return jsonOk({ data: page });
  } catch (error) {
    return jsonError(error, 500);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;

  const body = await parseJsonBody<PageWriteBody>(request);
  if (isNextResponse(body)) {
    return body;
  }

  const parsed = parsePageUpdateBody(body);
  if ("error" in parsed) {
    return jsonError(parsed.error, 400);
  }

  try {
    const page = await prisma.page.update({
      where: { id },
      data: parsed.data,
    });
    return jsonOk({ data: page });
  } catch (error) {
    if (isPrismaNotFound(error)) {
      return jsonError("Page not found", 404);
    }
    if (isPrismaUniqueViolation(error)) {
      return jsonError("A page with this route name already exists", 409);
    }
    return jsonError(error, 500);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    await prisma.page.delete({ where: { id } });
    return jsonOk({ data: { id } });
  } catch (error) {
    if (isPrismaNotFound(error)) {
      return jsonError("Page not found", 404);
    }
    return jsonError(error, 500);
  }
}
