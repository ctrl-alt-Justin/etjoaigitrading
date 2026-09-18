"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  BadgeDollarSign,
  Camera,
  Check,
  CheckCircle2,
  Clock,
  History,
  ImageIcon,
  ImagePlus,
  Loader2,
  PackagePlus,
  PencilLine,
  ShieldCheck,
  Share2,
  Sparkles,
  Tag,
  Trash2,
  TrendingDown,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import type { DbCategory, DbPriceEvent, Grade, ItemPhoto } from "@/db/schema";
import type { EnrichedItem } from "@/lib/queries";
import { agingMarkdown, computeFloor, calculatePricingFormula, DEFAULT_PRICING_CONFIG, GRADE_META, GRADE_ORDER } from "@/lib/valuation";
import { PHOTO_SLOTS, refPhotoFor, REAL_SETUP_PHOTO, SOLD_CHANNELS } from "@/lib/taxonomy-data";
import { cn, fmtMoney, fmtDateFull, normalizeDimensions, relTime, type DimensionUnit } from "@/lib/format";
import { compressImageFile } from "@/lib/image-compress";
import { Field, GradeChip, MarginPill, StatusChip, Thumb } from "./ui";
import { ShareModal, type ShareInfo } from "./share-modal";

/* ------------------------------------------------------------------ */

