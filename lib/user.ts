import type { GeneralStatus, Prisma } from "@/generated/prisma/client";
import { GeneralStatus as GeneralStatusValues } from "@/generated/prisma/client";

export type UserWriteBody = {
  username?: string;
  status?: GeneralStatus;
  roleId?: string | null;
};

/**
 * Normalizes any valid phone/username string to 91XXXXXXXXXX.
 * Frontend always sends a 10-digit number; backend has to save it with 91 adding at first.
 * Also handles numbers that already include 91, +91, or leading 0.
 */
export function normalizeUsername(value: unknown): string | null {
  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }
  let digits = value.trim().replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("0")) {
    digits = digits.slice(1);
  }
  if (digits.length === 12 && digits.startsWith("91")) {
    return digits;
  }
  if (digits.length === 10) {
    return `91${digits}`;
  }
  return null;
}

/**
 * Extracts raw 10 digits from any phone/username format (+91, 91, leading 0, etc.).
 * Suitable for UI inputs that expect only 10 digits.
 */
export function sanitizePhoneDigits(value: string | null | undefined): string {
  if (!value) return "";
  let cleaned = value.trim();
  if (cleaned.startsWith("+91")) {
    cleaned = cleaned.slice(3);
  }
  const digits = cleaned.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) {
    return digits.slice(2, 12);
  }
  if (digits.length === 11 && digits.startsWith("0")) {
    return digits.slice(1, 11);
  }
  return digits.slice(0, 10);
}

/**
 * Parses and validates a username from the request body.
 * Expects a 10-digit number from frontend and ensures it is returned with '91' prefixed.
 */
export function parseUsername(
  value: unknown,
): { value: string } | { error: string } {
  if (typeof value !== "string" || value.trim() === "") {
    return { error: "username must be a 10-digit phone number" };
  }
  const normalized = normalizeUsername(value);
  if (!normalized) {
    return { error: "username must be a 10-digit phone number" };
  }
  return { value: normalized };
}

function parseNonEmptyString(
  value: unknown,
  field: string,
): { value: string } | { error: string } {
  if (typeof value !== "string" || value.trim() === "") {
    return { error: `${field} must be a non-empty string` };
  }
  return { value: value.trim() };
}

function parseNullableId(
  value: unknown,
  field: string,
): { value: string | null } | { error: string } {
  if (value === null) {
    return { value: null };
  }
  if (typeof value !== "string") {
    return { error: `${field} must be a string or null` };
  }
  const trimmed = value.trim();
  return { value: trimmed === "" ? null : trimmed };
}

function parseGeneralStatus(
  value: unknown,
): { value: GeneralStatus } | { error: string } {
  if (
    value !== GeneralStatusValues.active &&
    value !== GeneralStatusValues.inactive
  ) {
    return { error: "status must be either active or inactive" };
  }
  return { value };
}

export function parseUserCreateBody(
  body: UserWriteBody,
): { data: Prisma.UserCreateInput } | { error: string } {
  const username = parseUsername(body.username);
  if ("error" in username) {
    return username;
  }

  let status: GeneralStatus = GeneralStatusValues.active;
  if (body.status !== undefined) {
    const parsedStatus = parseGeneralStatus(body.status);
    if ("error" in parsedStatus) {
      return parsedStatus;
    }
    status = parsedStatus.value;
  }

  let role: Prisma.RoleCreateNestedOneWithoutUsersInput | undefined;
  if (body.roleId !== undefined && body.roleId !== null) {
    const roleId = parseNullableId(body.roleId, "roleId");
    if ("error" in roleId) {
      return roleId;
    }
    if (roleId.value) {
      role = { connect: { id: roleId.value } };
    }
  }

  return {
    data: {
      username: username.value,
      status,
      role,
    },
  };
}

export function parseUserUpdateBody(
  body: UserWriteBody,
): { data: Prisma.UserUpdateInput } | { error: string } {
  const data: Prisma.UserUpdateInput = {};

  if (body.username !== undefined) {
    const username = parseUsername(body.username);
    if ("error" in username) {
      return username;
    }
    data.username = username.value;
  }

  if (body.status !== undefined) {
    const status = parseGeneralStatus(body.status);
    if ("error" in status) {
      return status;
    }
    data.status = status.value;
  }

  if (body.roleId !== undefined) {
    const roleId = parseNullableId(body.roleId, "roleId");
    if ("error" in roleId) {
      return roleId;
    }
    if (roleId.value) {
      data.role = { connect: { id: roleId.value } };
    } else {
      data.role = { disconnect: true };
    }
  }

  if (Object.keys(data).length === 0) {
    return { error: "At least one field is required to update" };
  }

  return { data };
}

export const userDetailInclude = {
  role: true,
  profile: {
    include: {
      addresses: true,
    },
  },
  authSession: true,
} as const;
