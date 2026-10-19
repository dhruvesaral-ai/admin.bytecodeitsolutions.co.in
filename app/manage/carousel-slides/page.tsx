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
  Textarea,
} from "@/components/admin/ui";
import { ImageUrlField } from "@/components/admin/ImageUrlField";
import { apiDelete, apiGet, apiPatch, apiPost, ApiError } from "@/lib/admin/client";
import type { CarouselSlide, ListResponse } from "@/lib/admin/types";

type FormState = {
  bgImgUrl: string;
  order: string;
  title: string;
  description: string;
  btnHrefLink: string;
  textContainerAlign: string;
  imgUrl: string;
  bannerHrefLink: string;
};

const emptyForm: FormState = {
  bgImgUrl: "",
  order: "",
  title: "",
  description: "",
  btnHrefLink: "",
  textContainerAlign: "",
  imgUrl: "",
  bannerHrefLink: "",
};

function toForm(slide: CarouselSlide): FormState {
  return {
    bgImgUrl: slide.bgImgUrl,
    order: String(slide.order),
    title: slide.title,
    description: slide.description ?? "",
    btnHrefLink: slide.btnHrefLink ?? "",
    textContainerAlign: slide.textContainerAlign ?? "",
    imgUrl: slide.imgUrl ?? "",
    bannerHrefLink: slide.bannerHrefLink ?? "",
  };
}

function buildPayload(form: FormState) {
  return {
    bgImgUrl: form.bgImgUrl,
    order: Number(form.order),
    title: form.title,
    description: form.description.trim() === "" ? null : form.description,
    btnHrefLink: form.btnHrefLink.trim() === "" ? null : form.btnHrefLink,
    textContainerAlign:
      form.textContainerAlign.trim() === "" ? null : form.textContainerAlign,
    imgUrl: form.imgUrl.trim() === "" ? null : form.imgUrl,
    bannerHrefLink: form.bannerHrefLink.trim() === "" ? null : form.bannerHrefLink,
  };
}

export default function ManageCarouselSlidesPage() {
  const [items, setItems] = useState<CarouselSlide[]>([]);
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
      const response = await apiGet<ListResponse<CarouselSlide>>("/api/carousel-slides");
      setItems(response.data);
    } catch (error) {
      setMessage({
        tone: "error",
        text: error instanceof ApiError ? error.message : "Failed to load slides",
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
        await apiPatch(`/api/carousel-slides/${editingId}`, payload);
        setMessage({ tone: "success", text: "Slide updated." });
      } else {
        await apiPost("/api/carousel-slides", payload);
        setMessage({ tone: "success", text: "Slide created." });
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
    if (!confirm("Delete this slide?")) {
      return;
    }
    try {
      await apiDelete(`/api/carousel-slides/${id}`);
      if (editingId === id) {
        resetForm();
      }
      await load();
      setMessage({ tone: "success", text: "Slide deleted." });
    } catch (error) {
      setMessage({
        tone: "error",
        text: error instanceof ApiError ? error.message : "Delete failed",
      });
    }
  }

  function startEdit(item: CarouselSlide) {
    setEditingId(item.id);
    setForm(toForm(item));
  }

  function copyId(id: string) {
    void navigator.clipboard.writeText(id);
    setMessage({ tone: "success", text: "Slide ID copied to clipboard." });
  }

  return (
    <AdminShell
      title="Carousel slides"
      description="Create slides here, then paste their IDs into a carousal."
    >
      {message ? <Alert tone={message.tone}>{message.text}</Alert> : null}

      <Card
        title={editingId ? "Edit slide" : "New slide"}
        action={
          editingId ? (
            <Button variant="ghost" onClick={resetForm}>Cancel edit</Button>
          ) : null
        }
      >
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <Field label="Title">
            <Input
              required
              value={form.title}
              onChange={(event) =>
                setForm((current) => ({ ...current, title: event.target.value }))
              }
            />
          </Field>
          <Field label="Order">
            <Input
              type="number"
              required
              value={form.order}
              onChange={(event) =>
                setForm((current) => ({ ...current, order: event.target.value }))
              }
            />
          </Field>
          <ImageUrlField
            label="Background image"
            required
            value={form.bgImgUrl}
            onChange={(bgImgUrl) =>
              setForm((current) => ({ ...current, bgImgUrl }))
            }
          />
          <ImageUrlField
            label="Foreground image"
            value={form.imgUrl}
            onChange={(imgUrl) => setForm((current) => ({ ...current, imgUrl }))}
          />
          <Field label="Button link">
            <Input
              value={form.btnHrefLink}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  btnHrefLink: event.target.value,
                }))
              }
            />
          </Field>
          <Field label="Banner link">
            <Input
              value={form.bannerHrefLink}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  bannerHrefLink: event.target.value,
                }))
              }
            />
          </Field>
          <Field label="Text alignment">
            <Select
              value={form.textContainerAlign}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  textContainerAlign: event.target.value,
                }))
              }
            >
              <option value="">Default</option>
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </Select>
          </Field>
          <div className="md:col-span-2">
            <Field label="Description">
              <Textarea
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
              />
            </Field>
          </div>
          <div className="md:col-span-2">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : editingId ? "Update slide" : "Create slide"}
            </Button>
          </div>
        </form>
      </Card>

      <Card title="All slides">
        {loading ? (
          <p className="text-sm text-zinc-500">Loading…</p>
        ) : items.length === 0 ? (
          <EmptyState>No slides yet.</EmptyState>
        ) : (
          <DataTable
            columns={["Order", "Title", "ID", "Actions"]}
            rows={items.map((item) => [
              item.order,
              item.title,
              <code key={`${item.id}-id`} className="text-xs">{item.id}</code>,
              <div key={item.id} className="flex flex-wrap gap-2">
                <Button variant="ghost" onClick={() => copyId(item.id)}>
                  Copy ID
                </Button>
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
