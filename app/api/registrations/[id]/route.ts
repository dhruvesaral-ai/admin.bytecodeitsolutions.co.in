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
  parseRegistrationUpdateBody,
  registrationDetailInclude,
  type RegistrationWriteBody,
} from "@/lib/registration";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    const registration = await prisma.registration.findUnique({
      where: { id },
      include: registrationDetailInclude,
    });
    if (!registration) {
      return jsonError("Registration not found", 404);
    }
    return jsonOk({ data: registration });
  } catch (error) {
    return jsonError(error, 500);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;

  const body = await parseJsonBody<RegistrationWriteBody>(request);
  if (isNextResponse(body)) {
    return body;
  }

  const parsed = parseRegistrationUpdateBody(body);
  if ("error" in parsed) {
    return jsonError(parsed.error, 400);
  }

  try {
    const registration = await prisma.registration.update({
      where: { id },
      data: parsed.data,
      include: registrationDetailInclude,
    });
    return jsonOk({ data: registration });
  } catch (error) {
    if (isPrismaNotFound(error)) {
      return jsonError("Registration not found", 404);
    }
    if (isPrismaUniqueViolation(error)) {
      return jsonError("A registration with this registrationNo already exists", 409);
    }
    if (isPrismaForeignKeyViolation(error)) {
      return jsonError("Foreign key violation: courseId, profileId, or batchId is invalid", 400);
    }
    return jsonError(error, 500);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    await prisma.registration.delete({ where: { id } });
    return jsonOk({ data: { id } });
  } catch (error) {
    if (isPrismaNotFound(error)) {
      return jsonError("Registration not found", 404);
    }
    return jsonError(error, 500);
  }
}
