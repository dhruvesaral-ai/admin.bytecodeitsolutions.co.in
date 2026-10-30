import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { formatMobileNumber, sendMsg91Otp } from "@/lib/msg91";
import { getRequestMetadata } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const rawMobile = body.mobile || body.username;

    if (!rawMobile || typeof rawMobile !== "string") {
      return NextResponse.json(
        { error: "Mobile number or username is required" },
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

    const { searchParams } = new URL(request.url);
    const callingFrom = (body.callingFrom || searchParams.get("callingFrom") || "")
      .toString()
      .toLowerCase()
      .trim();

    // Check user status and role (matches 91XXXXXXXXXX or legacy formats)
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: mobile },
          { username: mobile.slice(2) },
          { username: `+${mobile}` },
        ],
      },
      include: {
        role: true,
      },
    });

    if (user?.status === "inactive") {
      return NextResponse.json(
        { error: "User account is suspended or inactive" },
        { status: 403 },
      );
    }

    // When logging in from admin panel, users must already be added by staff and not have 'student' role
    if (callingFrom === "admin") {
      const isStudentOrUnregistered = !user || !user.role || user.role.slug === "student";
      if (isStudentOrUnregistered) {
        return NextResponse.json(
          { error: "Ask staff to add you then try to login" },
          { status: 403 },
        );
      }
    }

    // Client metadata
    const { ipAddress } = getRequestMetadata(request);

    // Call MSG91 Send OTP API
    const result = await sendMsg91Otp({
      mobile,
      templateId: body.template_id || body.templateId,
      otp: body.otp,
      otpLength: body.otp_length || body.otpLength,
      otpExpiry: body.otp_expiry || body.otpExpiry,
      unicode: body.unicode,
      invisible: body.invisible,
      userip: body.userip || ipAddress || undefined,
      email: body.email,
      params: body.params || (body.Param1 || body.Param2 || body.Param3 ? {
        ...(body.Param1 ? { Param1: body.Param1 } : {}),
        ...(body.Param2 ? { Param2: body.Param2 } : {}),
        ...(body.Param3 ? { Param3: body.Param3 } : {}),
      } : undefined),
    });

    if (result.type === "error") {
      return NextResponse.json(
        { error: result.message || "Failed to send OTP via MSG91", details: result },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message || "OTP sent successfully",
      type: result.type,
      mobile,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
