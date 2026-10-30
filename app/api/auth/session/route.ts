import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, setAuthCookies } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);

    if (!authResult.user) {
      return NextResponse.json(
        { error: authResult.error || "Unauthenticated" },
        { status: 401 },
      );
    }

    const response = NextResponse.json({
      success: true,
      user: authResult.user,
      refreshed: authResult.refreshed,
      ...(authResult.newAccessToken ? { newAccessToken: authResult.newAccessToken } : {}),
    });

    if (authResult.refreshed && authResult.newAccessToken) {
      setAuthCookies(response, { accessToken: authResult.newAccessToken });
      response.headers.set("x-new-access-token", authResult.newAccessToken);
    }

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
