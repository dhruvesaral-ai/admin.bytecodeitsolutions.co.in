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
  enrollmentDetailInclude,
  parseEnrollmentUpdateBody,
  type EnrollmentWriteBody,
} from "@/lib/enrollment";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    const enrollment = await prisma.enrollment.findUnique({
      where: { id },
      include: enrollmentDetailInclude,
    });
    if (!enrollment) {
      return jsonError("Enrollment not found", 404);
    }
    return jsonOk({ data: enrollment });
  } catch (error) {
    return jsonError(error, 500);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;

  const body = await parseJsonBody<EnrollmentWriteBody>(request);
  if (isNextResponse(body)) {
    return body;
  }

  const parsed = parseEnrollmentUpdateBody(body);
  if ("error" in parsed) {
    return jsonError(parsed.error, 400);
  }

  try {
    const enrollment = await prisma.enrollment.update({
      where: { id },
      data: parsed.data,
      include: enrollmentDetailInclude,
    });
    return jsonOk({ data: enrollment });
  } catch (error) {
    if (isPrismaNotFound(error)) {
      return jsonError("Enrollment not found", 404);
    }
    if (isPrismaUniqueViolation(error)) {
      return jsonError(
        "Unique constraint violation: enrollmentNo or registrationId already enrolled",
        409,
      );
    }
    if (isPrismaForeignKeyViolation(error)) {
      return jsonError(
        "Foreign key violation: courseId, profileId, registrationId, or batchId is invalid",
        400,
      );
    }
    return jsonError(error, 500);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    await prisma.enrollment.delete({ where: { id } });
    return jsonOk({ data: { id } });
  } catch (error) {
    if (isPrismaNotFound(error)) {
      return jsonError("Enrollment not found", 404);
    }
    return jsonError(error, 500);
  }
}
