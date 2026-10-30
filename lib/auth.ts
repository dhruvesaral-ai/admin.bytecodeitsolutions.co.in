import jwt, { TokenExpiredError } from "jsonwebtoken";
import { prisma } from "@/lib/db";
import { JWT_ACCESS_EXPIRATION, JWT_REFRESH_EXPIRATION, JWT_SECRET } from "@/config";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export interface AuthTokenPayload {
  userId: string;
  username: string;
  role?: string | null;
  type: "access" | "refresh";
}

export interface UserSessionData {
  id: string;
  username: string;
  status: string;
  role?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  profile?: unknown | null;
}

/**
 * Generates a short-lived access token (default 15 minutes)
 */
export function generateAccessToken(user: {
  id: string;
  username: string;
  role?: { slug: string } | null;
}): string {
  const payload: AuthTokenPayload = {
    userId: user.id,
    username: user.username,
    role: user.role?.slug ?? null,
    type: "access",
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_ACCESS_EXPIRATION as jwt.SignOptions["expiresIn"],
  });
}

/**
 * Generates a long-lived refresh token (default 30 days)
 */
export function generateRefreshToken(user: { id: string; username: string }): string {
  const payload: AuthTokenPayload = {
    userId: user.id,
    username: user.username,
    type: "refresh",
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRATION as jwt.SignOptions["expiresIn"],
  });
}

/**
 * Verifies any JWT token
 */
export function verifyJwtToken<T = AuthTokenPayload>(token: string): T {
  return jwt.verify(token, JWT_SECRET) as T;
}

/**
 * Creates or updates the AuthSession in the database for the user
 */
export async function createOrUpdateSession(params: {
  userId: string;
  refreshToken: string;
  userAgent?: string | null;
  ipAddress?: string | null;
}) {
  const { userId, refreshToken, userAgent, ipAddress } = params;

  return await prisma.authSession.upsert({
    where: { userId },
    update: {
      refreshToken,
      userAgent: userAgent || null,
      ipAddress: ipAddress || null,
    },
    create: {
      userId,
      refreshToken,
      userAgent: userAgent || null,
      ipAddress: ipAddress || null,
    },
  });
}

/**
 * Checks database user session with the refresh token.
 * If valid and user is active, issues a brand new short-lived access token
 * and optionally rotates the refresh token.
 */
export async function refreshUserSession(params: {
  refreshToken: string;
  userAgent?: string | null;
  ipAddress?: string | null;
  rotateRefreshToken?: boolean;
}) {
  const { refreshToken, userAgent, ipAddress, rotateRefreshToken = false } = params;

  // 1. Verify token structure / expiration
  let payload: AuthTokenPayload;
  try {
    payload = verifyJwtToken<AuthTokenPayload>(refreshToken);
    if (payload.type !== "refresh") {
      throw new Error("Invalid token type: expected refresh token");
    }
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      // If token expired, clean up database session if it exists
      await prisma.authSession.deleteMany({ where: { refreshToken } }).catch(() => {});
      throw new Error("Refresh token expired, please log in again");
    }
    throw new Error("Invalid refresh token");
  }

  // 2. Query session and user from database
  const session = await prisma.authSession.findUnique({
    where: { refreshToken },
    include: {
      user: {
        include: {
          role: true,
          profile: true,
        },
      },
    },
  });

  if (!session || !session.user) {
    throw new Error("Session not found or has been revoked");
  }

  if (session.user.status === "inactive") {
    throw new Error("User account is inactive or banned");
  }

  // 3. Generate brand new access token
  const newAccessToken = generateAccessToken(session.user);

  let newRefreshToken = refreshToken;
  if (rotateRefreshToken) {
    newRefreshToken = generateRefreshToken(session.user);
    await prisma.authSession.update({
      where: { id: session.id },
      data: {
        refreshToken: newRefreshToken,
        userAgent: userAgent !== undefined ? userAgent : session.userAgent,
        ipAddress: ipAddress !== undefined ? ipAddress : session.ipAddress,
      },
    });
  } else if (userAgent || ipAddress) {
    await prisma.authSession.update({
      where: { id: session.id },
      data: {
        userAgent: userAgent || session.userAgent,
        ipAddress: ipAddress || session.ipAddress,
      },
    });
  }

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    user: session.user,
    session,
  };
}

