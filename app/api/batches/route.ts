import { prisma } from "@/lib/db";
import {
  isNextResponse,
  jsonError,
  jsonOk,
  parseJsonBody,
} from "@/lib/api/http";

export async function GET() {
  try {
    const batches = await prisma.batch.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            registrations: true,
            enrollments: true,
            classes: true,
          },
        },
      },
    });
    return jsonOk({ data: batches });
  } catch (error) {
    return jsonError(error, 500);
  }
}

export async function POST(request: Request) {
  const body = await parseJsonBody<{ name?: string }>(request);
  if (isNextResponse(body)) {
    return body;
  }

  if (typeof body.name !== "string" || body.name.trim() === "") {
    return jsonError("name must be a non-empty string", 400);
  }

  try {
    const batch = await prisma.batch.create({
      data: { name: body.name.trim() },
    });
    return jsonOk({ data: batch }, 201);
  } catch (error) {
    return jsonError(error, 500);
  }
}
