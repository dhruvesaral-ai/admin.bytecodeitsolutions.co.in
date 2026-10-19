"use client";

import { useState } from "react";
import { ApiError, uploadImageFile } from "@/lib/admin/client";
import { Field, Input } from "@/components/admin/ui";

export function ImageUrlField({
  label,
  value,
  onChange,
  required,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  required?: boolean;
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
      const { data } = await uploadImageFile(file);
      onChange(data.url);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <Field label={label}>
      <div className="flex flex-col gap-2">
        <Input
          required={required}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="/uploads/images/..."
        />
        <input
          type="file"
          accept="image/*"
          disabled={uploading}
          onChange={(event) => void handleFileChange(event)}
          className="text-sm text-zinc-600 file:mr-3 file:rounded-md file:border-0 file:bg-indigo-600 file:px-3 file:py-1.5 file:text-sm file:text-white disabled:opacity-50"
        />
        {uploading ? (
          <span className="text-xs text-zinc-500">Uploading…</span>
        ) : null}
        {error ? <span className="text-xs text-red-600">{error}</span> : null}
        {value ? (
          <img
            src={value}
            alt=""
            className="h-20 w-20 rounded-lg border border-zinc-200 object-cover dark:border-zinc-700"
          />
        ) : null}
      </div>
    </Field>
  );
}
