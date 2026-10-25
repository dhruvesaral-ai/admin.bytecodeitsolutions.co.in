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
  parseProfileUpdateBody,
  profileDetailInclude,
  type ProfileWriteBody,
} from "@/lib/profile";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    const profile = await prisma.profile.findUnique({
      where: { id },
      include: {
        ...profileDetailInclude,
        registrations: {
          include: {
            course: { select: { id: true, name: true } },
            batch: { select: { id: true, name: true } },
          },
        },
        enrollments: {
          include: {
            course: { select: { id: true, name: true } },
            batch: { select: { id: true, name: true } },
          },
        },
        payments: true,
      },
    });
    if (!profile) {
      return jsonError("Profile not found", 404);
    }
    return jsonOk({ data: profile });
  } catch (error) {
    return jsonError(error, 500);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;

  const body = await parseJsonBody<ProfileWriteBody>(request);
  if (isNextResponse(body)) {
    return body;
  }

  const parsed = parseProfileUpdateBody(body);
  if ("error" in parsed) {
    return jsonError(parsed.error, 400);
  }

  try {
    const profile = await prisma.profile.update({
      where: { id },
      data: parsed.data,
      include: profileDetailInclude,
    });
    return jsonOk({ data: profile });
  } catch (error) {
    if (isPrismaNotFound(error)) {
      return jsonError("Profile not found", 404);
    }
    if (isPrismaUniqueViolation(error)) {
      return jsonError("A profile for this user already exists", 409);
    }
    if (isPrismaForeignKeyViolation(error)) {
      return jsonError("userId does not match an existing user", 400);
    }
    return jsonError(error, 500);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    await prisma.profile.delete({ where: { id } });
    return jsonOk({ data: { id } });
  } catch (error) {
    if (isPrismaNotFound(error)) {
      return jsonError("Profile not found", 404);
    }
    return jsonError(error, 500);
  }
}
