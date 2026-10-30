import { NextRequest, NextResponse } from "next/server";
import {
  extractTokensFromRequest,
  getRequestMetadata,
  refreshUserSession,
  setAuthCookies,
} from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { refreshToken: extractedRefresh } = extractTokensFromRequest(request);
    const refreshToken = body.refreshToken || extractedRefresh;

    if (!refreshToken) {
      return NextResponse.json(
        { error: "Refresh token is required to refresh session" },
        { status: 400 },
      );
    }

    const { ipAddress, userAgent } = getRequestMetadata(request);
    const rotateRefreshToken = Boolean(body.rotateRefreshToken ?? false);

    const refreshed = await refreshUserSession({
      refreshToken,
      userAgent,
      ipAddress,
      rotateRefreshToken,
    });

    const response = NextResponse.json({
      success: true,
      message: "New access token issued successfully",
      accessToken: refreshed.accessToken,
      refreshToken: refreshed.refreshToken,
      user: {
        id: refreshed.user.id,
        username: refreshed.user.username,
        status: refreshed.user.status,
        role: refreshed.user.role,
        profile: refreshed.user.profile,
      },
    });

    setAuthCookies(response, {
      accessToken: refreshed.accessToken,
      refreshToken: refreshed.refreshToken,
    });

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to refresh token";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
