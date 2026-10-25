import { prisma } from "@/lib/db";
import {
  isNextResponse,
  isPrismaForeignKeyViolation,
  isPrismaNotFound,
  isPrismaUniqueViolation,
  jsonError,
  jsonOk,
  parseJsonBody,
} from "@/lib/api/http";
import {
  parseUserUpdateBody,
  userDetailInclude,
  type UserWriteBody,
} from "@/lib/user";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: userDetailInclude,
    });
    if (!user) {
      return jsonError("User not found", 404);
    }
    return jsonOk({ data: user });
  } catch (error) {
    return jsonError(error, 500);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;

  const body = await parseJsonBody<UserWriteBody>(request);
  if (isNextResponse(body)) {
    return body;
  }

  const parsed = parseUserUpdateBody(body);
  if ("error" in parsed) {
    return jsonError(parsed.error, 400);
  }

  try {
    const user = await prisma.user.update({
      where: { id },
      data: parsed.data,
      include: userDetailInclude,
    });
    return jsonOk({ data: user });
  } catch (error) {
    if (isPrismaNotFound(error)) {
      return jsonError("User not found", 404);
    }
    if (isPrismaUniqueViolation(error)) {
      return jsonError("A user with this username already exists", 409);
    }
    if (isPrismaForeignKeyViolation(error)) {
      return jsonError("roleId does not match an existing role", 400);
    }
    return jsonError(error, 500);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    await prisma.user.delete({ where: { id } });
    return jsonOk({ data: { id } });
  } catch (error) {
    if (isPrismaNotFound(error)) {
      return jsonError("User not found", 404);
    }
    return jsonError(error, 500);
  }
}
