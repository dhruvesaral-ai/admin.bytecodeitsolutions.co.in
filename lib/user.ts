import type { GeneralStatus, Prisma } from "@/generated/prisma/client";
import { GeneralStatus as GeneralStatusValues } from "@/generated/prisma/client";

export type UserWriteBody = {
  username?: string;
  status?: GeneralStatus;
  roleId?: string | null;
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
  const username = parseNonEmptyString(body.username, "username");
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
    const username = parseNonEmptyString(body.username, "username");
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
} as const;
