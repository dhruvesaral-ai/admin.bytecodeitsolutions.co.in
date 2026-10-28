import type { GeneralStatus, Prisma } from "@/generated/prisma/client";
import { GeneralStatus as GeneralStatusValues } from "@/generated/prisma/client";

export type CourseWriteBody = {
  name?: string;
  shortDescription?: string | null;
  longDescription?: string | null;
  originalPrice?: number | string | null;
  discountedPrice?: number | string | null;
  rating?: number | null;
  technologyTags?: string[];
  duration?: string | null;
  status?: GeneralStatus;
  courseImgUrl?: string | null;
  portraitImgUrl?: string | null;
  syllabus?: string | null;
  courseCategorieId?: string | null;
  isPlacementGurranted?: boolean;
  isInSale?: boolean;
  courseModuleIds?: string[];
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

function parseOptionalDecimal(
  value: unknown,
  field: string,
): { value: number | string | null } | { error: string } {
  if (value === null) {
    return { value: null };
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return { value };
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return { error: `${field} must be a valid number` };
    }
    return { value };
  }
  return { error: `${field} must be a number, numeric string, or null` };
}

function parseOptionalRating(
  value: unknown,
): { value: number | null } | { error: string } {
  if (value === null) {
    return { value: null };
  }
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return { error: "rating must be a number or null" };
  }
  return { value };
}

function parseStringArray(
  value: unknown,
  field: string,
): { value: string[] } | { error: string } {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    return { error: `${field} must be an array of strings` };
  }
  return { value };
}

function parseGeneralStatus(
  value: unknown,
): { value: GeneralStatus } | { error: string } {
  if (
    value !== GeneralStatusValues.active &&
    value !== GeneralStatusValues.inactive
  ) {
    return { error: "status must be active or inactive" };
  }
  return { value };
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

function assignCourseFields(
  body: CourseWriteBody,
  data: Prisma.CourseCreateInput | Prisma.CourseUpdateInput,
  mode: "create" | "update",
): { error: string } | null {
  if (body.name !== undefined) {
    const name = parseNonEmptyString(body.name, "name");
    if ("error" in name) {
      return name;
    }
    data.name = name.value;
  } else if (mode === "create") {
    return { error: "name is required" };
  }

  if (body.shortDescription !== undefined) {
    const shortDescription = parseNullableString(
      body.shortDescription,
      "shortDescription",
    );
    if ("error" in shortDescription) {
      return shortDescription;
    }
    data.shortDescription = shortDescription.value;
  }

  if (body.longDescription !== undefined) {
    const longDescription = parseNullableString(
      body.longDescription,
      "longDescription",
    );
    if ("error" in longDescription) {
      return longDescription;
    }
    data.longDescription = longDescription.value;
  }

  if (body.originalPrice !== undefined) {
    const originalPrice = parseOptionalDecimal(body.originalPrice, "originalPrice");
    if ("error" in originalPrice) {
      return originalPrice;
    }
    data.originalPrice = originalPrice.value;
  }

  if (body.discountedPrice !== undefined) {
    const discountedPrice = parseOptionalDecimal(
      body.discountedPrice,
      "discountedPrice",
    );
    if ("error" in discountedPrice) {
      return discountedPrice;
    }
    data.discountedPrice = discountedPrice.value;
  }

  if (body.rating !== undefined) {
    const rating = parseOptionalRating(body.rating);
    if ("error" in rating) {
      return rating;
    }
    data.rating = rating.value;
  }

  if (body.technologyTags !== undefined) {
    const technologyTags = parseStringArray(body.technologyTags, "technologyTags");
    if ("error" in technologyTags) {
      return technologyTags;
    }
    data.technologyTags = technologyTags.value;
  }

  if (body.duration !== undefined) {
    const duration = parseNullableString(body.duration, "duration");
    if ("error" in duration) {
      return duration;
    }
    data.duration = duration.value;
  }

  if (body.status !== undefined) {
    const status = parseGeneralStatus(body.status);
    if ("error" in status) {
      return status;
    }
    data.status = status.value;
  }

  if (body.courseImgUrl !== undefined) {
    const courseImgUrl = parseNullableString(body.courseImgUrl, "courseImgUrl");
    if ("error" in courseImgUrl) {
      return courseImgUrl;
    }
    data.courseImgUrl = courseImgUrl.value;
  }

  if (body.portraitImgUrl !== undefined) {
    const portraitImgUrl = parseNullableString(
      body.portraitImgUrl,
      "portraitImgUrl",
    );
    if ("error" in portraitImgUrl) {
      return portraitImgUrl;
    }
    data.portraitImgUrl = portraitImgUrl.value;
  }

  if (body.syllabus !== undefined) {
    const syllabus = parseNullableString(body.syllabus, "syllabus");
    if ("error" in syllabus) {
      return syllabus;
    }
    data.syllabus = syllabus.value;
  }

  if (body.courseCategorieId !== undefined) {
    const courseCategorieId = parseNullableId(
      body.courseCategorieId,
      "courseCategorieId",
    );
    if ("error" in courseCategorieId) {
      return courseCategorieId;
    }
    if (courseCategorieId.value) {
      data.courseCategorie = { connect: { id: courseCategorieId.value } };
    } else if (mode === "update") {
      data.courseCategorie = { disconnect: true };
    }
  }

  if (body.isPlacementGurranted !== undefined) {
    if (typeof body.isPlacementGurranted !== "boolean") {
      return { error: "isPlacementGurranted must be a boolean" };
    }
    data.isPlacementGurranted = body.isPlacementGurranted;
  }

  if (body.isInSale !== undefined) {
    if (typeof body.isInSale !== "boolean") {
      return { error: "isInSale must be a boolean" };
    }
    data.isInSale = body.isInSale;
  }

  if (body.courseModuleIds !== undefined) {
    const courseModuleIds = parseStringArray(body.courseModuleIds, "courseModuleIds");
    if ("error" in courseModuleIds) {
      return courseModuleIds;
    }
    if (mode === "create") {
      (data as Prisma.CourseCreateInput).modules = {
        connect: courseModuleIds.value.map((id) => ({ id })),
      };
    } else {
      (data as Prisma.CourseUpdateInput).modules = {
        set: courseModuleIds.value.map((id) => ({ id })),
      };
    }
  }

  return null;
}

export function parseCourseCreateBody(
  body: CourseWriteBody,
): { data: Prisma.CourseCreateInput } | { error: string } {
  const data: Prisma.CourseCreateInput = {
    name: "",
    technologyTags: [],
  };

  const error = assignCourseFields(body, data, "create");
  if (error) {
    return error;
  }

  if (!data.name) {
    return { error: "name is required" };
  }

  return { data };
}

export function parseCourseUpdateBody(
  body: CourseWriteBody,
): { data: Prisma.CourseUpdateInput } | { error: string } {
  const data: Prisma.CourseUpdateInput = {};

  const error = assignCourseFields(body, data, "update");
  if (error) {
    return error;
  }

  if (Object.keys(data).length === 0) {
    return { error: "At least one field is required to update" };
  }

  return { data };
}

export const courseDetailInclude = {
  courseCategorie: true,
  modules: true,
} as const;

export function toApiCourse<T extends { modules?: { id: string }[] }>(
  course: T,
): T & { courseModuleIds: string[] } {
  return {
    ...course,
    courseModuleIds: course.modules ? course.modules.map((m) => m.id) : [],
  };
}
