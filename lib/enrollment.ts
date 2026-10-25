import type { Prisma } from "@/generated/prisma/client";

export type EnrollmentWriteBody = {
  registrationId?: string;
  courseId?: string;
  profileId?: string;
  batchId?: string | null;
  enrollmentNo?: string;
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

export function generateEnrollmentNo(): string {
  const time = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ENR-${time}-${rand}`;
}

export function parseEnrollmentCreateBody(
  body: EnrollmentWriteBody,
): { data: Prisma.EnrollmentCreateInput } | { error: string } {
  const registrationId = parseNonEmptyString(body.registrationId, "registrationId");
  if ("error" in registrationId) {
    return registrationId;
  }

  const courseId = parseNonEmptyString(body.courseId, "courseId");
  if ("error" in courseId) {
    return courseId;
  }

  const profileId = parseNonEmptyString(body.profileId, "profileId");
  if ("error" in profileId) {
    return profileId;
  }

  let enrollmentNo = generateEnrollmentNo();
  if (body.enrollmentNo !== undefined) {
    const customEnrollNo = parseNonEmptyString(body.enrollmentNo, "enrollmentNo");
    if ("error" in customEnrollNo) {
      return customEnrollNo;
    }
    enrollmentNo = customEnrollNo.value;
  }

  let batch: Prisma.BatchCreateNestedOneWithoutEnrollmentsInput | undefined;
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
      enrollmentNo,
      registration: { connect: { id: registrationId.value } },
      course: { connect: { id: courseId.value } },
      profile: { connect: { id: profileId.value } },
      batch,
    },
  };
}

export function parseEnrollmentUpdateBody(
  body: EnrollmentWriteBody,
): { data: Prisma.EnrollmentUpdateInput } | { error: string } {
  const data: Prisma.EnrollmentUpdateInput = {};

  if (body.registrationId !== undefined) {
    const registrationId = parseNonEmptyString(body.registrationId, "registrationId");
    if ("error" in registrationId) {
      return registrationId;
    }
    data.registration = { connect: { id: registrationId.value } };
  }

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

  if (body.enrollmentNo !== undefined) {
    const enrollmentNo = parseNonEmptyString(body.enrollmentNo, "enrollmentNo");
    if ("error" in enrollmentNo) {
      return enrollmentNo;
    }
    data.enrollmentNo = enrollmentNo.value;
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

export const enrollmentDetailInclude = {
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
  registration: {
    select: {
      id: true,
      registrationNo: true,
      createdAt: true,
    },
  },
  payments: true,
} as const;
