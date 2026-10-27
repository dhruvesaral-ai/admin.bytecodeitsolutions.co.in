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
} from "@/components/admin/ui";
import { ApiError, apiDelete, apiGet, apiPatch, apiPost } from "@/lib/admin/client";
import type { ListResponse, Setting } from "@/lib/admin/types";

type FormState = {
  companyName: string;
  companyAddress: string;
  companyWhatsappNumber: string;
  companyPrimaryContactNumber: string;
  companySecondaryContactNumber: string;
};

const emptyForm: FormState = {
  companyName: "",
  companyAddress: "",
  companyWhatsappNumber: "",
  companyPrimaryContactNumber: "",
  companySecondaryContactNumber: "",
};

function toForm(setting: Setting): FormState {
  return {
    companyName: setting.companyName ?? "",
    companyAddress: setting.companyAddress ?? "",
    companyWhatsappNumber: setting.companyWhatsappNumber ?? "",
    companyPrimaryContactNumber: setting.companyPrimaryContactNumber ?? "",
    companySecondaryContactNumber: setting.companySecondaryContactNumber ?? "",
  };
}

function buildPayload(form: FormState) {
  return {
    companyName: form.companyName.trim() || null,
    companyAddress: form.companyAddress.trim() || null,
    companyWhatsappNumber: form.companyWhatsappNumber.trim() || null,
    companyPrimaryContactNumber:
      form.companyPrimaryContactNumber.trim() || null,
    companySecondaryContactNumber:
      form.companySecondaryContactNumber.trim() || null,
  };
}

export default function ManageSettingsPage() {
  const [items, setItems] = useState<Setting[]>([]);
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
      const response = await apiGet<ListResponse<Setting>>("/api/settings");
      setItems(response.data);
    } catch (error) {
      setMessage({
        tone: "error",
        text: error instanceof ApiError ? error.message : "Failed to load settings",
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
    const payload = buildPayload(form);

    try {
      if (editingId) {
        await apiPatch(`/api/settings/${editingId}`, payload);
        setMessage({ tone: "success", text: "Settings updated." });
      } else {
        await apiPost("/api/settings", payload);
        setMessage({ tone: "success", text: "Settings created." });
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
    if (!confirm("Delete these settings?")) {
      return;
    }
    try {
      await apiDelete(`/api/settings/${id}`);
      if (editingId === id) {
        resetForm();
      }
      await load();
      setMessage({ tone: "success", text: "Settings deleted." });
    } catch (error) {
      setMessage({
        tone: "error",
        text: error instanceof ApiError ? error.message : "Delete failed",
      });
    }
  }

  function startEdit(item: Setting) {
    setEditingId(item.id);
    setForm(toForm(item));
  }

  return (
    <AdminShell
      title="Settings"
      description="Company branding, contact numbers, and the registered address used across the site."
    >
      {message ? <Alert tone={message.tone}>{message.text}</Alert> : null}

      <Card
        title={editingId ? "Edit settings" : "New settings"}
        action={
          editingId ? (
            <Button variant="ghost" onClick={resetForm}>
              Cancel edit
            </Button>
          ) : null
        }
      >
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <Field label="Company name">
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
          <Field label="Company address">
            <Input
              value={form.companyAddress}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  companyAddress: event.target.value,
                }))
              }
              placeholder="2nd Floor, MG Road, Indore, MP 452001"
            />
          </Field>
          <Field label="WhatsApp number">
            <Input
              value={form.companyWhatsappNumber}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  companyWhatsappNumber: event.target.value,
                }))
              }
              placeholder="+919876543210"
            />
          </Field>
          <Field label="Primary contact number">
            <Input
              value={form.companyPrimaryContactNumber}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  companyPrimaryContactNumber: event.target.value,
                }))
              }
              placeholder="+919876543210"
            />
          </Field>
          <Field label="Secondary contact number">
            <Input
              value={form.companySecondaryContactNumber}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  companySecondaryContactNumber: event.target.value,
                }))
              }
              placeholder="+919876543210"
            />
          </Field>
          <div className="md:col-span-2">
            <Button type="submit" disabled={saving}>
              {saving
                ? "Saving…"
                : editingId
                  ? "Update settings"
                  : "Create settings"}
            </Button>
          </div>
        </form>
      </Card>

      <Card title="All settings">
        {loading ? (
          <p className="text-sm text-zinc-500">Loading…</p>
        ) : items.length === 0 ? (
          <EmptyState>No settings yet.</EmptyState>
        ) : (
          <DataTable
            columns={[
              "Company",
              "Address",
              "WhatsApp",
              "Primary contact",
              "Secondary contact",
              "Actions",
            ]}
            rows={items.map((item) => [
              item.companyName ?? "—",
              item.companyAddress ?? "—",
              item.companyWhatsappNumber ?? "—",
              item.companyPrimaryContactNumber ?? "—",
              item.companySecondaryContactNumber ?? "—",
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
