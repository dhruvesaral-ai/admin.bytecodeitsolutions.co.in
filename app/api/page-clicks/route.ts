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
  parsePageClicksCreateBody,
  type PageClicksWriteBody,
} from "@/lib/page-clicks";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const pageId = searchParams.get("pageId");
    const fieldName = searchParams.get("fieldName");

    const where: { pageId?: string; fieldName?: string } = {};

    if (pageId) where.pageId = pageId;
    if (fieldName) where.fieldName = fieldName;

    const pageClicks = await prisma.pageClicks.findMany({
      where,
      orderBy: [{ fieldName: "asc" }, { createdAt: "asc" }],
      include: pageClicksDetailInclude,
    });
    return jsonOk({ data: pageClicks });
  } catch (error) {
    return jsonError(error, 500);
  }
}

export async function POST(request: Request) {
  const body = await parseJsonBody<PageClicksWriteBody>(request);
  if (isNextResponse(body)) {
    return body;
  }

  const parsed = parsePageClicksCreateBody(body);
  if ("error" in parsed) {
    return jsonError(parsed.error, 400);
  }

  try {
    const pageClicks = await prisma.pageClicks.create({
      data: parsed.data,
      include: pageClicksDetailInclude,
    });
    return jsonOk({ data: pageClicks }, 201);
  } catch (error) {
    if (isPrismaNotFound(error)) {
      return jsonError("Page not found", 404);
    }
    if (isPrismaUniqueViolation(error)) {
      return jsonError("Page clicks already exist for this field on the page", 409);
    }
    return jsonError(error, 500);
  }
}
