import { prisma } from "@/lib/db";
import {
  isNextResponse,
  isPrismaUniqueViolation,
  jsonError,
  jsonOk,
  parseJsonBody,
} from "@/lib/api/http";
import {
  formatRouteName,
  parsePageCreateBody,
  type PageWriteBody,
} from "@/lib/page";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const routeParam = searchParams.get("routeName") ?? searchParams.get("route");

    if (routeParam) {
      const formatted = formatRouteName(routeParam);
      const page = await prisma.page.findUnique({
        where: { routeName: formatted },
      });
      if (!page) {
        return jsonError(`Page with route "${routeParam}" not found`, 404);
      }
      return jsonOk({ data: page });
    }

    const pages = await prisma.page.findMany({
      orderBy: { createdAt: "asc" },
    });
    return jsonOk({ data: pages });
  } catch (error) {
    return jsonError(error, 500);
  }
}

export async function POST(request: Request) {
  const body = await parseJsonBody<PageWriteBody>(request);
  if (isNextResponse(body)) {
    return body;
  }

  const parsed = parsePageCreateBody(body);
  if ("error" in parsed) {
    return jsonError(parsed.error, 400);
  }

  try {
    const page = await prisma.page.create({ data: parsed.data });
    return jsonOk({ data: page }, 201);
  } catch (error) {
    if (isPrismaUniqueViolation(error)) {
      return jsonError("A page with this route name already exists", 409);
    }
    return jsonError(error, 500);
  }
}
