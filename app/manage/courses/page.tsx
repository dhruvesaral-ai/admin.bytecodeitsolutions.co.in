"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { DataTable } from "@/components/admin/DataTable";
import {
  Alert,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  Select,
  Textarea,
} from "@/components/admin/ui";
import { ImageUrlField } from "@/components/admin/ImageUrlField";
import { SyllabusPdfField } from "@/components/admin/SyllabusPdfField";
import { apiDelete, apiGet, apiPatch, apiPost, ApiError } from "@/lib/admin/client";
import type {
  Course,
  CourseCategorie,
  CourseModule,
  GeneralStatus,
  ListResponse,
} from "@/lib/admin/types";

type FormState = {
  name: string;
  shortDescription: string;
  longDescription: string;
  originalPrice: string;
  discountedPrice: string;
  rating: string;
  technologyTags: string;
  duration: string;
  status: GeneralStatus;
  courseImgUrl: string;
  syllabus: string;
  courseCategorieId: string;
  isPlacementGurranted: boolean;
  isInSale: boolean;
  courseModuleIds: string[];
};

const emptyForm: FormState = {
  name: "",
  shortDescription: "",
  longDescription: "",
  originalPrice: "",
  discountedPrice: "",
  rating: "",
  technologyTags: "",
  duration: "",
  status: "active",
  courseImgUrl: "",
  syllabus: "",
  courseCategorieId: "",
  isPlacementGurranted: false,
  isInSale: false,
  courseModuleIds: [],
};

