import type { Prisma } from "@/generated/prisma/client";

export type AddressWriteBody = {
  addressLine?: string;
  pincode?: string;
  city?: string;
  state?: string;
  country?: string;
  profileId?: string;
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

export function parseAddressCreateBody(
  body: AddressWriteBody,
): { data: Prisma.AddressCreateInput } | { error: string } {
  const addressLine = parseNonEmptyString(body.addressLine, "addressLine");
  if ("error" in addressLine) {
    return addressLine;
  }

  const pincode = parseNonEmptyString(body.pincode, "pincode");
  if ("error" in pincode) {
    return pincode;
  }

  const city = parseNonEmptyString(body.city, "city");
  if ("error" in city) {
    return city;
  }

  const state = parseNonEmptyString(body.state, "state");
  if ("error" in state) {
    return state;
  }

  const country = parseNonEmptyString(body.country, "country");
  if ("error" in country) {
    return country;
  }

  const profileId = parseNonEmptyString(body.profileId, "profileId");
  if ("error" in profileId) {
    return profileId;
  }

  return {
    data: {
      addressLine: addressLine.value,
      pincode: pincode.value,
      city: city.value,
      state: state.value,
      country: country.value,
      profile: { connect: { id: profileId.value } },
    },
  };
}

export function parseAddressUpdateBody(
  body: AddressWriteBody,
): { data: Prisma.AddressUpdateInput } | { error: string } {
  const data: Prisma.AddressUpdateInput = {};

  if (body.addressLine !== undefined) {
    const addressLine = parseNonEmptyString(body.addressLine, "addressLine");
    if ("error" in addressLine) {
      return addressLine;
    }
    data.addressLine = addressLine.value;
  }

  if (body.pincode !== undefined) {
    const pincode = parseNonEmptyString(body.pincode, "pincode");
    if ("error" in pincode) {
      return pincode;
    }
    data.pincode = pincode.value;
  }

  if (body.city !== undefined) {
    const city = parseNonEmptyString(body.city, "city");
    if ("error" in city) {
      return city;
    }
    data.city = city.value;
  }

  if (body.state !== undefined) {
    const state = parseNonEmptyString(body.state, "state");
    if ("error" in state) {
      return state;
    }
    data.state = state.value;
  }

  if (body.country !== undefined) {
    const country = parseNonEmptyString(body.country, "country");
    if ("error" in country) {
      return country;
    }
    data.country = country.value;
  }

  if (body.profileId !== undefined) {
    const profileId = parseNonEmptyString(body.profileId, "profileId");
    if ("error" in profileId) {
      return profileId;
    }
    data.profile = { connect: { id: profileId.value } };
  }

  if (Object.keys(data).length === 0) {
    return { error: "At least one field is required to update" };
  }

  return { data };
}

export const addressDetailInclude = {
  profile: {
    select: {
      id: true,
      name: true,
      email: true,
      userId: true,
    },
  },
} as const;
