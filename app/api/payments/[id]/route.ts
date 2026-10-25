import { prisma } from "@/lib/db";
import {
  isNextResponse,
  isPrismaForeignKeyViolation,
  isPrismaNotFound,
  jsonError,
  jsonOk,
  parseJsonBody,
} from "@/lib/api/http";
import {
  parsePaymentUpdateBody,
  paymentDetailInclude,
  type PaymentWriteBody,
} from "@/lib/payment";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: paymentDetailInclude,
    });
    if (!payment) {
      return jsonError("Payment not found", 404);
    }
    return jsonOk({ data: payment });
  } catch (error) {
    return jsonError(error, 500);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;

  const body = await parseJsonBody<PaymentWriteBody>(request);
  if (isNextResponse(body)) {
    return body;
  }

  const parsed = parsePaymentUpdateBody(body);
  if ("error" in parsed) {
    return jsonError(parsed.error, 400);
  }

  try {
    const payment = await prisma.payment.update({
      where: { id },
      data: parsed.data,
      include: paymentDetailInclude,
    });
    return jsonOk({ data: payment });
  } catch (error) {
    if (isPrismaNotFound(error)) {
      return jsonError("Payment not found", 404);
    }
    if (isPrismaForeignKeyViolation(error)) {
      return jsonError(
        "Foreign key violation: profileId, enrollmentId, or registrationId is invalid",
        400,
      );
    }
    return jsonError(error, 500);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    await prisma.payment.delete({ where: { id } });
    return jsonOk({ data: { id } });
  } catch (error) {
    if (isPrismaNotFound(error)) {
      return jsonError("Payment not found", 404);
    }
    return jsonError(error, 500);
  }
}
