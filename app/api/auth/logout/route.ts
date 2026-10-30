import { NextRequest, NextResponse } from "next/server";
import {
  authenticateRequest,
  clearAuthCookies,
  extractTokensFromRequest,
  revokeUserSession,
  verifyJwtToken,
  AuthTokenPayload,
} from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { refreshToken } = extractTokensFromRequest(request);

    // If we have refreshToken, remove that session
    if (refreshToken) {
      await prisma.authSession.deleteMany({
        where: { refreshToken },
      }).catch(() => {});
    }

    // Also check if request is authenticated to clear by userId
    try {
      const auth = await authenticateRequest(request);
      if (auth.user) {
        await revokeUserSession(auth.user.id).catch(() => {});
      }
    } catch {
      // ignore
    }

    const response = NextResponse.json({
      success: true,
      message: "Logged out successfully",
    });

    clearAuthCookies(response);
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
