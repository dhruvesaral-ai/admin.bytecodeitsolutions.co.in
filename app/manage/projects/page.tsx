"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { DataTable } from "@/components/admin/DataTable";
import { ImageUrlField } from "@/components/admin/ImageUrlField";
import { VideoUrlField } from "@/components/admin/VideoUrlField";
import {
  Alert,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  Textarea,
} from "@/components/admin/ui";
import {
  ApiError,
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
} from "@/lib/admin/client";
import type { ListResponse, Project } from "@/lib/admin/types";

type FormState = {
  name: string;
  shortDescription: string;
  longDescription: string;
  imgUrl: string;
  videoUrl: string;
};

const emptyForm: FormState = {
  name: "",
  shortDescription: "",
  longDescription: "",
  imgUrl: "",
  videoUrl: "",
};

function toForm(project: Project): FormState {
  return {
    name: project.name,
    shortDescription: project.shortDescription ?? "",
    longDescription: project.longDescription ?? "",
    imgUrl: project.imgUrl ?? "",
    videoUrl: project.videoUrl ?? "",
  };
}

function buildPayload(form: FormState) {
  return {
    name: form.name.trim(),
    shortDescription: form.shortDescription.trim() || null,
    longDescription: form.longDescription.trim() || null,
    imgUrl: form.imgUrl.trim() || null,
    videoUrl: form.videoUrl.trim() || null,
  };
}

