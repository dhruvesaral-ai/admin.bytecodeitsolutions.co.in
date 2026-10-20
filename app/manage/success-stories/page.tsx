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
  Textarea,
} from "@/components/admin/ui";
import { ApiError, apiDelete, apiGet, apiPatch, apiPost } from "@/lib/admin/client";
import type { ListResponse, SuccessStory } from "@/lib/admin/types";

type FormState = { videoIds: string };
const emptyForm: FormState = { videoIds: "" };

function parseVideoIds(value: string) {
  return value
    .split(/[\n,]/)
    .map((videoId) => videoId.trim())
    .filter(Boolean);
}

export default function ManageSuccessStoriesPage() {
  const [items, setItems] = useState<SuccessStory[]>([]);
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
      const response = await apiGet<ListResponse<SuccessStory>>(
        "/api/success-stories",
      );
      setItems(response.data);
    } catch (error) {
      setMessage({
        tone: "error",
        text:
          error instanceof ApiError
            ? error.message
            : "Failed to load success stories",
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
    const payload = { videoIds: parseVideoIds(form.videoIds) };

    try {
      if (editingId) {
        await apiPatch(`/api/success-stories/${editingId}`, payload);
        setMessage({ tone: "success", text: "Success story updated." });
      } else {
        await apiPost("/api/success-stories", payload);
        setMessage({ tone: "success", text: "Success story created." });
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
    if (!confirm("Delete this success story?")) {
      return;
    }
    try {
      await apiDelete(`/api/success-stories/${id}`);
      if (editingId === id) {
        resetForm();
      }
      await load();
      setMessage({ tone: "success", text: "Success story deleted." });
    } catch (error) {
      setMessage({
        tone: "error",
        text: error instanceof ApiError ? error.message : "Delete failed",
      });
    }
  }

  function startEdit(item: SuccessStory) {
    setEditingId(item.id);
    setForm({ videoIds: item.videoIds.join("\n") });
  }

  return (
    <AdminShell
      title="Success stories"
      description="Manage video IDs associated with success stories."
    >
      {message ? <Alert tone={message.tone}>{message.text}</Alert> : null}

      <Card
        title={editingId ? "Edit success story" : "New success story"}
        action={
          editingId ? (
            <Button variant="ghost" onClick={resetForm}>
              Cancel edit
            </Button>
          ) : null
        }
      >
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <Field label="Video IDs" hint="Enter one video ID per line, or separate them with commas.">
            <Textarea
              value={form.videoIds}
              onChange={(event) =>
                setForm({ videoIds: event.target.value })
              }
            />
          </Field>
          <div>
            <Button type="submit" disabled={saving}>
              {saving
                ? "Saving…"
                : editingId
                  ? "Update success story"
                  : "Create success story"}
            </Button>
          </div>
        </form>
      </Card>

      <Card title="All success stories">
        {loading ? (
          <p className="text-sm text-zinc-500">Loading…</p>
        ) : items.length === 0 ? (
          <EmptyState>No success stories yet.</EmptyState>
        ) : (
          <DataTable
            columns={["ID", "Video IDs", "Actions"]}
            rows={items.map((item) => [
              <code key={`${item.id}-code`} className="text-xs">
                {item.id}
              </code>,
              item.videoIds.length ? item.videoIds.join(", ") : "—",
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
