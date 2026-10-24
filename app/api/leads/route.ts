import { prisma } from "@/lib/db";
import {
  isNextResponse,
  isPrismaForeignKeyViolation,
  jsonError,
  jsonOk,
  parseJsonBody,
} from "@/lib/api/http";
import {
  leadDetailInclude,
  parseLeadCreateBody,
  type LeadWriteBody,
} from "@/lib/lead";

function serializeLead<T extends { remarks: Array<{ id: string }> }>(lead: T) {
  return { ...lead, remarksIds: lead.remarks.map(({ id }) => id) };
}

export async function GET() {
  try {
    const leads = await prisma.lead.findMany({
      orderBy: { createdAt: "desc" },
      include: leadDetailInclude,
    });
    return jsonOk({ data: leads.map(serializeLead) });
  } catch (error) {
    return jsonError(error, 500);
  }
}

export async function POST(request: Request) {
  const body = await parseJsonBody<LeadWriteBody>(request);
  if (isNextResponse(body)) return body;

  const parsed = parseLeadCreateBody(body);
  if ("error" in parsed) return jsonError(parsed.error, 400);

  parsed.data.utmSource = "offline";

  try {
    const lead = await prisma.lead.create({
      data: parsed.data,
      include: leadDetailInclude,
    });
    return jsonOk({ data: serializeLead(lead) }, 201);
  } catch (error) {
    if (isPrismaForeignKeyViolation(error)) {
      return jsonError("courseId does not match an existing course", 400);
    }
    return jsonError(error, 500);
  }
}
