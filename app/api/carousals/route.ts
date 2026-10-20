import { prisma } from "@/lib/db";
import {
  isNextResponse,
  jsonError,
  jsonOk,
  parseJsonBody,
} from "@/lib/api/http";
import {
  parseCarousalCreateBody,
  toApiCarousal,
  type CarousalWriteBody,
} from "@/lib/carousal";

export async function GET() {
  try {
    const carousals = await prisma.carousal.findMany({
      orderBy: { position: "asc" },
    });
    return jsonOk({ data: carousals.map(toApiCarousal) });
  } catch (error) {
    return jsonError(error, 500);
  }
}

export async function POST(request: Request) {
  const body = await parseJsonBody<CarousalWriteBody>(request);
  if (isNextResponse(body)) {
    return body;
  }

  const parsed = parseCarousalCreateBody(body);
  if ("error" in parsed) {
    return jsonError(parsed.error, 400);
  }

  try {
    const carousal = await prisma.carousal.create({ data: parsed.data });
    return jsonOk({ data: toApiCarousal(carousal) }, 201);
  } catch (error) {
    return jsonError(error, 500);
  }
}
