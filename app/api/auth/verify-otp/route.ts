import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { formatMobileNumber, verifyMsg91Otp } from "@/lib/msg91";
import {
  createOrUpdateSession,
  generateAccessToken,
  generateRefreshToken,
  getRequestMetadata,
  setAuthCookies,
} from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const rawMobile = body.mobile || body.username;
    const otp = body.otp ? String(body.otp).trim() : "";

    if (!rawMobile) {
      return NextResponse.json(
        { error: "Mobile number or username is required" },
        { status: 400 },
      );
    }

    if (!otp) {
      return NextResponse.json(
        { error: "OTP is required" },
        { status: 400 },
      );
    }

    const mobile = formatMobileNumber(rawMobile);
    if (!mobile) {
      return NextResponse.json(
        { error: "Invalid mobile number format" },
        { status: 400 },
      );
    }

    // Call MSG91 Verify OTP API
    const result = await verifyMsg91Otp({
      mobile,
      otp,
      otpExpiry: body.otp_expiry || body.otpExpiry,
    });

    if (result.type !== "success") {
      return NextResponse.json(
        { error: result.message || "OTP verification failed", details: result },
        { status: 400 },
      );
    }

    const { searchParams } = new URL(request.url);
    const callingFrom = (body.callingFrom || searchParams.get("callingFrom") || "")
      .toString()
      .toLowerCase()
      .trim();

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { username: mobile },
      include: {
        role: true,
        profile: true,
      },
    });

    if (user?.status === "inactive") {
      return NextResponse.json(
        { error: "User account is suspended or inactive" },
        { status: 403 },
      );
    }

    if (callingFrom === "admin") {
      const isStudentOrUnregistered = !user || !user.role || user.role.slug === "student";
      if (isStudentOrUnregistered) {
        return NextResponse.json(
          { error: "ask staff to add you then try to login" },
          { status: 403 },
        );
      }
    }

    if (!user) {
      user = await prisma.user.create({
        data: {
          username: mobile,
          status: "active",
        },
        include: {
          role: true,
          profile: true,
        },
      });
    }

    // Generate short-lived JWT access token & long-lived refresh token
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Save session in database
    const { userAgent, ipAddress } = getRequestMetadata(request);
    await createOrUpdateSession({
      userId: user.id,
      refreshToken,
      userAgent,
      ipAddress,
    });

    const response = NextResponse.json({
      success: true,
      message: result.message || "OTP verified successfully",
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        status: user.status,
        role: user.role,
        profile: user.profile,
      },
    });

    // Also set HTTP-only cookies for browser clients
    setAuthCookies(response, { accessToken, refreshToken });

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
