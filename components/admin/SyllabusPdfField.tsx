"use client";

import { useState } from "react";
import { Field, Input } from "@/components/admin/ui";
import { ApiError, uploadPdfFile } from "@/lib/admin/client";

export function SyllabusPdfField({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }

    setUploading(true);
    setError(null);
    try {
      const { data } = await uploadPdfFile(file);
      onChange(data.url);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "PDF upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <Field label="Syllabus PDF">
      <div className="flex flex-col gap-2">
        <Input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="/uploads/pdfs/..."
        />
        <Input
          type="file"
          accept="application/pdf,.pdf"
          disabled={uploading}
          onChange={(event) => void handleFileChange(event)}
        />
        {uploading ? (
          <span className="text-xs text-zinc-500">Uploading PDF…</span>
        ) : null}
        {error ? <span className="text-xs text-red-600">{error}</span> : null}
        {value ? (
          <a
            href={value}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-indigo-600 underline"
          >
            View uploaded syllabus PDF
          </a>
        ) : null}
      </div>
    </Field>
  );
}
