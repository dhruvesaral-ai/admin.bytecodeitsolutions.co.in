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
import {
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
  ApiError,
} from "@/lib/admin/client";
import type { ListResponse, Role } from "@/lib/admin/types";
import { slugify } from "@/lib/slug";

type FormState = {
  name: string;
  slug: string;
};

const emptyForm: FormState = { name: "", slug: "" };

export default function ManageRolesPage() {
  const [items, setItems] = useState<Role[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [isCustomSlug, setIsCustomSlug] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState<{
    tone: "error" | "success";
    text: string;
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const response = await apiGet<ListResponse<Role>>("/api/roles");
      setItems(response.data);
    } catch (error) {
      setMessage({
        tone: "error",
        text: error instanceof ApiError ? error.message : "Failed to load roles",
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
    setIsCustomSlug(false);
    setEditingId(null);
  }

  function handleNameChange(value: string) {
    setForm((current) => ({
      ...current,
      name: value,
      slug: isCustomSlug ? current.slug : slugify(value),
    }));
  }

  function handleSlugChange(value: string) {
    setIsCustomSlug(true);
    setForm((current) => ({
      ...current,
      slug: slugify(value),
    }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);

    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim(),
    };

    try {
      if (editingId) {
        await apiPatch(`/api/roles/${editingId}`, payload);
        setMessage({ tone: "success", text: "Role updated successfully." });
      } else {
        await apiPost("/api/roles", payload);
        setMessage({ tone: "success", text: "Role created successfully." });
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

  async function handleDelete(role: Role) {
    const userCount = role._count?.users ?? 0;
    const confirmPrompt =
      userCount > 0
        ? `Warning: This role is assigned to ${userCount} user(s). Are you sure you want to delete "${role.name}"?`
        : `Delete role "${role.name}"?`;

    if (!confirm(confirmPrompt)) {
      return;
    }

    try {
      await apiDelete(`/api/roles/${role.id}`);
      if (editingId === role.id) {
        resetForm();
      }
      await load();
      setMessage({ tone: "success", text: "Role deleted successfully." });
    } catch (error) {
      setMessage({
        tone: "error",
        text: error instanceof ApiError ? error.message : "Delete failed",
      });
    }
  }

  function startEdit(item: Role) {
    setEditingId(item.id);
    setIsCustomSlug(true);
    setForm({ name: item.name, slug: item.slug });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.slug.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <AdminShell
      title="Roles"
      description="Manage access levels and authorization roles for platform users."
    >
      {message ? <Alert tone={message.tone}>{message.text}</Alert> : null}

      <div className="grid gap-6">
        {/* Create / Edit Role Card */}
        <Card
          title={editingId ? "Edit role" : "Create new role"}
          action={
            editingId ? (
              <Button variant="ghost" onClick={resetForm}>
                Cancel edit
              </Button>
            ) : null
          }
        >
          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
            <Field label="Role Name" hint="Human-readable title, e.g. Administrator, Instructor">
              <Input
                required
                placeholder="e.g. Student Counselor"
                value={form.name}
                onChange={(event) => handleNameChange(event.target.value)}
              />
            </Field>

            <Field
              label="Role Slug"
              hint="URL-friendly identifier used in code, e.g. student-counselor"
            >
              <div className="relative">
                <Input
                  required
                  placeholder="e.g. student-counselor"
                  value={form.slug}
                  onChange={(event) => handleSlugChange(event.target.value)}
                />
                {isCustomSlug && !editingId ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomSlug(false);
                      setForm((current) => ({
                        ...current,
                        slug: slugify(current.name),
                      }));
                    }}
                    className="absolute right-2 top-2 text-xs text-indigo-600 hover:underline dark:text-indigo-400"
                  >
                    Auto-generate
                  </button>
                ) : null}
              </div>
            </Field>

            <div className="flex items-center gap-3 md:col-span-2 pt-2">
              <Button type="submit" disabled={saving}>
                {saving
                  ? "Saving…"
                  : editingId
                  ? "Update role"
                  : "Create role"}
              </Button>
              {editingId ? (
                <Button variant="secondary" onClick={resetForm}>
                  Cancel
                </Button>
              ) : null}
            </div>
          </form>
        </Card>

        {/* Roles List Card */}
        <Card
          title={`All roles (${items.length})`}
          action={
            items.length > 3 ? (
              <div className="w-56">
                <Input
                  placeholder="Search roles…"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
            ) : null
          }
        >
          {loading ? (
            <div className="py-8 text-center text-sm text-zinc-500">
              Loading roles…
            </div>
          ) : items.length === 0 ? (
            <EmptyState>No roles found. Create your first role above.</EmptyState>
          ) : filteredItems.length === 0 ? (
            <EmptyState>No roles match &quot;{search}&quot;.</EmptyState>
          ) : (
            <DataTable
              columns={["Name", "Slug", "Assigned Users", "Created At", "Actions"]}
              rows={filteredItems.map((item) => [
                <div key="name" className="font-medium text-zinc-900 dark:text-zinc-100">
                  {item.name}
                </div>,
                <code
                  key="slug"
                  className="rounded bg-zinc-100 px-2 py-0.5 text-xs font-mono text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                >
                  {item.slug}
                </code>,
                <span
                  key="users"
                  className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
                >
                  {item._count?.users ?? 0} user{item._count?.users === 1 ? "" : "s"}
                </span>,
                <span key="date" className="text-xs text-zinc-500">
                  {new Date(item.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>,
                <div key="actions" className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => startEdit(item)}
                    className="h-8 text-xs px-2.5"
                  >
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => void handleDelete(item)}
                    className="h-8 text-xs px-2.5"
                  >
                    Delete
                  </Button>
                </div>,
              ])}
            />
          )}
        </Card>
      </div>
    </AdminShell>
  );
}
