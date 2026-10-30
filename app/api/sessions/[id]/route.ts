import { prisma } from "@/lib/db";
import { jsonError, jsonOk, isPrismaNotFound } from "@/lib/api/http";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    const session = await prisma.authSession.findUnique({
      where: { id },
      include: {
        user: {
          include: {
            role: true,
            profile: true,
          },
        },
      },
    });

    if (!session) {
      return jsonError("Session not found", 404);
    }

    return jsonOk({ data: session });
  } catch (error) {
    return jsonError(error, 500);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    const deleted = await prisma.authSession.delete({
      where: { id },
    });

    return jsonOk({ data: deleted });
  } catch (error) {
    if (isPrismaNotFound(error)) {
      return jsonError("Session not found", 404);
    }
    return jsonError(error, 500);
  }
}
