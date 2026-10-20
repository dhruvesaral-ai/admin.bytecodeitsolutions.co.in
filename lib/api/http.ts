import { NextResponse } from "next/server";

export function jsonOk<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function jsonError(error: unknown, status: number) {
  const message = error instanceof Error ? error.message : String(error);
  return NextResponse.json({ error: message }, { status });
}

export async function parseJsonBody<T extends Record<string, unknown>>(
  request: Request,
): Promise<T | NextResponse> {
  try {
    const body = (await request.json()) as T;
    return body;
  } catch (error) {
    return jsonError(error, 400);
  }
}

export function isNextResponse(value: unknown): value is NextResponse {
  return value instanceof NextResponse;
}

export function isPrismaNotFound(error: unknown): boolean {
  return isPrismaCode(error, "P2025");
}

export function isPrismaUniqueViolation(error: unknown): boolean {
  return isPrismaCode(error, "P2002");
}

export function isPrismaForeignKeyViolation(error: unknown): boolean {
  return isPrismaCode(error, "P2003");
}

function isPrismaCode(error: unknown, code: string): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: string }).code === code
  );
}
