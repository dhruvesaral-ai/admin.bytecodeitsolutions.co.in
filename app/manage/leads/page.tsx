"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
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
import {
  ApiError,
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
} from "@/lib/admin/client";
import type {
  Course,
  Lead,
  LeadStatus,
  ListResponse,
} from "@/lib/admin/types";

type LeadForm = {
  firstName: string;
  lastName: string;
  username: string;
  courseId: string;
  hasBeenCalled: boolean;
  nextCallDate: string;
  status: LeadStatus;
  leadRemark: string;
  message: string;
};

const emptyForm: LeadForm = {
  firstName: "",
  lastName: "",
  username: "",
  courseId: "",
  hasBeenCalled: false,
  nextCallDate: "",
  status: "hot",
  leadRemark: "",
  message: "",
};

async function fetchLeadData() {
  return Promise.all([
    apiGet<ListResponse<Lead>>("/api/leads"),
    apiGet<ListResponse<Course>>("/api/courses"),
  ]);
}

function toDateInput(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 16);
}

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

function toForm(lead: Lead): LeadForm {
  return {
    firstName: lead.firstName,
    lastName: lead.lastName ?? "",
    username: sanitizePhoneDigits(lead.username),
    courseId: lead.courseId ?? "",
    hasBeenCalled: lead.hasBeenCalled,
    nextCallDate: toDateInput(lead.nextCallDate),
    status: lead.status,
    leadRemark: lead.leadRemark ?? "",
    message: lead.message ?? "",
  };
}

function nullableValue(value: string) {
  return value.trim() || null;
}

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleString() : "—";
}

