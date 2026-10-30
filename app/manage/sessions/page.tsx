"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { DataTable } from "@/components/admin/DataTable";
import {
  Alert,
  Button,
  Card,
  EmptyState,
  Input,
} from "@/components/admin/ui";
import { apiDelete, apiGet, ApiError } from "@/lib/admin/client";
import type { AuthSession, ListResponse } from "@/lib/admin/types";

function parseClientDeviceInfo(userAgent: string | null): {
  browser: string;
  os: string;
} {
  if (!userAgent) {
    return { browser: "Unknown Browser", os: "Unknown OS" };
  }

  let os = "Desktop / Server";
  if (/windows/i.test(userAgent)) os = "Windows";
  else if (/macintosh|mac os x/i.test(userAgent)) os = "macOS";
  else if (/linux/i.test(userAgent)) os = "Linux";
  else if (/android/i.test(userAgent)) os = "Android";
  else if (/iphone|ipad|ipod/i.test(userAgent)) os = "iOS";

  let browser = "Browser";
  if (/chrome|crios/i.test(userAgent) && !/edge|edg/i.test(userAgent)) browser = "Chrome";
  else if (/safari/i.test(userAgent) && !/chrome|crios/i.test(userAgent)) browser = "Safari";
  else if (/firefox|fxios/i.test(userAgent)) browser = "Firefox";
  else if (/edg/i.test(userAgent)) browser = "Edge";
  else if (/postman/i.test(userAgent)) browser = "Postman Client";
  else if (/curl/i.test(userAgent)) browser = "cURL / CLI";

  return { browser, os };
}

function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
}

