import { prisma } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api/http";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username");
  const ipAddress = searchParams.get("ipAddress");

  try {
    const where: {
      user?: { username?: string };
      ipAddress?: string;
    } = {};

    if (username) {
      where.user = { username };
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
