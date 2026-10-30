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
import {
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
  ApiError,
} from "@/lib/admin/client";
import type { ListResponse, Role, User } from "@/lib/admin/types";

type UserFormState = {
  username: string;
  roleId: string;
  status: "active" | "inactive";
};

const emptyForm: UserFormState = {
  username: "",
  roleId: "",
  status: "active",
};

export default function ManageUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [form, setForm] = useState<UserFormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [message, setMessage] = useState<{
    tone: "error" | "success";
    text: string;
  } | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const [usersRes, rolesRes] = await Promise.all([
        apiGet<ListResponse<User>>("/api/users"),
        apiGet<ListResponse<Role>>("/api/roles"),
      ]);
      setUsers(usersRes.data);
      setRoles(rolesRes.data);
    } catch (error) {
      setMessage({
        tone: "error",
        text: error instanceof ApiError ? error.message : "Failed to load users data",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

function sanitizePhoneDigits(value: string | null | undefined): string {
  if (!value) return "";
  let cleaned = value.trim();
  if (cleaned.startsWith("+91")) {
    cleaned = cleaned.slice(3);
  }
  const digits = cleaned.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) {
    return digits.slice(2, 12);
  }
  if (digits.length === 11 && digits.startsWith("0")) {
    return digits.slice(1, 11);
  }
  return digits.slice(0, 10);
}

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  function startEdit(user: User) {
    setEditingId(user.id);
    setForm({
      username: sanitizePhoneDigits(user.username),
      roleId: user.roleId || "",
      status: user.status,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);

    const cleanUsername = sanitizePhoneDigits(form.username);
    if (cleanUsername.length !== 10) {
      setMessage({
        tone: "error",
        text: "Please enter a valid 10-digit phone number for username.",
      });
      setSaving(false);
      return;
    }

    const payload = {
      username: cleanUsername,
      roleId: form.roleId ? form.roleId : null,
      status: form.status,
    };

    try {
      if (editingId) {
        await apiPatch(`/api/users/${editingId}`, payload);
        setMessage({ tone: "success", text: "User updated successfully." });
      } else {
        await apiPost("/api/users", payload);
        setMessage({ tone: "success", text: "User created successfully." });
      }
      resetForm();
      await loadData();
    } catch (error) {
      setMessage({
        tone: "error",
        text: error instanceof ApiError ? error.message : "Failed to save user",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleStatus(user: User) {
    const nextStatus = user.status === "active" ? "inactive" : "active";
    const actionName = nextStatus === "active" ? "activate" : "suspend / ban";
    if (!confirm(`Are you sure you want to ${actionName} user "${user.username}"?`)) {
      return;
    }

    try {
      await apiPatch(`/api/users/${user.id}`, { status: nextStatus });
      setMessage({
        tone: "success",
        text: `User ${user.username} is now ${nextStatus}.`,
      });
      await loadData();
    } catch (error) {
      setMessage({
        tone: "error",
        text: error instanceof ApiError ? error.message : "Failed to update status",
      });
    }
  }

  async function handleRevokeUserSession(user: User) {
    if (!confirm(`Revoke live session for user "${user.username}"? They will need to log in again.`)) {
      return;
    }

    try {
      await apiDelete(`/api/sessions?userId=${user.id}`);
      setMessage({
        tone: "success",
        text: `Active session for ${user.username} revoked successfully.`,
      });
      await loadData();
    } catch (error) {
      setMessage({
        tone: "error",
        text: error instanceof ApiError ? error.message : "Failed to revoke session",
      });
    }
  }

  async function handleDelete(user: User) {
    if (!confirm(`Delete user account "${user.username}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await apiDelete(`/api/users/${user.id}`);
      if (editingId === user.id) {
        resetForm();
      }
      setMessage({ tone: "success", text: "User account deleted successfully." });
      await loadData();
    } catch (error) {
      setMessage({
        tone: "error",
        text: error instanceof ApiError ? error.message : "Failed to delete user",
      });
    }
  }

  // Filter users
  const filteredUsers = users.filter((user) => {
    const matchSearch =
      user.username.toLowerCase().includes(search.toLowerCase()) ||
      (user.profile?.name && user.profile.name.toLowerCase().includes(search.toLowerCase())) ||
      (user.profile?.email && user.profile.email.toLowerCase().includes(search.toLowerCase())) ||
      (user.role?.name && user.role.name.toLowerCase().includes(search.toLowerCase()));

    const matchStatus = statusFilter === "all" || user.status === statusFilter;
    const matchRole =
      roleFilter === "all" ||
      (roleFilter === "none" ? !user.roleId : user.roleId === roleFilter);

    return matchSearch && matchStatus && matchRole;
  });

  const activeCount = users.filter((u) => u.status === "active").length;
  const suspendedCount = users.filter((u) => u.status === "inactive").length;
  const sessionCount = users.filter((u) => u.authSession).length;

  return (
    <AdminShell
      title="Users"
      description="Manage registered user accounts, phone numbers, RBAC roles, and login access."
    >
      {message ? <Alert tone={message.tone}>{message.text}</Alert> : null}

      {/* Metric Stat Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Total Users</p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">{users.length}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Active Accounts</p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">{activeCount}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-xs font-medium text-red-500 dark:text-red-400">Suspended / Inactive</p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-red-600 dark:text-red-400">{suspendedCount}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400">Live Active Sessions</p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-indigo-600 dark:text-indigo-400">{sessionCount}</p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Create / Edit Form Card */}
        <Card
          title={editingId ? "Edit user account" : "Create new user"}
          action={
            editingId ? (
              <Button variant="ghost" onClick={resetForm}>
                Cancel edit
              </Button>
            ) : null
          }
        >
          <form className="grid gap-4 md:grid-cols-3" onSubmit={handleSubmit}>
            <Field
              label="Username / Mobile"
              hint="10-digit mobile number (e.g. 9876543210) — saved with 91 prefix"
            >
              <Input
                required
                placeholder="e.g. 9876543210"
                value={form.username}
                maxLength={10}
                onChange={(e) => setForm((c) => ({ ...c, username: sanitizePhoneDigits(e.target.value) }))}
              />
            </Field>

            <Field label="Assigned Role" hint="Platform access permission level">
              <Select
                value={form.roleId}
                onChange={(e) => setForm((c) => ({ ...c, roleId: e.target.value }))}
              >
                <option value="">No Role (Default Student/Guest)</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.slug})
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Account Status" hint="Inactive users cannot log in or request OTP">
              <Select
                value={form.status}
                onChange={(e) =>
                  setForm((c) => ({ ...c, status: e.target.value as "active" | "inactive" }))
                }
              >
                <option value="active">Active (Access allowed)</option>
                <option value="inactive">Inactive (Suspended / Banned)</option>
              </Select>
            </Field>

            <div className="flex items-center gap-3 pt-2 md:col-span-3">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : editingId ? "Update User" : "Create User"}
              </Button>
              {editingId ? (
                <Button variant="secondary" onClick={resetForm}>
                  Cancel
                </Button>
              ) : null}
            </div>
          </form>
        </Card>

        {/* Users Table Card */}
        <Card
          title={`All Users (${filteredUsers.length} of ${users.length})`}
          action={
            <div className="flex flex-wrap items-center gap-2">
              <div className="w-44 sm:w-56">
                <Input
                  placeholder="Search user, phone, email…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <select
                className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs text-zinc-800 shadow-sm outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
              <select
                className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs text-zinc-800 shadow-sm outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="all">All Roles</option>
                <option value="none">No Role</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          }
        >
          {loading ? (
            <div className="py-12 text-center text-sm text-zinc-500">Loading users catalog…</div>
          ) : users.length === 0 ? (
            <EmptyState>No registered users found. Create the first account above.</EmptyState>
          ) : filteredUsers.length === 0 ? (
            <EmptyState>No users match your search and filter criteria.</EmptyState>
          ) : (
            <DataTable
              columns={[
                "User / Mobile",
                "Profile Info",
                "Role",
                "Status",
                "Live Session",
                "Joined",
                "Actions",
              ]}
              rows={filteredUsers.map((user) => [
                <div key="username" className="space-y-0.5">
                  <div className="font-semibold text-zinc-900 dark:text-zinc-50">
                    {user.username}
                  </div>
                  <div className="text-[11px] font-mono text-zinc-400">ID: {user.id.slice(-8)}</div>
                </div>,

                <div key="profile" className="text-xs">
                  {user.profile ? (
                    <div>
                      <p className="font-medium text-zinc-800 dark:text-zinc-200">
                        {user.profile.name}
                      </p>
                      <p className="text-zinc-400">{user.profile.email}</p>
                    </div>
                  ) : (
                    <span className="italic text-zinc-400">No profile created</span>
                  )}
                </div>,

                <div key="role">
                  {user.role ? (
                    <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                      {user.role.name}
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                      Standard User
                    </span>
                  )}
                </div>,

                <div key="status">
                  {user.status === "active" ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700 dark:bg-red-950/60 dark:text-red-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                      Suspended
                    </span>
                  )}
                </div>,

                <div key="session">
                  {user.authSession ? (
                    <div className="space-y-0.5">
                      <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-1.5 py-0.5 text-[11px] font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        Online
                      </span>
                      {user.authSession.ipAddress && (
                        <p className="text-[11px] font-mono text-zinc-400">
                          {user.authSession.ipAddress}
                        </p>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-zinc-400">Offline</span>
                  )}
                </div>,

                <span key="date" className="text-xs text-zinc-500">
                  {new Date(user.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>,

                <div key="actions" className="flex flex-wrap items-center gap-1.5">
                  <Button
                    variant="secondary"
                    onClick={() => startEdit(user)}
                    className="h-7 text-xs px-2"
                  >
                    Edit
                  </Button>
                  <Button
                    variant={user.status === "active" ? "ghost" : "primary"}
                    onClick={() => void handleToggleStatus(user)}
                    className="h-7 text-xs px-2"
                  >
                    {user.status === "active" ? "Suspend" : "Activate"}
                  </Button>
                  {user.authSession && (
                    <Button
                      variant="ghost"
                      onClick={() => void handleRevokeUserSession(user)}
                      className="h-7 text-xs px-2 text-amber-600 hover:text-amber-700 dark:text-amber-400"
                    >
                      Revoke
                    </Button>
                  )}
                  <Button
                    variant="danger"
                    onClick={() => void handleDelete(user)}
                    className="h-7 text-xs px-2"
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
