import { prisma } from "@/lib/db";
import {
  isNextResponse,
  isPrismaForeignKeyViolation,
  isPrismaNotFound,
  jsonError,
  jsonOk,
  parseJsonBody,
} from "@/lib/api/http";

type RouteContext = { params: Promise<{ id: string }> };
type RemarkBody = { remark?: string };

export async function POST(request: Request, context: RouteContext) {
  const { id: leadId } = await context.params;
  const body = await parseJsonBody<RemarkBody>(request);
  if (isNextResponse(body)) return body;
  if (typeof body.remark !== "string" || body.remark.trim() === "") {
    return jsonError("remark must be a non-empty string", 400);
  }

  try {
    const remark = await prisma.leadRemark.create({
      data: { leadId, remark: body.remark.trim() },
    });
    return jsonOk({ data: remark }, 201);
  } catch (error) {
    if (isPrismaNotFound(error)) return jsonError("Lead not found", 404);
    if (isPrismaForeignKeyViolation(error)) return jsonError("Lead not found", 404);
    return jsonError(error, 500);
  }
}
