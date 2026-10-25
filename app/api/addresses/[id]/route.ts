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
  addressDetailInclude,
  parseAddressUpdateBody,
  type AddressWriteBody,
} from "@/lib/address";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    const address = await prisma.address.findUnique({
      where: { id },
      include: addressDetailInclude,
    });
    if (!address) {
      return jsonError("Address not found", 404);
    }
    return jsonOk({ data: address });
  } catch (error) {
    return jsonError(error, 500);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;

  const body = await parseJsonBody<AddressWriteBody>(request);
  if (isNextResponse(body)) {
    return body;
  }

  const parsed = parseAddressUpdateBody(body);
  if ("error" in parsed) {
    return jsonError(parsed.error, 400);
  }

  try {
    const address = await prisma.address.update({
      where: { id },
      data: parsed.data,
      include: addressDetailInclude,
    });
    return jsonOk({ data: address });
  } catch (error) {
    if (isPrismaNotFound(error)) {
      return jsonError("Address not found", 404);
    }
    if (isPrismaForeignKeyViolation(error)) {
      return jsonError("profileId does not match an existing profile", 400);
    }
    return jsonError(error, 500);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    await prisma.address.delete({ where: { id } });
    return jsonOk({ data: { id } });
  } catch (error) {
    if (isPrismaNotFound(error)) {
      return jsonError("Address not found", 404);
    }
    return jsonError(error, 500);
  }
}