export default function ManageLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [form, setForm] = useState<LeadForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newRemark, setNewRemark] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingRemark, setSavingRemark] = useState(false);
  const [message, setMessage] = useState<{
    tone: "error" | "success";
    text: string;
  } | null>(null);

  const load = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    setMessage(null);
    try {
      const [leadResponse, courseResponse] = await fetchLeadData();
      setLeads(leadResponse.data);
      setCourses(courseResponse.data);
      return true;
    } catch (error) {
      setMessage({
        tone: "error",
        text: error instanceof ApiError ? error.message : "Failed to load leads",
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    async function initialize() {
      try {
        const [leadResponse, courseResponse] = await fetchLeadData();
        if (!active) return;
        setLeads(leadResponse.data);
        setCourses(courseResponse.data);
      } catch (error) {
        if (!active) return;
        setMessage({
          tone: "error",
          text: error instanceof ApiError ? error.message : "Failed to load leads",
        });
      } finally {
        if (active) setLoading(false);
      }
    }
    void initialize();
    return () => {
      active = false;
    };
  }, []);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setNewRemark("");
  }

  function startEdit(lead: Lead) {
    setEditingId(lead.id);
    setForm(toForm(lead));
    setNewRemark("");
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const cleanUsername = sanitizePhoneDigits(form.username);
    if (cleanUsername.length !== 10) {
      setMessage({
        tone: "error",
        text: "Please enter a valid 10-digit phone number for username.",
      });
      return;
    }

    setSaving(true);
    setMessage(null);
    const payload = {
      firstName: form.firstName,
      lastName: nullableValue(form.lastName),
      username: cleanUsername,
      courseId: form.courseId || null,
      hasBeenCalled: form.hasBeenCalled,
      nextCallDate: form.nextCallDate
        ? new Date(form.nextCallDate).toISOString()
        : null,
      status: form.status,
      generatedSource: "offline",
      leadRemark: nullableValue(form.leadRemark),
      message: nullableValue(form.message),
    };

    try {
      if (editingId) {
        await apiPatch(`/api/leads/${editingId}`, payload);
      } else {
        await apiPost("/api/leads", payload);
      }
      resetForm();
      if (!(await load())) return;
      setMessage({
        tone: "success",
        text: editingId ? "Lead updated." : "Lead created.",
      });
    } catch (error) {
      setMessage({
        tone: "error",
        text: error instanceof ApiError ? error.message : "Lead save failed",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this lead and its remark history?")) return;
    try {
      await apiDelete(`/api/leads/${id}`);
      if (editingId === id) resetForm();
      if (!(await load())) return;
      setMessage({ tone: "success", text: "Lead deleted." });
    } catch (error) {
      setMessage({
        tone: "error",
        text: error instanceof ApiError ? error.message : "Lead deletion failed",
      });
    }
  }

  async function handleAddRemark() {
    if (!editingId || !newRemark.trim()) return;
    setSavingRemark(true);
    setMessage(null);
    try {
      await apiPost(`/api/leads/${editingId}/remarks`, {
        remark: newRemark.trim(),
      });
      setNewRemark("");
      if (!(await load())) return;
      setMessage({ tone: "success", text: "Remark added." });
    } catch (error) {
      setMessage({
        tone: "error",
        text: error instanceof ApiError ? error.message : "Could not add remark",
      });
    } finally {
      setSavingRemark(false);
    }
  }

  async function handleDeleteRemark(remarkId: string) {
    if (!editingId || !confirm("Delete this remark?")) return;
    try {
      await apiDelete(`/api/leads/${editingId}/remarks/${remarkId}`);
      if (!(await load())) return;
      setMessage({ tone: "success", text: "Remark deleted." });
    } catch (error) {
      setMessage({
        tone: "error",
        text: error instanceof ApiError ? error.message : "Could not delete remark",
      });
    }
  }

  const currentLead = leads.find((lead) => lead.id === editingId);

  return (
    <AdminShell
      title="Leads"
      description="Manage lead details, course interest, follow-up calls, status, and remark history."
    >
      {message ? <Alert tone={message.tone}>{message.text}</Alert> : null}

      <Card
        title={editingId ? "Edit lead" : "New lead"}
        action={
          editingId ? (
            <Button variant="ghost" onClick={resetForm}>
              Cancel edit
            </Button>
          ) : null
        }
      >
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <Field label="First name">
            <Input
              required
              value={form.firstName}
              onChange={(event) =>
                setForm((current) => ({ ...current, firstName: event.target.value }))
              }
            />
          </Field>
          <Field label="Last name">
            <Input
              value={form.lastName}
              onChange={(event) =>
                setForm((current) => ({ ...current, lastName: event.target.value }))
              }
            />
          </Field>
          <Field
            label="Phone number (Username)"
            hint="10-digit mobile number (backend stores with +91)"
          >
            <Input
              type="tel"
              required
              placeholder="e.g. 9876543210"
              maxLength={15}
              pattern="[0-9]{10}"
              value={form.username}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  username: sanitizePhoneDigits(event.target.value),
                }))
              }
            />
          </Field>
          <Field label="Course">
            <Select
              value={form.courseId}
              onChange={(event) =>
                setForm((current) => ({ ...current, courseId: event.target.value }))
              }
            >
              <option value="">No course selected</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Status">
            <Select
              value={form.status}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  status: event.target.value as LeadStatus,
                }))
              }
            >
              <option value="hot">Hot</option>
              <option value="medium">Medium</option>
              <option value="cold">Cold</option>
              <option value="converted">Converted</option>
            </Select>
          </Field>
          <Field label="Next call date">
            <Input
              type="datetime-local"
              value={form.nextCallDate}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  nextCallDate: event.target.value,
                }))
              }
            />
          </Field>
          <label className="flex items-center gap-2 self-end pb-2 text-sm">
            <input
              type="checkbox"
              checked={form.hasBeenCalled}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  hasBeenCalled: event.target.checked,
                }))
              }
            />
            Has been called
          </label>
          <div className="md:col-span-2">
            <Field label="Lead remark">
              <Textarea
                value={form.leadRemark}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    leadRemark: event.target.value,
                  }))
                }
              />
            </Field>
          </div>
          <div className="md:col-span-2">
            <Field label="Message">
              <Textarea
                value={form.message}
                onChange={(event) =>
                  setForm((current) => ({ ...current, message: event.target.value }))
                }
              />
            </Field>
          </div>

          {editingId ? (
            <div className="space-y-3 md:col-span-2">
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  value={newRemark}
                  onChange={(event) => setNewRemark(event.target.value)}
                  placeholder="Add to remark history"
                  aria-label="New remark"
                />
                <Button
                  onClick={() => void handleAddRemark()}
                  disabled={savingRemark || !newRemark.trim()}
                >
                  {savingRemark ? "Adding…" : "Add remark"}
                </Button>
              </div>
              {currentLead?.remarks.length ? (
                <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
                  {currentLead.remarks.map((remark) => (
                    <li
                      key={remark.id}
                      className="flex items-start justify-between gap-3 p-3 text-sm"
                    >
                      <div>
                        <p>{remark.remark}</p>
                        <time className="mt-1 block text-xs text-zinc-500">
                          {formatDate(remark.createdAt)}
                        </time>
                      </div>
                      <Button
                        variant="danger"
                        onClick={() => void handleDeleteRemark(remark.id)}
                      >
                        Delete
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-zinc-500">No remarks recorded yet.</p>
              )}
            </div>
          ) : null}

          <div className="md:col-span-2">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : editingId ? "Update lead" : "Create lead"}
            </Button>
          </div>
        </form>
      </Card>

      <Card title="All leads">
        {loading ? (
          <p className="text-sm text-zinc-500">Loading…</p>
        ) : leads.length === 0 ? (
          <EmptyState>No leads yet.</EmptyState>
        ) : (
          <DataTable
            columns={[
              "Name",
              "Phone (Username)",
              "Course",
              "Status",
              "Follow-up",
              "Remarks",
              "Created",
              "Actions",
            ]}
            rows={leads.map((lead) => [
              `${lead.firstName} ${lead.lastName ?? ""}`.trim(),
              lead.username,
              lead.course?.name ?? "—",
              lead.status,
              lead.hasBeenCalled
                ? "Called"
                : `Not called${lead.nextCallDate ? ` · ${formatDate(lead.nextCallDate)}` : ""}`,
              lead.remarksIds.length,
              formatDate(lead.createdAt),
              <div key={lead.id} className="flex items-center gap-2">
                <Link
                  href={`/manage/leads/registration/${lead.id}`}
                  className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-indigo-500 shadow-sm"
                >
                  Register
                </Link>
                <Button
                  variant="secondary"
                  onClick={() => startEdit(lead)}
                  className="text-xs px-2.5 py-1.5"
                >
                  Edit
                </Button>
                <Button
                  variant="danger"
                  onClick={() => void handleDelete(lead.id)}
                  className="text-xs px-2.5 py-1.5"
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
