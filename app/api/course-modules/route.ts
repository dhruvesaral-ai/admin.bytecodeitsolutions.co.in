import { prisma } from "@/lib/prisma";
import {
  isNextResponse,
  jsonError,
  jsonOk,
  parseJsonBody,
} from "@/lib/api/http";
import {
  parseCourseModuleCreateBody,
  type CourseModuleWriteBody,
} from "@/lib/course-module";

export async function GET() {
  try {
    const modules = await prisma.courseModule.findMany({
      orderBy: { title: "asc" },
    });
    return jsonOk({ data: modules });
  } catch {
    return jsonError("Failed to list course modules", 500);
  }
}

export async function POST(request: Request) {
  const body = await parseJsonBody<CourseModuleWriteBody>(request);
  if (isNextResponse(body)) {
    return body;
  }

  const parsed = parseCourseModuleCreateBody(body);
  if ("error" in parsed) {
    return jsonError(parsed.error, 400);
  }

  try {
    const courseModule = await prisma.courseModule.create({ data: parsed.data });
    return jsonOk({ data: courseModule }, 201);
  } catch {
    return jsonError("Failed to create course module", 500);
  }
}
