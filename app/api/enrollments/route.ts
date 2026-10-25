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
  enrollmentDetailInclude,
  parseEnrollmentCreateBody,
  type EnrollmentWriteBody,
} from "@/lib/enrollment";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const profileId = searchParams.get("profileId");
  const courseId = searchParams.get("courseId");
  const batchId = searchParams.get("batchId");
  const enrollmentNo = searchParams.get("enrollmentNo");
  const registrationId = searchParams.get("registrationId");

  try {
    const where: {
      profileId?: string;
      courseId?: string;
      batchId?: string;
      enrollmentNo?: string;
      registrationId?: string;
    } = {};

    if (profileId) where.profileId = profileId;
    if (courseId) where.courseId = courseId;
    if (batchId) where.batchId = batchId;
    if (enrollmentNo) where.enrollmentNo = enrollmentNo;
    if (registrationId) where.registrationId = registrationId;

    const enrollments = await prisma.enrollment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: enrollmentDetailInclude,
    });
    return jsonOk({ data: enrollments });
  } catch (error) {
    return jsonError(error, 500);
  }
}

export async function POST(request: Request) {
  const body = await parseJsonBody<EnrollmentWriteBody>(request);
  if (isNextResponse(body)) {
    return body;
  }

  // If courseId or profileId are missing, auto-populate from the registration if available
  if (body.registrationId && (!body.courseId || !body.profileId)) {
    const reg = await prisma.registration.findUnique({
      where: { id: body.registrationId },
    });
    if (!reg) {
      return jsonError("registrationId does not match an existing registration", 400);
    }
    if (!body.courseId) {
      body.courseId = reg.courseId;
    }
    if (!body.profileId) {
      body.profileId = reg.profileId;
    }
    if (body.batchId === undefined && reg.batchId) {
      body.batchId = reg.batchId;
    }
  }

  const parsed = parseEnrollmentCreateBody(body);
  if ("error" in parsed) {
    return jsonError(parsed.error, 400);
  }

  try {
    const enrollment = await prisma.enrollment.create({
      data: parsed.data,
      include: enrollmentDetailInclude,
    });
    return jsonOk({ data: enrollment }, 201);
  } catch (error) {
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