function parseTags(value: string) {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function toForm(course: Course): FormState {
  return {
    name: course.name,
    shortDescription: course.shortDescription ?? "",
    longDescription: course.longDescription ?? "",
    originalPrice: course.originalPrice ?? "",
    discountedPrice: course.discountedPrice ?? "",
    rating: course.rating?.toString() ?? "",
    technologyTags: course.technologyTags.join(", "),
    duration: course.duration ?? "",
    status: course.status,
    courseImgUrl: course.courseImgUrl ?? "",
    syllabus: course.syllabus ?? "",
    courseCategorieId: course.courseCategorieId ?? "",
    isPlacementGurranted: course.isPlacementGurranted,
    isInSale: course.isInSale,
    courseModuleIds: course.courseModuleIds,
  };
}

function buildPayload(form: FormState) {
  return {
    name: form.name,
    shortDescription:
      form.shortDescription.trim() === "" ? null : form.shortDescription,
    longDescription:
      form.longDescription.trim() === "" ? null : form.longDescription,
    originalPrice: form.originalPrice === "" ? null : Number(form.originalPrice),
    discountedPrice:
      form.discountedPrice === "" ? null : Number(form.discountedPrice),
    rating: form.rating === "" ? null : Number(form.rating),
    technologyTags: parseTags(form.technologyTags),
    duration: form.duration.trim() === "" ? null : form.duration,
    status: form.status,
    courseImgUrl: form.courseImgUrl.trim() === "" ? null : form.courseImgUrl,
    syllabus: form.syllabus.trim() === "" ? null : form.syllabus,
    courseCategorieId: form.courseCategorieId === "" ? null : form.courseCategorieId,
    isPlacementGurranted: form.isPlacementGurranted,
    isInSale: form.isInSale,
    courseModuleIds: form.courseModuleIds,
  };
}

export default function ManageCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<CourseCategorie[]>([]);
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ tone: "error" | "success"; text: string } | null>(
    null,
  );

  const load = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const [courseRes, categoryRes, moduleRes] = await Promise.all([
        apiGet<ListResponse<Course>>("/api/courses"),
        apiGet<ListResponse<CourseCategorie>>("/api/course-categories"),
        apiGet<ListResponse<CourseModule>>("/api/course-modules"),
      ]);
      setCourses(courseRes.data);
      setCategories(categoryRes.data);
      setModules(moduleRes.data);
    } catch (error) {
      setMessage({
        tone: "error",
        text: error instanceof ApiError ? error.message : "Failed to load courses",
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

  function toggleModule(moduleId: string) {
    setForm((current) => {
      const exists = current.courseModuleIds.includes(moduleId);
      return {
        ...current,
        courseModuleIds: exists
          ? current.courseModuleIds.filter((id) => id !== moduleId)
          : [...current.courseModuleIds, moduleId],
      };
    });
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);

    const payload = buildPayload(form);

    try {
      if (editingId) {
        await apiPatch(`/api/courses/${editingId}`, payload);
        setMessage({ tone: "success", text: "Course updated." });
      } else {
        await apiPost("/api/courses", payload);
        setMessage({ tone: "success", text: "Course created." });
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

  async function handleDelete(id: string) {
    if (!confirm("Delete this course?")) {
      return;
    }
    try {
      await apiDelete(`/api/courses/${id}`);
      if (editingId === id) {
        resetForm();
      }
      await load();
      setMessage({ tone: "success", text: "Course deleted." });
    } catch (error) {
      setMessage({
        tone: "error",
        text: error instanceof ApiError ? error.message : "Delete failed",
      });
    }
  }

  function startEdit(course: Course) {
    setEditingId(course.id);
    setForm(toForm(course));
  }

  return (
    <AdminShell
      title="Courses"
      description="Manage catalog entries, pricing, and linked category/modules."
    >
      {message ? <Alert tone={message.tone}>{message.text}</Alert> : null}

      <Card
        title={editingId ? "Edit course" : "New course"}
        action={
          editingId ? (
            <Button variant="ghost" onClick={resetForm}>Cancel edit</Button>
          ) : null
        }
      >
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <Field label="Name">
            <Input
              required
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({ ...current, name: event.target.value }))
              }
            />
          </Field>
          <Field label="Status">
            <Select
              value={form.status}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  status: event.target.value as GeneralStatus,
                }))
              }
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
          </Field>
          <Field label="Category">
            <Select
              value={form.courseCategorieId}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  courseCategorieId: event.target.value,
                }))
              }
            >
              <option value="">No category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Duration">
            <Input
              value={form.duration}
              onChange={(event) =>
                setForm((current) => ({ ...current, duration: event.target.value }))
              }
            />
          </Field>
          <Field label="Original price">
            <Input
              type="number"
              min="0"
              step="0.01"
              value={form.originalPrice}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  originalPrice: event.target.value,
                }))
              }
            />
          </Field>
          <Field label="Discounted price">
            <Input
              type="number"
              min="0"
              step="0.01"
              value={form.discountedPrice}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  discountedPrice: event.target.value,
                }))
              }
            />
          </Field>
          <Field label="Rating">
            <Input
              type="number"
              min="0"
              max="5"
              step="0.1"
              value={form.rating}
              onChange={(event) =>
                setForm((current) => ({ ...current, rating: event.target.value }))
              }
            />
          </Field>
          <ImageUrlField
            label="Course image"
            value={form.courseImgUrl}
            onChange={(courseImgUrl) =>
              setForm((current) => ({ ...current, courseImgUrl }))
            }
          />
          <Field label="Technology tags" hint="Comma-separated">
            <Input
              value={form.technologyTags}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  technologyTags: event.target.value,
                }))
              }
            />
          </Field>
          <div className="flex flex-col gap-3 md:col-span-2">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Flags
            </span>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isPlacementGurranted}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    isPlacementGurranted: event.target.checked,
                  }))
                }
              />
              Placement guaranteed
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isInSale}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    isInSale: event.target.checked,
                  }))
                }
              />
              On sale
            </label>
          </div>
          <div className="md:col-span-2">
            <Field label="Short description">
              <Textarea
                value={form.shortDescription}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    shortDescription: event.target.value,
                  }))
                }
              />
            </Field>
          </div>
          <div className="md:col-span-2">
            <Field label="Long description">
              <Textarea
                value={form.longDescription}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    longDescription: event.target.value,
                  }))
                }
              />
            </Field>
          </div>
          <div className="md:col-span-2">
            <SyllabusPdfField
              value={form.syllabus}
              onChange={(syllabus) =>
                setForm((current) => ({ ...current, syllabus }))
              }
            />
          </div>
          <div className="md:col-span-2">
            <span className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Modules
            </span>
            {modules.length === 0 ? (
              <p className="text-sm text-zinc-500">
                Create modules first to attach them here.
              </p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {modules.map((module) => (
                  <label
                    key={module.id}
                    className="flex items-start gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700"
                  >
                    <input
                      type="checkbox"
                      className="mt-0.5"
                      checked={form.courseModuleIds.includes(module.id)}
                      onChange={() => toggleModule(module.id)}
                    />
                    <span>
                      <span className="font-medium">{module.title}</span>
                      <span className="mt-0.5 block text-xs text-zinc-500">
                        {module.id}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
          <div className="md:col-span-2">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : editingId ? "Update course" : "Create course"}
            </Button>
          </div>
        </form>
      </Card>

      <Card title="All courses">
        {loading ? (
          <p className="text-sm text-zinc-500">Loading…</p>
        ) : courses.length === 0 ? (
          <EmptyState>No courses yet.</EmptyState>
        ) : (
          <DataTable
            columns={["Name", "Category", "Status", "Price", "Actions"]}
            rows={courses.map((course) => [
              course.name,
              course.courseCategorie?.name ?? "—",
              course.status,
              course.discountedPrice ?? course.originalPrice ?? "—",
              <div key={course.id} className="flex gap-2">
                <Button variant="secondary" onClick={() => startEdit(course)}>
                  Edit
                </Button>
                <Button variant="danger" onClick={() => void handleDelete(course.id)}>
                  Delete
                </Button>
              </div>,
            ])}
          />
        )}
      </Card>
    </AdminShell>
  );
}
