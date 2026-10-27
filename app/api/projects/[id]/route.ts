import { prisma } from "@/lib/db";
import {
  isNextResponse,
  isPrismaNotFound,
  jsonError,
  jsonOk,
  parseJsonBody,
} from "@/lib/api/http";
import {
  parseProjectsUpdateBody,
  type ProjectsWriteBody,
} from "@/lib/projects";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  try {
    const project = await prisma.projects.findUnique({ where: { id } });
    if (!project) {
      return jsonError("Project not found", 404);
    }
    return jsonOk({ data: project });
  } catch (error) {
    return jsonError(error, 500);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const body = await parseJsonBody<ProjectsWriteBody>(request);
  if (isNextResponse(body)) {
    return body;
  }
  const parsed = parseProjectsUpdateBody(body);
  if ("error" in parsed) {
    return jsonError(parsed.error, 400);
  }

  try {
    const project = await prisma.projects.update({
      where: { id },
      data: parsed.data,
    });
    return jsonOk({ data: project });
  } catch (error) {
    if (isPrismaNotFound(error)) {
      return jsonError("Project not found", 404);
    }
    return jsonError(error, 500);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  try {
    await prisma.projects.delete({ where: { id } });
    return jsonOk({ data: { id } });
  } catch (error) {
    if (isPrismaNotFound(error)) {
      return jsonError("Project not found", 404);
    }
    return jsonError(error, 500);
  }
}
