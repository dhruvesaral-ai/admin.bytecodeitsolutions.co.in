import { prisma } from "@/lib/db";
import {
  isNextResponse,
  isPrismaNotFound,
  isPrismaUniqueViolation,
  jsonError,
  jsonOk,
  parseJsonBody,
} from "@/lib/api/http";
import {
  parseCourseCategorieUpdateBody,
  type CourseCategorieWriteBody,
} from "@/lib/course-categorie";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    const category = await prisma.courseCategorie.findUnique({ where: { id } });
    if (!category) {
      return jsonError("Course category not found", 404);
    }
    return jsonOk({ data: category });
  } catch (error) {
    return jsonError(error, 500);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;

  const body = await parseJsonBody<CourseCategorieWriteBody>(request);
  if (isNextResponse(body)) {
    return body;
  }

  const parsed = parseCourseCategorieUpdateBody(body);
  if ("error" in parsed) {
    return jsonError(parsed.error, 400);
  }

  try {
    const category = await prisma.courseCategorie.update({
      where: { id },
      data: parsed.data,
    });
    return jsonOk({ data: category });
  } catch (error) {
    if (isPrismaNotFound(error)) {
      return jsonError("Course category not found", 404);
    }
    if (isPrismaUniqueViolation(error)) {
      return jsonError("A category with this slug already exists", 409);
    }
    return jsonError(error, 500);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    await prisma.courseCategorie.delete({ where: { id } });
    return jsonOk({ data: { id } });
  } catch (error) {
    if (isPrismaNotFound(error)) {
      return jsonError("Course category not found", 404);
    }
    return jsonError(error, 500);
  }
}
