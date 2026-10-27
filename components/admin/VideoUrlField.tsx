"use client";

import { useState } from "react";
import { Field, Input } from "@/components/admin/ui";
import { ApiError, uploadVideoFile } from "@/lib/admin/client";

export function VideoUrlField({
  label = "Showcase video",
  value,
  onChange,
  required,
}: {
  label?: string;
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

    // Client-side quick check: 100MB max
    if (file.size > 100 * 1024 * 1024) {
      setError("File exceeds maximum allowed size of 100MB");
      return;
    }

    setUploading(true);
    setError(null);
    try {
      const { data } = await uploadVideoFile(file);
      onChange(data.url);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Video upload failed");
    } finally {
      setUploading(false);
    }
  }

  function handleClear() {
    onChange("");
    setError(null);
  }

  return (
    <Field
      label={label}
      hint="Upload an MP4/WebM video (up to 100MB) or enter a video URL directly."
    >
      <div className="flex flex-col gap-2.5">
        <Input
          required={required}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="/uploads/videos/... or https://..."
        />

        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800">
            <span>{uploading ? "Uploading video…" : "Choose video file"}</span>
            <input
              type="file"
              accept="video/mp4,video/webm,.mp4,.webm"
              disabled={uploading}
              onChange={(event) => void handleFileChange(event)}
              className="sr-only"
            />
          </label>

          {value ? (
            <button
              type="button"
              onClick={handleClear}
              className="text-xs font-medium text-rose-600 hover:text-rose-700 hover:underline dark:text-rose-400"
            >
              Remove video
            </button>
          ) : null}

          {uploading ? (
            <div className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400">
              <svg
                className="h-3.5 w-3.5 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8H4z"
                />
              </svg>
              <span>Uploading to server…</span>
            </div>
          ) : null}
        </div>

        {error ? <span className="text-xs text-red-600">{error}</span> : null}

        {value ? (
          <div className="mt-1 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-950 p-2 shadow-sm dark:border-zinc-800">
            <div className="mb-1.5 flex items-center justify-between px-1 text-xs text-zinc-400">
              <span className="font-medium truncate max-w-[80%]">{value}</span>
              <a
                href={value}
                target="_blank"
                rel="noreferrer"
                className="text-indigo-400 underline hover:text-indigo-300"
              >
                Open in tab ↗
              </a>
            </div>
            <video
              src={value}
              controls
              className="max-h-60 w-full rounded-lg bg-black object-contain"
              preload="metadata"
            >
              Your browser does not support the video tag.
            </video>
          </div>
        ) : null}
      </div>
    </Field>
  );
}
