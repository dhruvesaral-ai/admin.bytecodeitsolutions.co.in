import { prisma } from "@/lib/db";
import {
  isNextResponse,
  isPrismaForeignKeyViolation,
  jsonError,
  jsonOk,
  parseJsonBody,
} from "@/lib/api/http";
import {
  courseDetailInclude,
  parseCourseCreateBody,
  toApiCourse,
  type CourseWriteBody,
} from "@/lib/course";

export async function GET() {
  try {
    const courses = await prisma.course.findMany({
      orderBy: { name: "asc" },
      include: courseDetailInclude,
    });
    return jsonOk({ data: courses.map(toApiCourse) });
  } catch (error) {
    return jsonError(error, 500);
  }
}

export async function POST(request: Request) {
  const body = await parseJsonBody<CourseWriteBody>(request);
  if (isNextResponse(body)) {
    return body;
  }

  const parsed = parseCourseCreateBody(body);
  if ("error" in parsed) {
    return jsonError(parsed.error, 400);
  }

  try {
    const course = await prisma.course.create({
      data: parsed.data,
      include: courseDetailInclude,
    });
    return jsonOk({ data: toApiCourse(course) }, 201);
  } catch (error) {
    if (isPrismaForeignKeyViolation(error)) {
      return jsonError("courseCategorieId does not match an existing category", 400);
    }
    return jsonError(error, 500);
  }
}
