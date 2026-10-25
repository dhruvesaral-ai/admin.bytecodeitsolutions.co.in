import { prisma } from "@/lib/db";
import {
  isNextResponse,
  isPrismaForeignKeyViolation,
  jsonError,
  jsonOk,
  parseJsonBody,
} from "@/lib/api/http";
import {
  parsePaymentCreateBody,
  paymentDetailInclude,
  type PaymentWriteBody,
} from "@/lib/payment";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const profileId = searchParams.get("profileId");
  const enrollmentId = searchParams.get("enrollmentId");
  const registrationId = searchParams.get("registrationId");
  const isVerified = searchParams.get("isVerified");
  const paymentMethod = searchParams.get("paymentMethod");

  try {
    const where: {
      profileId?: string;
      enrollmentId?: string;
      registrationId?: string;
      isVerified?: boolean;
      paymentMethod?: string;
    } = {};

    if (profileId) where.profileId = profileId;
    if (enrollmentId) where.enrollmentId = enrollmentId;
    if (registrationId) where.registrationId = registrationId;
    if (isVerified !== null && isVerified !== undefined) {
      where.isVerified = isVerified === "true";
    }
    if (paymentMethod) where.paymentMethod = paymentMethod;

    const payments = await prisma.payment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: paymentDetailInclude,
    });
    return jsonOk({ data: payments });
  } catch (error) {
    return jsonError(error, 500);
  }
}

export async function POST(request: Request) {
  const body = await parseJsonBody<PaymentWriteBody>(request);
  if (isNextResponse(body)) {
    return body;
  }

  // Auto-fill profileId from enrollment or registration if omitted
  if (!body.profileId) {
    if (body.enrollmentId) {
      const enroll = await prisma.enrollment.findUnique({
        where: { id: body.enrollmentId },
        select: { profileId: true },
      });
      if (enroll) {
        body.profileId = enroll.profileId;
      }
    } else if (body.registrationId) {
      const reg = await prisma.registration.findUnique({
        where: { id: body.registrationId },
        select: { profileId: true },
      });
      if (reg) {
        body.profileId = reg.profileId;
      }
    }
  }

  const parsed = parsePaymentCreateBody(body);
  if ("error" in parsed) {
    return jsonError(parsed.error, 400);
  }

  try {
    const payment = await prisma.payment.create({
      data: parsed.data,
      include: paymentDetailInclude,
    });
    return jsonOk({ data: payment }, 201);
  } catch (error) {
    if (isPrismaForeignKeyViolation(error)) {
      return jsonError(
        "Foreign key violation: profileId, enrollmentId, or registrationId is invalid",
        400,
      );
    }
    return jsonError(error, 500);
  }
}