/**
 * Extracts client IP and User Agent from NextRequest
 */
export function getRequestMetadata(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const ipAddress = forwardedFor ? forwardedFor.split(",")[0].trim() : request.headers.get("x-real-ip") || null;
  const userAgent = request.headers.get("user-agent") || null;
  return { ipAddress, userAgent };
}

/**
 * Extracts token from Request Authorization header or cookies
 */
export function extractTokensFromRequest(request: NextRequest) {
  let accessToken: string | null = null;
  let refreshToken: string | null = null;

  // Header Authorization: Bearer <token>
  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    accessToken = authHeader.substring(7).trim();
  }

  // Header X-Refresh-Token
  const customRefreshHeader = request.headers.get("x-refresh-token");
  if (customRefreshHeader) {
    refreshToken = customRefreshHeader.trim();
  }

  // Cookies
  if (!accessToken) {
    accessToken = request.cookies.get("access_token")?.value || null;
  }
  if (!refreshToken) {
    refreshToken = request.cookies.get("refresh_token")?.value || null;
  }

  return { accessToken, refreshToken };
}

export interface AuthenticateResult {
  user: UserSessionData | null;
  newAccessToken?: string | null;
  refreshed: boolean;
  error?: string;
}

/**
 * Authenticates request.
 * If short-lived JWT token is expired, checks user session in database
 * and issues a brand new access token seamlessly.
 */
export async function authenticateRequest(request: NextRequest): Promise<AuthenticateResult> {
  const { accessToken, refreshToken } = extractTokensFromRequest(request);
  const { ipAddress, userAgent } = getRequestMetadata(request);

  // 1. Try to verify short-lived access token
  if (accessToken) {
    try {
      const decoded = verifyJwtToken<AuthTokenPayload>(accessToken);
      if (decoded.type === "access") {
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          include: { role: true, profile: true },
        });

        if (user && user.status === "active") {
          return {
            user,
            refreshed: false,
          };
        }
      }
    } catch (error) {
      if (!(error instanceof TokenExpiredError)) {
        // If it's a malformed token or wrong signature, ignore and try refresh token if present
      }
    }
  }

  // 2. If access token is expired or missing, check user session and issue brand new token
  if (refreshToken) {
    try {
      const refreshed = await refreshUserSession({
        refreshToken,
        userAgent,
        ipAddress,
        rotateRefreshToken: false,
      });

      return {
        user: refreshed.user,
        newAccessToken: refreshed.accessToken,
        refreshed: true,
      };
    } catch (error) {
      return {
        user: null,
        refreshed: false,
        error: error instanceof Error ? error.message : "Session verification failed",
      };
    }
  }

  return {
    user: null,
    refreshed: false,
    error: "No authorization token or active session found",
  };
}

/**
 * Sets access_token and refresh_token HTTP-only cookies on a NextResponse
 */
export function setAuthCookies(
  response: NextResponse,
  tokens: { accessToken?: string; refreshToken?: string },
) {
  const isProduction = process.env.NODE_ENV === "production";

  if (tokens.accessToken) {
    response.cookies.set("access_token", tokens.accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: 15 * 60, // 15 minutes
    });
  }

  if (tokens.refreshToken) {
    response.cookies.set("refresh_token", tokens.refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });
  }
}

/**
 * Clears auth cookies on logout
 */
export function clearAuthCookies(response: NextResponse) {
  response.cookies.set("access_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  response.cookies.set("refresh_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

/**
 * Revokes user session from database
 */
export async function revokeUserSession(userId: string) {
  return await prisma.authSession.deleteMany({
    where: { userId },
  });
}