export default function ManageSessionsPage() {
  const [sessions, setSessions] = useState<AuthSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [revokingAll, setRevokingAll] = useState(false);
  const [message, setMessage] = useState<{
    tone: "error" | "success";
    text: string;
  } | null>(null);

  const loadSessions = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const response = await apiGet<ListResponse<AuthSession>>("/api/sessions");
      setSessions(response.data);
    } catch (error) {
      setMessage({
        tone: "error",
        text: error instanceof ApiError ? error.message : "Failed to load active sessions",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSessions();
  }, [loadSessions]);

  async function handleRevoke(session: AuthSession) {
    const userLabel = session.user?.username || session.userId;
    if (!confirm(`Revoke session for ${userLabel}? The user will be logged out immediately.`)) {
      return;
    }

    setRevokingId(session.id);
    setMessage(null);

    try {
      await apiDelete(`/api/sessions/${session.id}`);
      setMessage({
        tone: "success",
        text: `Session for ${userLabel} was revoked successfully.`,
      });
      await loadSessions();
    } catch (error) {
      setMessage({
        tone: "error",
        text: error instanceof ApiError ? error.message : "Failed to revoke session",
      });
    } finally {
      setRevokingId(null);
    }
  }

  async function handleRevokeAll() {
    if (
      !confirm(
        "EMERGENCY ACTION: Are you sure you want to terminate ALL user sessions across the entire system? All currently logged-in users will be forced to authenticate again.",
      )
    ) {
      return;
    }

    setRevokingAll(true);
    setMessage(null);

    try {
      await apiDelete("/api/sessions");
      setMessage({
        tone: "success",
        text: "All platform sessions have been successfully revoked.",
      });
      await loadSessions();
    } catch (error) {
      setMessage({
        tone: "error",
        text: error instanceof ApiError ? error.message : "Failed to revoke all sessions",
      });
    } finally {
      setRevokingAll(false);
    }
  }

  const filteredSessions = sessions.filter((s) => {
    const term = search.toLowerCase();
    const username = s.user?.username?.toLowerCase() || "";
    const name = s.user?.profile?.name?.toLowerCase() || "";
    const ip = s.ipAddress?.toLowerCase() || "";
    const ua = s.userAgent?.toLowerCase() || "";

    return (
      username.includes(term) ||
      name.includes(term) ||
      ip.includes(term) ||
      ua.includes(term)
    );
  });

  const uniqueUsers = new Set(sessions.map((s) => s.userId)).size;
  const uniqueIps = new Set(sessions.map((s) => s.ipAddress).filter(Boolean)).size;

  return (
    <AdminShell
      title="Active Sessions"
      description="Monitor live authenticated user sessions, refresh token lifecycles, and device security."
    >
      {message ? <Alert tone={message.tone}>{message.text}</Alert> : null}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
            Total Active Sessions
          </p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {sessions.length}
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
            Distinct Users Online
          </p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
            {uniqueUsers}
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Unique IP Addresses
          </p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {uniqueIps}
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
            Token Expiry Standard
          </p>
          <p className="mt-1 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
            Access: 15m · Refresh: 30d
          </p>
        </div>
      </div>

      {/* Sessions Table Card */}
      <Card
        title={`All Live Sessions (${filteredSessions.length})`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <div className="w-48 sm:w-60">
              <Input
                placeholder="Search user, IP, device…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button variant="secondary" onClick={() => void loadSessions()} disabled={loading}>
              Refresh
            </Button>
            {sessions.length > 0 && (
              <Button
                variant="danger"
                onClick={() => void handleRevokeAll()}
                disabled={revokingAll}
              >
                {revokingAll ? "Revoking…" : "Revoke All Sessions"}
              </Button>
            )}
          </div>
        }
      >
        {loading ? (
          <div className="py-12 text-center text-sm text-zinc-500">
            Scanning active user sessions…
          </div>
        ) : sessions.length === 0 ? (
          <EmptyState>
            No active user sessions currently exist. Once users verify OTP and log in, their sessions will appear here.
          </EmptyState>
        ) : filteredSessions.length === 0 ? (
          <EmptyState>No sessions match &quot;{search}&quot;.</EmptyState>
        ) : (
          <DataTable
            columns={[
              "User / Account",
              "Client Device & OS",
              "Network IP",
              "Session Started",
              "Last Refreshed",
              "Actions",
            ]}
            rows={filteredSessions.map((session) => {
              const device = parseClientDeviceInfo(session.userAgent);
              return [
                <div key="user" className="space-y-0.5">
                  <div className="font-semibold text-zinc-900 dark:text-zinc-50">
                    {session.user?.username || session.userId}
                  </div>
                  {session.user?.profile?.name && (
                    <div className="text-xs text-zinc-500">{session.user.profile.name}</div>
                  )}
                  {session.user?.role && (
                    <span className="inline-flex rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-medium text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                      {session.user.role.name}
                    </span>
                  )}
                </div>,

                <div key="device" className="space-y-0.5">
                  <div className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
                    {device.browser} on {device.os}
                  </div>
                  <div
                    className="max-w-[180px] truncate text-[11px] text-zinc-400"
                    title={session.userAgent || "No user-agent string provided"}
                  >
                    {session.userAgent || "Unknown UA"}
                  </div>
                </div>,

                <div key="ip" className="text-xs font-mono text-zinc-700 dark:text-zinc-300">
                  {session.ipAddress ? (
                    <span className="rounded bg-zinc-100 px-1.5 py-0.5 dark:bg-zinc-800">
                      {session.ipAddress}
                    </span>
                  ) : (
                    <span className="text-zinc-400 italic">Not recorded</span>
                  )}
                </div>,

                <div key="created" className="text-xs">
                  <span className="text-zinc-800 dark:text-zinc-200">
                    {new Date(session.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <p className="text-[11px] text-zinc-400">{timeAgo(session.createdAt)}</p>
                </div>,

                <div key="updated" className="text-xs">
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">
                    {timeAgo(session.updatedAt)}
                  </span>
                  <p className="text-[11px] text-zinc-400">
                    {new Date(session.updatedAt).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>,

                <div key="actions">
                  <Button
                    variant="danger"
                    onClick={() => void handleRevoke(session)}
                    disabled={revokingId === session.id}
                    className="h-8 text-xs px-2.5"
                  >
                    {revokingId === session.id ? "Revoking…" : "Revoke Session"}
                  </Button>
                </div>,
              ];
            })}
          />
        )}
      </Card>
    </AdminShell>
  );
}
