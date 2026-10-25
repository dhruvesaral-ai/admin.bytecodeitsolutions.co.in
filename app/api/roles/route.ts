import { prisma } from "@/lib/db";
import {
  isNextResponse,
  isPrismaUniqueViolation,
  jsonError,
  jsonOk,
  parseJsonBody,
} from "@/lib/api/http";
import { parseRoleCreateBody, type RoleWriteBody } from "@/lib/role";

export async function GET() {
  try {
    const roles = await prisma.role.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { users: true },
        },
      },
    });
    return jsonOk({ data: roles });
  } catch (error) {
    return jsonError(error, 500);
  }
}

export async function POST(request: Request) {
  const body = await parseJsonBody<RoleWriteBody>(request);
  if (isNextResponse(body)) {
    return body;
  }

  const parsed = parseRoleCreateBody(body);
  if ("error" in parsed) {
    return jsonError(parsed.error, 400);
  }

  try {
    const role = await prisma.role.create({ data: parsed.data });
    return jsonOk({ data: role }, 201);
  } catch (error) {
    if (isPrismaUniqueViolation(error)) {
      return jsonError("A role with this slug already exists", 409);
    }
    return jsonError(error, 500);
  }
}
