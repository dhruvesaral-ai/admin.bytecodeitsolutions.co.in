import { prisma } from "@/lib/db";
import {
  isNextResponse,
  jsonError,
  jsonOk,
  parseJsonBody,
} from "@/lib/api/http";
import {
  parseProjectsCreateBody,
  type ProjectsWriteBody,
} from "@/lib/projects";

export async function GET() {
  try {
    const projects = await prisma.projects.findMany({
      orderBy: [{ createdAt: "desc" }, { name: "asc" }],
    });
    return jsonOk({ data: projects });
  } catch (error) {
    return jsonError(error, 500);
  }
}

export async function POST(request: Request) {
  const body = await parseJsonBody<ProjectsWriteBody>(request);
  if (isNextResponse(body)) {
    return body;
  }
  const parsed = parseProjectsCreateBody(body);
  if ("error" in parsed) {
    return jsonError(parsed.error, 400);
  }

  try {
    const project = await prisma.projects.create({ data: parsed.data });
    return jsonOk({ data: project }, 201);
  } catch (error) {
    return jsonError(error, 500);
  }
}
