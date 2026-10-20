"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { DataTable } from "@/components/admin/DataTable";
import { Alert, Button, Card, EmptyState, Field, Input } from "@/components/admin/ui";
import { apiDelete, apiGet, apiPatch, apiPost, ApiError } from "@/lib/admin/client";
import type { CourseCategorie, ListResponse } from "@/lib/admin/types";
import { slugify } from "@/lib/slug";

type FormState = { name: string; slug: string };

const emptyForm: FormState = { name: "", slug: "" };

export default function ManageCourseCategoriesPage() {
  const [items, setItems] = useState<CourseCategorie[]>([]);
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
      const response = await apiGet<ListResponse<CourseCategorie>>(
        "/api/course-categories",
      );
      setItems(response.data);
    } catch (error) {
      setMessage({
        tone: "error",
        text: error instanceof ApiError ? error.message : "Failed to load categories",
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

    try {
      if (editingId) {
        await apiPatch(`/api/course-categories/${editingId}`, {
          name: form.name,
        });
        setMessage({ tone: "success", text: "Category updated." });
      } else {
        await apiPost("/api/course-categories", { name: form.name });
        setMessage({ tone: "success", text: "Category created." });
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
    if (!confirm("Delete this category?")) {
      return;
    }
    try {
      await apiDelete(`/api/course-categories/${id}`);
      if (editingId === id) {
        resetForm();
      }
      await load();
      setMessage({ tone: "success", text: "Category deleted." });
    } catch (error) {
      setMessage({
        tone: "error",
        text: error instanceof ApiError ? error.message : "Delete failed",
      });
    }
  }

  function startEdit(item: CourseCategorie) {
    setEditingId(item.id);
    setForm({ name: item.name, slug: item.slug });
  }

  return (
    <AdminShell
      title="Course categories"
      description="Categories group courses on the marketing site."
    >
      {message ? <Alert tone={message.tone}>{message.text}</Alert> : null}

      <Card
        title={editingId ? "Edit category" : "New category"}
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
              onChange={(event) => {
                const name = event.target.value;
                setForm((current) => ({
                  ...current,
                  name,
                  slug: slugify(name),
                }));
              }}
            />
          </Field>
          <Field label="Slug">
            <Input
              required
              readOnly
              value={form.slug}
            />
          </Field>
          <div className="md:col-span-2">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : editingId ? "Update category" : "Create category"}
            </Button>
          </div>
        </form>
      </Card>

      <Card title="All categories">
        {loading ? (
          <p className="text-sm text-zinc-500">Loading…</p>
        ) : items.length === 0 ? (
          <EmptyState>No categories yet.</EmptyState>
        ) : (
          <DataTable
            columns={["Name", "Slug", "Actions"]}
            rows={items.map((item) => [
              item.name,
              item.slug,
              <div key={item.id} className="flex gap-2">
                <Button variant="secondary" onClick={() => startEdit(item)}>
                  Edit
                </Button>
                <Button variant="danger" onClick={() => void handleDelete(item.id)}>
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
