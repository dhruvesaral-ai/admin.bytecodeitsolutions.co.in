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
  parseProfileCreateBody,
  profileDetailInclude,
  type ProfileWriteBody,
} from "@/lib/profile";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const userId = searchParams.get("userId");

  try {
    const where: {
      status?: "active" | "inactive";
      userId?: string;
    } = {};

    if (status === "active" || status === "inactive") {
      where.status = status;
    }
    if (userId) {
      where.userId = userId;
    }

    const profiles = await prisma.profile.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: profileDetailInclude,
    });
    return jsonOk({ data: profiles });
  } catch (error) {
    return jsonError(error, 500);
  }
}

export async function POST(request: Request) {
  const body = await parseJsonBody<ProfileWriteBody>(request);
  if (isNextResponse(body)) {
    return body;
  }

  const parsed = parseProfileCreateBody(body);
  if ("error" in parsed) {
    return jsonError(parsed.error, 400);
  }

  try {
    const profile = await prisma.profile.upsert({
      where: { userId: parsed.userId },
      create: parsed.data,
      update: {
        name: parsed.data.name,
        email: parsed.data.email,
        status: parsed.data.status,
        profileImgUrl: parsed.data.profileImgUrl,
      },
      include: profileDetailInclude,
    });
    return jsonOk({ data: profile }, 201);
  } catch (error) {
    if (isPrismaForeignKeyViolation(error)) {
      return jsonError("userId does not match an existing user", 400);
    }
    return jsonError(error, 500);
  }
}
