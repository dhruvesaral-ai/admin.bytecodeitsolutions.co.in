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
  Textarea,
} from "@/components/admin/ui";
import { apiDelete, apiGet, apiPatch, apiPost, ApiError } from "@/lib/admin/client";
import type { CourseModule, ListResponse } from "@/lib/admin/types";

type FormState = { title: string; description: string };

const emptyForm: FormState = { title: "", description: "" };

export default function ManageCourseModulesPage() {
  const [items, setItems] = useState<CourseModule[]>([]);
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
      const response = await apiGet<ListResponse<CourseModule>>("/api/course-modules");
      setItems(response.data);
    } catch (error) {
      setMessage({
        tone: "error",
        text: error instanceof ApiError ? error.message : "Failed to load modules",
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

    const payload = {
      title: form.title,
      description: form.description.trim() === "" ? null : form.description,
    };

    try {
      if (editingId) {
        await apiPatch(`/api/course-modules/${editingId}`, payload);
        setMessage({ tone: "success", text: "Module updated." });
      } else {
        await apiPost("/api/course-modules", payload);
        setMessage({ tone: "success", text: "Module created." });
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
    if (!confirm("Delete this module?")) {
      return;
    }
    try {
      await apiDelete(`/api/course-modules/${id}`);
      if (editingId === id) {
        resetForm();
      }
      await load();
      setMessage({ tone: "success", text: "Module deleted." });
    } catch (error) {
      setMessage({
        tone: "error",
        text: error instanceof ApiError ? error.message : "Delete failed",
      });
    }
  }

  function startEdit(item: CourseModule) {
    setEditingId(item.id);
    setForm({
      title: item.title,
      description: item.description ?? "",
    });
  }

  return (
    <AdminShell
      title="Course modules"
      description="Modules can be referenced from courses by ID."
    >
      {message ? <Alert tone={message.tone}>{message.text}</Alert> : null}

      <Card
        title={editingId ? "Edit module" : "New module"}
        action={
          editingId ? (
            <Button variant="ghost" onClick={resetForm}>Cancel edit</Button>
          ) : null
        }
      >
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <Field label="Title">
            <Input
              required
              value={form.title}
              onChange={(event) =>
                setForm((current) => ({ ...current, title: event.target.value }))
              }
            />
          </Field>
          <Field label="Description">
            <Textarea
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
            />
          </Field>
          <div>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : editingId ? "Update module" : "Create module"}
            </Button>
          </div>
        </form>
      </Card>

      <Card title="All modules">
        {loading ? (
          <p className="text-sm text-zinc-500">Loading…</p>
        ) : items.length === 0 ? (
          <EmptyState>No modules yet.</EmptyState>
        ) : (
          <DataTable
            columns={["Title", "Description", "ID", "Actions"]}
            rows={items.map((item) => [
              item.title,
              item.description ?? "—",
              <code key={`${item.id}-code`} className="text-xs">{item.id}</code>,
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
