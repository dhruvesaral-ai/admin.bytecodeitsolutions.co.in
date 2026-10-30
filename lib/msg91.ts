import { MSG91_API, MSG91_AUTH_KEY, MSG91_TEMPLATE_ID } from "@/config";

export interface SendOtpOptions {
  mobile: string;
  templateId?: string;
  otp?: string;
  otpLength?: number;
  otpExpiry?: number; // in minutes (default: 15)
  unicode?: number; // 1 for non-English templates
  invisible?: number; // 1 for Android auto verification
  userip?: string; // client IP
  email?: string;
  params?: Record<string, string | number>;
}

export interface VerifyOtpOptions {
  mobile: string;
  otp: string;
  otpExpiry?: number;
}

export interface RetryOtpOptions {
  mobile: string;
  retrytype?: "text" | "voice";
}

export interface Msg91Response {
  type: "success" | "error";
  message: string;
  requestId?: string;
  [key: string]: unknown;
}

/**
 * Normalizes a phone number to international format without '+' or spaces.
 * Defaults to country code 91 (India) if a 10-digit number is provided.
 */
export function formatMobileNumber(phone: string, defaultCountryCode = "91"): string {
  if (!phone) return "";
  const cleaned = phone.replace(/[^0-9]/g, "");
  if (cleaned.length === 10) {
    return `${defaultCountryCode}${cleaned}`;
  }
  return cleaned;
}

/**
 * Sends an OTP using MSG91 Send OTP API (v5)
 * Endpoint: POST https://control.msg91.com/api/v5/otp
 */
export async function sendMsg91Otp(options: SendOtpOptions): Promise<Msg91Response> {
  const authKey = MSG91_AUTH_KEY;
  if (!authKey) {
    throw new Error("MSG91_AUTH_KEY is not configured");
  }

  const templateId = options.templateId || MSG91_TEMPLATE_ID;
  if (!templateId) {
    throw new Error("MSG91_TEMPLATE_ID is not configured");
  }

  const mobile = formatMobileNumber(options.mobile);
  if (!mobile) {
    throw new Error("A valid mobile number is required");
  }

  const url = new URL("otp", MSG91_API);
  url.searchParams.set("template_id", templateId);
  url.searchParams.set("mobile", mobile);

  if (options.otp) {
    url.searchParams.set("otp", options.otp);
  }
  if (options.otpLength) {
    url.searchParams.set("otp_length", options.otpLength.toString());
  }
  if (options.otpExpiry) {
    url.searchParams.set("otp_expiry", options.otpExpiry.toString());
  }
  if (options.unicode !== undefined) {
    url.searchParams.set("unicode", options.unicode.toString());
  }
  if (options.invisible !== undefined) {
    url.searchParams.set("invisible", options.invisible.toString());
  }
  if (options.userip) {
    url.searchParams.set("userip", options.userip);
  }
  if (options.email) {
    url.searchParams.set("email", options.email);
  }

  const response = await fetch(url.toString(), {
    method: "POST",
    headers: {
      authkey: authKey,
      "content-type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(options.params || {}),
  });

  const data = (await response.json()) as Msg91Response;
  return data;
}

/**
 * Verifies an OTP using MSG91 Verify OTP API (v5)
 * Endpoint: GET https://control.msg91.com/api/v5/otp/verify
 * Note: MSG91 returns HTTP 200 even for failed verifications with { type: "error" },
 * so callers should check response.type === "success".
 */
export async function verifyMsg91Otp(options: VerifyOtpOptions): Promise<Msg91Response> {
  const authKey = MSG91_AUTH_KEY;
  if (!authKey) {
    throw new Error("MSG91_AUTH_KEY is not configured");
  }

  const mobile = formatMobileNumber(options.mobile);
  if (!mobile) {
    throw new Error("A valid mobile number is required");
  }

  if (!options.otp) {
    throw new Error("OTP is required");
  }

  const url = new URL("otp/verify", MSG91_API);
  url.searchParams.set("mobile", mobile);
  url.searchParams.set("otp", options.otp.trim());

  if (options.otpExpiry) {
    url.searchParams.set("otp_expiry", options.otpExpiry.toString());
  }

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      authkey: authKey,
      Accept: "application/json",
    },
  });

  const data = (await response.json()) as Msg91Response;
  return data;
}

/**
 * Retries / Resends an OTP using MSG91 Retry OTP API (v5)
 * Endpoint: GET https://control.msg91.com/api/v5/otp/retry
 * retrytype: 'text' (SMS) or 'voice' (Call)
 */
export async function resendMsg91Otp(options: RetryOtpOptions): Promise<Msg91Response> {
  const authKey = MSG91_AUTH_KEY;
  if (!authKey) {
    throw new Error("MSG91_AUTH_KEY is not configured");
  }

  const mobile = formatMobileNumber(options.mobile);
  if (!mobile) {
    throw new Error("A valid mobile number is required");
  }

  const url = new URL("otp/retry", MSG91_API);
  url.searchParams.set("authkey", authKey);
  url.searchParams.set("mobile", mobile);
  url.searchParams.set("retrytype", options.retrytype || "text");

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      authkey: authKey,
      Accept: "application/json",
    },
  });

  const data = (await response.json()) as Msg91Response;
  return data;
}
