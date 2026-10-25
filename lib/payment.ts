import type { Prisma } from "@/generated/prisma/client";

export type PaymentWriteBody = {
  profileId?: string;
  enrollmentId?: string | null;
  registrationId?: string | null;
  paymentMethod?: string;
  rupees?: number | string;
  paymentProof?: string | null;
  isVerified?: boolean;
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

function parseRupees(value: unknown): { value: number | string } | { error: string } {
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
    return { value };
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed >= 0) {
      return { value };
    }
  }
  return { error: "rupees must be a non-negative number" };
}

export function parsePaymentCreateBody(
  body: PaymentWriteBody,
): { data: Prisma.PaymentCreateInput } | { error: string } {
  const profileId = parseNonEmptyString(body.profileId, "profileId");
  if ("error" in profileId) {
    return profileId;
  }

  const paymentMethod = parseNonEmptyString(body.paymentMethod, "paymentMethod");
  if ("error" in paymentMethod) {
    return paymentMethod;
  }

  const rupees = parseRupees(body.rupees);
  if ("error" in rupees) {
    return rupees;
  }

  let paymentProof: string | null = null;
  if (body.paymentProof !== undefined) {
    const proof = parseNullableString(body.paymentProof, "paymentProof");
    if ("error" in proof) {
      return proof;
    }
    paymentProof = proof.value;
  }

  let isVerified = false;
  if (body.isVerified !== undefined) {
    if (typeof body.isVerified !== "boolean") {
      return { error: "isVerified must be a boolean" };
    }
    isVerified = body.isVerified;
  }

  let enrollment: Prisma.EnrollmentCreateNestedOneWithoutPaymentsInput | undefined;
  if (body.enrollmentId !== undefined && body.enrollmentId !== null) {
    const enrollId = parseNullableString(body.enrollmentId, "enrollmentId");
    if ("error" in enrollId) {
      return enrollId;
    }
    if (enrollId.value) {
      enrollment = { connect: { id: enrollId.value } };
    }
  }

  let registration: Prisma.RegistrationCreateNestedOneWithoutPaymentsInput | undefined;
  if (body.registrationId !== undefined && body.registrationId !== null) {
    const regId = parseNullableString(body.registrationId, "registrationId");
    if ("error" in regId) {
      return regId;
    }
    if (regId.value) {
      registration = { connect: { id: regId.value } };
    }
  }

  return {
    data: {
      paymentMethod: paymentMethod.value,
      rupees: rupees.value,
      paymentProof,
      isVerified,
      profile: { connect: { id: profileId.value } },
      enrollment,
      registration,
    },
  };
}

export function parsePaymentUpdateBody(
  body: PaymentWriteBody,
): { data: Prisma.PaymentUpdateInput } | { error: string } {
  const data: Prisma.PaymentUpdateInput = {};

  if (body.profileId !== undefined) {
    const profileId = parseNonEmptyString(body.profileId, "profileId");
    if ("error" in profileId) {
      return profileId;
    }
    data.profile = { connect: { id: profileId.value } };
  }

  if (body.paymentMethod !== undefined) {
    const paymentMethod = parseNonEmptyString(body.paymentMethod, "paymentMethod");
    if ("error" in paymentMethod) {
      return paymentMethod;
    }
    data.paymentMethod = paymentMethod.value;
  }

  if (body.rupees !== undefined) {
    const rupees = parseRupees(body.rupees);
    if ("error" in rupees) {
      return rupees;
    }
    data.rupees = rupees.value;
  }

  if (body.paymentProof !== undefined) {
    const proof = parseNullableString(body.paymentProof, "paymentProof");
    if ("error" in proof) {
      return proof;
    }
    data.paymentProof = proof.value;
  }

  if (body.isVerified !== undefined) {
    if (typeof body.isVerified !== "boolean") {
      return { error: "isVerified must be a boolean" };
    }
    data.isVerified = body.isVerified;
  }

  if (body.enrollmentId !== undefined) {
    const enrollId = parseNullableString(body.enrollmentId, "enrollmentId");
    if ("error" in enrollId) {
      return enrollId;
    }
    if (enrollId.value) {
      data.enrollment = { connect: { id: enrollId.value } };
    } else {
      data.enrollment = { disconnect: true };
    }
  }

  if (body.registrationId !== undefined) {
    const regId = parseNullableString(body.registrationId, "registrationId");
    if ("error" in regId) {
      return regId;
    }
    if (regId.value) {
      data.registration = { connect: { id: regId.value } };
    } else {
      data.registration = { disconnect: true };
    }
  }

  if (Object.keys(data).length === 0) {
    return { error: "At least one field is required to update" };
  }

  return { data };
}

export const paymentDetailInclude = {
  profile: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
  enrollment: {
    select: {
      id: true,
      enrollmentNo: true,
      course: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  },
  registration: {
    select: {
      id: true,
      registrationNo: true,
      course: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  },
} as const;
