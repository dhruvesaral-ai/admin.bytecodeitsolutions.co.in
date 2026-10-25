import type { GeneralStatus, Prisma } from "@/generated/prisma/client";
import { GeneralStatus as GeneralStatusValues } from "@/generated/prisma/client";

export type ProfileWriteBody = {
  userId?: string;
  name?: string;
  email?: string;
  status?: GeneralStatus;
  profileImgUrl?: string | null;
};

function parseNonEmptyString(
  value: unknown,
  field: string,
): { value: string } | { error: string } {
  if (typeof value !== "string" || value.trim() === "") {
    return { error: `${field} must be a non-empty string` };
  }
  return { value: value.trim() };
}

function parseEmail(value: unknown): { value: string } | { error: string } {
  if (typeof value !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
    return { error: "email must be a valid email address" };
  }
  return { value: value.trim().toLowerCase() };
}

function parseNullableString(
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

export function parseProfileCreateBody(
  body: ProfileWriteBody,
): { data: Prisma.ProfileCreateInput } | { error: string } {
  const userId = parseNonEmptyString(body.userId, "userId");
  if ("error" in userId) {
    return userId;
  }

  const name = parseNonEmptyString(body.name, "name");
  if ("error" in name) {
    return name;
  }

  const email = parseEmail(body.email);
  if ("error" in email) {
    return email;
  }

  let status: GeneralStatus = GeneralStatusValues.active;
  if (body.status !== undefined) {
    const parsedStatus = parseGeneralStatus(body.status);
    if ("error" in parsedStatus) {
      return parsedStatus;
    }
    status = parsedStatus.value;
  }

  let profileImgUrl: string | null = null;
  if (body.profileImgUrl !== undefined) {
    const parsedImg = parseNullableString(body.profileImgUrl, "profileImgUrl");
    if ("error" in parsedImg) {
      return parsedImg;
    }
    profileImgUrl = parsedImg.value;
  }

  return {
    data: {
      name: name.value,
      email: email.value,
      status,
      profileImgUrl,
      user: { connect: { id: userId.value } },
    },
  };
}

export function parseProfileUpdateBody(
  body: ProfileWriteBody,
): { data: Prisma.ProfileUpdateInput } | { error: string } {
  const data: Prisma.ProfileUpdateInput = {};

  if (body.userId !== undefined) {
    const userId = parseNonEmptyString(body.userId, "userId");
    if ("error" in userId) {
      return userId;
    }
    data.user = { connect: { id: userId.value } };
  }

  if (body.name !== undefined) {
    const name = parseNonEmptyString(body.name, "name");
    if ("error" in name) {
      return name;
    }
    data.name = name.value;
  }

  if (body.email !== undefined) {
    const email = parseEmail(body.email);
    if ("error" in email) {
      return email;
    }
    data.email = email.value;
  }

  if (body.status !== undefined) {
    const status = parseGeneralStatus(body.status);
    if ("error" in status) {
      return status;
    }
    data.status = status.value;
  }

  if (body.profileImgUrl !== undefined) {
    const parsedImg = parseNullableString(body.profileImgUrl, "profileImgUrl");
    if ("error" in parsedImg) {
      return parsedImg;
    }
    data.profileImgUrl = parsedImg.value;
  }

  if (Object.keys(data).length === 0) {
    return { error: "At least one field is required to update" };
  }

  return { data };
}

export const profileDetailInclude = {
  user: {
    select: {
      id: true,
      username: true,
      status: true,
      role: true,
    },
  },
  addresses: true,
} as const;
