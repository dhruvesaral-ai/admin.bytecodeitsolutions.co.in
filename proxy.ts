import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function handleAuth(request: NextRequest) {

  const { pathname } = request.nextUrl;

  // Protect all /manage routes
  if (pathname.startsWith("/manage")) {
    const accessToken = request.cookies.get("access_token")?.value;
    const refreshToken = request.cookies.get("refresh_token")?.value;

    // If neither token is present, redirect to login
    if (!accessToken && !refreshToken) {
      const loginUrl = new URL("/", request.url);
      loginUrl.searchParams.set("error", "unauthorized");
      return NextResponse.redirect(loginUrl);
    }

    // If access token is present, check if role is student
    if (accessToken) {
      try {
        const parts = accessToken.split(".");
        if (parts.length === 3) {
          const payloadJson = Buffer.from(parts[1], "base64").toString("utf8");
          const payload = JSON.parse(payloadJson);

          // Expired access token will be handled by refresh mechanism if refresh_token is present
          const isExpired = payload.exp && payload.exp * 1000 < Date.now();

          if (!isExpired) {
            // Check if role is student or user has no staff role
            if (payload.role === "student" || !payload.role) {
              const loginUrl = new URL("/", request.url);
              loginUrl.searchParams.set("error", "unauthorized");
              return NextResponse.redirect(loginUrl);
            }
          } else if (!refreshToken) {
            const loginUrl = new URL("/", request.url);
            loginUrl.searchParams.set("error", "unauthorized");
            return NextResponse.redirect(loginUrl);
          }
        }
      } catch {
        if (!refreshToken) {
          const loginUrl = new URL("/", request.url);
          loginUrl.searchParams.set("error", "unauthorized");
          return NextResponse.redirect(loginUrl);
        }
      }
    }
  }

  return NextResponse.next();
}

export function proxy(request: NextRequest) {
  return handleAuth(request);
}

export function middleware(request: NextRequest) {
  return handleAuth(request);
}

export const config = {
  matcher: ["/manage/:path*"],
};

