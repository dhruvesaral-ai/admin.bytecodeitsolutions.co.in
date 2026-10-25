import fs from "node:fs";
import path from "node:path";
import multer from "multer";

const imageDir = path.join(process.cwd(), "public/uploads/images");
const pdfDir = path.join(process.cwd(), "public/uploads/pdfs");

function sanitizeFilename(originalName: string): string {
  const ext = path.extname(originalName).toLowerCase();
  const base = path.basename(originalName, ext);
  const cleanBase = base
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove diacritics
    .replace(/[^a-zA-Z0-9_-]/g, "-") // replace spaces and special characters with dash
    .replace(/-+/g, "-") // collapse consecutive dashes
    .replace(/^-|-$/g, ""); // trim leading/trailing dashes
  return `${Date.now()}-${cleanBase || "file"}${ext}`;
}

function diskStorage(dir: string) {
  return multer.diskStorage({
    destination(_req, _file, cb) {
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename(_req, file, cb) {
      cb(null, sanitizeFilename(file.originalname));
    },
  });
}

export const imageUpload = multer({
  storage: diskStorage(imageDir),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
      return;
    }
    cb(new Error("Only image files are allowed"));
  },
});

export const pdfUpload = multer({
  storage: diskStorage(pdfDir),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
      return;
    }
    cb(new Error("Only PDF files are allowed"));
  },
});
