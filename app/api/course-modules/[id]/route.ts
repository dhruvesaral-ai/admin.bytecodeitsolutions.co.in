import { prisma } from "@/lib/prisma";
import {
  isNextResponse,
  isPrismaNotFound,
  jsonError,
  jsonOk,
  parseJsonBody,
} from "@/lib/api/http";
import {
  parseCourseModuleUpdateBody,
  type CourseModuleWriteBody,
} from "@/lib/course-module";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    const courseModule = await prisma.courseModule.findUnique({ where: { id } });
    if (!courseModule) {
      return jsonError("Course module not found", 404);
    }
    return jsonOk({ data: courseModule });
  } catch {
    return jsonError("Failed to fetch course module", 500);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;

  const body = await parseJsonBody<CourseModuleWriteBody>(request);
  if (isNextResponse(body)) {
    return body;
  }

  const parsed = parseCourseModuleUpdateBody(body);
  if ("error" in parsed) {
    return jsonError(parsed.error, 400);
  }

  try {
    const courseModule = await prisma.courseModule.update({
      where: { id },
      data: parsed.data,
    });
    return jsonOk({ data: courseModule });
  } catch (error) {
    if (isPrismaNotFound(error)) {
      return jsonError("Course module not found", 404);
    }
    return jsonError("Failed to update course module", 500);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    await prisma.courseModule.delete({ where: { id } });
    return jsonOk({ data: { id } });
  } catch (error) {
    if (isPrismaNotFound(error)) {
      return jsonError("Course module not found", 404);
    }
    return jsonError("Failed to delete course module", 500);
  }
}
