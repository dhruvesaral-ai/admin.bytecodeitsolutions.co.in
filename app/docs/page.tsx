"use client";

import { useMemo, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import {
  API_CATEGORIES,
  API_ENDPOINTS,
  type ApiEndpoint,
  type FieldDefinition,
  type HttpMethod,
} from "@/lib/docs/api-spec";

const METHOD_STYLES: Record<
  HttpMethod,
  {
    badge: string;
    pill: string;
    border: string;
    bg: string;
  }
> = {
  GET: {
    badge: "bg-blue-600 text-white",
    pill: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/60",
    border: "border-blue-500",
    bg: "bg-blue-50/30 dark:bg-blue-950/20",
  },
  POST: {
    badge: "bg-emerald-600 text-white",
    pill: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/60",
    border: "border-emerald-500",
    bg: "bg-emerald-50/30 dark:bg-emerald-950/20",
  },
  PATCH: {
    badge: "bg-amber-600 text-white",
    pill: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/60",
    border: "border-amber-500",
    bg: "bg-amber-50/30 dark:bg-amber-950/20",
  },
  DELETE: {
    badge: "bg-rose-600 text-white",
    pill: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/60",
    border: "border-rose-500",
    bg: "bg-rose-50/30 dark:bg-rose-950/20",
  },
};

function CopyButton({
  text,
  label = "Copy",
  className = "",
}: {
  text: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 ${className}`}
      title="Copy to clipboard"
    >
      {copied ? (
        <>
          <span className="text-emerald-600 dark:text-emerald-400">✓</span>
          <span>Copied!</span>
        </>
      ) : (
        <>
          <svg
            className="h-3.5 w-3.5 text-zinc-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
          <span>{label}</span>
        </>
      )}
    </button>
  );
}

function FieldTable({
  fields,
  title,
}: {
  fields: FieldDefinition[];
  title: string;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
      <div className="bg-zinc-100/70 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:bg-zinc-900/80 dark:text-zinc-400">
        {title}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-[11px] font-semibold text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-2">Field Name</th>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Requirement</th>
              <th className="px-3 py-2">Default</th>
              <th className="px-4 py-2">Description & Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-800 dark:bg-zinc-950">
            {fields.map((f) => (
              <tr key={f.name} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30">
                <td className="px-4 py-2.5 font-mono font-bold text-zinc-900 dark:text-zinc-100">
                  {f.name}
                </td>
                <td className="px-3 py-2.5 font-mono text-indigo-600 dark:text-indigo-400">
                  {f.type}
                </td>
                <td className="px-3 py-2.5">
                  {f.required ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-600 dark:bg-rose-400" />
                      Required
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                      Optional
                    </span>
                  )}
                </td>
                <td className="px-3 py-2.5 font-mono text-zinc-500">
                  {f.default ? f.default : "—"}
                </td>
                <td className="px-4 py-2.5 text-zinc-600 dark:text-zinc-300">
                  {f.description}
                  {f.example !== undefined && (
                    <span className="mt-0.5 block font-mono text-[11px] text-zinc-400">
                      e.g. <code>{String(f.example)}</code>
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EndpointCard({
  endpoint,
  isExpanded,
  onToggle,
}: {
  endpoint: ApiEndpoint;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const methodStyle = METHOD_STYLES[endpoint.method];
  const [selectedResponseIdx, setSelectedResponseIdx] = useState(0);

  // Build a sample cURL string
  const curlCommand = useMemo(() => {
    let curl = `curl -X ${endpoint.method} "https://admin.bytecodeitsolutions.co.in${endpoint.path}"`;
    if (endpoint.headers) {
      Object.entries(endpoint.headers).forEach(([k, v]) => {
        curl += ` \\\n  -H "${k}: ${v}"`;
      });
    } else if (endpoint.method === "POST" || endpoint.method === "PATCH") {
      curl += ` \\\n  -H "Content-Type: application/json"`;
    }
    if (endpoint.requestBody?.exampleJson) {
      curl += ` \\\n  -d '${endpoint.requestBody.exampleJson.replace(/\n/g, "")}'`;
    }
    return curl;
  }, [endpoint]);

  return (
    <div
      id={endpoint.id}
      className={`rounded-xl border transition-all ${
        isExpanded
          ? "border-zinc-300 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
          : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900/60"
      }`}
    >
      {/* Clickable Header */}
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 p-4 text-left cursor-pointer"
      >
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={`inline-flex items-center justify-center rounded-md px-2.5 py-1 font-mono text-xs font-bold tracking-wide ${methodStyle.badge}`}
          >
            {endpoint.method}
          </span>
          <span className="font-mono text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {endpoint.path}
          </span>
          <span className="hidden text-xs text-zinc-400 sm:inline">•</span>
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            {endpoint.title}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-400">
            {isExpanded ? "Collapse ▲" : "Details ▼"}
          </span>
        </div>
      </button>

      {/* Expanded Accordion Body */}
      {isExpanded && (
        <div className="border-t border-zinc-200 p-5 space-y-6 dark:border-zinc-800">
          {/* Description & Action Bar */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <p className="text-sm text-zinc-600 dark:text-zinc-300 max-w-2xl">
              {endpoint.description}
            </p>
            <div className="flex items-center gap-2">
              <CopyButton text={`https://admin.bytecodeitsolutions.co.in${endpoint.path}`} label="Copy URL" />
              <CopyButton text={curlCommand} label="Copy cURL" />
            </div>
          </div>

          {/* Query Parameters */}
          {endpoint.queryParams && endpoint.queryParams.length > 0 && (
            <FieldTable fields={endpoint.queryParams} title="Query Parameters (URL Search)" />
          )}

          {/* Request Headers */}
          {endpoint.headers && (
            <div className="rounded-lg border border-zinc-200 bg-zinc-50/50 p-3 text-xs dark:border-zinc-800 dark:bg-zinc-950/40">
              <span className="font-semibold text-zinc-700 dark:text-zinc-300">Headers: </span>
              {Object.entries(endpoint.headers).map(([k, v]) => (
                <code key={k} className="ml-2 rounded bg-zinc-200/60 px-1.5 py-0.5 dark:bg-zinc-800 font-mono text-indigo-600 dark:text-indigo-400">
                  {k}: {v}
                </code>
              ))}
            </div>
          )}

          {/* Request Body Specification */}
          {endpoint.requestBody && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                  Request Payload ({endpoint.requestBody.contentType || "application/json"})
                </h4>
                {endpoint.requestBody.exampleJson && (
                  <CopyButton text={endpoint.requestBody.exampleJson} label="Copy JSON Payload" />
                )}
              </div>

              {/* Required & Optional Fields Breakdown Table */}
              <FieldTable
                fields={endpoint.requestBody.fields}
                title="Payload Fields (Required & Optional)"
              />

              {/* JSON Example */}
              {endpoint.requestBody.exampleJson && (
                <div className="rounded-lg border border-zinc-200 bg-zinc-950 p-4 text-xs dark:border-zinc-800">
                  <div className="flex items-center justify-between pb-2 text-[11px] font-semibold text-zinc-400">
                    <span>Example Request Body</span>
                    <span className="text-zinc-500">JSON</span>
                  </div>
                  <pre className="overflow-x-auto font-mono text-emerald-400">
                    {endpoint.requestBody.exampleJson}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* Responses Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                Responses & Status Codes
              </h4>
              <CopyButton
                text={endpoint.responses[selectedResponseIdx]?.exampleJson || ""}
                label="Copy Response JSON"
              />
            </div>

            {/* Status Tabs */}
            <div className="flex flex-wrap gap-2">
              {endpoint.responses.map((resp, idx) => {
                const isSelected = selectedResponseIdx === idx;
                const is2xx = resp.status >= 200 && resp.status < 300;
                return (
                  <button
                    key={resp.status}
                    type="button"
                    onClick={() => setSelectedResponseIdx(idx)}
                    className={`rounded-md border px-3 py-1 text-xs font-medium transition cursor-pointer ${
                      isSelected
                        ? is2xx
                          ? "border-emerald-500 bg-emerald-50 font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                          : "border-rose-500 bg-rose-50 font-bold text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                        : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400"
                    }`}
                  >
                    <span className="font-mono">{resp.status}</span>
                    <span className="ml-1.5 opacity-80">{resp.description}</span>
                  </button>
                );
              })}
            </div>

            {/* Response JSON Viewer */}
            <div className="rounded-lg border border-zinc-200 bg-zinc-950 p-4 text-xs dark:border-zinc-800">
              <pre className="overflow-x-auto font-mono text-zinc-200">
                {endpoint.responses[selectedResponseIdx]?.exampleJson}
              </pre>
            </div>
          </div>

          {/* cURL Command Snippet */}
          <div className="rounded-lg border border-zinc-200 bg-zinc-950 p-4 text-xs dark:border-zinc-800">
            <div className="flex items-center justify-between pb-2 text-[11px] font-semibold text-zinc-400">
              <span>cURL Request Command</span>
              <CopyButton text={curlCommand} label="Copy cURL" />
            </div>
            <pre className="overflow-x-auto font-mono text-sky-300 whitespace-pre-wrap">
              {curlCommand}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ApiDocsPage() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedMethod, setSelectedMethod] = useState<string>("ALL");
  const [expandedEndpoints, setExpandedEndpoints] = useState<Record<string, boolean>>({
    "registrations-create": true,
    "payments-create": true,
    "users-create": true,
  });

  // Filtered endpoints
  const filteredEndpoints = useMemo(() => {
    return API_ENDPOINTS.filter((ep) => {
      // Category match
      if (selectedCategory !== "all" && ep.category !== selectedCategory) {
        return false;
      }
      // Method match
      if (selectedMethod !== "ALL" && ep.method !== selectedMethod) {
        return false;
      }
      // Search match (search path, title, description, or field names)
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchesBasic =
          ep.path.toLowerCase().includes(query) ||
          ep.title.toLowerCase().includes(query) ||
          ep.description.toLowerCase().includes(query) ||
          ep.category.toLowerCase().includes(query);

        const matchesFields = ep.requestBody?.fields.some((f) =>
          f.name.toLowerCase().includes(query) || f.description.toLowerCase().includes(query)
        );

        return matchesBasic || Boolean(matchesFields);
      }
      return true;
    });
  }, [search, selectedCategory, selectedMethod]);

  function handleToggleAll(expand: boolean) {
    const updated: Record<string, boolean> = {};
    filteredEndpoints.forEach((ep) => {
      updated[ep.id] = expand;
    });
    setExpandedEndpoints(updated);
  }

  return (
    <AdminShell
      title="API Documentation"
      description="Interactive REST API reference for all backend endpoints, payloads, required & optional fields, and response schemas."
    >
      <div className="space-y-6">
        {/* Top Info Banner */}
        <div className="rounded-xl border border-indigo-100 bg-gradient-to-r from-indigo-50/80 via-white to-sky-50/80 p-5 shadow-sm dark:border-indigo-900/50 dark:from-indigo-950/20 dark:via-zinc-900 dark:to-sky-950/20">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                  ⚡
                </span>
                <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                  Bytecode REST API Specification
                </h2>
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                  v1.0.0
                </span>
              </div>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                All endpoints use standard JSON request/response formats with HTTP status codes.
                Click on any endpoint below to inspect schema requirements, sample cURL commands, and responses.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-md border border-zinc-200 bg-white px-2.5 py-1 font-mono text-zinc-700 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
                Base URL: <strong>/api</strong>
              </span>
              <span className="rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-zinc-700 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
                Total Endpoints: <strong>{API_ENDPOINTS.length}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Search & Filters Control Bar */}
        <div className="space-y-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {/* Search Input */}
            <div className="sm:col-span-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search endpoint path, payload field, or description… (e.g. registrationNo, /api/payments)"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 bg-white pl-9 pr-4 py-2 text-xs text-zinc-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                />
                <svg
                  className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-2.5 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* HTTP Method Filter */}
            <div>
              <select
                value={selectedMethod}
                onChange={(e) => setSelectedMethod(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-800 shadow-sm outline-none transition focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              >
                <option value="ALL">All HTTP Methods</option>
                <option value="GET">GET Only</option>
                <option value="POST">POST Only</option>
                <option value="PATCH">PATCH Only</option>
                <option value="DELETE">DELETE Only</option>
              </select>
            </div>

            {/* Expand / Collapse Actions */}
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => handleToggleAll(true)}
                className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
              >
                Expand All
              </button>
              <button
                type="button"
                onClick={() => handleToggleAll(false)}
                className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
              >
                Collapse All
              </button>
            </div>
          </div>

          {/* Category Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pt-2 pb-1 scrollbar-thin">
            <button
              type="button"
              onClick={() => setSelectedCategory("all")}
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition cursor-pointer ${
                selectedCategory === "all"
                  ? "bg-indigo-600 text-white"
                  : "border border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
              }`}
            >
              All Categories ({API_ENDPOINTS.length})
            </button>
            {API_CATEGORIES.map((cat) => {
              const count = API_ENDPOINTS.filter((e) => e.category === cat.id).length;
              if (count === 0) return null;
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition cursor-pointer ${
                    isSelected
                      ? "bg-indigo-600 text-white"
                      : "border border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                  }`}
                >
                  {cat.name} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Results Counter */}
        <div className="flex items-center justify-between text-xs text-zinc-500">
          <span>
            Showing <strong>{filteredEndpoints.length}</strong> matching endpoints
          </span>
          {selectedCategory !== "all" && (
            <button
              type="button"
              onClick={() => setSelectedCategory("all")}
              className="text-indigo-600 hover:underline dark:text-indigo-400"
            >
              Reset filter
            </button>
          )}
        </div>

        {/* Endpoint List */}
        {filteredEndpoints.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 p-12 text-center text-sm text-zinc-500 dark:border-zinc-800">
            No API endpoints match your search criteria. Try adjusting keywords or filters.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEndpoints.map((ep) => (
              <EndpointCard
                key={ep.id}
                endpoint={ep}
                isExpanded={Boolean(expandedEndpoints[ep.id])}
                onToggle={() =>
                  setExpandedEndpoints((prev) => ({
                    ...prev,
                    [ep.id]: !prev[ep.id],
                  }))
                }
              />
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
