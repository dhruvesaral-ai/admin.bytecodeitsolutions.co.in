type ApiErrorBody = { error?: string };

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function parseResponse<T>(response: Response): Promise<T> {
  const body = (await response.json()) as T & ApiErrorBody;
  if (!response.ok) {
    throw new ApiError(body.error ?? "Request failed", response.status);
  }
  return body;
}

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(path);
  return parseResponse<T>(response);
}

export async function apiPost<T>(path: string, data: unknown): Promise<T> {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return parseResponse<T>(response);
}

export async function apiPatch<T>(path: string, data: unknown): Promise<T> {
  const response = await fetch(path, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return parseResponse<T>(response);
}

export async function apiDelete<T>(path: string): Promise<T> {
  const response = await fetch(path, { method: "DELETE" });
  return parseResponse<T>(response);
}

export async function uploadImageFile(file: File) {
  const body = new FormData();
  body.append("file", file);
  const response = await fetch("/api/upload/image", { method: "POST", body });
  return parseResponse<{ data: { url: string } }>(response);
}

export async function uploadPdfFile(file: File) {
  const body = new FormData();
  body.append("file", file);
  const response = await fetch("/api/upload/pdf", { method: "POST", body });
  return parseResponse<{ data: { url: string } }>(response);
}

export async function uploadVideoFile(file: File) {
  const body = new FormData();
  body.append("file", file);
  const response = await fetch("/api/upload/video", { method: "POST", body });
  return parseResponse<{ data: { url: string } }>(response);
}

export async function uploadCourseCsv(file: File) {
  const body = new FormData();
  body.append("file", file);
  const response = await fetch("/api/courses/import", {
    method: "POST",
    body,
  });
  return parseResponse<{ data: { created: number } }>(response);
}
