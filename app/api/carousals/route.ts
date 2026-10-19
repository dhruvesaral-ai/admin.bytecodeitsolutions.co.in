import { prisma } from "@/lib/prisma";
import {
  isNextResponse,
  jsonError,
  jsonOk,
  parseJsonBody,
} from "@/lib/api/http";
import {
  parseCarousalCreateBody,
  type CarousalWriteBody,
} from "@/lib/carousal";

export async function GET() {
  try {
    const carousals = await prisma.carousal.findMany({
      orderBy: { position: "asc" },
    });
    return jsonOk({ data: carousals });
  } catch {
    return jsonError("Failed to list carousals", 500);
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
    return jsonOk({ data: carousal }, 201);
  } catch {
    return jsonError("Failed to create carousal", 500);
  }
}
