import { prisma } from "@/lib/db";
import {
  isNextResponse,
  jsonError,
  jsonOk,
  parseJsonBody,
} from "@/lib/api/http";
import {
  parseSuccessStoryCreateBody,
  type SuccessStoryWriteBody,
} from "@/lib/success-story";

export async function GET() {
  try {
    const stories = await prisma.successStory.findMany({ orderBy: { id: "asc" } });
    return jsonOk({ data: stories });
  } catch (error) {
    return jsonError(error, 500);
  }
}

export async function POST(request: Request) {
  const body = await parseJsonBody<SuccessStoryWriteBody>(request);
  if (isNextResponse(body)) {
    return body;
  }
  const parsed = parseSuccessStoryCreateBody(body);
  if ("error" in parsed) {
    return jsonError(parsed.error, 400);
  }

  try {
    const story = await prisma.successStory.create({ data: parsed.data });
    return jsonOk({ data: story }, 201);
  } catch (error) {
    return jsonError(error, 500);
  }
}
