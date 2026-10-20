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
  Select,
} from "@/components/admin/ui";
import { apiDelete, apiGet, apiPatch, apiPost, ApiError } from "@/lib/admin/client";
import type {
  Carousal,
  CarouselSlide,
  ListResponse,
} from "@/lib/admin/types";
import {
  CAROUSAL_POSITIONS,
  type CarousalPosition,
} from "@/lib/carousal-position";

type FormState = {
  position: CarousalPosition | "";
  carousalSlideIds: string[];
};

const emptyForm: FormState = { position: "", carousalSlideIds: [] };

export default function ManageCarousalsPage() {
  const [items, setItems] = useState<Carousal[]>([]);
  const [slides, setSlides] = useState<CarouselSlide[]>([]);
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
      const [carousalsResponse, slidesResponse] = await Promise.all([
        apiGet<ListResponse<Carousal>>("/api/carousals"),
        apiGet<ListResponse<CarouselSlide>>("/api/carousel-slides"),
      ]);
      setItems(carousalsResponse.data);
      setSlides(slidesResponse.data);
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

  function toggleSlide(slideId: string) {
    setForm((current) => {
      const isSelected = current.carousalSlideIds.includes(slideId);
      return {
        ...current,
        carousalSlideIds: isSelected
          ? current.carousalSlideIds.filter((id) => id !== slideId)
          : [...current.carousalSlideIds, slideId],
      };
    });
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
      carousalSlideIds: form.carousalSlideIds,
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
      carousalSlideIds: item.carousalSlideIds,
    });
  }

  return (
    <AdminShell
      title="Carousals"
      description="Choose a position and select the slides to show in that carousal."
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
          <div className="md:col-span-2">
            <span className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Slides
            </span>
            {slides.length === 0 ? (
              <p className="text-sm text-zinc-500">
                Create carousel slides first to attach them here.
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {slides.map((slide) => {
                  const selected = form.carousalSlideIds.includes(slide.id);
                  const image = slide.imgUrl || slide.bgImgUrl;

                  return (
                    <label
                      key={slide.id}
                      className={`flex cursor-pointer gap-3 rounded-lg border p-3 transition ${
                        selected
                          ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30"
                          : "border-zinc-200 dark:border-zinc-700"
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="mt-1"
                        checked={selected}
                        onChange={() => toggleSlide(slide.id)}
                      />
                      {image ? (
                        <img
                          src={image}
                          alt=""
                          className="h-16 w-24 rounded object-cover"
                        />
                      ) : null}
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">
                          {slide.title}
                        </span>
                        <span className="mt-1 block truncate text-xs text-zinc-500">
                          {slide.id}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
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
            columns={["Position", "Slides", "Actions"]}
            rows={items.map((item) => [
              item.position,
              item.carousalSlideIds.length
                ? item.carousalSlideIds
                    .map(
                      (id) =>
                        slides.find((slide) => slide.id === id)?.title ?? id,
                    )
                    .join(", ")
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
