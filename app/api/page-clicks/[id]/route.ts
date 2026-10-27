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
  pageClicksDetailInclude,
  parsePageClicksUpdateBody,
  type PageClicksWriteBody,
} from "@/lib/page-clicks";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    const pageClicks = await prisma.pageClicks.findUnique({
      where: { id },
      include: pageClicksDetailInclude,
    });
    if (!pageClicks) {
      return jsonError("Page clicks not found", 404);
    }
    return jsonOk({ data: pageClicks });
  } catch (error) {
    return jsonError(error, 500);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;

  const body = await parseJsonBody<PageClicksWriteBody>(request);
  if (isNextResponse(body)) {
    return body;
  }

  const parsed = parsePageClicksUpdateBody(body);
  if ("error" in parsed) {
    return jsonError(parsed.error, 400);
  }

  try {
    const pageClicks = await prisma.pageClicks.update({
      where: { id },
      data: parsed.data,
      include: pageClicksDetailInclude,
    });
    return jsonOk({ data: pageClicks });
  } catch (error) {
    if (isPrismaNotFound(error)) {
      return jsonError("Page clicks or page not found", 404);
    }
    if (isPrismaUniqueViolation(error)) {
      return jsonError("Page clicks already exist for this field on the page", 409);
    }
    return jsonError(error, 500);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    await prisma.pageClicks.delete({ where: { id } });
    return jsonOk({ data: { id } });
  } catch (error) {
    if (isPrismaNotFound(error)) {
      return jsonError("Page clicks not found", 404);
    }
    return jsonError(error, 500);
  }
}
