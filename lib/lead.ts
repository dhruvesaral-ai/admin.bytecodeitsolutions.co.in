import type { LeadGeneratedSource, LeadStatus, Prisma } from "@/generated/prisma/client";
import {
  LeadGeneratedSource as LeadGeneratedSourceValues,
  LeadStatus as LeadStatusValues,
} from "@/generated/prisma/client";

export type LeadWriteBody = {
  firstName?: string;
  lastName?: string | null;
  username?: string;
  courseId?: string | null;
  hasBeenCalled?: boolean;
  nextCallDate?: string | null;
  status?: LeadStatus;
  generatedSource?: LeadGeneratedSource;
  leadRemark?: string | null;
  message?: string | null;
};

function requiredString(
  value: unknown,
  field: string,
): { value: string } | { error: string } {
  if (typeof value !== "string" || value.trim() === "") {
    return { error: `${field} must be a non-empty string` };
  }
  return { value: value.trim() };
}

function nullableString(
  value: unknown,
  field: string,
): { value: string | null } | { error: string } {
  if (value === null) {
    return { value: null };
  }
  if (typeof value !== "string") {
    return { error: `${field} must be a string or null` };
  }
  return { value: value.trim() || null };
}

function nullableDate(value: unknown): { value: Date | null } | { error: string } {
  if (value === null) {
    return { value: null };
  }
  if (typeof value !== "string" || value.trim() === "") {
    return { error: "nextCallDate must be a valid date or null" };
  }
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) {
    return { error: "nextCallDate must be a valid date or null" };
  }
  return { value: date };
}

function leadStatus(value: unknown): { value: LeadStatus } | { error: string } {
  if (
    value !== LeadStatusValues.hot &&
    value !== LeadStatusValues.medium &&
    value !== LeadStatusValues.cold &&
    value !== LeadStatusValues.converted
  ) {
    return { error: "status must be hot, medium, cold, or converted" };
  }
  return { value };
}

function generatedSource(
  value: unknown,
): { value: LeadGeneratedSource } | { error: string } {
  if (
    value !== LeadGeneratedSourceValues.online &&
    value !== LeadGeneratedSourceValues.offline
  ) {
    return { error: "generatedSource must be online or offline" };
  }
  return { value };
}

function parseLeadUsername(
  value: unknown,
): { value: string } | { error: string } {
  if (typeof value !== "string" || value.trim() === "") {
    return { error: "username must be a 10-digit phone number" };
  }
  const sanitized = value.trim().replace(/[\s-]/g, "");
  if (/^\d{10}$/.test(sanitized)) {
    return { value: `+91${sanitized}` };
  }
  if (/^\+91\d{10}$/.test(sanitized)) {
    return { value: sanitized };
  }
  if (/^91\d{10}$/.test(sanitized)) {
    return { value: `+${sanitized}` };
  }
  return { error: "username must be a 10-digit phone number" };
}

function assignLeadFields(
  body: LeadWriteBody,
  data: Prisma.LeadUncheckedCreateInput | Prisma.LeadUncheckedUpdateInput,
): { error: string } | null {
  if (body.firstName !== undefined) {
    const firstName = requiredString(body.firstName, "firstName");
    if ("error" in firstName) return firstName;
    data.firstName = firstName.value;
  }

  if (body.username !== undefined) {
    const username = parseLeadUsername(body.username);
    if ("error" in username) return username;
    data.username = username.value;
  }

  for (const field of ["lastName", "leadRemark", "message"] as const) {
    if (body[field] !== undefined) {
      const parsed = nullableString(body[field], field);
      if ("error" in parsed) return parsed;
      data[field] = parsed.value;
    }
  }

  if (body.courseId !== undefined) {
    if (body.courseId !== null && typeof body.courseId !== "string") {
      return { error: "courseId must be a string or null" };
    }
    data.courseId =
      typeof body.courseId === "string" && body.courseId.trim() !== ""
        ? body.courseId.trim()
        : null;
  }

  if (body.hasBeenCalled !== undefined) {
    if (typeof body.hasBeenCalled !== "boolean") {
      return { error: "hasBeenCalled must be a boolean" };
    }
    data.hasBeenCalled = body.hasBeenCalled;
  }

  if (body.nextCallDate !== undefined) {
    const nextCallDate = nullableDate(body.nextCallDate);
    if ("error" in nextCallDate) return nextCallDate;
    data.nextCallDate = nextCallDate.value;
  }

  if (body.status !== undefined) {
    const status = leadStatus(body.status);
    if ("error" in status) return status;
    data.status = status.value;
  }

  if (body.generatedSource !== undefined) {
    const source = generatedSource(body.generatedSource);
    if ("error" in source) return source;
    data.generatedSource = source.value;
  }

  return null;
}

export function parseLeadCreateBody(
  body: LeadWriteBody,
): { data: Prisma.LeadUncheckedCreateInput } | { error: string } {
  const firstName = requiredString(body.firstName, "firstName");
  if ("error" in firstName) return firstName;
  const username = parseLeadUsername(body.username);
  if ("error" in username) return username;

  const data: Prisma.LeadUncheckedCreateInput = {
    firstName: firstName.value,
    username: username.value,
  };
  const error = assignLeadFields(body, data);
  if (error) return error;
  if (body.status === undefined) {
    data.status = LeadStatusValues.hot;
  }
  return { data };
}

export function parseLeadUpdateBody(
  body: LeadWriteBody,
): { data: Prisma.LeadUncheckedUpdateInput } | { error: string } {
  const data: Prisma.LeadUncheckedUpdateInput = {};
  const error = assignLeadFields(body, data);
  if (error) return error;
  if (Object.keys(data).length === 0) {
    return { error: "At least one lead field is required to update" };
  }
  return { data };
}

export const leadDetailInclude = {
  course: { select: { id: true, name: true } },
  remarks: { orderBy: { createdAt: "desc" as const } },
} as const;
