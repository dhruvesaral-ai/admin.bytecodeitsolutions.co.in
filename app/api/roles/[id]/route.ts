import { prisma } from "@/lib/db";
import {
  isNextResponse,
  isPrismaNotFound,
  isPrismaUniqueViolation,
  jsonError,
  jsonOk,
  parseJsonBody,
} from "@/lib/api/http";
import { parseRoleUpdateBody, type RoleWriteBody } from "@/lib/role";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    const role = await prisma.role.findUnique({
      where: { id },
      include: {
        _count: {
          select: { users: true },
        },
      },
    });
    if (!role) {
      return jsonError("Role not found", 404);
    }
    return jsonOk({ data: role });
  } catch (error) {
    return jsonError(error, 500);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;

  const body = await parseJsonBody<RoleWriteBody>(request);
  if (isNextResponse(body)) {
    return body;
  }

  const parsed = parseRoleUpdateBody(body);
  if ("error" in parsed) {
    return jsonError(parsed.error, 400);
  }

  try {
    const role = await prisma.role.update({
      where: { id },
      data: parsed.data,
    });
    return jsonOk({ data: role });
  } catch (error) {
    if (isPrismaNotFound(error)) {
      return jsonError("Role not found", 404);
    }
    if (isPrismaUniqueViolation(error)) {
      return jsonError("A role with this slug already exists", 409);
    }
    return jsonError(error, 500);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    await prisma.role.delete({ where: { id } });
    return jsonOk({ data: { id } });
  } catch (error) {
    if (isPrismaNotFound(error)) {
      return jsonError("Role not found", 404);
    }
    return jsonError(error, 500);
  }
}
