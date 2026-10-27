import type { Prisma } from "@/generated/prisma/client";

export type SettingWriteBody = {
  companyLogoUrl?: string | null;
  companyName?: string | null;
  companyAddressId?: string | null;
  companyWhatsappNumber?: string | null;
  companyPrimaryContactNumber?: string | null;
  companySecondaryContactNumber?: string | null;
};

/**
 * Scalar subset shared by `SettingCreateInput` and `SettingUpdateInput`, so the
 * same field assignment logic can feed both parsers.
 */
type SettingScalarFields = Omit<Prisma.SettingUpdateInput, "address">;

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
  return parseNonEmptyString(value, field);
}

function assignSettingFields(
  body: SettingWriteBody,
  data: SettingScalarFields,
): { error: string } | null {
  if (body.companyLogoUrl !== undefined) {
    const companyLogoUrl = parseNullableString(
      body.companyLogoUrl,
      "companyLogoUrl",
    );
    if ("error" in companyLogoUrl) {
      return companyLogoUrl;
    }
    data.companyLogoUrl = companyLogoUrl.value;
  }

  if (body.companyName !== undefined) {
    const companyName = parseNullableString(body.companyName, "companyName");
    if ("error" in companyName) {
      return companyName;
    }
    data.companyName = companyName.value;
  }

  if (body.companyWhatsappNumber !== undefined) {
    const companyWhatsappNumber = parseNullableString(
      body.companyWhatsappNumber,
      "companyWhatsappNumber",
    );
    if ("error" in companyWhatsappNumber) {
      return companyWhatsappNumber;
    }
    data.companyWhatsappNumber = companyWhatsappNumber.value;
  }

  if (body.companyPrimaryContactNumber !== undefined) {
    const companyPrimaryContactNumber = parseNullableString(
      body.companyPrimaryContactNumber,
      "companyPrimaryContactNumber",
    );
    if ("error" in companyPrimaryContactNumber) {
      return companyPrimaryContactNumber;
    }
    data.companyPrimaryContactNumber = companyPrimaryContactNumber.value;
  }

  if (body.companySecondaryContactNumber !== undefined) {
    const companySecondaryContactNumber = parseNullableString(
      body.companySecondaryContactNumber,
      "companySecondaryContactNumber",
    );
    if ("error" in companySecondaryContactNumber) {
      return companySecondaryContactNumber;
    }
    data.companySecondaryContactNumber = companySecondaryContactNumber.value;
  }

  return null;
}

export function parseSettingCreateBody(
  body: SettingWriteBody,
): { data: Prisma.SettingCreateInput } | { error: string } {
  const data: Prisma.SettingCreateInput = {};

  const error = assignSettingFields(body, data);
  if (error) {
    return error;
  }

  if (body.companyAddressId !== undefined) {
    const companyAddressId = parseNullableId(
      body.companyAddressId,
      "companyAddressId",
    );
    if ("error" in companyAddressId) {
      return companyAddressId;
    }
    if (companyAddressId.value) {
      data.address = { connect: { id: companyAddressId.value } };
    }
  }

  return { data };
}

export function parseSettingUpdateBody(
  body: SettingWriteBody,
): { data: Prisma.SettingUpdateInput } | { error: string } {
  const data: Prisma.SettingUpdateInput = {};

  const error = assignSettingFields(body, data);
  if (error) {
    return error;
  }

  if (body.companyAddressId !== undefined) {
    const companyAddressId = parseNullableId(
      body.companyAddressId,
      "companyAddressId",
    );
    if ("error" in companyAddressId) {
      return companyAddressId;
    }
    if (companyAddressId.value) {
      data.address = { connect: { id: companyAddressId.value } };
    } else {
      data.address = { disconnect: true };
    }
  }

  if (Object.keys(data).length === 0) {
    return { error: "At least one setting field is required to update" };
  }

  return { data };
}

export const settingDetailInclude = {
  address: true,
} as const;
