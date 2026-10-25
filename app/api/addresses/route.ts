import { prisma } from "@/lib/db";
import {
  isNextResponse,
  isPrismaForeignKeyViolation,
  jsonError,
  jsonOk,
  parseJsonBody,
} from "@/lib/api/http";
import {
  addressDetailInclude,
  parseAddressCreateBody,
  type AddressWriteBody,
} from "@/lib/address";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const profileId = searchParams.get("profileId");

  try {
    const where: { profileId?: string } = {};
    if (profileId) {
      where.profileId = profileId;
    }

    const addresses = await prisma.address.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: addressDetailInclude,
    });
    return jsonOk({ data: addresses });
  } catch (error) {
    return jsonError(error, 500);
  }
}

export async function POST(request: Request) {
  const body = await parseJsonBody<AddressWriteBody>(request);
  if (isNextResponse(body)) {
    return body;
  }

  const parsed = parseAddressCreateBody(body);
  if ("error" in parsed) {
    return jsonError(parsed.error, 400);
  }

  try {
    const address = await prisma.address.create({
      data: parsed.data,
      include: addressDetailInclude,
    });
    return jsonOk({ data: address }, 201);
  } catch (error) {
    if (isPrismaForeignKeyViolation(error)) {
      return jsonError("profileId does not match an existing profile", 400);
    }
    return jsonError(error, 500);
  }
}
