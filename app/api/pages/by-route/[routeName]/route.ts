import { prisma } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api/http";
import { formatRouteName } from "@/lib/page";

type RouteContext = { params: Promise<{ routeName: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { routeName } = await context.params;
  const formatted = formatRouteName(routeName);

  try {
    const page = await prisma.page.findUnique({
      where: { routeName: formatted },
    });
    if (!page) {
      return jsonError(`Page with route "${routeName}" not found`, 404);
    }
    return jsonOk({ data: page });
  } catch (error) {
    return jsonError(error, 500);
  }
}
