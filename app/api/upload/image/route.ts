import { uploadImage } from "@/lib/helper";
import { jsonError, jsonOk } from "@/lib/api/http";
import type { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const data = await uploadImage(request);
    return jsonOk({ data }, 201);
  } catch (error) {
    return jsonError(error, 400);
  }
}
