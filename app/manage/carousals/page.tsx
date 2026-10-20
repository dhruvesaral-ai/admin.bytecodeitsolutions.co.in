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
} from "@/components/admin/ui";
import { apiDelete, apiGet, apiPatch, apiPost, ApiError } from "@/lib/admin/client";
import type { Carousal, ListResponse } from "@/lib/admin/types";
import {
  CAROUSAL_POSITIONS,
  type CarousalPosition,
} from "@/lib/carousal-position";

type FormState = {
  position: CarousalPosition | "";
  carousalSlideIds: string;
};

const emptyForm: FormState = { position: "", carousalSlideIds: "" };

function parseSlideIds(value: string) {
  return value
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

export default function ManageCarousalsPage() {
  const [items, setItems] = useState<Carousal[]>([]);
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
      const response = await apiGet<ListResponse<Carousal>>("/api/carousals");
      setItems(response.data);
    } catch (error) {
      setMessage({
        tone: "error",
        text: error instanceof ApiError ? error.message : "Failed to load carousals",
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

    if (!form.position) {
      setMessage({ tone: "error", text: "Select a position." });
      setSaving(false);
      return;
    }

    const payload = {
      position: form.position,
      carousalSlideIds: parseSlideIds(form.carousalSlideIds),
    };

    try {
      if (editingId) {
        await apiPatch(`/api/carousals/${editingId}`, payload);
        setMessage({ tone: "success", text: "Carousal updated." });
      } else {
        await apiPost("/api/carousals", payload);
        setMessage({ tone: "success", text: "Carousal created." });
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
    if (!confirm("Delete this carousal?")) {
      return;
    }
    setMessage(null);
    try {
      await apiDelete(`/api/carousals/${id}`);
      if (editingId === id) {
        resetForm();
      }
      await load();
      setMessage({ tone: "success", text: "Carousal deleted." });
    } catch (error) {
      setMessage({
        tone: "error",
        text: error instanceof ApiError ? error.message : "Delete failed",
      });
    }
  }

  function startEdit(item: Carousal) {
    setEditingId(item.id);
    setForm({
      position: item.position,
      carousalSlideIds: item.carousalSlideIds.join(", "),
    });
  }

  return (
    <AdminShell
      title="Carousals"
      description="Set display order and attach carousel slide IDs."
    >
      {message ? <Alert tone={message.tone}>{message.text}</Alert> : null}

      <Card
        title={editingId ? "Edit carousal" : "New carousal"}
        action={
          editingId ? (
            <Button variant="ghost" onClick={resetForm}>Cancel edit</Button>
          ) : null
        }
      >
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <Field label="Position">
            <Select
              required
              value={form.position}
              onChange={(event) => {
                const position =
                  CAROUSAL_POSITIONS.find(
                    (candidate) => candidate === event.target.value,
                  ) ?? "";
                setForm((current) => ({ ...current, position }));
              }}
            >
              <option value="">Select position</option>
              {CAROUSAL_POSITIONS.map((position) => (
                <option key={position} value={position}>
                  {position}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Slide IDs" hint="Comma-separated carousel slide IDs">
            <Input
              value={form.carousalSlideIds}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  carousalSlideIds: event.target.value,
                }))
              }
            />
          </Field>
          <div className="md:col-span-2">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : editingId ? "Update carousal" : "Create carousal"}
            </Button>
          </div>
        </form>
      </Card>

      <Card title="All carousals">
        {loading ? (
          <p className="text-sm text-zinc-500">Loading…</p>
        ) : items.length === 0 ? (
          <EmptyState>No carousals yet.</EmptyState>
        ) : (
          <DataTable
            columns={["Position", "Slide IDs", "Actions"]}
            rows={items.map((item) => [
              item.position,
              item.carousalSlideIds.length
                ? item.carousalSlideIds.join(", ")
                : "—",
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
