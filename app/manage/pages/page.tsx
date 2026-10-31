"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { DataTable } from "@/components/admin/DataTable";
import {
  Alert,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  Textarea,
} from "@/components/admin/ui";
import { apiDelete, apiGet, apiPatch, apiPost, ApiError } from "@/lib/admin/client";
import type { Page, ListResponse } from "@/lib/admin/types";
import { formatRouteName } from "@/lib/page";
import { VideoUrlField } from "@/components/admin/VideoUrlField";

type FormState = {
  heading: string;
  subheading: string;
  videoUrl: string;
  routeName: string;
};

const emptyForm: FormState = {
  heading: "",
  subheading: "",
  videoUrl: "",
  routeName: "",
};

export default function ManagePagesPage() {
  const [items, setItems] = useState<Page[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedRoute, setCopiedRoute] = useState<string | null>(null);
  const [previewPage, setPreviewPage] = useState<Page | null>(null);
  const [message, setMessage] = useState<{
    tone: "error" | "success";
    text: string;
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const response = await apiGet<ListResponse<Page>>("/api/pages");
      setItems(response.data);
    } catch (error) {
      setMessage({
        tone: "error",
        text: error instanceof ApiError ? error.message : "Failed to load pages",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);

    const formattedRoute = formatRouteName(form.routeName);
    if (!formattedRoute) {
      setMessage({
        tone: "error",
        text: "Please provide a valid route name (e.g. 'home' or 'training')",
      });
      setSaving(false);
      return;
    }

    try {
      const payload = {
        heading: form.heading.trim(),
        subheading: form.subheading.trim(),
        videoUrl: form.videoUrl.trim() || null,
        routeName: formattedRoute,
      };

      if (editingId) {
        await apiPatch(`/api/pages/${editingId}`, payload);
        setMessage({ tone: "success", text: "Page updated successfully." });
      } else {
        await apiPost("/api/pages", payload);
        setMessage({ tone: "success", text: "Page created successfully." });
      }
      resetForm();
      await load();
    } catch (error) {
      setMessage({
        tone: "error",
        text: error instanceof ApiError ? error.message : "Failed to save page",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, routeName: string) {
    if (!confirm(`Are you sure you want to delete page "/${routeName}"?`)) {
      return;
    }
    try {
      await apiDelete(`/api/pages/${id}`);
      if (editingId === id) {
        resetForm();
      }
      await load();
      setMessage({ tone: "success", text: "Page deleted successfully." });
    } catch (error) {
      setMessage({
        tone: "error",
        text: error instanceof ApiError ? error.message : "Failed to delete page",
      });
    }
  }

  function startEdit(item: Page) {
    setEditingId(item.id);
    setForm({
      heading: item.heading,
      subheading: item.subheading,
      videoUrl: item.videoUrl ?? "",
      routeName: item.routeName,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function copyRouteToClipboard(routeName: string) {
    const path = `/${routeName}`;
    void navigator.clipboard.writeText(path);
    setCopiedRoute(routeName);
    setTimeout(() => {
      setCopiedRoute(null);
    }, 2000);
  }

  const normalizedPreviewRoute = useMemo(() => {
    return formatRouteName(form.routeName);
  }, [form.routeName]);

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const query = searchQuery.toLowerCase();
    return items.filter(
      (item) =>
        item.routeName.toLowerCase().includes(query) ||
        item.heading.toLowerCase().includes(query) ||
        item.subheading.toLowerCase().includes(query) ||
        (item.videoUrl && item.videoUrl.toLowerCase().includes(query)),
    );
  }, [items, searchQuery]);

  return (
    <AdminShell
      title="Pages"
      description="Create and manage dynamic frontend website pages with customizable headings, subheadings, showcase videos, and URL routes."
    >
      {message ? <Alert tone={message.tone}>{message.text}</Alert> : null}

      {/* Page Form */}
      <Card
        title={
          editingId
            ? `Edit page: /${normalizedPreviewRoute || form.routeName}`
            : "New page"
        }
        action={
          editingId ? (
            <Button variant="ghost" onClick={resetForm}>
              Cancel edit
            </Button>
          ) : null
        }
      >
        <form className="grid gap-5 md:grid-cols-2" onSubmit={handleSubmit}>
          {/* Route Name with visual '/' prefix */}
          <div className="md:col-span-2">
            <Field
              label="Route name"
              hint="The URL path segment user enters (e.g. 'home' or 'training'). On your frontend website, this will be accessed in front of the slash as /{routeName}."
            >
              <div className="flex rounded-lg border border-zinc-200 bg-white shadow-sm transition focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-900">
                <span className="inline-flex items-center rounded-l-lg border-r border-zinc-200 bg-zinc-50 px-3.5 text-sm font-semibold text-indigo-600 select-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-indigo-400">
                  /
                </span>
                <input
                  type="text"
                  required
                  placeholder="home, training, about-us, etc."
                  value={form.routeName}
                  onChange={(event) => {
                    setForm((current) => ({
                      ...current,
                      routeName: event.target.value,
                    }));
                  }}
                  onBlur={() => {
                    if (form.routeName.trim()) {
                      setForm((current) => ({
                        ...current,
                        routeName: formatRouteName(current.routeName),
                      }));
                    }
                  }}
                  className="w-full rounded-r-lg bg-transparent px-3 py-2 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                />
              </div>
            </Field>

            {/* Live Frontend URL Preview Callout */}
            <div className="mt-2.5 flex flex-wrap items-center gap-2 rounded-lg border border-indigo-100 bg-indigo-50/50 px-3.5 py-2 text-xs text-zinc-600 dark:border-indigo-950/60 dark:bg-indigo-950/20 dark:text-zinc-300">
              <span className="font-medium text-indigo-700 dark:text-indigo-300">
                Frontend Website URL:
              </span>
              <span className="rounded bg-white px-2 py-0.5 font-mono font-semibold text-indigo-600 shadow-xs dark:bg-zinc-900 dark:text-indigo-400">
                /{normalizedPreviewRoute || "route-name"}
              </span>
              <span className="text-zinc-400 dark:text-zinc-500">|</span>
              <span className="text-zinc-500 dark:text-zinc-400">
                Full link:{" "}
                <code className="text-zinc-700 dark:text-zinc-300">
                  https://yourwebsite.com/{normalizedPreviewRoute || "route-name"}
                </code>
              </span>
            </div>
          </div>

          {/* Heading */}
          <div className="md:col-span-2">
            <Field
              label="Page heading"
              hint="Main hero title or primary header shown on this frontend page."
            >
              <Input
                required
                placeholder="e.g. Modern Full-Stack Development Training"
                value={form.heading}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    heading: event.target.value,
                  }))
                }
              />
            </Field>
          </div>

          {/* Subheading */}
          <div className="md:col-span-2">
            <Field
              label="Page subheading"
              hint="Supporting subtitle, description, or lead text displayed below the main heading."
            >
              <Textarea
                required
                rows={3}
                placeholder="e.g. Master React, Next.js, Node.js, and Cloud Infrastructure with hands-on real-world projects and placement assistance."
                value={form.subheading}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    subheading: event.target.value,
                  }))
                }
              />
            </Field>
          </div>

          {/* Showcase Video */}
          <div className="md:col-span-2">
            <VideoUrlField
              label="Page showcase video (optional)"
              value={form.videoUrl}
              onChange={(videoUrl) =>
                setForm((current) => ({
                  ...current,
                  videoUrl,
                }))
              }
            />
          </div>

          {/* Submit Actions */}
          <div className="flex items-center gap-3 md:col-span-2 pt-2">
            <Button type="submit" disabled={saving}>
              {saving
                ? "Saving…"
                : editingId
                  ? "Update page"
                  : "Create page"}
            </Button>
            {editingId ? (
              <Button variant="secondary" onClick={resetForm} disabled={saving}>
                Cancel
              </Button>
            ) : null}
          </div>
        </form>
      </Card>

      {/* Pages List */}
      <Card
        title={`All pages (${items.length})`}
        action={
          items.length > 0 ? (
            <div className="w-56 sm:w-64">
              <Input
                type="search"
                placeholder="Search route, heading, video…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          ) : null
        }
      >
        {loading ? (
          <p className="text-sm text-zinc-500">Loading pages…</p>
        ) : items.length === 0 ? (
          <EmptyState>
            No pages created yet. Use the form above to add your first page route
            (e.g. &quot;home&quot;, &quot;training&quot;).
          </EmptyState>
        ) : filteredItems.length === 0 ? (
          <EmptyState>No pages match your search query &quot;{searchQuery}&quot;.</EmptyState>
        ) : (
          <DataTable
            columns={["Route", "Heading", "Subheading", "Video", "Actions"]}
            rows={filteredItems.map((item) => [
              <div key="route" className="flex items-center gap-2">
                <span className="inline-flex items-center rounded-md bg-indigo-50 px-2.5 py-1 font-mono text-xs font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-700/10 dark:bg-indigo-950/50 dark:text-indigo-300 dark:ring-indigo-400/20">
                  /{item.routeName}
                </span>
                <button
                  type="button"
                  title="Copy route path"
                  onClick={() => copyRouteToClipboard(item.routeName)}
                  className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                >
                  {copiedRoute === item.routeName ? (
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-sans font-medium">
                      Copied!
                    </span>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                    </svg>
                  )}
                </button>
              </div>,
              <div key="heading" className="max-w-xs font-medium text-zinc-900 dark:text-zinc-100">
                {item.heading}
              </div>,
              <div
                key="subheading"
                className="max-w-md text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2"
                title={item.subheading}
              >
                {item.subheading}
              </div>,
              <div key="video" className="flex items-center gap-2">
                {item.videoUrl ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setPreviewPage(item)}
                      className="inline-flex items-center gap-1.5 rounded-md bg-purple-50 px-2.5 py-1 text-xs font-semibold text-purple-700 hover:bg-purple-100 transition dark:bg-purple-950/50 dark:text-purple-300 dark:hover:bg-purple-900/50"
                      title="Preview video"
                    >
                      <span>🎬 Watch</span>
                    </button>
                    <a
                      href={item.videoUrl}
                      target="_blank"
                      rel="noreferrer"
                      title="Open video URL in new tab"
                      className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        <polyline points="15 3 21 3 21 9" />
                        <line x1="10" y1="14" x2="21" y2="3" />
                      </svg>
                    </a>
                  </>
                ) : (
                  <span className="text-xs text-zinc-400 italic">— None</span>
                )}
              </div>,
              <div key="actions" className="flex gap-2">
                <Button variant="secondary" onClick={() => startEdit(item)}>
                  Edit
                </Button>
                <Button
                  variant="danger"
                  onClick={() => void handleDelete(item.id, item.routeName)}
                >
                  Delete
                </Button>
              </div>,
            ])}
          />
        )}
      </Card>

      {/* Video Preview Modal */}
      {previewPage ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
          onClick={() => setPreviewPage(null)}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-zinc-100 pb-4 dark:border-zinc-800">
              <div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                  {previewPage.heading}
                </h3>
                <p className="text-xs text-zinc-500 font-mono">
                  /{previewPage.routeName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewPage(null)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              >
                ✕
              </button>
            </div>

            {previewPage.videoUrl ? (
              <div className="mt-4 space-y-3">
                <video
                  src={previewPage.videoUrl}
                  controls
                  autoPlay
                  className="max-h-80 w-full rounded-xl bg-black object-contain shadow-sm"
                >
                  Your browser does not support HTML5 video.
                </video>
                <div className="flex items-center justify-between text-xs text-zinc-500">
                  <span className="truncate max-w-[80%] font-mono text-zinc-600 dark:text-zinc-400">
                    {previewPage.videoUrl}
                  </span>
                  <a
                    href={previewPage.videoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                  >
                    Open in tab ↗
                  </a>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-zinc-500">No video configured for this page.</p>
            )}
          </div>
        </div>
      ) : null}
    </AdminShell>
  );
}
