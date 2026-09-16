"use client";

import { useMemo, useState } from "react";
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
  ImagePlus,
  Loader2,
  PackagePlus,
  PencilLine,
  ShieldCheck,
  Share2,
  Tag,
  Trash2,
  TrendingDown,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import type { DbCategory, DbPriceEvent, Grade, ItemPhoto } from "@/db/schema";
import type { EnrichedItem } from "@/lib/queries";
import { agingMarkdown, computeFloor, GRADE_META, GRADE_ORDER } from "@/lib/valuation";
import { SOLD_CHANNELS } from "@/lib/taxonomy-data";
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
    listedPrice: item.listedPrice == null ? "" : String(item.listedPrice),
    location: item.location ?? "",
    categoryId: item.categoryId == null ? "" : String(item.categoryId),
  });
  const [checklist, setChecklist] = useState(item.checklist ?? []);
  const [intakePhotos, setIntakePhotos] = useState<ItemPhoto[]>(() => (item.photos ?? []).filter((photo) => !photo.slot.startsWith("after-")));
  const [afterPhotos, setAfterPhotos] = useState<ItemPhoto[]>(() => (item.photos ?? []).filter((photo) => photo.slot.startsWith("after-")));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!open) return null;

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
  const priceSuggestions = [
    { label: "Floor", value: editFloor },
    { label: "Value low", value: item.valueLow },
    { label: "Benchmark", value: item.benchmarkPrice },
    { label: "Value high", value: item.valueHigh },
  ].filter((suggestion): suggestion is { label: string; value: number } => suggestion.value != null && suggestion.value >= editFloor && suggestion.value > 0);

  const addIntakeMedia = async (file: File | undefined) => {
    if (!file) return;
    const now = new Date();
    const timestamp = now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true });
    try {
      const dataUrl = await compressImageFile(file);
      setIntakePhotos((current) => [...current, { slot: `intake-${Date.now()}-${current.length}`, label: file.type.startsWith("video/") ? "Video" : "Intake photo", url: dataUrl, timestamp }]);
    } catch {
      const reader = new FileReader();
      reader.onload = () => setIntakePhotos((current) => [...current, { slot: `intake-${Date.now()}-${current.length}`, label: file.type.startsWith("video/") ? "Video" : "Intake photo", url: String(reader.result), timestamp }]);
      reader.readAsDataURL(file);
    }
  };

  const replaceIntakePhoto = async (index: number, file: File | undefined) => {
    if (!file) return;
    const now = new Date();
    const timestamp = now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true });
    try {
      const dataUrl = await compressImageFile(file);
      setIntakePhotos((current) => current.map((p, i) => i === index ? { ...p, url: dataUrl, timestamp } : p));
    } catch {
      const reader = new FileReader();
      reader.onload = () => setIntakePhotos((current) => current.map((p, i) => i === index ? { ...p, url: String(reader.result), timestamp } : p));
      reader.readAsDataURL(file);
    }
  };

  const deleteIntakePhoto = (index: number) => {
    setIntakePhotos((current) => current.filter((_, i) => i !== index));
  };

  const addAfterMedia = async (file: File | undefined) => {
    if (!file) return;
    const now = new Date();
    const timestamp = now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true });
    try {
      const dataUrl = await compressImageFile(file);
      setAfterPhotos((current) => [...current, { slot: `after-${Date.now()}-${current.length}`, label: file.type.startsWith("video/") ? "After video" : "After photo", url: dataUrl, timestamp }]);
    } catch {
      const reader = new FileReader();
      reader.onload = () => setAfterPhotos((current) => [...current, { slot: `after-${Date.now()}-${current.length}`, label: file.type.startsWith("video/") ? "After video" : "After photo", url: String(reader.result), timestamp }]);
      reader.readAsDataURL(file);
    }
  };

  const submit = async () => {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/items/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "edit", ...form, status: form.status, dimensions: normalizeDimensions(form.dimensions, dimensionUnit), checklist, photos: [...intakePhotos, ...afterPhotos], categoryId: form.categoryId ? Number(form.categoryId) : null, acquisitionCost: Number(form.acquisitionCost), refurbCost: Number(form.refurbCost), listedPrice: form.listedPrice ? Number(form.listedPrice) : null, grade: form.grade || null }),
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

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-stone-950/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="card max-h-[90vh] w-full max-w-2xl overflow-y-auto p-5" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-4"><div><h3 className="font-display text-xl font-semibold text-stone-900">Edit inventory entry</h3><p className="mt-1 text-[12.5px] text-stone-500">Update the record without changing its price history.</p></div><button onClick={onClose} className="btn-ghost px-3">Close</button></div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {([["name", "Item name"], ["brand", "Brand"], ["model", "Model"], ["color", "Color"], ["material", "Material"], ["location", "Location"]] as const).map(([key, label]) => <label key={key} className={key === "name" ? "sm:col-span-2" : ""}><span className="label">{label}</span><input className="input" value={form[key]} onChange={(event) => update(key, event.target.value)} /></label>)}
          <div className="sm:col-span-2">
            <span className="label">Dimensions</span>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  className="input text-center font-medium"
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
                  className="input text-center font-medium"
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
                  className="input text-center font-medium"
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
          <label><span className="label">Category</span><select className="input" value={form.categoryId} onChange={(event) => update("categoryId", event.target.value)}><option value="">Uncategorized</option>{categories.filter((category) => category.parentId != null).sort((a, b) => a.name.localeCompare(b.name)).map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
          <label>
            <span className="label">Product status</span>
            <select className="input" value={form.status} onChange={(event) => update("status", event.target.value)}>
              <option value="draft">Information required (Draft)</option>
              <option value="intake">Intake</option>
              <option value="for_cleaning">For cleaning</option>
              <option value="for_refurb">For cleaning & refurbishing</option>
              <option value="in_stock">In stock</option>
              <option value="listed">Listed</option>
              <option value="reserved">Reserved</option>
            </select>
          </label>
          <div className="sm:col-span-2"><span className="label">Condition grade</span><div className="grid grid-cols-4 gap-2">{GRADE_ORDER.map((grade) => { const active = form.grade === grade; const meta = GRADE_META[grade]; return <button key={grade} type="button" onClick={() => update("grade", active ? "" : grade)} className={cn("rounded-xl border px-2 py-2 text-left transition", active ? "border-amber-500 bg-amber-50 ring-2 ring-amber-500/30" : "border-[var(--line)] bg-white hover:border-amber-300")}><span className={cn("chip", meta.chip)}>{grade}</span><span className="mt-1 block truncate text-[10px] font-semibold text-stone-600">{meta.tagline}</span></button>; })}</div><p className="mt-1.5 text-[11px] text-stone-400">Select a grade to update the inspection record, or click the selected grade again to clear it.</p></div>
          <label><span className="label">Listed price — ₱</span><input className="input" type="number" min={0} value={form.listedPrice} onChange={(event) => update("listedPrice", event.target.value)} placeholder="Not listed" /></label>
          <label><span className="label">Acquisition cost — ₱</span><input className="input" type="number" min={0} value={form.acquisitionCost} onChange={(event) => update("acquisitionCost", event.target.value)} /></label>
          <label><span className="label">Refurb cost — ₱</span><input className="input" type="number" min={0} value={form.refurbCost} onChange={(event) => update("refurbCost", event.target.value)} /></label>
          <label className="sm:col-span-2"><span className="label">Condition notes</span><textarea className="input" value={form.conditionNotes} onChange={(event) => update("conditionNotes", event.target.value)} /></label>
        </div>
        <div className="mt-4 rounded-xl bg-amber-50/60 p-3.5">
          <div className="flex items-center justify-between gap-3"><span className="text-[11px] font-bold uppercase tracking-[0.12em] text-amber-900">Automatic listing suggestions</span><span className="text-xs font-semibold text-rose-600">Floor {fmtMoney(editFloor)}</span></div>
          <div className="mt-2 flex flex-wrap gap-2">
            {priceSuggestions.length === 0 ? <span className="text-xs text-stone-500">Add costs and complete the item valuation to see suggestions.</span> : priceSuggestions.map((suggestion) => <button key={suggestion.label} type="button" onClick={() => update("listedPrice", String(suggestion.value))} className="rounded-lg border border-amber-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-amber-900 transition hover:border-amber-400 hover:bg-amber-50">{suggestion.label} · {fmtMoney(suggestion.value)}</button>)}
          </div>
        </div>
        <div className="mt-5 border-t border-stone-100 pt-4">
          <div className="label">Inspection checklist</div>
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
        {/* Intake photos and videos */}
        <div className="mt-5 border-t border-stone-100 pt-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="label mb-0">Intake photos and videos</div>
              <p className="mt-1 text-[11px] text-stone-400">
                Change or delete the photos originally uploaded during intake, or add new views.
              </p>
            </div>
            <label className="btn-soft h-9 cursor-pointer text-[12px]">
              <ImagePlus className="h-4 w-4" />
              <span>Add intake photo</span>
              <input
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={(event) => {
                  addIntakeMedia(event.target.files?.[0]);
                  event.currentTarget.value = "";
                }}
              />
            </label>
          </div>
          {intakePhotos.length === 0 ? (
            <div className="mt-3 rounded-xl border border-dashed border-[var(--line)] bg-stone-50 px-3 py-3 text-xs text-stone-500">
              No intake photos remaining. Click &ldquo;Add intake photo&rdquo; to upload.
            </div>
          ) : (
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {intakePhotos.map((photo, ix) => (
                <div key={photo.slot || ix} className="group relative overflow-hidden rounded-xl border border-[var(--line)] bg-stone-50">
                  {photo.url.startsWith("data:video/") ? (
                    <video src={photo.url} controls className="aspect-square w-full object-cover" />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photo.url} alt={photo.label} className="aspect-square w-full object-cover" />
                  )}

                  <div className="absolute bottom-1.5 left-1.5 rounded bg-black/65 px-1.5 py-0.5 text-[9px] font-bold text-white uppercase backdrop-blur-sm">
                    {photo.label || `Photo ${ix + 1}`}
                  </div>

                  <div className="absolute right-1.5 top-1.5 flex items-center gap-1">
                    <label
                      className="cursor-pointer rounded-full bg-stone-950/70 p-1 text-white backdrop-blur transition hover:bg-stone-900"
                      title="Change photo"
                    >
                      <Camera className="h-3.5 w-3.5" />
                      <input
                        type="file"
                        accept="image/*,video/*"
                        className="hidden"
                        onChange={(event) => {
                          replaceIntakePhoto(ix, event.target.files?.[0]);
                          event.currentTarget.value = "";
                        }}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => deleteIntakePhoto(ix)}
                      className="rounded-full bg-rose-600/80 p-1 text-white backdrop-blur transition hover:bg-rose-700"
                      title="Delete photo"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-5 border-t border-stone-100 pt-4">
          <div className="flex items-center justify-between gap-3"><div><div className="label mb-0">After photos and videos</div><p className="mt-1 text-[11px] text-stone-400">Add the finished or refurbished condition without replacing the before photos.</p></div><label className="btn-soft h-9 cursor-pointer text-[12px]"><ImagePlus className="h-4 w-4" /><span>Add media</span><input type="file" accept="image/*,video/*" className="hidden" onChange={(event) => { addAfterMedia(event.target.files?.[0]); event.currentTarget.value = ""; }} /></label></div>
          {afterPhotos.length === 0 ? (
            <div className="mt-3 rounded-xl border border-dashed border-[var(--line)] bg-stone-50 px-3 py-3 text-xs text-stone-500">No after media added yet.</div>
          ) : (
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {afterPhotos.map((photo) => (
                <div key={photo.slot} className="relative overflow-hidden rounded-xl border border-[var(--line)] bg-stone-50">
                  {photo.url.startsWith("data:video/") ? (
                    <video src={photo.url} controls className="aspect-square w-full object-cover" />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photo.url} alt={photo.label} className="aspect-square w-full object-cover" />
                  )}
                  <button type="button" onClick={() => setAfterPhotos((current) => current.filter((item) => item.slot !== photo.slot))} className="absolute right-1.5 top-1.5 rounded-full bg-stone-950/65 p-1 text-white" aria-label={`Remove ${photo.label}`}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
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
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const photos = item.photos ?? [];
  const aging = item.status === "listed" && item.daysListed != null
    ? agingMarkdown(item.daysListed, item.listedPrice ?? 0, item.floorPrice)
    : null;

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
            <button onClick={() => item.status === "draft" ? router.push(`/inventory/new?edit=${item.id}`) : setEditOpen(true)} className="btn-ghost"><PencilLine className="h-4 w-4" /> Edit</button>
            {item.status !== "sold" && item.status !== "archived" && (
              <button
                onClick={() => isInformationRequired ? null : setShareOpen(true)}
                disabled={isInformationRequired}
                title={isInformationRequired ? "Complete required details before sharing" : undefined}
                className={cn("btn-ghost relative", isInformationRequired && "opacity-40 cursor-not-allowed text-stone-400 pointer-events-none")}
              >
                <Share2 className="h-4 w-4" /> Share
                {share?.active && (
                  <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-amber-500 ring-2 ring-white" />
                )}
              </button>
            )}
            {["draft", "intake", "in_stock", "for_cleaning", "for_refurb", "for_refurbishing", "cleaning", "refurbishing"].includes(item.status) && (
              <button
                onClick={() => isInformationRequired ? null : setModal("list")}
                disabled={isInformationRequired}
                title={isInformationRequired ? "Cannot list: complete required information first" : undefined}
                className={cn("btn-accent", isInformationRequired && "opacity-40 cursor-not-allowed bg-stone-200 text-stone-400 hover:bg-stone-200 pointer-events-none")}
              >
                <Tag className="h-4 w-4" /> List for sale
              </button>
            )}
            {item.status === "for_cleaning" && (
              <button onClick={() => simpleAction("clean_done", { action: "edit", status: "in_stock" })} disabled={busyAction != null} className="btn-soft">
                <Check className="h-4 w-4 text-emerald-600" /> Mark cleaned → To stock
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

      <EditItemModal item={item} categories={categories} open={editOpen} onClose={() => setEditOpen(false)} onSaved={() => router.refresh()} />

      <div className="grid gap-5 lg:grid-cols-[1.12fr_1fr]">
        {/* LEFT */}
        <div className="space-y-5">
          {/* gallery */}
          <div className="card overflow-hidden p-3">
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
      <MoneyModal
        open={modal === "list"}
        onClose={() => setModal(null)}
        title="List for sale"
        description={item.valueLow != null ? `Graded value range ${fmtMoney(item.valueLow)} – ${fmtMoney(item.valueHigh)} · benchmark ${fmtMoney(item.benchmarkPrice)}.` : "Set the ask price."}
        submitLabel="Go live"
        defaultValue={Math.max(item.floorPrice ?? 0, item.valueLow && item.valueHigh ? Math.round(((item.valueLow + item.valueHigh) / 2) / 5) * 5 : item.benchmarkPrice ?? 0)}
        floor={item.floorPrice}
        onSubmit={(p) => act({ action: "list", price: p })}
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
