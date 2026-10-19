import { uploadImage } from "@/lib/helper";
import { jsonError, jsonOk } from "@/lib/api/http";
import type { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const data = await uploadImage(request);
    return jsonOk({ data }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return jsonError(message, 400);
  }
}
