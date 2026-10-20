import type { Prisma } from "@/generated/prisma/client";

export type TestimonialWriteBody = {
  name?: string;
  profileImg?: string | null;
  companyName?: string | null;
};

function parseRequiredString(value: unknown): { value: string } | { error: string } {
  if (typeof value !== "string" || value.trim() === "") {
    return { error: "name must be a non-empty string" };
  }
  return { value: value.trim() };
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

export function parseTestimonialCreateBody(
  body: TestimonialWriteBody,
): { data: Prisma.TestimonialCreateInput } | { error: string } {
  const name = parseRequiredString(body.name);
  if ("error" in name) {
    return name;
  }

  const data: Prisma.TestimonialCreateInput = { name: name.value };
  if (body.profileImg !== undefined) {
    const profileImg = parseNullableString(body.profileImg, "profileImg");
    if ("error" in profileImg) {
      return profileImg;
    }
    data.profileImg = profileImg.value;
  }
  if (body.companyName !== undefined) {
    const companyName = parseNullableString(body.companyName, "companyName");
    if ("error" in companyName) {
      return companyName;
    }
    data.companyName = companyName.value;
  }
  return { data };
}

export function parseTestimonialUpdateBody(
  body: TestimonialWriteBody,
): { data: Prisma.TestimonialUpdateInput } | { error: string } {
  const data: Prisma.TestimonialUpdateInput = {};
  if (body.name !== undefined) {
    const name = parseRequiredString(body.name);
    if ("error" in name) {
      return name;
    }
    data.name = name.value;
  }
  if (body.profileImg !== undefined) {
    const profileImg = parseNullableString(body.profileImg, "profileImg");
    if ("error" in profileImg) {
      return profileImg;
    }
    data.profileImg = profileImg.value;
  }
  if (body.companyName !== undefined) {
    const companyName = parseNullableString(body.companyName, "companyName");
    if ("error" in companyName) {
      return companyName;
    }
    data.companyName = companyName.value;
  }
  if (Object.keys(data).length === 0) {
    return { error: "At least one testimonial field is required to update" };
  }
  return { data };
}
