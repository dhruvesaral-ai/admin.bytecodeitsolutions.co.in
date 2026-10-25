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
  parseRegistrationCreateBody,
  registrationDetailInclude,
  type RegistrationWriteBody,
} from "@/lib/registration";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const profileId = searchParams.get("profileId");
  const courseId = searchParams.get("courseId");
  const batchId = searchParams.get("batchId");
  const registrationNo = searchParams.get("registrationNo");

  try {
    const where: {
      profileId?: string;
      courseId?: string;
      batchId?: string;
      registrationNo?: string;
    } = {};

    if (profileId) where.profileId = profileId;
    if (courseId) where.courseId = courseId;
    if (batchId) where.batchId = batchId;
    if (registrationNo) where.registrationNo = registrationNo;

    const registrations = await prisma.registration.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: registrationDetailInclude,
    });
    return jsonOk({ data: registrations });
  } catch (error) {
    return jsonError(error, 500);
  }
}

export async function POST(request: Request) {
  const body = await parseJsonBody<RegistrationWriteBody>(request);
  if (isNextResponse(body)) {
    return body;
  }

  const parsed = parseRegistrationCreateBody(body);
  if ("error" in parsed) {
    return jsonError(parsed.error, 400);
  }

  try {
    const existing = await prisma.registration.findUnique({
      where: { registrationNo: parsed.registrationNo },
      include: registrationDetailInclude,
    });

    if (existing) {
      if (existing.profileId === parsed.profileId) {
        // If it belongs to the same student, update course & batch and return existing cleanly
        const updated = await prisma.registration.update({
          where: { id: existing.id },
          data: {
            course: { connect: { id: parsed.courseId } },
            batch: parsed.batchId ? { connect: { id: parsed.batchId } } : { disconnect: true },
          },
          include: registrationDetailInclude,
        });
        return jsonOk({ data: updated }, 200);
      }
      return jsonError("A registration with this registrationNo already exists", 409);
    }

    const registration = await prisma.registration.create({
      data: parsed.data,
      include: registrationDetailInclude,
    });
    return jsonOk({ data: registration }, 201);
  } catch (error) {
    if (isPrismaUniqueViolation(error)) {
      return jsonError("A registration with this registrationNo already exists", 409);
    }
    if (isPrismaForeignKeyViolation(error)) {
      return jsonError("Foreign key violation: courseId, profileId, or batchId is invalid", 400);
    }
    return jsonError(error, 500);
  }
}
