import { prisma } from "@/lib/db";
import { isPrismaNotFound, jsonError, jsonOk } from "@/lib/api/http";

type RouteContext = {
  params: Promise<{ id: string; remarkId: string }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  const { id: leadId, remarkId } = await context.params;
  try {
    await prisma.leadRemark.delete({
      where: { id: remarkId, leadId },
    });
    return jsonOk({ data: { id: remarkId } });
  } catch (error) {
    if (isPrismaNotFound(error)) return jsonError("Remark not found", 404);
    return jsonError(error, 500);
  }
}