function PriceSpectrum({
  low, high, floor, benchmark, listed, sold,
}: {
  low?: number | null; high?: number | null; floor?: number | null;
  benchmark?: number | null; listed?: number | null; sold?: number | null;
}) {
  const vals = [low, high, floor, benchmark, listed, sold].filter((x): x is number => x != null && x > 0);
  if (!vals.length) return null;
  const max = Math.max(...vals) * 1.14;
  const x = (v: number) => `${Math.min(98, (v / max) * 100)}%`;

  return (
    <div>
      <div className="relative h-[86px] select-none">
        <div className="absolute inset-x-0 top-[46px] h-1.5 rounded-full bg-stone-100" />
        {low != null && high != null && (
          <div
            className="absolute top-[42px] h-[14px] rounded-md border border-amber-300 bg-amber-100/90"
            style={{ left: x(low), width: `${Math.max(1.5, ((high - low) / max) * 100)}%` }}
            title={`Graded value range ${fmtMoney(low)} – ${fmtMoney(high)}`}
          />
        )}
        {floor != null && floor > 0 && (
          <div className="absolute top-[30px]" style={{ left: x(floor) }} title={`Price floor ${fmtMoney(floor)}`}>
            <div className="h-8 w-[2px] -translate-x-1/2 bg-rose-400" />
            <div className="absolute left-1/2 top-[36px] -translate-x-1/2 whitespace-nowrap text-[10px] font-bold text-rose-500">
              floor {fmtMoney(floor)}
            </div>
          </div>
        )}
        {benchmark != null && (
          <div className="absolute top-[30px]" style={{ left: x(benchmark) }} title={`Market benchmark ${fmtMoney(benchmark)}`}>
            <div className="h-8 w-[2px] -translate-x-1/2 border-l-2 border-dashed border-indigo-400" />
            <div className="absolute left-1/2 top-[-16px] -translate-x-1/2 whitespace-nowrap text-[10px] font-bold text-indigo-500">
              market {fmtMoney(benchmark)}
            </div>
          </div>
        )}
        {listed != null && (
          <div className="absolute top-[38px]" style={{ left: x(listed) }} title={`Current ask ${fmtMoney(listed)}`}>
            <div className="h-5 w-5 -translate-x-1/2 rounded-full border-[3px] border-white bg-stone-900 shadow" />
            <div className="absolute left-1/2 top-[-20px] -translate-x-1/2 whitespace-nowrap rounded-full bg-stone-900 px-2 py-0.5 text-[10px] font-bold text-white">
              ask {fmtMoney(listed)}
            </div>
          </div>
        )}
        {sold != null && (
          <div className="absolute top-[38px]" style={{ left: x(sold) }} title={`Sold at ${fmtMoney(sold)}`}>
            <div className="h-5 w-5 -translate-x-1/2 rounded-full border-[3px] border-white bg-emerald-600 shadow" />
            <div className="absolute left-1/2 top-[-20px] -translate-x-1/2 whitespace-nowrap rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white">
              sold {fmtMoney(sold)}
            </div>
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10.5px] font-medium text-stone-400">
        <span className="flex items-center gap-1"><span className="h-2 w-3 rounded-sm border border-amber-300 bg-amber-100" /> graded range</span>
        <span className="flex items-center gap-1"><span className="h-0.5 w-2.5 bg-rose-400" /> floor</span>
        <span className="flex items-center gap-1"><span className="h-3 w-0 border-l-2 border-dashed border-indigo-400" /> benchmark</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function MoneyModal({
  open, onClose, title, description, submitLabel, defaultValue, withChannel, floor, tone = "accent",
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  submitLabel: string;
  defaultValue?: number | null;
  withChannel?: boolean;
  floor?: number | null;
  tone?: "accent" | "primary" | "emerald";
  onSubmit: (price: number, channel?: string) => Promise<string | null>;
}) {
  const [price, setPrice] = useState(defaultValue ? String(defaultValue) : "");
  const [channel, setChannel] = useState(SOLD_CHANNELS[0]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (!open) return null;
  const num = Number(price) || 0;
  const btnTone = tone === "emerald" ? "bg-emerald-600 hover:bg-emerald-500 text-white" : tone === "primary" ? "btn-primary" : "btn-accent";

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-stone-950/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="card w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-display text-xl font-semibold text-stone-900">{title}</h3>
        {description && <p className="mt-1 text-[12.5px] leading-relaxed text-stone-500">{description}</p>}
        <div className="mt-4">
          <label className="label">Price — ₱</label>
          <input
            autoFocus
            type="number"
            min={0}
            className="input text-lg font-semibold tabular-nums"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>
        {withChannel && (
          <div className="mt-3">
            <label className="label">Sold via</label>
            <select className="input" value={channel} onChange={(e) => setChannel(e.target.value)}>
              {SOLD_CHANNELS.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
        )}
        {floor != null && floor > 0 && num > 0 && num < floor && (
          <div className="mt-3 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] text-rose-700">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> Below enforced floor of {fmtMoney(floor)}.
          </div>
        )}
        {err && (
          <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] text-rose-700">{err}</div>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="btn-ghost">Cancel</button>
          <button
            disabled={busy || num <= 0}
            className={cn("inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition disabled:opacity-50", btnTone)}
            onClick={async () => {
              setBusy(true);
              const e = await onSubmit(num, withChannel ? channel : undefined);
              setBusy(false);
              if (e) setErr(e);
              else onClose();
            }}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function ListForSaleModal({
  open,
  onClose,
  item,
  defaultValue,
  floor,
  description,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  item: EnrichedItem;
  defaultValue?: number | null;
  floor?: number | null;
  description?: string;
  onSubmit: (price: number, previewPhotoUrl?: string) => Promise<string | null>;
}) {
  const candidatePhotos = useMemo(() => {
    const list: { url: string; label: string; slot?: string; isAfter?: boolean }[] = [];
    const seen = new Set<string>();

    (item.photos ?? []).forEach((p, idx) => {
      if (p.url && !seen.has(p.url)) {
        seen.add(p.url);
        const isAfter = p.slot === "after" || (p.label && p.label.toLowerCase().includes("after")) || false;
        list.push({
          url: p.url,
          label: p.label || (isAfter ? "After cleaning" : `Photo ${idx + 1}`),
          slot: p.slot,
          isAfter,
        });
      }
    });

    const attrAfter = (item.attributes as Record<string, unknown> | null)?.after_cleaning_photo_url;
    if (attrAfter && typeof attrAfter === "string" && !seen.has(attrAfter)) {
      seen.add(attrAfter);
      list.push({
        url: attrAfter,
        label: "After cleaning",
        slot: "after",
        isAfter: true,
      });
    }

    return list;
  }, [item.photos, item.attributes]);

  const initialPhoto = useMemo(() => {
    const previewAttr = (item.attributes as Record<string, unknown> | null)?.preview_photo_url;
    if (previewAttr && typeof previewAttr === "string" && candidatePhotos.some((c) => c.url === previewAttr)) {
      return previewAttr;
    }
    const after = candidatePhotos.find((c) => c.isAfter);
    if (after) return after.url;
    return candidatePhotos[0]?.url ?? "";
  }, [candidatePhotos, item.attributes]);

  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState<string>(initialPhoto);
  const [price, setPrice] = useState(defaultValue ? String(defaultValue) : "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setSelectedPhotoUrl(initialPhoto);
      setPrice(defaultValue ? String(defaultValue) : "");
      setErr(null);
    }
  }, [open, initialPhoto, defaultValue]);

  if (!open) return null;
  const num = Number(price) || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="card w-full max-w-lg overflow-hidden p-5 sm:p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-2.5 py-0.5 text-[11px] font-bold text-accent">
              <Tag className="h-3 w-3" /> List Item for Sale
            </div>
            <h3 className="mt-1.5 font-display text-xl font-semibold text-stone-900">List for sale</h3>
            {description && <p className="mt-1 text-[12px] leading-relaxed text-stone-500">{description}</p>}
          </div>
          <button onClick={onClose} className="btn-ghost px-2.5 py-1 text-xs">Cancel</button>
        </div>

        {/* Preview Photo Picker */}
        <div className="mt-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-stone-700">
              Select Listing Preview Photo
            </label>
            {candidatePhotos.length > 0 && (
              <span className="text-[11px] font-medium text-stone-400">
                {candidatePhotos.length} {candidatePhotos.length === 1 ? "photo" : "photos"} available
              </span>
            )}
          </div>
          <p className="mt-0.5 text-[11.5px] text-stone-500">
            Choose which uploaded photo or after-cleaning photo will be displayed as the main preview card for buyers.
          </p>

          {candidatePhotos.length === 0 ? (
            <div className="mt-2.5 flex items-center gap-2 rounded-xl border border-dashed border-stone-300 bg-stone-50 p-3 text-xs text-stone-500">
              <Camera className="h-4 w-4 text-stone-400 shrink-0" />
              <span>No photos uploaded for this item yet. You can list now, or add photos via Edit Item.</span>
            </div>
          ) : (
            <div className="mt-2.5 grid grid-cols-3 sm:grid-cols-4 gap-2.5 max-h-52 overflow-y-auto p-1.5 rounded-xl border border-stone-200/80 bg-stone-50/70">
              {candidatePhotos.map((p) => {
                const isSelected = selectedPhotoUrl === p.url;
                return (
                  <button
                    key={p.url}
                    type="button"
                    onClick={() => setSelectedPhotoUrl(p.url)}
                    className={cn(
                      "group relative aspect-square w-full overflow-hidden rounded-xl border-2 transition text-left focus:outline-none",
                      isSelected
                        ? "border-emerald-500 ring-2 ring-emerald-500/30 shadow-md"
                        : "border-stone-200 hover:border-stone-400 opacity-75 hover:opacity-100"
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.url} alt={p.label} className="h-full w-full object-cover" />

                    {/* Selection Checkmark */}
                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white shadow">
                        <Check className="h-3 w-3 stroke-[3]" />
                      </div>
                    )}

                    {/* After badge */}
                    {p.isAfter && (
                      <span className="absolute top-1.5 left-1.5 rounded bg-emerald-600 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white shadow">
                        After
                      </span>
                    )}

                    {/* Bottom Label */}
                    <div
                      className={cn(
                        "absolute inset-x-0 bottom-0 px-1 py-0.5 text-center text-[10px] font-medium truncate",
                        isSelected
                          ? "bg-emerald-700/90 text-white font-semibold"
                          : "bg-stone-900/60 text-white backdrop-blur-[2px]"
                      )}
                    >
                      {isSelected ? "Preview Cover" : p.label}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Price Input */}
        <div className="mt-4">
          <label className="label">Live Ask Price — ₱</label>
          <input
            autoFocus
            type="number"
            min={0}
            className="input text-lg font-semibold tabular-nums"
            placeholder="0.00"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>

        {floor != null && floor > 0 && num > 0 && num < floor && (
          <div className="mt-3 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] text-rose-700">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> Below enforced floor of {fmtMoney(floor)}.
          </div>
        )}

        {err && (
          <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] text-rose-700">
            {err}
          </div>
        )}

        {/* Actions */}
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="btn-ghost">Cancel</button>
          <button
            disabled={busy || num <= 0}
            className="btn-accent inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition disabled:opacity-50"
            onClick={async () => {
              setBusy(true);
              const e = await onSubmit(num, selectedPhotoUrl || undefined);
              setBusy(false);
              if (e) setErr(e);
              else onClose();
            }}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Tag className="h-4 w-4" />}
            Confirm &amp; Go Live
          </button>
        </div>
      </div>
    </div>
  );
}

function parseInitialDims(raw?: string | null): { l: string; w: string; h: string; unit: DimensionUnit } {
  if (!raw) return { l: "", w: "", h: "", unit: "cm" };
  const trimmed = raw.trim();
  let unit: DimensionUnit = "cm";
  const unitMatch = trimmed.match(/(mm|cm|inch|in|meters|m)$/i);
  if (unitMatch) {
    const matched = unitMatch[1].toLowerCase();
    unit = matched === "inch" ? "in" : matched === "meters" ? "m" : (matched as DimensionUnit);
  }
  const numbers = trimmed.match(/\d+(?:\.\d+)?/g);
  return {
    l: numbers?.[0] ?? "",
    w: numbers?.[1] ?? "",
    h: numbers?.[2] ?? "",
    unit,
  };
}

function AfterPhotoModal({
  open,
  item,
  onClose,
  onSuccess,
}: {
  open: boolean;
  item: EnrichedItem;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(() => {
    const existingAfter = item.photos?.find((p) => p.slot === "after");
    return existingAfter?.url ?? null;
  });
  const [timestamp, setTimestamp] = useState<string | null>(() => {
    const existingAfter = item.photos?.find((p) => p.slot === "after");
    return existingAfter?.timestamp ?? null;
  });
  const [cleaningNotes, setCleaningNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (file: File | undefined) => {
    if (!file) return;
    const now = new Date();
    const timeStr = now.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    try {
      const dataUrl = await compressImageFile(file);
      setPhotoUrl(dataUrl);
      setTimestamp(timeStr);
    } catch {
      const reader = new FileReader();
      reader.onload = () => {
        setPhotoUrl(String(reader.result));
        setTimestamp(timeStr);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!photoUrl) {
      setError("Please capture or upload the After-cleaning photo before completing cleaning.");
      return;
    }
    setBusy(true);
    setError(null);

    const afterPhoto: ItemPhoto = {
      slot: "after",
      label: "After cleaning",
      url: photoUrl,
      timestamp: timestamp ?? new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true }),
    };

    const existingPhotos = (item.photos ?? []).filter((p) => p.slot !== "after");
    const updatedPhotos = [...existingPhotos, afterPhoto];

    const noteAddition = cleaningNotes.trim()
      ? (item.conditionNotes ? `${item.conditionNotes} · Cleaned: ${cleaningNotes.trim()}` : `Cleaned: ${cleaningNotes.trim()}`)
      : item.conditionNotes;

    const res = await fetch(`/api/items/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "edit",
        status: "in_stock",
        photos: updatedPhotos,
        conditionNotes: noteAddition,
      }),
    });

    const data = await res.json().catch(() => ({}));
    setBusy(false);

    if (!res.ok) {
      setError(data.message ?? data.error ?? "Failed to update item status");
      return;
    }

    onSuccess();
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="card w-full max-w-lg overflow-hidden p-5 sm:p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
              <Sparkles className="h-3 w-3" /> Cleaning Completion
            </div>
            <h3 className="mt-1.5 font-display text-xl font-semibold text-stone-900">Mark cleaned → Move to stock</h3>
            <p className="mt-1 text-[12.5px] leading-relaxed text-stone-500">
              Please upload or capture the <strong>After cleaning</strong> photo to document the restored condition before moving this unit to active stock.
            </p>
          </div>
          <button onClick={onClose} className="btn-ghost px-2.5 py-1 text-xs">Cancel</button>
        </div>

        {/* Photo Upload Area */}
        <div className="mt-4">
          <label className="label flex items-center justify-between">
            <span className="flex items-center gap-1 font-bold text-stone-800">
              After-Cleaning Photo <span className="text-rose-500 font-bold">*</span>
            </span>
            {timestamp && <span className="text-[10.5px] font-normal text-stone-400">Captured: {timestamp}</span>}
          </label>

          {photoUrl ? (
            <div className="relative overflow-hidden rounded-xl border border-stone-200 bg-stone-50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photoUrl} alt="After cleaning" className="aspect-[16/10] w-full object-cover" />
              <div className="absolute bottom-3 right-3 flex items-center gap-2">
                <label className="btn-soft h-8 cursor-pointer rounded-lg bg-stone-950/80 px-3 text-xs font-semibold text-white backdrop-blur hover:bg-stone-950">
                  <Camera className="h-3.5 w-3.5" /> Retake / Change
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      handleUpload(e.target.files?.[0]);
                      e.currentTarget.value = "";
                    }}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setPhotoUrl(null);
                    setTimestamp(null);
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-600 text-white transition hover:bg-rose-500"
                  title="Remove photo"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <label className="flex aspect-[16/10] w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50/30 p-6 text-center transition hover:border-emerald-500 hover:bg-emerald-50/60">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-emerald-200">
                <Camera className="h-6 w-6 text-emerald-600" />
              </div>
              <span className="mt-3 text-sm font-bold text-stone-800">Upload or Capture After Photo</span>
              <span className="mt-1 text-xs text-stone-500">Show the cleaned, restored unit in good lighting</span>
              <span className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm">
                <ImagePlus className="h-3.5 w-3.5" /> Choose file / camera
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  handleUpload(e.target.files?.[0]);
                  e.currentTarget.value = "";
                }}
              />
            </label>
          )}
        </div>

        {/* Cleaning notes */}
        <div className="mt-4">
          <label className="label">Cleaning &amp; restoration notes <span className="font-normal text-stone-400">(optional)</span></label>
          <input
            type="text"
            className="input text-xs"
            placeholder="e.g. Ultrasonic foam wash, leather conditioned, sanitized wheels"
            value={cleaningNotes}
            onChange={(e) => setCleaningNotes(e.target.value)}
          />
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
            <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
          </div>
        )}

        <div className="mt-5 flex items-center justify-end gap-2.5">
          <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={busy || !photoUrl}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Confirm Cleaned → Move to Stock
          </button>
        </div>
      </div>
    </div>
  );
}

function EditItemModal({
  item,
  categories,
  open,
  onClose,
  onSaved,
}: {
  item: EnrichedItem;
  categories: DbCategory[];
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const initialDims = useMemo(() => parseInitialDims(item.dimensions), [item.dimensions]);
  const [dimL, setDimL] = useState(initialDims.l);
  const [dimW, setDimW] = useState(initialDims.w);
  const [dimH, setDimH] = useState(initialDims.h);
  const [dimensionUnit, setDimensionUnit] = useState<DimensionUnit>(initialDims.unit);

  const [form, setForm] = useState({
    name: item.name,
    brand: item.brand ?? "",
    model: item.model ?? "",
    color: item.color ?? "",
    material: item.material ?? "",
    dimensions: item.dimensions ?? "",
    grade: item.grade ?? "",
    status: item.status,
    conditionNotes: item.conditionNotes ?? "",
    acquisitionCost: String(item.acquisitionCost),
    refurbCost: String(item.refurbCost),
    benchmarkPrice: item.benchmarkPrice == null ? "" : String(item.benchmarkPrice),
    listedPrice: item.listedPrice == null ? "" : String(item.listedPrice),
    location: item.location ?? "",
    categoryId: item.categoryId == null ? "" : String(item.categoryId),
  });
  const [checklist, setChecklist] = useState(item.checklist ?? []);

  // Map each standard slot to its photo if present
  const [slotPhotos, setSlotPhotos] = useState<Record<string, ItemPhoto | null>>(() => {
    const map: Record<string, ItemPhoto | null> = {};
    const photos = item.photos ?? [];
    for (const s of PHOTO_SLOTS) {
      const found = photos.find((p) => p.slot === s.slot);
      map[s.slot] = found ?? null;
    }
    return map;
  });

  // Any non-standard extra photos / walkaround videos
  const [extraPhotos, setExtraPhotos] = useState<ItemPhoto[]>(() => {
    const standardSlots = new Set<string>(PHOTO_SLOTS.map((s) => s.slot));
    return (item.photos ?? []).filter((p) => !standardSlots.has(p.slot));
  });

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = (key: string, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const updateDims = (l: string, w: string, h: string, u: DimensionUnit) => {
    setDimL(l);
    setDimW(w);
    setDimH(h);
    setDimensionUnit(u);
    if (l.trim() && w.trim() && h.trim()) {
      update("dimensions", `L ${l.trim()} × W ${w.trim()} × H ${h.trim()} ${u}`);
    } else if (l.trim() || w.trim() || h.trim()) {
      update("dimensions", [l.trim(), w.trim(), h.trim()].filter(Boolean).join(" x "));
    } else {
      update("dimensions", "");
    }
  };

  const editFloor = computeFloor(Number(form.acquisitionCost) || 0, Number(form.refurbCost) || 0);
  const acqNum = Number(form.acquisitionCost) || 0;
  const refurbNum = Number(form.refurbCost) || 0;
  const bmNum = Number(form.benchmarkPrice) || 0;

  const formulaResult = useMemo(() => {
    return calculatePricingFormula({
      acquisitionCost: acqNum,
      refurbCost: refurbNum,
      cleaningCost: 0,
      brandNewPrice: bmNum,
      selectedGrade: (form.grade as Grade) || null,
    });
  }, [acqNum, refurbNum, bmNum, form.grade]);

  const priceSuggestions: { label: string; value: number }[] = [];
  if (editFloor > 0) {
    priceSuggestions.push({ label: "Floor", value: editFloor });
  }
  if (formulaResult.targetPrice > 0) {
    priceSuggestions.push({ label: "Cost Target (1.40×)", value: formulaResult.targetPrice });
  }
  if (formulaResult.maxA > 0) {
    priceSuggestions.push({ label: "MaxA Cap (35% gap)", value: formulaResult.maxA });
  }
  if (form.grade && formulaResult.recommendedGradeRow) {
    priceSuggestions.push({
      label: `Grade ${form.grade} Cap`,
      value: formulaResult.recommendedGradeRow.maxAllowedCap,
    });
  }
  if (bmNum > 0) {
    priceSuggestions.push({ label: "Retail Benchmark", value: bmNum });
  }

  // Missing fields checking for items tagged with "Information required"
  const missingInfoList = useMemo(() => {
    const list: { key: string; label: string; desc: string }[] = [];
    if (!form.name.trim() || form.name.toLowerCase() === "information required") {
      list.push({ key: "name", label: "Item Name", desc: "Product title / model description" });
    }
    if (!form.categoryId) {
      list.push({ key: "category", label: "Category", desc: "Select taxonomy branch" });
    }
    if (!dimL.trim() || !dimW.trim() || !dimH.trim()) {
      list.push({ key: "dimensions", label: "Dimensions", desc: "L × W × H measurements" });
    }
    if (!form.grade) {
      list.push({ key: "grade", label: "Condition Grade", desc: "Grade A, B, or C" });
    }
    if (!Number(form.acquisitionCost) || Number(form.acquisitionCost) <= 0) {
      list.push({ key: "cost", label: "Acquisition Cost", desc: "Cost paid to buy unit" });
    }
    if (!slotPhotos["front"]?.url) {
      list.push({ key: "photo_front", label: "Front Photo", desc: "Clear front overview" });
    }
    if (!slotPhotos["back"]?.url) {
      list.push({ key: "photo_back", label: "Back Photo", desc: "Rear / reverse view" });
    }
    if (!checklist.length) {
      list.push({ key: "checklist", label: "Inspection Checklist", desc: "At least one check recorded" });
    }
    return list;
  }, [form.name, form.categoryId, dimL, dimW, dimH, form.grade, form.acquisitionCost, slotPhotos, checklist]);

  const isMissing = (key: string) => missingInfoList.some((m) => m.key === key);

  const updateSlotPhoto = (slot: string, label: string, url: string, timestamp?: string) => {
    setSlotPhotos((prev) => ({
      ...prev,
      [slot]: { slot, label, url, timestamp },
    }));
  };

  const removeSlotPhoto = (slot: string) => {
    setSlotPhotos((prev) => ({
      ...prev,
      [slot]: null,
    }));
  };

  const handleUploadSlot = async (slot: string, label: string, file: File | undefined) => {
    if (!file) return;
    const now = new Date();
    const timestamp = now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true });
    try {
      const dataUrl = await compressImageFile(file);
      updateSlotPhoto(slot, label, dataUrl, timestamp);
    } catch {
      const reader = new FileReader();
      reader.onload = () => {
        updateSlotPhoto(slot, label, String(reader.result), timestamp);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUseReference = (slot: string, label: string) => {
    const catId = Number(form.categoryId) || item.categoryId;
    const cat = categories.find((c) => c.id === catId);
    const url = slot === "setup" ? REAL_SETUP_PHOTO : refPhotoFor(cat?.slug ?? "");
    const now = new Date();
    const timestamp = now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true });
    updateSlotPhoto(slot, label, url, timestamp);
  };

  const handleAddExtraMedia = async (file: File | undefined) => {
    if (!file) return;
    const now = new Date();
    const timestamp = now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true });
    const isVideo = file.type.startsWith("video/");
    const slotKey = isVideo ? `video-${Date.now()}` : `extra-${Date.now()}`;
    const label = isVideo ? "Walkaround video" : "Extra detail photo";
    try {
      const dataUrl = await compressImageFile(file);
      setExtraPhotos((prev) => [...prev, { slot: slotKey, label, url: dataUrl, timestamp }]);
    } catch {
      const reader = new FileReader();
      reader.onload = () => {
        setExtraPhotos((prev) => [...prev, { slot: slotKey, label, url: String(reader.result), timestamp }]);
      };
      reader.readAsDataURL(file);
    }
  };

  const submit = async () => {
    setBusy(true);
    setError(null);
    const combinedPhotos: ItemPhoto[] = [
      ...PHOTO_SLOTS.map((s) => slotPhotos[s.slot]).filter((p): p is ItemPhoto => Boolean(p && p.url)),
      ...extraPhotos.filter((p) => Boolean(p && p.url)),
    ];
    const res = await fetch(`/api/items/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "edit",
        ...form,
        status: form.status,
        dimensions: normalizeDimensions(form.dimensions, dimensionUnit),
        checklist,
        photos: combinedPhotos,
        categoryId: form.categoryId ? Number(form.categoryId) : null,
        acquisitionCost: Number(form.acquisitionCost),
        refurbCost: Number(form.refurbCost),
        benchmarkPrice: form.benchmarkPrice ? Number(form.benchmarkPrice) : null,
        listedPrice: form.listedPrice ? Number(form.listedPrice) : null,
        grade: form.grade || null,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(data.message ?? data.error ?? "Could not save changes");
      return;
    }
    onSaved();
    onClose();
  };

  const isCleaningItem = item.status === "for_cleaning";

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-stone-950/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="card max-h-[90vh] w-full max-w-3xl overflow-y-auto p-5 sm:p-6" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-display text-xl font-semibold text-stone-900">Edit inventory entry</h3>
            <p className="mt-1 text-[12.5px] text-stone-500">Update the record without changing its price history.</p>
          </div>
          <button onClick={onClose} className="btn-ghost px-3">Close</button>
        </div>

        {/* Emphasize Missing Fields if Tagged with Information Required */}
        {missingInfoList.length > 0 && (
          <div className="mt-4 rounded-2xl border border-rose-300 bg-rose-50/80 p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-rose-900">
                    Information Required — {missingInfoList.length} Missing {missingInfoList.length === 1 ? "Detail" : "Details"}
                  </h4>
                  <span className="rounded-full bg-rose-200/80 px-2 py-0.5 text-[11px] font-bold text-rose-800">
                    Action Needed
                  </span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-rose-700">
                  This item is incomplete or tagged for information required. Fill in the highlighted red fields below to finalize the record:
                </p>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {missingInfoList.map((m) => (
                    <span
                      key={m.key}
                      className="inline-flex items-center gap-1 rounded-md border border-rose-300 bg-white px-2 py-1 text-[11px] font-bold text-rose-800 shadow-xs"
                    >
                      <XCircle className="h-3 w-3 text-rose-500" />
                      <span>{m.label}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {/* Name Field */}
          <label className="sm:col-span-2">
            <div className="flex items-center justify-between">
              <span className="label">Item name</span>
              {isMissing("name") && <span className="text-[10.5px] font-bold text-rose-600">Required — Missing</span>}
            </div>
            <input
              className={cn("input", isMissing("name") && "border-rose-400 bg-rose-50/20 ring-2 ring-rose-200/50")}
              value={form.name}
              onChange={(event) => update("name", event.target.value)}
              placeholder="e.g. Herman Miller Aeron Chair"
            />
          </label>

          {/* Brand */}
          <label>
            <span className="label">Brand</span>
            <input className="input" value={form.brand} onChange={(event) => update("brand", event.target.value)} />
          </label>

          {/* Model */}
          <label>
            <span className="label">Model</span>
            <input className="input" value={form.model} onChange={(event) => update("model", event.target.value)} />
          </label>

          {/* Color */}
          <label>
            <span className="label">Color</span>
            <input className="input" value={form.color} onChange={(event) => update("color", event.target.value)} />
          </label>

          {/* Material */}
          <label>
            <span className="label">Material</span>
            <input className="input" value={form.material} onChange={(event) => update("material", event.target.value)} />
          </label>

          {/* Location */}
          <label>
            <span className="label">Location</span>
            <input className="input" value={form.location} onChange={(event) => update("location", event.target.value)} />
          </label>

          {/* Category */}
          <label>
            <div className="flex items-center justify-between">
              <span className="label">Category</span>
              {isMissing("category") && <span className="text-[10.5px] font-bold text-rose-600">Required — Missing</span>}
            </div>
            <select
              className={cn("input", isMissing("category") && "border-rose-400 bg-rose-50/20 ring-2 ring-rose-200/50")}
              value={form.categoryId}
              onChange={(event) => update("categoryId", event.target.value)}
            >
              <option value="">Uncategorized</option>
              {categories
                .filter((category) => category.parentId != null)
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
            </select>
          </label>

          {/* Dimensions */}
          <div className="sm:col-span-2">
            <div className="flex items-center justify-between">
              <span className="label">Dimensions</span>
              {isMissing("dimensions") && <span className="text-[10.5px] font-bold text-rose-600">Required — Missing</span>}
            </div>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  className={cn("input text-center font-medium", isMissing("dimensions") && !dimL.trim() && "border-rose-400 bg-rose-50/20 ring-2 ring-rose-200/50")}
                  placeholder="L"
                  value={dimL}
                  onChange={(e) => updateDims(e.target.value, dimW, dimH, dimensionUnit)}
                  aria-label="Length"
                />
                <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-stone-400">L</span>
              </div>
              <span className="shrink-0 text-sm font-bold text-stone-400">×</span>
              <div className="relative flex-1">
                <input
                  className={cn("input text-center font-medium", isMissing("dimensions") && !dimW.trim() && "border-rose-400 bg-rose-50/20 ring-2 ring-rose-200/50")}
                  placeholder="W"
                  value={dimW}
                  onChange={(e) => updateDims(dimL, e.target.value, dimH, dimensionUnit)}
                  aria-label="Width"
                />
                <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-stone-400">W</span>
              </div>
              <span className="shrink-0 text-sm font-bold text-stone-400">×</span>
              <div className="relative flex-1">
                <input
                  className={cn("input text-center font-medium", isMissing("dimensions") && !dimH.trim() && "border-rose-400 bg-rose-50/20 ring-2 ring-rose-200/50")}
                  placeholder="H"
                  value={dimH}
                  onChange={(e) => updateDims(dimL, dimW, e.target.value, dimensionUnit)}
                  aria-label="Height"
                />
                <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-stone-400">H</span>
              </div>
              <select
                className="input"
                style={{ width: "92px", minWidth: "92px", flex: "0 0 92px" }}
                value={dimensionUnit}
                onChange={(e) => updateDims(dimL, dimW, dimH, e.target.value as DimensionUnit)}
                aria-label="Dimension unit"
              >
                <option value="cm">cm</option>
                <option value="mm">mm</option>
                <option value="in">inch</option>
                <option value="m">meters</option>
              </select>
            </div>
            <p className="mt-1 text-[11px] text-stone-400">Unit: {dimensionUnit === "cm" ? "centimeters" : dimensionUnit === "mm" ? "millimeters" : dimensionUnit === "in" ? "inches" : "meters"}</p>
          </div>

          {/* Product status */}
          <label>
            <span className="label">Product status</span>
            <select className="input" value={form.status} onChange={(event) => update("status", event.target.value)}>
              <option value="draft">Information required (Draft)</option>
              <option value="intake">Intake</option>
              <option value="for_cleaning">For cleaning</option>
              <option value="for_refurb">For cleaning &amp; refurbishing</option>
              <option value="in_stock">In stock</option>
              <option value="listed" disabled={isCleaningItem}>
                {isCleaningItem ? "Listed (Disabled: Cleaning required first)" : "Listed"}
              </option>
              <option value="reserved">Reserved</option>
            </select>
          </label>

          {/* Condition grade */}
          <div className="sm:col-span-2">
            <div className="flex items-center justify-between">
              <span className="label">Condition grade</span>
              {isMissing("grade") && <span className="text-[10.5px] font-bold text-rose-600">Required — Missing</span>}
            </div>
            <div className={cn("grid grid-cols-4 gap-2 rounded-xl p-1", isMissing("grade") && "border border-dashed border-rose-300 bg-rose-50/20")}>
              {GRADE_ORDER.map((grade) => {
                const active = form.grade === grade;
                const meta = GRADE_META[grade];
                return (
                  <button
                    key={grade}
                    type="button"
                    onClick={() => update("grade", active ? "" : grade)}
                    className={cn(
                      "rounded-xl border px-2 py-2 text-left transition",
                      active
                        ? "border-amber-500 bg-amber-50 ring-2 ring-amber-500/30"
                        : "border-[var(--line)] bg-white hover:border-amber-300"
                    )}
                  >
                    <span className={cn("chip", meta.chip)}>{grade}</span>
                    <span className="mt-1 block truncate text-[10px] font-semibold text-stone-600">{meta.tagline}</span>
                  </button>
                );
              })}
            </div>
            <p className="mt-1.5 text-[11px] text-stone-400">Select a grade to update the inspection record, or click the selected grade again to clear it.</p>
          </div>

          {/* Acquisition cost */}
          <label>
            <div className="flex items-center justify-between">
              <span className="label">Acquisition cost — ₱</span>
              {isMissing("cost") && <span className="text-[10.5px] font-bold text-rose-600">Required — Missing</span>}
            </div>
            <input
              className={cn("input", isMissing("cost") && "border-rose-400 bg-rose-50/20 ring-2 ring-rose-200/50")}
              type="number"
              min={0}
              value={form.acquisitionCost}
              onChange={(event) => update("acquisitionCost", event.target.value)}
            />
          </label>

          {/* Refurb cost */}
          <label>
            <span className="label">Refurb cost — ₱</span>
            <input className="input" type="number" min={0} value={form.refurbCost} onChange={(event) => update("refurbCost", event.target.value)} />
          </label>

          {/* Benchmark Price (Brand New Retail Benchmark) */}
          <label>
            <span className="label">Brand New Benchmark — ₱</span>
            <input
              className="input"
              type="number"
              min={0}
              value={form.benchmarkPrice}
              onChange={(event) => update("benchmarkPrice", event.target.value)}
              placeholder="e.g. 50000"
            />
          </label>

          {/* Listed price */}
          <label>
            <span className="label">Listed price — ₱</span>
            <input
              className="input"
              type="number"
              min={0}
              value={form.listedPrice}
              onChange={(event) => update("listedPrice", event.target.value)}
              placeholder="Not listed"
            />
          </label>

          {/* Condition notes */}
          <label className="sm:col-span-2">
            <span className="label">Condition notes</span>
            <textarea className="input" value={form.conditionNotes} onChange={(event) => update("conditionNotes", event.target.value)} />
          </label>
        </div>

        {/* Pricing Formula Suggestions */}
        <div className="mt-4 rounded-xl bg-amber-50/60 p-3.5">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-amber-900">Official Pricing Formula Suggestions</span>
            <span className="text-xs font-semibold text-rose-600">Floor {fmtMoney(editFloor)}</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {priceSuggestions.length === 0 ? (
              <span className="text-xs text-stone-500">Add costs and benchmark to compute formula suggestions.</span>
            ) : (
              priceSuggestions.map((suggestion) => (
                <button
                  key={suggestion.label}
                  type="button"
                  onClick={() => update("listedPrice", String(suggestion.value))}
                  className="rounded-lg border border-amber-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-amber-900 transition hover:border-amber-400 hover:bg-amber-50"
                >
                  {suggestion.label} · {fmtMoney(suggestion.value)}
                </button>
              ))
            )}
          </div>
        </div>

        <div className="mt-5 border-t border-stone-100 pt-4">
          <div className="flex items-center justify-between">
            <div className="label">Inspection checklist</div>
            {isMissing("checklist") && <span className="text-[10.5px] font-bold text-rose-600">Required — Missing</span>}
          </div>
          {checklist.length === 0 ? (
            <p className="rounded-xl border border-dashed border-[var(--line)] bg-stone-50 px-3 py-3 text-xs text-stone-500">No inspection checklist was recorded for this item.</p>
          ) : (
            <div className="space-y-2">
              {checklist.map((entry, index) => (
                <div key={entry.key} className="flex flex-wrap items-center gap-2 rounded-xl border border-stone-100 bg-stone-50/60 px-3 py-2.5">
                  <span className="min-w-0 flex-1 text-[13px] text-stone-700">{entry.label}</span>
                  <div className="flex overflow-hidden rounded-lg border border-stone-200 bg-white">
                    {(["pass", "flag", "fail"] as const).map((status) => (
                      <button key={status} type="button" onClick={() => setChecklist((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, status } : item))} className={cn("px-2.5 py-1.5 text-[11px] font-semibold capitalize", entry.status === status ? status === "pass" ? "bg-emerald-600 text-white" : status === "flag" ? "bg-amber-500 text-white" : "bg-rose-600 text-white" : "text-stone-400 hover:bg-stone-50")}>{status}</button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Media editing per slot */}
        <div className="mt-6 border-t border-stone-100 pt-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="label mb-0 text-sm font-bold text-stone-800">Media & Photography by Slot</div>
              <p className="mt-0.5 text-[12px] text-stone-500">
                Edit media per slot: front &amp; reverse views, wears &amp; defects, styled setup preview, after condition, and serial labels.
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {PHOTO_SLOTS.map((s) => {
              const photo = slotPhotos[s.slot];
              const isRequiredSlotMissing = s.required && !photo;

              return (
                <div
                  key={s.slot}
                  className={cn(
                    "relative flex flex-col justify-between overflow-hidden rounded-xl border transition-all",
                    photo
                      ? "border-stone-200 bg-white shadow-sm"
                      : isRequiredSlotMissing
                      ? "border-2 border-dashed border-rose-400 bg-rose-50/30 ring-2 ring-rose-200/50"
                      : "border-dashed border-stone-300 bg-stone-50/70"
                  )}
                >
                  {/* Slot Header */}
                  <div className={cn("flex items-center justify-between border-b px-3 py-1.5 text-[11px]", isRequiredSlotMissing ? "border-rose-200 bg-rose-100/60" : "border-stone-100 bg-stone-50/90")}>
                    <span className="font-bold text-stone-800 flex items-center gap-1">
                      {s.label}
                      {s.required ? (
                        <span className="text-rose-500 font-bold">*</span>
                      ) : (
                        <span className="text-stone-400 font-normal text-[10px]">(optional)</span>
                      )}
                    </span>
                    {isRequiredSlotMissing ? (
                      <span className="rounded bg-rose-200 px-1 text-[9.5px] font-bold text-rose-800">Required Missing</span>
                    ) : (
                      <span className="text-[9.5px] font-semibold text-stone-400 uppercase tracking-wider">
                        {s.slot}
                      </span>
                    )}
                  </div>

                  {photo ? (
                    <div className="p-2.5">
                      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-stone-100">
                        {photo.url.startsWith("data:video/") ? (
                          <video src={photo.url} controls className="h-full w-full object-cover" />
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={photo.url}
                            alt={s.label}
                            className="h-full w-full object-cover"
                          />
                        )}

                        {/* Timestamp */}
                        {photo.timestamp && (
                          <div className="absolute left-1.5 top-1.5 flex items-center gap-1 rounded-full bg-black/70 px-2 py-0.5 text-[9px] font-medium text-white backdrop-blur">
                            <Clock className="h-2.5 w-2.5 text-amber-400" />
                            {photo.timestamp}
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="mt-2 flex items-center gap-1.5">
                        <label
                          className="btn-soft h-7 flex-1 cursor-pointer justify-center text-[11px] font-semibold"
                          title={`Change ${s.label}`}
                        >
                          <Camera className="h-3 w-3" />
                          <span>Change</span>
                          <input
                            type="file"
                            accept="image/*,video/*"
                            className="hidden"
                            onChange={(e) => {
                              handleUploadSlot(s.slot, s.label, e.target.files?.[0]);
                              e.currentTarget.value = "";
                            }}
                          />
                        </label>

                        <button
                          type="button"
                          onClick={() => handleUseReference(s.slot, s.label)}
                          className="btn-ghost h-7 px-2 text-[10.5px] text-[#1D5D8B]"
                          title="Reset to reference photo"
                        >
                          Ref
                        </button>

                        <button
                          type="button"
                          onClick={() => removeSlotPhoto(s.slot)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition"
                          title={`Delete ${s.label}`}
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-1 flex-col items-center justify-center p-4 text-center min-h-[140px]">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-stone-400 shadow-sm mb-1">
                        <Camera className="h-4 w-4" />
                      </div>
                      <p className="text-[10.5px] leading-tight text-stone-400 line-clamp-2 px-1 mb-2">
                        {s.hint}
                      </p>
                      <div className="flex items-center gap-1.5">
                        <label className="btn-soft h-7 cursor-pointer px-2.5 text-[11px] font-semibold">
                          <ImagePlus className="h-3 w-3" />
                          <span>Upload</span>
                          <input
                            type="file"
                            accept="image/*,video/*"
                            className="hidden"
                            onChange={(e) => {
                              handleUploadSlot(s.slot, s.label, e.target.files?.[0]);
                              e.currentTarget.value = "";
                            }}
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => handleUseReference(s.slot, s.label)}
                          className="btn-ghost h-7 px-2 text-[10.5px] text-[#1D5D8B]"
                          title="Use standard reference photo"
                        >
                          Ref
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Additional Media & Videos (Extra defect shots, walkarounds) */}
          <div className="mt-4 rounded-xl border border-stone-200 bg-stone-50/60 p-3.5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[12px] font-bold text-stone-700">Additional Media &amp; Videos</span>
                <p className="text-[11px] text-stone-400">Add extra defect angles, alternate styling views, or walkaround videos</p>
              </div>
              <label className="btn-ghost h-7 cursor-pointer text-[11.5px] font-semibold text-stone-700">
                <ImagePlus className="h-3.5 w-3.5" />
                <span>+ Add extra media</span>
                <input
                  type="file"
                  accept="image/*,video/*"
                  className="hidden"
                  onChange={(e) => {
                    handleAddExtraMedia(e.target.files?.[0]);
                    e.currentTarget.value = "";
                  }}
                />
              </label>
            </div>

            {extraPhotos.length > 0 ? (
              <div className="mt-2.5 grid grid-cols-2 sm:grid-cols-4 gap-2">
                {extraPhotos.map((p, idx) => (
                  <div key={p.slot || idx} className="relative aspect-[4/3] rounded-lg overflow-hidden border border-stone-200 bg-white">
                    {p.url.startsWith("data:video/") ? (
                      <video src={p.url} controls className="h-full w-full object-cover" />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.url} alt={p.label} className="h-full w-full object-cover" />
                    )}
                    <button
                      type="button"
                      onClick={() => setExtraPhotos((prev) => prev.filter((_, i) => i !== idx))}
                      className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-stone-900/70 text-white hover:bg-rose-600 transition"
                      title="Remove extra media"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                    <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[9px] font-medium text-white truncate max-w-[80%]">
                      {p.label || `Extra ${idx + 1}`}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-1 text-[11px] text-stone-400 italic">No additional media uploaded.</p>
            )}
          </div>
        </div>
        {error && <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] text-rose-700">{error}</div>}
        <div className="mt-5 flex justify-end gap-2"><button onClick={onClose} className="btn-ghost">Cancel</button><button onClick={submit} disabled={busy} className="btn-primary">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Save changes</button></div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

const EVENT_META: Record<string, { icon: LucideIcon; label: string; tone: string }> = {
  intake: { icon: PackagePlus, label: "Intake", tone: "bg-violet-100 text-violet-600" },
  listed: { icon: Tag, label: "Listed", tone: "bg-amber-100 text-amber-700" },
  markdown: { icon: TrendingDown, label: "Markdown", tone: "bg-orange-100 text-orange-600" },
  price_update: { icon: PencilLine, label: "Price updated", tone: "bg-stone-100 text-stone-500" },
  sold: { icon: BadgeDollarSign, label: "Sold", tone: "bg-emerald-100 text-emerald-600" },
};

export function ItemDetail({
  item,
  categories,
  events,
  history,
  share,
}: {
  item: EnrichedItem;
  categories: DbCategory[];
  events: DbPriceEvent[];
  share: ShareInfo | null;
  history: {
    rows: EnrichedItem[];
    comparableCount: number;
    avg: number | null;
    median: number | null;
    min: number | null;
    max: number | null;
    rootMedian: number | null;
    rootCount: number;
  };
}) {
  const router = useRouter();
  const [photo, setPhoto] = useState(0);
  const [modal, setModal] = useState<null | "list" | "sold" | "price">(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [cleanModalOpen, setCleanModalOpen] = useState(false);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const photos = item.photos ?? [];
  const aging = item.status === "listed" && item.daysListed != null
    ? agingMarkdown(item.daysListed, item.listedPrice ?? 0, item.floorPrice)
    : null;

  const listFormula = useMemo(() => {
    return calculatePricingFormula({
      acquisitionCost: item.acquisitionCost ?? 0,
      refurbCost: item.refurbCost ?? 0,
      cleaningCost: 0,
      brandNewPrice: item.benchmarkPrice ?? 0,
      selectedGrade: item.grade,
    });
  }, [item.acquisitionCost, item.refurbCost, item.benchmarkPrice, item.grade]);

  const recommendedListPrice = useMemo(() => {
    if (listFormula.recommendedGradeRow?.maxAllowedCap) {
      return listFormula.recommendedGradeRow.maxAllowedCap;
    }
    if (listFormula.targetPrice > 0) {
      return listFormula.targetPrice;
    }
    return Math.max(item.floorPrice ?? 0, item.benchmarkPrice ?? 0);
  }, [listFormula, item.floorPrice, item.benchmarkPrice]);

  const act = async (body: Record<string, unknown>, after?: () => void) => {
    const res = await fetch(`/api/items/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return data.message ?? data.error ?? "Something went wrong";
    router.refresh();
    after?.();
    return null;
  };

  const simpleAction = async (key: string, body: Record<string, unknown>) => {
    setBusyAction(key);
    await act(body);
    setBusyAction(null);
  };

  const remove = async () => {
    const confirmation = window.prompt(`Type DELETE to permanently remove ${item.sku ?? "this item"}. Price history goes with it.`);
    if (confirmation !== "DELETE") return;
    setBusyAction("delete");
    await fetch(`/api/items/${item.id}`, { method: "DELETE" });
    router.push("/inventory");
    router.refresh();
  };

  const checks = item.checklist ?? [];
  const passN = checks.filter((c) => c.status === "pass").length;
  const flagN = checks.filter((c) => c.status === "flag").length;
  const failN = checks.filter((c) => c.status === "fail").length;
  const profit = item.soldPrice != null ? item.soldPrice - item.effectiveCost : null;
  const isInformationRequired =
    item.status === "draft" ||
    item.name === "Information required" ||
    !item.dimensions?.trim() ||
    !item.grade;

  return (
    <div className="space-y-5">
      {/* header */}
      <div>
        <Link href="/inventory" className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-stone-400 transition hover:text-stone-700">
          <ArrowLeft className="h-3.5 w-3.5" /> Inventory
        </Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-[32px] font-semibold leading-tight tracking-tight text-stone-900">
              {item.name}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="chip border-stone-200 bg-white font-bold text-stone-700">{item.sku ?? "no sku"}</span>
              <GradeChip grade={item.grade} />
              <StatusChip status={item.status} />
              <span className="text-[12px] text-stone-400">{item.categoryPath}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => router.push(`/inventory/new?edit=${item.id}`)} className="btn-ghost"><PencilLine className="h-4 w-4" /> Edit</button>
            {item.status !== "sold" && item.status !== "archived" && (
              <button
                onClick={() => setShareOpen(true)}
                className="btn-ghost relative"
              >
                <Share2 className="h-4 w-4" /> Share
                {share?.active && (
                  <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-amber-500 ring-2 ring-white" />
                )}
              </button>
            )}
            {item.status === "for_cleaning" && (
              <div
                className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-dashed border-amber-300 bg-amber-50/80 px-3 text-xs font-semibold text-amber-800"
                title="Item is currently tagged for cleaning. Cleaning must be completed before listing for sale."
              >
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                <span>Tagged for cleaning · Clean before listing</span>
              </div>
            )}
            {["draft", "intake", "in_stock", "for_refurb", "for_refurbishing", "refurbishing"].includes(item.status) && (
              <button
                onClick={() => setModal("list")}
                className="btn-accent"
              >
                <Tag className="h-4 w-4" /> List for sale
              </button>
            )}
            {item.status === "for_cleaning" && (
              <button onClick={() => setCleanModalOpen(true)} disabled={busyAction != null} className="btn-soft">
                <Sparkles className="h-4 w-4 text-emerald-600" /> Mark cleaned → To stock
              </button>
            )}
            {item.status === "for_refurb" && (
              <button onClick={() => simpleAction("to_cleaning", { action: "edit", status: "for_cleaning" })} disabled={busyAction != null} className="btn-soft">
                <Check className="h-4 w-4 text-teal-600" /> Refurb done → To cleaning
              </button>
            )}
            {item.status === "listed" && (
              <>
                <button onClick={() => setModal("sold")} className="inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-500">
                  <BadgeDollarSign className="h-4 w-4" /> Mark sold
                </button>
                <button onClick={() => setModal("price")} className="btn-ghost">
                  <TrendingDown className="h-4 w-4" /> Adjust price
                </button>
                <button
                  onClick={() => simpleAction("reserve", { action: "reserve" })}
                  disabled={busyAction != null}
                  className="btn-ghost"
                >
                  {busyAction === "reserve" ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Reserve
                </button>
              </>
            )}
            {item.status === "reserved" && (
              <>
                <button onClick={() => setModal("sold")} className="inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-500">
                  <BadgeDollarSign className="h-4 w-4" /> Mark sold
                </button>
                <button onClick={() => simpleAction("release", { action: "release" })} disabled={busyAction != null} className="btn-ghost">
                  Release
                </button>
              </>
            )}
            {item.status === "archived" ? (
              <button onClick={() => simpleAction("restore", { action: "restore" })} disabled={busyAction != null} className="btn-soft">
                Restore to stock
              </button>
            ) : item.status !== "sold" ? (
              <button onClick={() => simpleAction("archive", { action: "archive" })} disabled={busyAction != null} className="btn-ghost text-stone-400">
                Archive
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {editOpen && (
        <EditItemModal item={item} categories={categories} open={editOpen} onClose={() => setEditOpen(false)} onSaved={() => router.refresh()} />
      )}

      <div className="grid gap-5 lg:grid-cols-[1.12fr_1fr]">
        {/* LEFT */}
        <div className="space-y-5">
          {/* gallery */}
          <div className="card overflow-hidden p-3">
            <div className="mb-2 flex items-center justify-between px-1">
              <span className="text-[11.5px] font-bold uppercase tracking-wider text-stone-500">
                Item Photography
              </span>
              <button
                type="button"
                onClick={() => router.push(`/inventory/new?edit=${item.id}`)}
                className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-[#1D5D8B] hover:underline"
              >
                <Camera className="h-3.5 w-3.5" />
                <span>Edit media slots</span>
              </button>
            </div>
            {photos.length ? (
              <>
                <div className="relative overflow-hidden rounded-xl">
                  <Thumb
                    url={photos[Math.min(photo, photos.length - 1)]?.url}
                    alt={item.name}
                    className="aspect-[16/10] w-full"
                  />
                  {photos[Math.min(photo, photos.length - 1)]?.timestamp && (
                    <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5 rounded-full bg-stone-950/75 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur">
                      <Clock className="h-3 w-3 text-amber-400" />
                      {photos[Math.min(photo, photos.length - 1)]?.timestamp}
                    </div>
                  )}
                </div>
                {photos.length > 1 && (
                  <div className="mt-3 grid grid-cols-4 gap-2.5">
                    {photos.map((p, ix) => (
                      <button
                        key={ix}
                        onClick={() => setPhoto(ix)}
                        className={cn(
                          "overflow-hidden rounded-lg border-2 transition",
                          ix === photo ? "border-amber-500" : "border-transparent opacity-70 hover:opacity-100"
                        )}
                      >
                        <Thumb url={p.url} alt={p.label} className="aspect-[4/3] w-full" />
                        <span className="block truncate bg-stone-50 px-1.5 py-1 text-[10px] font-semibold text-stone-500">{p.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <Thumb className="aspect-[16/10] w-full rounded-xl" iconClassName="h-16 w-16" />
            )}
          </div>

          {/* condition */}
          <div className="card p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold text-stone-900">Inspection record</h3>
              {checks.length > 0 && (
                <div className="flex gap-1.5 text-[11px] font-semibold">
                  <span className="chip border-emerald-200 bg-emerald-50 text-emerald-700">{passN} pass</span>
                  {flagN > 0 && <span className="chip border-amber-200 bg-amber-50 text-amber-700">{flagN} flagged</span>}
                  {failN > 0 && <span className="chip border-rose-200 bg-rose-50 text-rose-700">{failN} failed</span>}
                </div>
              )}
            </div>
            {item.conditionNotes && (
              <p className="mt-3 rounded-xl bg-stone-50 px-3.5 py-3 text-[13px] leading-relaxed text-stone-600">
                “{item.conditionNotes}”
              </p>
            )}
            {checks.length > 0 ? (
              <div className="mt-4 grid gap-x-6 gap-y-2 sm:grid-cols-2">
                {checks.map((c) => (
                  <div key={c.key} className="flex items-center gap-2.5 text-[13px] text-stone-600">
                    {c.status === "pass" ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                    ) : c.status === "flag" ? (
                      <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
                    ) : (
                      <XCircle className="h-4 w-4 shrink-0 text-rose-500" />
                    )}
                    {c.label}
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-[13px] text-stone-400">No checklist recorded for this unit.</p>
            )}
          </div>

          {/* details */}
          <div className="card p-5">
            <h3 className="font-display text-lg font-semibold text-stone-900">Specifications</h3>
            <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
              <Field label="Brand">{item.brand ?? "—"}</Field>
              <Field label="Model">{item.model ?? "—"}</Field>
              <Field label="Color">{item.color ?? "—"}</Field>
              <Field label="Material">{item.material ?? "—"}</Field>
              <Field label="Dimensions">
                {item.dimensions ? (
                  <span>
                    {item.dimensions}
                    {!/(cm|mm|inch|in|meters|m)$/i.test(item.dimensions.trim()) && (
                      <span className="ml-1 text-stone-400 font-normal">(cm)</span>
                    )}
                  </span>
                ) : (
                  "—"
                )}
              </Field>
              <Field label="Location">{item.location ?? "—"}</Field>
              <Field label="Supplier">{item.supplierName ?? "Unassigned"}</Field>
              <Field label="Acquired">{fmtDateFull(item.intakeAt)}</Field>
              <Field label="Days in book">{item.daysInStock}</Field>
              {Object.entries(item.attributes ?? {}).map(([k, v]) => (
                <Field key={k} label={k}>{v}</Field>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="space-y-5">
          {/* pricing */}
          <div className="card p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-stone-400">
                  {item.status === "sold" ? "Realized price" : "Current ask"}
                </div>
                <div className="mt-1 font-display text-[34px] font-semibold leading-none tracking-tight text-stone-900 tabular-nums">
                  {item.status === "sold" ? fmtMoney(item.soldPrice) : fmtMoney(item.listedPrice)}
                </div>
              </div>
              {item.status === "sold" ? <MarginPill margin={item.realizedMargin} /> : <MarginPill margin={item.listedMargin} />}
            </div>

            {item.status === "sold" && (
              <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-emerald-50 px-3.5 py-2.5 text-[12.5px] text-emerald-800">
                <BadgeDollarSign className="h-4 w-4" />
                Sold {relTime(item.soldAt)} {item.soldChannel ? `via ${item.soldChannel}` : ""}
                {profit != null && (
                  <span className="ml-auto font-bold tabular-nums">+{fmtMoney(profit)} gross</span>
                )}
              </div>
            )}

            {aging && aging.tier !== "ok" && (
              <div className={cn(
                "mt-3 flex flex-wrap items-center gap-2 rounded-xl px-3.5 py-2.5 text-[12.5px]",
                aging.tier === "critical" ? "bg-rose-50 text-rose-700" : aging.tier === "action" ? "bg-orange-50 text-orange-700" : "bg-amber-50 text-amber-800"
              )}>
                <AlertTriangle className="h-4 w-4 shrink-0" />
                Listed {item.daysListed} days — aging policy suggests −{Math.round(aging.pct * 100)}%
                {aging.suggested != null && (
                  <button
                    onClick={() => simpleAction("markdown", { action: "price", price: aging.suggested })}
                    disabled={busyAction != null}
                    className="ml-auto inline-flex items-center gap-1 rounded-lg bg-white/80 px-2 py-1 font-bold shadow-sm transition hover:bg-white"
                  >
                    {busyAction === "markdown" ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                    Apply {fmtMoney(aging.suggested)}
                  </button>
                )}
              </div>
            )}

            <div className="mt-4 space-y-1.5 text-[13px]">
              {[
                ["Acquisition cost", fmtMoney(item.acquisitionCost)],
                ["Refurb spend", fmtMoney(item.refurbCost || 0)],
                ["Effective cost", fmtMoney(item.effectiveCost)],
              ].map(([l, r]) => (
                <div key={String(l)} className="flex items-center justify-between border-b border-dashed border-stone-100 pb-1.5">
                  <span className="text-stone-500">{l}</span>
                  <span className="font-semibold tabular-nums text-stone-800">{r}</span>
                </div>
              ))}
              <div className="flex items-center justify-between pt-1">
                <span className="flex items-center gap-1.5 text-stone-500">
                  <ShieldCheck className="h-3.5 w-3.5 text-amber-600" /> Price floor
                </span>
                <span className="font-bold tabular-nums text-rose-600">{fmtMoney(item.floorPrice)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-500">Graded value range</span>
                <span className="font-semibold tabular-nums text-stone-800">
                  {item.valueLow != null ? `${fmtMoney(item.valueLow)} – ${fmtMoney(item.valueHigh)}` : "—"}
                </span>
              </div>
            </div>

            <div className="mt-4 border-t border-stone-100 pt-2">
              <PriceSpectrum
                low={item.valueLow}
                high={item.valueHigh}
                floor={item.floorPrice}
                benchmark={item.benchmarkPrice}
                listed={item.listedPrice}
                sold={item.soldPrice}
              />
            </div>
          </div>

          {/* historical reference */}
          <div className="card p-5">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-stone-400" />
              <h3 className="font-display text-lg font-semibold text-stone-900">Historical price reference</h3>
            </div>
            {history.comparableCount > 0 ? (
              <>
                <div className="mt-3 grid grid-cols-4 gap-2 text-center">
                  {[
                    ["Comps", String(history.comparableCount)],
                    ["Avg", fmtMoney(history.avg)],
                    ["Median", fmtMoney(history.median)],
                    ["Range", `${fmtMoney(history.min)}–${fmtMoney(history.max)}`],
                  ].map(([l, r]) => (
                    <div key={l} className="rounded-xl bg-stone-50 px-1.5 py-2">
                      <div className="text-[9.5px] font-bold uppercase tracking-wider text-stone-400">{l}</div>
                      <div className="mt-0.5 truncate text-[13.5px] font-bold tabular-nums text-stone-900">{r}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 space-y-2">
                  {history.rows.map((r) => (
                    <Link
                      key={r.id}
                      href={`/inventory/${r.id}`}
                      className="flex items-center gap-3 rounded-xl px-2 py-1.5 transition hover:bg-amber-50/60"
                    >
                      <Thumb url={r.photos?.[0]?.url} className="h-9 w-12 shrink-0 rounded-md border border-stone-100" />
                      <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium text-stone-700">{r.name}</span>
                      <span className="shrink-0 text-right text-[12px] tabular-nums text-stone-500">
                        <span className="font-bold text-stone-900">{fmtMoney(r.soldPrice)}</span>
                        <span className="ml-1.5">{relTime(r.soldAt)}</span>
                      </span>
                    </Link>
                  ))}
                </div>
              </>
            ) : (
              <p className="mt-2.5 text-[12.5px] text-stone-400">
                No close comparables sold in this family yet.
                {history.rootCount > 0 && (
                  <> Family median across all grades: <span className="font-semibold text-stone-700">{fmtMoney(history.rootMedian)}</span> ({history.rootCount} sales).</>
                )}
              </p>
            )}
          </div>

          {/* timeline */}
          <div className="card p-5">
            <h3 className="font-display text-lg font-semibold text-stone-900">Price & movement log</h3>
            <div className="mt-3 space-y-0.5">
              {events.length === 0 && <p className="text-[13px] text-stone-400">No events yet.</p>}
              {events.map((e) => {
                const meta = EVENT_META[e.kind] ?? EVENT_META.price_update;
                return (
                  <div key={e.id} className="flex items-center gap-3 py-1.5">
                    <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-lg", meta.tone)}>
                      <meta.icon className="h-3.5 w-3.5" />
                    </span>
                    <span className="flex-1 text-[12.5px]">
                      <span className="font-semibold text-stone-800">{meta.label}</span>
                      {e.note && <span className="text-stone-400"> · {e.note}</span>}
                    </span>
                    <span className="text-[12.5px] tabular-nums text-stone-500">
                      {e.price != null && <span className="mr-2 font-bold text-stone-800">{fmtMoney(e.price)}</span>}
                      {relTime(e.createdAt)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* danger */}
          <div className="flex items-center justify-between rounded-2xl border border-dashed border-stone-200 px-4 py-3">
            <span className="text-[11.5px] text-stone-400">Danger zone — deleting removes all price events.</span>
            <button
              onClick={remove}
              disabled={busyAction === "delete"}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-semibold text-rose-500 transition hover:bg-rose-50"
            >
              {busyAction === "delete" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* modals */}
      {cleanModalOpen && (
        <AfterPhotoModal
          open={cleanModalOpen}
          item={item}
          onClose={() => setCleanModalOpen(false)}
          onSuccess={() => router.refresh()}
        />
      )}
      <ShareModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        itemId={item.id}
        sku={item.sku}
        itemName={item.name}
        listedPrice={item.listedPrice}
        conditionNotes={item.conditionNotes}
        initial={share}
      />
      <ListForSaleModal
        open={modal === "list"}
        onClose={() => setModal(null)}
        item={item}
        description={
          item.benchmarkPrice != null
            ? `Official Formula Target ${fmtMoney(listFormula.targetPrice)} · MaxA cap ${fmtMoney(listFormula.maxA)} · Benchmark ${fmtMoney(item.benchmarkPrice)}`
            : `Official Formula Target ${fmtMoney(listFormula.targetPrice)} · Enforced floor ${fmtMoney(item.floorPrice)}.`
        }
        defaultValue={recommendedListPrice}
        floor={item.floorPrice}
        onSubmit={(p, previewPhotoUrl) => act({ action: "list", price: p, previewPhotoUrl })}
      />
      <MoneyModal
        open={modal === "price"}
        onClose={() => setModal(null)}
        title="Adjust ask price"
        description={aging && aging.suggested ? `Aging policy suggests ${fmtMoney(aging.suggested)} after ${item.daysListed} days listed.` : "Markdowns are logged to the price history."}
        submitLabel="Save price"
        defaultValue={aging?.suggested ?? item.listedPrice}
        floor={item.floorPrice}
        tone="primary"
        onSubmit={(p) => act({ action: "price", price: p })}
      />
      <MoneyModal
        open={modal === "sold"}
        onClose={() => setModal(null)}
        title="Mark as sold"
        description={`Effective cost was ${fmtMoney(item.effectiveCost)}. The sale is logged to price history and supplier stats.`}
        submitLabel="Book the sale"
        defaultValue={item.listedPrice ?? item.benchmarkPrice}
        withChannel
        tone="emerald"
        onSubmit={(p, ch) => act({ action: "sold", price: p, channel: ch })}
      />
    </div>
  );
}