export default function ManageProjectsPage() {
  const [items, setItems] = useState<Project[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [previewProject, setPreviewProject] = useState<Project | null>(null);
  const [message, setMessage] = useState<{
    tone: "error" | "success";
    text: string;
  } | null>(null);

  const formRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const response = await apiGet<ListResponse<Project>>("/api/projects");
      setItems(response.data);
    } catch (error) {
      setMessage({
        tone: "error",
        text:
          error instanceof ApiError
            ? error.message
            : "Failed to load projects",
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

  function startEdit(project: Project) {
    setEditingId(project.id);
    setForm(toForm(project));
    setMessage(null);
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.name.trim()) {
      setMessage({ tone: "error", text: "Project name is required" });
      return;
    }

    setSaving(true);
    setMessage(null);
    const payload = buildPayload(form);

    try {
      if (editingId) {
        await apiPatch(`/api/projects/${editingId}`, payload);
        setMessage({ tone: "success", text: `Project "${form.name}" updated successfully.` });
      } else {
        await apiPost("/api/projects", payload);
        setMessage({ tone: "success", text: `Project "${form.name}" created successfully.` });
      }
      resetForm();
      await load();
    } catch (error) {
      setMessage({
        tone: "error",
        text: error instanceof ApiError ? error.message : "Save failed",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(project: Project) {
    if (!confirm(`Are you sure you want to delete "${project.name}"? This action cannot be undone.`)) {
      return;
    }
    setDeletingId(project.id);
    try {
      await apiDelete(`/api/projects/${project.id}`);
      if (editingId === project.id) {
        resetForm();
      }
      if (previewProject?.id === project.id) {
        setPreviewProject(null);
      }
      await load();
      setMessage({ tone: "success", text: `Project "${project.name}" deleted.` });
    } catch (error) {
      setMessage({
        tone: "error",
        text: error instanceof ApiError ? error.message : "Delete failed",
      });
    } finally {
      setDeletingId(null);
    }
  }

  // Filtered projects based on search query
  const filteredItems = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return items;
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        (item.shortDescription && item.shortDescription.toLowerCase().includes(q)) ||
        (item.longDescription && item.longDescription.toLowerCase().includes(q))
    );
  }, [items, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const total = items.length;
    const withImages = items.filter((p) => Boolean(p.imgUrl)).length;
    const withVideos = items.filter((p) => Boolean(p.videoUrl)).length;
    return { total, withImages, withVideos };
  }, [items]);

  const editingProject = useMemo(
    () => items.find((p) => p.id === editingId) || null,
    [items, editingId]
  );

  return (
    <AdminShell
      title="Projects"
      description="Manage portfolio showcase projects, descriptions, cover preview images, and demo videos."
    >
      {/* Alert Notification */}
      {message ? (
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1">
            <Alert tone={message.tone}>{message.text}</Alert>
          </div>
          <button
            type="button"
            onClick={() => setMessage(null)}
            className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          >
            Dismiss
          </button>
        </div>
      ) : null}

      {/* KPI Stats Overview */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Total Projects</p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{stats.total}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">With Cover Image</p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{stats.withImages}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">With Demo Video</p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{stats.withVideos}</p>
          </div>
        </div>
      </div>

      {/* Form Card (Create / Edit) */}
      <div ref={formRef}>
        <Card
          title={
            editingId
              ? `Edit Project: ${editingProject?.name ?? ""}`
              : "Create New Project"
          }
          action={
            editingId ? (
              <Button variant="ghost" onClick={resetForm}>
                Cancel Edit
              </Button>
            ) : null
          }
        >
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <Field
                  label="Project Name"
                  hint="Descriptive name of the client or portfolio project (required)."
                >
                  <Input
                    required
                    placeholder="e.g. Bytecode Next-Gen LMS Platform"
                    value={form.name}
                    onChange={(e) =>
                      setForm((cur) => ({ ...cur, name: e.target.value }))
                    }
                  />
                </Field>
              </div>

              <div className="md:col-span-2">
                <Field
                  label="Short Description"
                  hint="A high-level summary or tagline shown on cards and teaser lists."
                >
                  <Input
                    placeholder="e.g. Cloud-native enterprise education management system with automated student grading."
                    value={form.shortDescription}
                    onChange={(e) =>
                      setForm((cur) => ({
                        ...cur,
                        shortDescription: e.target.value,
                      }))
                    }
                  />
                </Field>
              </div>

              <div className="md:col-span-2">
                <Field
                  label="Long Description"
                  hint="Detailed project overview, tech stack details, challenge & solution, deliverables, etc."
                >
                  <Textarea
                    placeholder="Write a comprehensive overview of the project, architecture decisions, frameworks used..."
                    rows={4}
                    value={form.longDescription}
                    onChange={(e) =>
                      setForm((cur) => ({
                        ...cur,
                        longDescription: e.target.value,
                      }))
                    }
                  />
                </Field>
              </div>

              <div>
                <ImageUrlField
                  label="Cover / Preview Image"
                  value={form.imgUrl}
                  onChange={(imgUrl) =>
                    setForm((cur) => ({ ...cur, imgUrl }))
                  }
                />
              </div>

              <div>
                <VideoUrlField
                  label="Showcase / Walkthrough Video"
                  value={form.videoUrl}
                  onChange={(videoUrl) =>
                    setForm((cur) => ({ ...cur, videoUrl }))
                  }
                />
              </div>
            </div>

            <div className="flex items-center gap-3 border-t border-zinc-100 pt-4 dark:border-zinc-800">
              <Button type="submit" disabled={saving}>
                {saving
                  ? "Saving…"
                  : editingId
                    ? "Update Project"
                    : "Create Project"}
              </Button>
              {editingId ? (
                <Button variant="secondary" onClick={resetForm} disabled={saving}>
                  Cancel
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  onClick={resetForm}
                  type="button"
                  disabled={saving}
                >
                  Reset Form
                </Button>
              )}
            </div>
          </form>
        </Card>
      </div>

      {/* Directory & DataTable */}
      <Card
        title="All Projects"
        action={
          <div className="flex items-center gap-2">
            <div className="relative w-64">
              <input
                type="text"
                placeholder="Search projects…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 bg-white py-1.5 pl-8 pr-3 text-xs text-zinc-900 placeholder-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              />
              <svg
                className="absolute left-2.5 top-2 h-3.5 w-3.5 text-zinc-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-2 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                >
                  ×
                </button>
              ) : null}
            </div>
            <Button variant="secondary" onClick={() => void load()} disabled={loading}>
              ↻ Refresh
            </Button>
          </div>
        }
      >
        {loading ? (
          <div className="flex items-center justify-center py-12 text-sm text-zinc-500">
            <svg
              className="mr-2 h-4 w-4 animate-spin text-indigo-600"
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
            Loading projects…
          </div>
        ) : filteredItems.length === 0 ? (
          searchQuery ? (
            <EmptyState>
              No projects match &ldquo;{searchQuery}&rdquo;.
              <div className="mt-2">
                <Button variant="secondary" onClick={() => setSearchQuery("")}>
                  Clear search
                </Button>
              </div>
            </EmptyState>
          ) : (
            <EmptyState>
              No projects found. Use the form above to add your first showcase project!
            </EmptyState>
          )
        ) : (
          <DataTable
            columns={["Media", "Project Details", "Descriptions", "Assets", "Actions"]}
            rows={filteredItems.map((project) => [
              /* Media preview */
              <div
                key={`${project.id}-media`}
                className="group relative flex h-16 w-24 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100 shadow-xs transition hover:ring-2 hover:ring-indigo-500 dark:border-zinc-800 dark:bg-zinc-800"
                onClick={() => setPreviewProject(project)}
                title="Click to preview media"
              >
                {project.imgUrl ? (
                  <img
                    src={project.imgUrl}
                    alt={project.name}
                    className="h-full w-full object-cover transition group-hover:scale-105"
                  />
                ) : (
                  <span className="text-[10px] font-semibold uppercase text-zinc-400">
                    No image
                  </span>
                )}
                {project.videoUrl ? (
                  <span className="absolute bottom-1 right-1 flex items-center rounded-sm bg-black/75 px-1 py-0.5 text-[9px] font-semibold text-white backdrop-blur-xs">
                    ▶ Video
                  </span>
                ) : null}
              </div>,

              /* Project Details */
              <div key={`${project.id}-details`} className="space-y-1">
                <p className="font-semibold text-zinc-900 dark:text-zinc-50">
                  {project.name}
                </p>
                <div className="flex flex-wrap items-center gap-1.5 text-xs text-zinc-400">
                  <span className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[10px] dark:bg-zinc-800">
                    {project.id.slice(0, 10)}…
                  </span>
                  <span>•</span>
                  <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                </div>
              </div>,

              /* Descriptions */
              <div key={`${project.id}-desc`} className="max-w-md space-y-1 text-xs">
                {project.shortDescription ? (
                  <p className="font-medium text-zinc-800 dark:text-zinc-200 line-clamp-2">
                    {project.shortDescription}
                  </p>
                ) : (
                  <span className="text-zinc-400 italic">No short description</span>
                )}
                {project.longDescription ? (
                  <p className="text-zinc-500 dark:text-zinc-400 line-clamp-2">
                    {project.longDescription}
                  </p>
                ) : null}
              </div>,

              /* Assets indicators */
              <div key={`${project.id}-assets`} className="flex flex-col gap-1.5 text-xs">
                {project.imgUrl ? (
                  <a
                    href={project.imgUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-indigo-600 hover:underline dark:text-indigo-400"
                  >
                    <span>🖼 Image</span>
                  </a>
                ) : (
                  <span className="text-zinc-400 text-[11px]">— Image</span>
                )}
                {project.videoUrl ? (
                  <button
                    type="button"
                    onClick={() => setPreviewProject(project)}
                    className="inline-flex items-center gap-1 text-purple-600 hover:underline dark:text-purple-400"
                  >
                    <span>🎬 Watch Video</span>
                  </button>
                ) : (
                  <span className="text-zinc-400 text-[11px]">— Video</span>
                )}
              </div>,

              /* Actions */
              <div key={`${project.id}-actions`} className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  onClick={() => startEdit(project)}
                  className="px-2.5 py-1 text-xs"
                >
                  Edit
                </Button>
                <Button
                  variant="danger"
                  onClick={() => void handleDelete(project)}
                  disabled={deletingId === project.id}
                  className="px-2.5 py-1 text-xs"
                >
                  {deletingId === project.id ? "…" : "Delete"}
                </Button>
              </div>,
            ])}
          />
        )}
      </Card>

      {/* Media & Details Preview Modal */}
      {previewProject ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
          onClick={() => setPreviewProject(null)}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-zinc-100 pb-4 dark:border-zinc-800">
              <div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                  {previewProject.name}
                </h3>
                <p className="text-xs text-zinc-500">
                  ID: {previewProject.id} • Added on{" "}
                  {new Date(previewProject.createdAt).toLocaleDateString()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewProject(null)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {/* Video Player */}
              {previewProject.videoUrl ? (
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Showcase Video
                  </p>
                  <video
                    src={previewProject.videoUrl}
                    controls
                    autoPlay
                    className="max-h-80 w-full rounded-xl bg-black object-contain shadow-sm"
                  >
                    Your browser does not support HTML5 video.
                  </video>
                </div>
              ) : null}

              {/* Cover Image */}
              {previewProject.imgUrl ? (
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Cover Image
                  </p>
                  <img
                    src={previewProject.imgUrl}
                    alt={previewProject.name}
                    className="max-h-72 w-full rounded-xl border border-zinc-200 object-cover shadow-sm dark:border-zinc-800"
                  />
                </div>
              ) : null}

              {/* Descriptions */}
              {previewProject.shortDescription ? (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Short Description
                  </p>
                  <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
                    {previewProject.shortDescription}
                  </p>
                </div>
              ) : null}

              {previewProject.longDescription ? (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Long Description
                  </p>
                  <p className="mt-1 whitespace-pre-line text-sm text-zinc-700 dark:text-zinc-300">
                    {previewProject.longDescription}
                  </p>
                </div>
              ) : null}
            </div>

            <div className="mt-6 flex justify-end gap-2 border-t border-zinc-100 pt-4 dark:border-zinc-800">
              <Button
                variant="secondary"
                onClick={() => {
                  startEdit(previewProject);
                  setPreviewProject(null);
                }}
              >
                Edit Project
              </Button>
              <Button variant="primary" onClick={() => setPreviewProject(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </AdminShell>
  );
}
