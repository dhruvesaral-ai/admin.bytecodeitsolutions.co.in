import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api/http";
import { normalizeUsername } from "@/lib/user";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username");
  const ipAddress = searchParams.get("ipAddress");

  try {
    const where: Prisma.AuthSessionWhereInput = {};

    if (username) {
      const normalized = normalizeUsername(username);
      if (normalized) {
        where.user = {
          OR: [
            { username: normalized },
            { username: username.trim() },
            { username: `+${normalized}` },
          ],
        };
      } else {
        where.user = { username: username.trim() };
      }
    }
    if (ipAddress) {
      where.ipAddress = ipAddress;
    }

    const sessions = await prisma.authSession.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      include: {
        user: {
          include: {
            role: true,
            profile: true,
          },
        },
      },
    });

    return jsonOk({ data: sessions });
  } catch (error) {
    return jsonError(error, 500);
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  try {
    if (userId) {
      const result = await prisma.authSession.deleteMany({
        where: { userId },
      });
      return jsonOk({ data: { count: result.count } });
    }

    // Emergency kill-switch: revoke all sessions
    const result = await prisma.authSession.deleteMany({});
    return jsonOk({ data: { count: result.count } });
  } catch (error) {
    return jsonError(error, 500);
  }
}
