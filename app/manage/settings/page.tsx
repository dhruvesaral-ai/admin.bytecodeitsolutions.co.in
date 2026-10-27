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
  Select,
} from "@/components/admin/ui";
import { ApiError, apiDelete, apiGet, apiPatch, apiPost } from "@/lib/admin/client";
import type { Address, ListResponse, Setting } from "@/lib/admin/types";

type FormState = {
  companyName: string;
  companyLogoUrl: string;
  companyAddressId: string;
  companyWhatsappNumber: string;
  companyPrimaryContactNumber: string;
  companySecondaryContactNumber: string;
};

const emptyForm: FormState = {
  companyName: "",
  companyLogoUrl: "",
  companyAddressId: "",
  companyWhatsappNumber: "",
  companyPrimaryContactNumber: "",
  companySecondaryContactNumber: "",
};

function toForm(setting: Setting): FormState {
  return {
    companyName: setting.companyName ?? "",
    companyLogoUrl: setting.companyLogoUrl ?? "",
    companyAddressId: setting.companyAddressId ?? "",
    companyWhatsappNumber: setting.companyWhatsappNumber ?? "",
    companyPrimaryContactNumber: setting.companyPrimaryContactNumber ?? "",
    companySecondaryContactNumber: setting.companySecondaryContactNumber ?? "",
  };
}

function buildPayload(form: FormState) {
  return {
    companyName: form.companyName.trim() || null,
    companyLogoUrl: form.companyLogoUrl.trim() || null,
    companyAddressId: form.companyAddressId === "" ? null : form.companyAddressId,
    companyWhatsappNumber: form.companyWhatsappNumber.trim() || null,
    companyPrimaryContactNumber:
      form.companyPrimaryContactNumber.trim() || null,
    companySecondaryContactNumber:
      form.companySecondaryContactNumber.trim() || null,
  };
}

function formatAddress(address: Address) {
  return [address.addressLine, address.city, address.state, address.pincode]
    .filter(Boolean)
    .join(", ");
}

export default function ManageSettingsPage() {
  const [items, setItems] = useState<Setting[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
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
      const [settingsResponse, addressesResponse] = await Promise.all([
        apiGet<ListResponse<Setting>>("/api/settings"),
        apiGet<ListResponse<Address>>("/api/addresses"),
      ]);
      setItems(settingsResponse.data);
      setAddresses(addressesResponse.data);
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
          <ImageUrlField
            label="Company logo"
            value={form.companyLogoUrl}
            onChange={(companyLogoUrl) =>
              setForm((current) => ({ ...current, companyLogoUrl }))
            }
          />
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
          <Field
            label="Company address"
            hint="Addresses are managed by the addresses API."
          >
            <Select
              value={form.companyAddressId}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  companyAddressId: event.target.value,
                }))
              }
            >
              <option value="">No address</option>
              {addresses.map((address) => (
                <option key={address.id} value={address.id}>
                  {formatAddress(address)}
                </option>
              ))}
            </Select>
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
              "Logo",
              "WhatsApp",
              "Primary contact",
              "Secondary contact",
              "Address",
              "Actions",
            ]}
            rows={items.map((item) => [
              item.companyName ?? "—",
              item.companyLogoUrl ? (
                <img
                  key={`${item.id}-logo`}
                  src={item.companyLogoUrl}
                  alt=""
                  className="h-10 w-10 rounded-lg border border-zinc-200 object-cover dark:border-zinc-700"
                />
              ) : (
                "—"
              ),
              item.companyWhatsappNumber ?? "—",
              item.companyPrimaryContactNumber ?? "—",
              item.companySecondaryContactNumber ?? "—",
              item.address ? formatAddress(item.address) : "—",
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
