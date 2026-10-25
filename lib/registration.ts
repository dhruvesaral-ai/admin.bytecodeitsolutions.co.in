import type { Prisma } from "@/generated/prisma/client";

export type RegistrationWriteBody = {
  courseId?: string;
  batchId?: string | null;
  profileId?: string;
  registrationNo?: string;
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

export function generateRegistrationNo(): string {
  const time = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `REG-${time}-${rand}`;
}

export function parseRegistrationCreateBody(
  body: RegistrationWriteBody,
): { data: Prisma.RegistrationCreateInput } | { error: string } {
  const courseId = parseNonEmptyString(body.courseId, "courseId");
  if ("error" in courseId) {
    return courseId;
  }

  const profileId = parseNonEmptyString(body.profileId, "profileId");
  if ("error" in profileId) {
    return profileId;
  }

  let registrationNo = generateRegistrationNo();
  if (body.registrationNo !== undefined) {
    const customRegNo = parseNonEmptyString(body.registrationNo, "registrationNo");
    if ("error" in customRegNo) {
      return customRegNo;
    }
    registrationNo = customRegNo.value;
  }

  let batch: Prisma.BatchCreateNestedOneWithoutRegistrationsInput | undefined;
  if (body.batchId !== undefined && body.batchId !== null) {
    const batchId = parseNullableId(body.batchId, "batchId");
    if ("error" in batchId) {
      return batchId;
    }
    if (batchId.value) {
      batch = { connect: { id: batchId.value } };
    }
  }

  return {
    data: {
      registrationNo,
      course: { connect: { id: courseId.value } },
      profile: { connect: { id: profileId.value } },
      batch,
    },
  };
}

export function parseRegistrationUpdateBody(
  body: RegistrationWriteBody,
): { data: Prisma.RegistrationUpdateInput } | { error: string } {
  const data: Prisma.RegistrationUpdateInput = {};

  if (body.courseId !== undefined) {
    const courseId = parseNonEmptyString(body.courseId, "courseId");
    if ("error" in courseId) {
      return courseId;
    }
    data.course = { connect: { id: courseId.value } };
  }

  if (body.profileId !== undefined) {
    const profileId = parseNonEmptyString(body.profileId, "profileId");
    if ("error" in profileId) {
      return profileId;
    }
    data.profile = { connect: { id: profileId.value } };
  }

  if (body.registrationNo !== undefined) {
    const registrationNo = parseNonEmptyString(body.registrationNo, "registrationNo");
    if ("error" in registrationNo) {
      return registrationNo;
    }
    data.registrationNo = registrationNo.value;
  }

  if (body.batchId !== undefined) {
    const batchId = parseNullableId(body.batchId, "batchId");
    if ("error" in batchId) {
      return batchId;
    }
    if (batchId.value) {
      data.batch = { connect: { id: batchId.value } };
    } else {
      data.batch = { disconnect: true };
    }
  }

  if (Object.keys(data).length === 0) {
    return { error: "At least one field is required to update" };
  }

  return { data };
}

export const registrationDetailInclude = {
  course: {
    select: {
      id: true,
      name: true,
      status: true,
    },
  },
  batch: {
    select: {
      id: true,
      name: true,
    },
  },
  profile: {
    select: {
      id: true,
      name: true,
      email: true,
      userId: true,
    },
  },
  enrollment: {
    select: {
      id: true,
      enrollmentNo: true,
    },
  },
  payments: true,
} as const;
