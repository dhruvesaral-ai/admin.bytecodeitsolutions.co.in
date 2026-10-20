import { prisma } from "@/lib/db";
import {
  isNextResponse,
  isPrismaForeignKeyViolation,
  isPrismaNotFound,
  jsonError,
  jsonOk,
  parseJsonBody,
} from "@/lib/api/http";
import {
  courseDetailInclude,
  parseCourseUpdateBody,
  type CourseWriteBody,
} from "@/lib/course";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    const course = await prisma.course.findUnique({
      where: { id },
      include: courseDetailInclude,
    });
    if (!course) {
      return jsonError("Course not found", 404);
    }
    return jsonOk({ data: course });
  } catch (error) {
    return jsonError(error, 500);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;

  const body = await parseJsonBody<CourseWriteBody>(request);
  if (isNextResponse(body)) {
    return body;
  }

  const parsed = parseCourseUpdateBody(body);
  if ("error" in parsed) {
    return jsonError(parsed.error, 400);
  }

  try {
    const course = await prisma.course.update({
      where: { id },
      data: parsed.data,
      include: courseDetailInclude,
    });
    return jsonOk({ data: course });
  } catch (error) {
    if (isPrismaNotFound(error)) {
      return jsonError("Course not found", 404);
    }
    if (isPrismaForeignKeyViolation(error)) {
      return jsonError("courseCategorieId does not match an existing category", 400);
    }
    return jsonError(error, 500);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    await prisma.course.delete({ where: { id } });
    return jsonOk({ data: { id } });
  } catch (error) {
    if (isPrismaNotFound(error)) {
      return jsonError("Course not found", 404);
    }
    return jsonError(error, 500);
  }
}
