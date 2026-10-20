"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { DataTable } from "@/components/admin/DataTable";
import { ImageUrlField } from "@/components/admin/ImageUrlField";
import {
  Alert,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
} from "@/components/admin/ui";
import { ApiError, apiDelete, apiGet, apiPatch, apiPost } from "@/lib/admin/client";
import type { ListResponse, Testimonial } from "@/lib/admin/types";

type FormState = {
  name: string;
  companyName: string;
  profileImg: string;
};

const emptyForm: FormState = {
  name: "",
  companyName: "",
  profileImg: "",
};

export default function ManageTestimonialsPage() {
  const [items, setItems] = useState<Testimonial[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    tone: "error" | "success";
    text: string;
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const response = await apiGet<ListResponse<Testimonial>>("/api/testimonials");
      setItems(response.data);
    } catch (error) {
      setMessage({
        tone: "error",
        text:
          error instanceof ApiError
            ? error.message
            : "Failed to load testimonials",
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
      name: form.name,
      companyName: form.companyName.trim() || null,
      profileImg: form.profileImg.trim() || null,
    };

    try {
      if (editingId) {
        await apiPatch(`/api/testimonials/${editingId}`, payload);
        setMessage({ tone: "success", text: "Testimonial updated." });
      } else {
        await apiPost("/api/testimonials", payload);
        setMessage({ tone: "success", text: "Testimonial created." });
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
    if (!confirm("Delete this testimonial?")) {
      return;
    }
    try {
      await apiDelete(`/api/testimonials/${id}`);
      if (editingId === id) {
        resetForm();
      }
      await load();
      setMessage({ tone: "success", text: "Testimonial deleted." });
    } catch (error) {
      setMessage({
        tone: "error",
        text: error instanceof ApiError ? error.message : "Delete failed",
      });
    }
  }

  function startEdit(item: Testimonial) {
    setEditingId(item.id);
    setForm({
      name: item.name,
      companyName: item.companyName ?? "",
      profileImg: item.profileImg ?? "",
    });
  }

  return (
    <AdminShell
      title="Testimonials"
      description="Manage testimonial names, company details, and profile photos."
    >
      {message ? <Alert tone={message.tone}>{message.text}</Alert> : null}

      <Card
        title={editingId ? "Edit testimonial" : "New testimonial"}
        action={
          editingId ? (
            <Button variant="ghost" onClick={resetForm}>
              Cancel edit
            </Button>
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
          <Field label="Company">
            <Input
              value={form.companyName}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  companyName: event.target.value,
                }))
              }
            />
          </Field>
          <ImageUrlField
            label="Profile image"
            value={form.profileImg}
            onChange={(profileImg) =>
              setForm((current) => ({ ...current, profileImg }))
            }
          />
          <div className="md:col-span-2">
            <Button type="submit" disabled={saving}>
              {saving
                ? "Saving…"
                : editingId
                  ? "Update testimonial"
                  : "Create testimonial"}
            </Button>
          </div>
        </form>
      </Card>

      <Card title="All testimonials">
        {loading ? (
          <p className="text-sm text-zinc-500">Loading…</p>
        ) : items.length === 0 ? (
          <EmptyState>No testimonials yet.</EmptyState>
        ) : (
          <DataTable
            columns={["Name", "Company", "Profile image", "Actions"]}
            rows={items.map((item) => [
              item.name,
              item.companyName ?? "—",
              item.profileImg ? (
                <img
                  key={`${item.id}-image`}
                  src={item.profileImg}
                  alt=""
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                "—"
              ),
              <div key={item.id} className="flex gap-2">
                <Button variant="secondary" onClick={() => startEdit(item)}>
                  Edit
                </Button>
                <Button
                  variant="danger"
                  onClick={() => void handleDelete(item.id)}
                >
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
