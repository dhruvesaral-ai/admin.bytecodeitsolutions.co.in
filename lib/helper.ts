import { Readable } from "node:stream";
import type { IncomingMessage } from "node:http";
import type { NextRequest } from "next/server";
import type multer from "multer";
import { imageUpload, pdfUpload } from "@/lib/multer";

type MulterRequest = IncomingMessage & { file?: Express.Multer.File };

async function runSingle(
  request: NextRequest,
  middleware: ReturnType<multer.Multer["single"]>,
): Promise<Express.Multer.File> {
  const buffer = Buffer.from(await request.arrayBuffer());
  const req = Readable.from(buffer) as MulterRequest;
  req.headers = Object.fromEntries(request.headers.entries());
  req.method = request.method;

  await new Promise<void>((resolve, reject) => {
    const res = {
      statusCode: 200,
      setHeader() {
        return this;
      },
      end() {
        resolve();
      },
    };

    middleware(
      req as unknown as Parameters<typeof middleware>[0],
      res as unknown as Parameters<typeof middleware>[1],
      (error) => (error ? reject(error) : resolve()),
    );
  });

  if (!req.file) {
    throw new Error('Missing "file" in form data');
  }

  return req.file;
}

export async function uploadImage(request: NextRequest) {
  const file = await runSingle(request, imageUpload.single("file"));
  return { url: `/uploads/images/${file.filename}` };
}

export async function uploadPdf(request: NextRequest) {
  const file = await runSingle(request, pdfUpload.single("file"));
  return { url: `/uploads/pdfs/${file.filename}` };
}
