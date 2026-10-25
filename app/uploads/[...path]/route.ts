import fs from "node:fs";
import path from "node:path";
import { type NextRequest, NextResponse } from "next/server";

const MIME_MAP: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".avif": "image/avif",
  ".ico": "image/x-icon",
  ".pdf": "application/pdf",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
};

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ path?: string[] }> }
) {
  const { path: rawSegments } = await context.params;

  if (!rawSegments || rawSegments.length === 0) {
    return new NextResponse("Not Found", { status: 404 });
  }

  // Decode URI components to handle spaces (%20), parentheses, etc.
  const decodedSegments = rawSegments.map((segment) => {
    try {
      return decodeURIComponent(segment);
    } catch {
      return segment;
    }
  });

  const uploadsRoot = path.resolve(process.cwd(), "public/uploads");
  const targetFilePath = path.resolve(uploadsRoot, ...decodedSegments);

  // Security check: ensure targetFilePath is strictly inside uploadsRoot (prevent path traversal)
  if (!targetFilePath.startsWith(uploadsRoot)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  try {
    if (!fs.existsSync(targetFilePath)) {
      return new NextResponse("File Not Found", { status: 404 });
    }

    const stat = fs.statSync(targetFilePath);
    if (!stat.isFile()) {
      return new NextResponse("Not Found", { status: 404 });
    }

    const ext = path.extname(targetFilePath).toLowerCase();
    const contentType = MIME_MAP[ext] || "application/octet-stream";

    const fileBuffer = fs.readFileSync(targetFilePath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": stat.size.toString(),
        "Cache-Control": "public, max-age=31536000, immutable",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
      },
    });
  } catch (error) {
    console.error("Error serving uploaded file:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function HEAD(
  _request: NextRequest,
  context: { params: Promise<{ path?: string[] }> }
) {
  const { path: rawSegments } = await context.params;

  if (!rawSegments || rawSegments.length === 0) {
    return new NextResponse(null, { status: 404 });
  }

  const decodedSegments = rawSegments.map((segment) => {
    try {
      return decodeURIComponent(segment);
    } catch {
      return segment;
    }
  });

  const uploadsRoot = path.resolve(process.cwd(), "public/uploads");
  const targetFilePath = path.resolve(uploadsRoot, ...decodedSegments);

  if (!targetFilePath.startsWith(uploadsRoot) || !fs.existsSync(targetFilePath)) {
    return new NextResponse(null, { status: 404 });
  }

  const stat = fs.statSync(targetFilePath);
  const ext = path.extname(targetFilePath).toLowerCase();
  const contentType = MIME_MAP[ext] || "application/octet-stream";

  return new NextResponse(null, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Length": stat.size.toString(),
      "Cache-Control": "public, max-age=31536000, immutable",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
    },
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
      "Access-Control-Allow-Headers": "*",
    },
  });
}
