import { prisma } from "@/lib/db";
import {
  isNextResponse,
  isPrismaForeignKeyViolation,
  isPrismaNotFound,
  jsonError,
  jsonOk,
  parseJsonBody,
} from "@/lib/api/http";
import {
  leadDetailInclude,
  parseLeadUpdateBody,
  type LeadWriteBody,
} from "@/lib/lead";

type RouteContext = { params: Promise<{ id: string }> };

function serializeLead<T extends { remarks: Array<{ id: string }> }>(lead: T) {
  return { ...lead, remarksIds: lead.remarks.map(({ id }) => id) };
}

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  try {
    const lead = await prisma.lead.findUnique({
      where: { id },
      include: leadDetailInclude,
    });
    if (!lead) return jsonError("Lead not found", 404);
    return jsonOk({ data: serializeLead(lead) });
  } catch (error) {
    return jsonError(error, 500);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const body = await parseJsonBody<LeadWriteBody>(request);
  if (isNextResponse(body)) return body;

  const parsed = parseLeadUpdateBody(body);
  if ("error" in parsed) return jsonError(parsed.error, 400);

  parsed.data.utmSource = "offline";

  try {
    const lead = await prisma.lead.update({
      where: { id },
      data: parsed.data,
      include: leadDetailInclude,
    });
    return jsonOk({ data: serializeLead(lead) });
  } catch (error) {
    if (isPrismaNotFound(error)) return jsonError("Lead not found", 404);
    if (isPrismaForeignKeyViolation(error)) {
      return jsonError("courseId does not match an existing course", 400);
    }
    return jsonError(error, 500);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  try {
    await prisma.lead.delete({ where: { id } });
    return jsonOk({ data: { id } });
  } catch (error) {
    if (isPrismaNotFound(error)) return jsonError("Lead not found", 404);
    return jsonError(error, 500);
  }
}
