import { prisma } from "@/lib/db";
import {
  isNextResponse,
  isPrismaForeignKeyViolation,
  isPrismaUniqueViolation,
  jsonError,
  jsonOk,
  parseJsonBody,
} from "@/lib/api/http";
import {
  parseUserCreateBody,
  userDetailInclude,
  type UserWriteBody,
} from "@/lib/user";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const roleId = searchParams.get("roleId");
  const username = searchParams.get("username");

  try {
    const where: {
      status?: "active" | "inactive";
      roleId?: string;
      username?: string;
    } = {};

    if (status === "active" || status === "inactive") {
      where.status = status;
    }
    if (roleId) {
      where.roleId = roleId;
    }
    if (username) {
      where.username = username;
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: userDetailInclude,
    });
    return jsonOk({ data: users });
  } catch (error) {
    return jsonError(error, 500);
  }
}

export async function POST(request: Request) {
  const body = await parseJsonBody<UserWriteBody>(request);
  if (isNextResponse(body)) {
    return body;
  }

  const parsed = parseUserCreateBody(body);
  if ("error" in parsed) {
    return jsonError(parsed.error, 400);
  }

  try {
    const user = await prisma.user.create({
      data: parsed.data,
      include: userDetailInclude,
    });
    return jsonOk({ data: user }, 201);
  } catch (error) {
    if (isPrismaUniqueViolation(error)) {
      return jsonError("A user with this username already exists", 409);
    }
    if (isPrismaForeignKeyViolation(error)) {
      return jsonError("roleId does not match an existing role", 400);
    }
    return jsonError(error, 500);
  }
}
