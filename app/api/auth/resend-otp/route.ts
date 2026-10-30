import { NextRequest, NextResponse } from "next/server";
import { formatMobileNumber, resendMsg91Otp } from "@/lib/msg91";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const rawMobile = body.mobile || body.username;
    const retrytype = (body.retrytype === "voice" ? "voice" : "text") as "text" | "voice";

    if (!rawMobile) {
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

    // Call MSG91 Retry OTP API
    const result = await resendMsg91Otp({
      mobile,
      retrytype,
    });

    if (result.type === "error") {
      return NextResponse.json(
        { error: result.message || "Failed to resend OTP", details: result },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message || "OTP resent successfully",
      type: result.type,
      retrytype,
      mobile,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawMobile = searchParams.get("mobile") || searchParams.get("username");
    const retrytype = (searchParams.get("retrytype") === "voice" ? "voice" : "text") as "text" | "voice";

    if (!rawMobile) {
      return NextResponse.json(
        { error: "mobile or username query parameter is required" },
        { status: 400 },
      );
    }

    const mobile = formatMobileNumber(rawMobile);
    const result = await resendMsg91Otp({
      mobile,
      retrytype,
    });

    if (result.type === "error") {
      return NextResponse.json(
        { error: result.message || "Failed to resend OTP", details: result },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message || "OTP resent successfully",
      type: result.type,
      retrytype,
      mobile,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
