"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Fuse from "fuse.js";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Camera,
  Check,
  CheckCircle2,
  CheckSquare,
  ChevronRight,
  CircleDot,
  Clock,
  Factory,
  ImageIcon,
  Layers,
  Loader2,
  Plus,
  Settings,
  ShieldCheck,
  Sparkles,
  Trash2,
  Video,
  X,
} from "lucide-react";
import type { DbCategory, DbCategoryAttribute, DbItem, Grade } from "@/db/schema";
import {
  GRADE_META,
  GRADE_ORDER,
  brandTier,
  computeFloor,
  valuate,
} from "@/lib/valuation";
import {
  PHOTO_SLOTS,
  WAREHOUSE_LOCATIONS,
  categorizedChecklistFor,
  CHECKLIST_CATEGORIES,
  calculateAutoGrade,
  refPhotoFor,
  REAL_SETUP_PHOTO,
  type ChecklistCategory,
} from "@/lib/taxonomy-data";
import { cn, fmtMoney, normalizeDimensions, relTime, type DimensionUnit } from "@/lib/format";
import { compressImageFile } from "@/lib/image-compress";
import { GradeChip, Thumb } from "./ui";

export type SoldRef = {
  id: number;
  name: string;
  categoryId: number;
  rootSlug: string;
  brand: string | null;
  grade: string | null;
  soldPrice: number | null;
  soldAt: string | Date | null;
};

export type SupplierLite = { id: number; name: string; channel: string };

const STEPS = ["Media & Photos", "Sourcing", "Identity", "Inspection", "Pricing & Publish"];

export const INTAKE_FIXED_SLOTS = [
  {
    slot: "front",
    label: "Front View",
    hint: "Full item, angled three-quarter, good light",
    required: true,
  },
  {
    slot: "back",
    label: "Back / Reverse",
    hint: "Frame, mechanism or rear panels visible",
    required: true,
  },
  {
    slot: "label",
    label: "Label / Serial",
    hint: "Manufacturer tag, model sticker or serial plate",
    required: false,
  },
] as const;

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

const COLORS = [
  "Black", "Graphite", "White", "Grey", "Walnut", "Oak", "Birch", "Cherry",
  "Maple", "Beige", "Navy", "Burgundy", "Forest", "Tan", "Aluminium",
];

export const DEFAULT_MATERIALS = [
  "Mesh",
  "Pellicle Mesh",
  "Leather",
  "Fabric / Upholstery",
  "Walnut Veneer",
  "Oak Veneer",
  "Laminate",
  "High-Pressure Laminate",
  "Steel",
  "Die-Cast Aluminum",
  "Polypropylene",
  "Molded Foam",
  "Solid Wood",
  "Tempered Glass",
  "Acoustic PET Felt",
  "Vinyl",
];

const MATERIAL_STORAGE_KEY = "etjoaigi_material_frequencies";

export const GRADE_CARD_THEMES: Record<
  Grade,
  {
    chip: string;
    activeCard: string;
    checkColor: string;
  }
> = {
  A: {
    chip: "bg-[#f0d900] text-[#17364b] font-black border-[#e5ce00]",
    activeCard: "border-[#f0d900] bg-[#fefce8] ring-2 ring-[#f0d900]/50",
    checkColor: "text-amber-500",
  },
  B: {
    chip: "bg-[#16a34a] text-white font-bold border-[#15803d]",
    activeCard: "border-[#16a34a] bg-emerald-50/60 ring-2 ring-[#16a34a]/40",
    checkColor: "text-[#16a34a]",
  },
  C: {
    chip: "bg-[#2563eb] text-white font-bold border-[#1d4ed8]",
    activeCard: "border-[#2563eb] bg-blue-50/60 ring-2 ring-[#2563eb]/40",
    checkColor: "text-[#2563eb]",
  },
  D: {
    chip: "bg-[#e11d48] text-white font-bold border-[#be123c]",
    activeCard: "border-[#e11d48] bg-rose-50/60 ring-2 ring-[#e11d48]/40",
    checkColor: "text-[#e11d48]",
  },
};

/* ------------------------------------------------------------------ */

function ComboInput({
  value,
  onChange,
  onSelect,
  suggestions,
  frequencies,
  placeholder,
  icon: Icon,
  headerLabel = "Suggestions",
}: {
  value: string;
  onChange: (v: string) => void;
  onSelect?: (v: string) => void;
  suggestions: string[];
  frequencies?: Record<string, number>;
  placeholder?: string;
  icon?: React.ComponentType<{ className?: string }>;
  headerLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const filtered = useMemo(() => {
    const q = value.trim().toLowerCase();
    const list = q ? suggestions.filter((s) => s.toLowerCase().includes(q)) : suggestions;
    return list.filter((s) => s.toLowerCase() !== q).slice(0, 8);
  }, [value, suggestions]);
  return (
    <div className="relative">
      {Icon && (
        <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
      )}
      <input
        className={cn("input", Icon && "pl-10")}
        value={value}
        placeholder={placeholder}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 160)}
      />
      {open && filtered.length > 0 && (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 max-h-64 overflow-y-auto rounded-xl border border-stone-200 bg-white shadow-xl">
          <div className="flex items-center justify-between px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-[0.14em] text-stone-400">
            <span>{headerLabel}</span>
            {frequencies && <span className="text-[9px] font-medium text-stone-400 normal-case">Most frequent first</span>}
          </div>
          {filtered.map((s) => {
            const count = frequencies?.[s];
            return (
              <button
                key={s}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange(s);
                  onSelect?.(s);
                  setOpen(false);
                }}
                className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-[13px] text-stone-700 transition hover:bg-amber-50"
              >
                <div className="flex items-center gap-2 truncate">
                  <Sparkles className="h-3 w-3 shrink-0 text-stone-300" />
                  <span className="truncate">{s}</span>
                </div>
                {count && count > 0 ? (
                  <span className="shrink-0 rounded-full bg-amber-100/80 px-1.5 py-0.5 text-[9.5px] font-bold text-amber-800">
                    {count}× used
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

export function IntakeWizard({
  categories,
  attributes,
  suppliers,
  soldRefs,
  brands,
  brandModels,
  initialItem = null,
}: {
  categories: DbCategory[];
  attributes: DbCategoryAttribute[];
  suppliers: SupplierLite[];
  soldRefs: SoldRef[];
  brands: string[];
  brandModels: Record<string, string[]>;
  initialItem?: DbItem | null;
}) {
  const router = useRouter();
  /* ---- data structure helpers ---- */
  const byId = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const childrenOf = useMemo(() => {
    const m = new Map<number | null, DbCategory[]>();
    for (const c of categories) {
      const k = c.parentId ?? null;
      const arr = m.get(k) ?? [];
      arr.push(c);
      m.set(k, arr);
    }
    for (const arr of m.values()) arr.sort((a, b) => a.sortOrder - b.sortOrder);
    return m;
  }, [categories]);
  const roots = childrenOf.get(null) ?? [];
  const leaves = useMemo(
    () => categories.filter((c) => (childrenOf.get(c.id) ?? []).length === 0),
    [categories, childrenOf]
  );
  const pathOfLeaf = (c: DbCategory) => {
    const parts = [c.name];
    let cur = c.parentId != null ? byId.get(c.parentId) : undefined;
    while (cur) {
      parts.unshift(cur.name);
      cur = cur.parentId != null ? byId.get(cur.parentId) : undefined;
    }
    return parts.join(" › ");
  };
  const rootOf = (id: number | null): DbCategory | null => {
    let cur = id != null ? byId.get(id) : undefined;
    let guard = 0;
    while (cur && cur.parentId != null && guard < 10) {
      cur = byId.get(cur.parentId);
      guard++;
    }
    return cur ?? null;
  };
  const baseOf = (id: number | null): number | null => {
    let cur = id != null ? byId.get(id) : undefined;
    let guard = 0;
    while (cur && guard < 10) {
      if (cur.baseValue && cur.baseValue > 0) return cur.baseValue;
      cur = cur.parentId != null ? byId.get(cur.parentId) : undefined;
      guard++;
    }
    return null;
  };

  /* ---- wizard state ---- */
  const initialRootId = initialItem?.categoryId != null ? rootOf(initialItem.categoryId)?.id ?? null : null;
  const [step, setStep] = useState(0);
  const [rootId, setRootId] = useState<number | null>(initialRootId);
  const [leafId, setLeafId] = useState<number | null>(initialItem?.categoryId ?? null);
  const [catQuery, setCatQuery] = useState("");

  const [brand, setBrand] = useState(initialItem?.brand ?? "");
  const [model, setModel] = useState(initialItem?.model ?? "");
  const [name, setName] = useState(initialItem?.name === "Information required" ? "" : initialItem?.name ?? "");
  const [nameTouched, setNameTouched] = useState(!!initialItem?.name && initialItem.name !== "Information required");
  const [attrVals, setAttrVals] = useState<Record<string, string>>(initialItem?.attributes ?? {});
  const [color, setColor] = useState(initialItem?.color ?? "");
  const [material, setMaterial] = useState(initialItem?.material ?? "");
  const [materialFreqs, setMaterialFreqs] = useState<Record<string, number>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(MATERIAL_STORAGE_KEY);
      if (raw) {
        setMaterialFreqs(JSON.parse(raw));
      }
    } catch {
      // ignore
    }
  }, []);

  const recordMaterialUsage = (val: string) => {
    const trimmed = val.trim();
    if (!trimmed) return;
    setMaterialFreqs((prev) => {
      const matchKey = Object.keys(prev).find((k) => k.toLowerCase() === trimmed.toLowerCase()) || trimmed;
      const next = { ...prev, [matchKey]: (prev[matchKey] || 0) + 1 };
      try {
        localStorage.setItem(MATERIAL_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const materialSuggestions = useMemo(() => {
    const combined = Array.from(new Set([...Object.keys(materialFreqs), ...DEFAULT_MATERIALS]));
    return combined.sort((a, b) => {
      const freqA = materialFreqs[a] || 0;
      const freqB = materialFreqs[b] || 0;
      if (freqB !== freqA) return freqB - freqA;
      const defA = DEFAULT_MATERIALS.indexOf(a);
      const defB = DEFAULT_MATERIALS.indexOf(b);
      if (defA !== -1 && defB !== -1) return defA - defB;
      if (defA !== -1) return -1;
      if (defB !== -1) return 1;
      return a.localeCompare(b);
    });
  }, [materialFreqs]);
  const initialParsedDims = useMemo(() => parseInitialDims(initialItem?.dimensions), [initialItem?.dimensions]);
  const [dimL, setDimL] = useState(initialParsedDims.l);
  const [dimW, setDimW] = useState(initialParsedDims.w);
  const [dimH, setDimH] = useState(initialParsedDims.h);
  const [dimensionUnit, setDimensionUnit] = useState<DimensionUnit>(initialParsedDims.unit);
  const [dimensions, setDimensions] = useState(initialItem?.dimensions ?? "");
  const [sups, setSups] = useState<SupplierLite[]>(suppliers);
  const [supplierId, setSupplierId] = useState<number | "">(initialItem?.supplierId ?? "");
  const [newSup, setNewSup] = useState<{ open: boolean; name: string; channel: string; contact: string; busy: boolean }>({ open: false, name: "", channel: "Direct", contact: "", busy: false });
  const [location, setLocation] = useState(initialItem?.location ?? WAREHOUSE_LOCATIONS[0]);
  const [acq, setAcq] = useState(initialItem?.acquisitionCost ? String(initialItem.acquisitionCost) : "");
  const [refurb, setRefurb] = useState(initialItem?.refurbCost ? String(initialItem.refurbCost) : "");
  const [cleaning, setCleaning] = useState(
    initialItem?.attributes?.cleaning_cost ? String(initialItem.attributes.cleaning_cost) : "0"
  );

  const updateDims = (l: string, w: string, h: string, u: DimensionUnit) => {
    setDimL(l);
    setDimW(w);
    setDimH(h);
    setDimensionUnit(u);
    if (l.trim() && w.trim() && h.trim()) {
      setDimensions(`L ${l.trim()} × W ${w.trim()} × H ${h.trim()} ${u}`);
    } else if (l.trim() || w.trim() || h.trim()) {
      setDimensions([l.trim(), w.trim(), h.trim()].filter(Boolean).join(" x "));
    } else {
      setDimensions("");
    }
  };

  const [checks, setChecks] = useState<Record<number, "pass" | "flag" | "fail">>(() =>
    Object.fromEntries((initialItem?.checklist ?? []).map((entry, index) => [index, entry.status]))
  );
  const autoGrade = useMemo(() => calculateAutoGrade(checks), [checks]);
  const [gradeOverridden, setGradeOverridden] = useState(initialItem?.grade != null);
  const [grade, setGrade] = useState<Grade | null>(initialItem?.grade ?? null);
  const effectiveGrade = grade ?? autoGrade;

  const handleCheck = (ix: number, s: "pass" | "flag" | "fail") => {
    const next = { ...checks, [ix]: s };
    setChecks(next);
    if (!gradeOverridden) {
      setGrade(calculateAutoGrade(next));
    }
  };

  const handleMarkAllPass = (totalCount: number) => {
    const next = Object.fromEntries(Array.from({ length: totalCount }, (_, ix) => [ix, "pass" as const]));
    setChecks(next);
    if (!gradeOverridden) {
      setGrade("A");
    }
  };

  const handleSelectGrade = (g: Grade) => {
    setGrade(g);
    setGradeOverridden(true);
  };

  const [notes, setNotes] = useState(initialItem?.conditionNotes ?? "");

  const [photos, setPhotos] = useState<Record<string, string | null>>(() =>
    Object.fromEntries((initialItem?.photos ?? []).map((photo) => [photo.slot, photo.url]))
  );
  const [photoTimestamps, setPhotoTimestamps] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      (initialItem?.photos ?? []).filter((p) => p.timestamp).map((p) => [p.slot, p.timestamp!])
    )
  );
  const initialDefectPhotos = useMemo(() => {
    return (initialItem?.photos ?? [])
      .filter((p) => p.slot === "detail" || p.slot.startsWith("detail_"))
      .map((p, ix) => ({
        id: `defect-${ix}-${Date.now()}`,
        url: p.url,
        timestamp: p.timestamp,
      }));
  }, [initialItem?.photos]);
  const [defectPhotos, setDefectPhotos] = useState<{ id: string; url: string; timestamp?: string }[]>(initialDefectPhotos);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const defectMultiInputRef = useRef<HTMLInputElement | null>(null);
  const defectSingleInputRef = useRef<HTMLInputElement | null>(null);
  const activeChangeDefectId = useRef<string | null>(null);

  const [listMode, setListMode] = useState<"intake" | "stock" | "listed" | "for_cleaning" | "for_refurb">(
    initialItem?.status === "listed"
      ? "listed"
      : initialItem?.status === "for_cleaning"
      ? "for_cleaning"
      : initialItem?.status === "for_refurb"
      ? "for_refurb"
      : "stock"
  );
  const [price, setPrice] = useState(initialItem?.listedPrice == null ? "" : String(initialItem.listedPrice));
  const [priceTouched, setPriceTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ id: number; sku: string; status: string } | null>(null);

  /* ---- derived ---- */
  const leaf = leafId != null ? byId.get(leafId) ?? null : null;
  const root = leafId != null ? rootOf(leafId) : null;
  const rootSlug = root?.slug ?? "";
  const baseValue = leafId != null ? baseOf(leafId) : null;
  const categorizedChecklist = useMemo(() => categorizedChecklistFor(rootSlug), [rootSlug]);
  const catAttrs = useMemo(() => {
    if (!leafId) return [] as DbCategoryAttribute[];
    const chain: number[] = [];
    let cur = byId.get(leafId);
    while (cur) {
      chain.unshift(cur.id);
      cur = cur.parentId != null ? byId.get(cur.parentId) : undefined;
    }
    return attributes.filter((a) => chain.includes(a.categoryId));
  }, [leafId, attributes, byId]);

  const v = useMemo(() => valuate({ baseValue, brand, grade: effectiveGrade }), [baseValue, brand, effectiveGrade]);
  const tier = brandTier(brand);
  const acqNum = Number(acq) || 0;
  const refurbNum = Number(refurb) || 0;
  const cleaningNum = Number(cleaning) || 0;
  const floor = computeFloor(acqNum, refurbNum + cleaningNum);
  const suggested = v.suggested ? Math.max(floor, v.suggested) : floor || null;
  const priceNum = Number(price) || 0;

  const history = useMemo(() => {
    const same = soldRefs
      .filter((r) => r.rootSlug === rootSlug && r.soldPrice)
      .map((r) => {
        let score = 0;
        if (leafId && r.categoryId === leafId) score += 2;
        if (brand && r.brand && r.brand.toLowerCase() === brand.toLowerCase()) score += 2;
        if (effectiveGrade && r.grade === effectiveGrade) score += 1;
        return { r, score };
      })
      .filter((x) => x.score >= 3)
      .sort((a, b) => +new Date(b.r.soldAt ?? 0) - +new Date(a.r.soldAt ?? 0));
    const prices = same.map((x) => x.r.soldPrice!);
    return {
      rows: same.slice(0, 4).map((x) => x.r),
      count: prices.length,
      avg: prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : null,
      min: prices.length ? Math.min(...prices) : null,
      max: prices.length ? Math.max(...prices) : null,
    };
  }, [soldRefs, rootSlug, leafId, brand, effectiveGrade]);

  const catFuse = useMemo(
    () =>
      new Fuse(
        leaves.map((c) => ({ c, path: pathOfLeaf(c) })),
        { keys: ["c.name", "path"], threshold: 0.32, ignoreLocation: true }
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [leaves]
  );

  /* ---- gating ---- */
  const answered = categorizedChecklist.filter((_, ix) => checks[ix] != null).length;
  const isGradeA = effectiveGrade === "A";
  const requiredPhotosOk = Boolean(photos["front"] && photos["back"]);
  const hasAnyMedia = Boolean(
    photos["front"] ||
    photos["back"] ||
    photos["label"] ||
    defectPhotos.length > 0 ||
    photos["video"]
  );
  const mustAttrsOk = catAttrs.filter((a) => a.required).every((a) => (attrVals[a.name] ?? "").trim() !== "");
  const listingReady =
    leafId != null &&
    name.trim().length > 1 &&
    dimensions.trim().length > 0 &&
    acqNum > 0 &&
    mustAttrsOk &&
    effectiveGrade != null &&
    answered === categorizedChecklist.length &&
    requiredPhotosOk &&
    priceNum >= floor &&
    priceNum > 0;
  const canContinue = step === 0 ? hasAnyMedia : true;

  const syncName = (b: string, m: string) => {
    if (!nameTouched) setName([b, m].filter(Boolean).join(" "));
  };

  const onFile = async (slot: string, f: File | undefined) => {
    if (!f) return;
    const nowStr = new Date().toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    try {
      const dataUrl = await compressImageFile(f);
      setPhotos((p) => ({ ...p, [slot]: dataUrl }));
      setPhotoTimestamps((t) => ({ ...t, [slot]: nowStr }));
    } catch {
      const reader = new FileReader();
      reader.onload = () => {
        setPhotos((p) => ({ ...p, [slot]: String(reader.result) }));
        setPhotoTimestamps((t) => ({ ...t, [slot]: nowStr }));
      };
      reader.readAsDataURL(f);
    }
  };

  const onDefectFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const nowStr = new Date().toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    for (const f of Array.from(files)) {
      try {
        const dataUrl = await compressImageFile(f);
        setDefectPhotos((prev) => [
          ...prev,
          { id: `defect-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, url: dataUrl, timestamp: nowStr },
        ]);
      } catch {
        const reader = new FileReader();
        reader.onload = () => {
          setDefectPhotos((prev) => [
            ...prev,
            { id: `defect-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, url: String(reader.result), timestamp: nowStr },
          ]);
        };
        reader.readAsDataURL(f);
      }
    }
  };

  const onChangeSingleDefectFile = async (id: string, f: File | undefined) => {
    if (!f) return;
    const nowStr = new Date().toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    try {
      const dataUrl = await compressImageFile(f);
      setDefectPhotos((prev) =>
        prev.map((dp) => (dp.id === id ? { ...dp, url: dataUrl, timestamp: nowStr } : dp))
      );
    } catch {
      const reader = new FileReader();
      reader.onload = () => {
        setDefectPhotos((prev) =>
          prev.map((dp) => (dp.id === id ? { ...dp, url: String(reader.result), timestamp: nowStr } : dp))
        );
      };
      reader.readAsDataURL(f);
    }
  };

  const onUseReference = (slot: string, url: string) => {
    const nowStr = new Date().toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    setPhotos((p) => ({ ...p, [slot]: url }));
    setPhotoTimestamps((t) => ({ ...t, [slot]: nowStr }));
  };

  const addSupplier = async () => {
    if (!newSup.name.trim()) return;
    setNewSup((s) => ({ ...s, busy: true }));
    const res = await fetch("/api/suppliers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newSup.name, channel: newSup.channel, contactPerson: newSup.contact }),
    });
    if (res.ok) {
      const row = (await res.json()) as { id: number; name: string; channel: string };
      setSups((s) => [...s, { id: row.id, name: row.name, channel: row.channel }]);
      setSupplierId(row.id);
      setNewSup({ open: false, name: "", channel: "Direct", contact: "", busy: false });
    } else {
      setNewSup((s) => ({ ...s, busy: false }));
    }
  };

  const submit = async () => {
    setSaving(true);
    setError(null);
    try {
      const editing = initialItem != null;
      const statusToSave =
        listMode === "for_cleaning"
          ? "for_cleaning"
          : listMode === "for_refurb"
          ? "for_refurb"
          : listMode === "listed" && listingReady
          ? "listed"
          : listMode === "stock" && listingReady
          ? "in_stock"
          : "draft";

      const res = await fetch(editing ? `/api/items/${initialItem.id}` : "/api/items", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(editing ? { action: "edit" } : {}),
          name: name.trim(),
          brand: brand.trim() || null,
          model: model.trim() || null,
          categoryId: leafId,
          attributes: { ...attrVals, cleaning_cost: String(cleaningNum) },
          color: color.trim() || null,
          material: material.trim() || null,
          dimensions: normalizeDimensions(dimensions, dimensionUnit) || null,
          grade: effectiveGrade,
          checklist: categorizedChecklist.map((item, ix) => ({
            key: `c${ix}`,
            label: item.label,
            category: item.category,
            status: checks[ix] ?? "pass",
          })),
          photos: [
            ...(photos["front"]
              ? [{ slot: "front", label: "Front View", url: photos["front"], timestamp: photoTimestamps["front"] || undefined }]
              : []),
            ...(photos["back"]
              ? [{ slot: "back", label: "Back / Reverse", url: photos["back"], timestamp: photoTimestamps["back"] || undefined }]
              : []),
            ...defectPhotos.map((dp, i) => ({
              slot: i === 0 ? "detail" : `detail_${i}`,
              label: defectPhotos.length === 1 ? "Defects & Wear" : `Defects & Wear #${i + 1}`,
              url: dp.url,
              timestamp: dp.timestamp || undefined,
            })),
            ...(photos["label"]
              ? [{ slot: "label", label: "Label / Serial", url: photos["label"], timestamp: photoTimestamps["label"] || undefined }]
              : []),
            ...(photos["video"]
              ? [
                  {
                    slot: "video",
                    label: "Condition Walkaround Video",
                    url: photos["video"],
                    timestamp: photoTimestamps["video"] || undefined,
                  },
                ]
              : []),
          ],
          conditionNotes: notes.trim() || null,
          acquisitionCost: acqNum,
          refurbCost: refurbNum,
          cleaningCost: cleaningNum,
          listedPrice:
            statusToSave === "listed"
              ? priceNum
              : statusToSave === "in_stock" || statusToSave === "for_cleaning" || statusToSave === "for_refurb"
              ? priceNum || null
              : null,
          status: statusToSave,
          supplierId: supplierId === "" ? null : supplierId,
          location,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 409 && data.error === "BELOW_FLOOR") {
        setError(`Price floor enforced — the ask must be at least ${fmtMoney(data.floor)} for this unit.`);
        setStep(4);
      } else if (!res.ok) {
        setError(data.error === "DATABASE_MIGRATION_REQUIRED"
          ? "The database needs the draft-item migration. Run supabase/draft-items.sql in Supabase SQL Editor, then try again."
          : data.message ?? data.error ?? "Could not save the item. Please try again.");
      } else {
        if (material.trim()) recordMaterialUsage(material.trim());
        if (editing) {
          router.push(`/inventory/${initialItem.id}`);
          router.refresh();
        } else {
          setResult({ id: data.id, sku: data.sku, status: statusToSave });
        }
      }
    } catch {
      setError("Network error while saving. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setStep(0);
    setRootId(null);
    setLeafId(null);
    setBrand(""); setModel(""); setName(""); setNameTouched(false);
    setAttrVals({}); setColor(""); setMaterial(""); setDimensions(""); setDimensionUnit("cm");
    setDimL(""); setDimW(""); setDimH("");
    setSupplierId(""); setAcq(""); setRefurb(""); setGrade(null); setGradeOverridden(false);
    setCleaning("0");
    setChecks({}); setNotes(""); setPhotos({}); setPhotoTimestamps({}); setDefectPhotos([]); setListMode("intake");
    setPrice(""); setPriceTouched(false); setResult(null); setError(null);
  };

  /* ================================================================ */

  if (result) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="card mx-auto mt-8 max-w-lg px-8 py-12 text-center"
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <BadgeCheck className="h-7 w-7" />
        </div>
        <h2 className="mt-5 font-display text-[26px] font-semibold tracking-tight text-stone-900">
          {result.status === "draft"
            ? "Saved as a Draft"
            : result.status === "for_cleaning"
            ? "Queued for Cleaning"
            : result.status === "for_refurb"
            ? "Queued for Refurbishing"
            : "Logged into the Book"}
        </h2>
        <p className="mt-1.5 text-sm text-stone-500">
          <span className="font-semibold text-stone-800">{name || "Information required"}</span> is now tracked as{" "}
          <code className="rounded-md bg-stone-100 px-2 py-0.5 text-[13px] font-bold text-stone-800">{result.sku}</code>
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-2.5">
          <Link href={`/inventory/${result.id}`} className="btn-primary">
            View item <ArrowRight className="h-4 w-4" />
          </Link>
          <button onClick={reset} className="btn-ghost">
            <Plus className="h-4 w-4" /> Intake another
          </button>
          <Link href="/" className="btn-ghost">Dashboard</Link>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[230px_1fr]">
      {/* stepper */}
      <div className="hidden lg:block">
        <div className="card sticky top-6 p-3">
          {STEPS.map((label, ix) => {
            const done = ix < step;
            const current = ix === step;
            return (
              <button
                key={label}
                onClick={() => ix < step && setStep(ix)}
                disabled={!done}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] transition",
                  current ? "bg-amber-50 font-semibold text-amber-900" : done ? "text-stone-700 hover:bg-stone-50" : "text-stone-400"
                )}
              >
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                    done ? "bg-emerald-100 text-emerald-700" : current ? "bg-amber-600 text-white" : "bg-stone-100 text-stone-400"
                  )}
                >
                  {done ? <Check className="h-3.5 w-3.5" /> : ix + 1}
                </span>
                {label}
              </button>
            );
          })}
          <div className="mt-3 rounded-xl bg-stone-50 p-3 text-[11px] leading-relaxed text-stone-500">
            Standardized intake: same tree, same grading scale, same photo set — every unit,
            every buyer.
          </div>
        </div>
      </div>

      {/* body */}
      <div>
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            {/* ---------------- STEP 0 · MEDIA & PHOTOS ---------------- */}
            {step === 0 && (
              <div className="space-y-4">
                <div className="card p-5">
                  <h3 className="font-display text-xl font-semibold text-stone-900">Photo Capture</h3>
                  <p className="mb-4 mt-1 text-[13px] text-stone-500">
                    Start with what you have. Add photos now, then complete the record and listing details later.
                  </p>
                  <div className="grid gap-3.5 sm:grid-cols-2">
                    {INTAKE_FIXED_SLOTS.map((s) => {
                      const url = photos[s.slot];
                      const slotBadge = s.required ? (
                        <span className="text-rose-500">*</span>
                      ) : (
                        <span className="font-medium text-stone-400">(optional)</span>
                      );

                      return (
                        <div key={s.slot} className={cn("overflow-hidden rounded-2xl border transition-all", url ? "border-[var(--line)] shadow-sm bg-white" : "border-dashed border-stone-300 bg-stone-50/60")}>
                          {url ? (
                            <div className="relative group">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={url} alt={s.label} className="aspect-[4/3] w-full object-cover" />

                              {/* Timestamp Badge */}
                              {photoTimestamps[s.slot] && (
                                <div className="absolute left-2.5 top-2.5 flex items-center gap-1 rounded-full bg-stone-950/75 px-2.5 py-1 text-[10.5px] font-medium text-white backdrop-blur shadow-sm">
                                  <Clock className="h-3 w-3 text-amber-400" />
                                  {photoTimestamps[s.slot]}
                                </div>
                              )}

                              {/* Top-Right Action Controls: Change Photo & Delete */}
                              <div className="absolute right-2.5 top-2.5 flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => fileRefs.current[s.slot]?.click()}
                                  className="flex items-center gap-1 rounded-full bg-stone-950/75 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur transition hover:bg-stone-900 shadow-sm"
                                  title={`Change ${s.label}`}
                                >
                                  <Camera className="h-3.5 w-3.5 text-stone-300" />
                                  <span>Change</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPhotos((p) => ({ ...p, [s.slot]: null }));
                                    setPhotoTimestamps((t) => {
                                      const next = { ...t };
                                      delete next[s.slot];
                                      return next;
                                    });
                                  }}
                                  className="flex items-center justify-center rounded-full bg-rose-600/90 p-1.5 text-white backdrop-blur transition hover:bg-rose-700 shadow-sm"
                                  title={`Delete ${s.label}`}
                                  aria-label={`Delete ${s.label}`}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>

                              {/* Bottom Slot Label & Switch-to-Reference Button */}
                              <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between">
                                <div className="flex items-center gap-2 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold text-stone-800 backdrop-blur shadow-sm">
                                  <span>{s.label}</span>
                                </div>

                                {leaf && (
                                  <button
                                    type="button"
                                    onClick={() => onUseReference(s.slot, refPhotoFor(leaf.slug))}
                                    className="rounded-full bg-white/95 px-2.5 py-1 text-[10.5px] font-semibold text-[#1D5D8B] backdrop-blur shadow-sm transition hover:bg-white hover:underline"
                                    title="Switch to reference photo"
                                  >
                                    Use reference
                                  </button>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="flex aspect-[4/3] flex-col items-center justify-center gap-2.5 p-5 text-center">
                              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-stone-400 shadow-sm">
                                <Camera className="h-5 w-5" strokeWidth={1.8} />
                              </div>
                              <div className="text-[13px] font-bold text-stone-700">
                                {s.label} {slotBadge}
                              </div>
                              <p className="text-[11.5px] leading-snug text-stone-400">{s.hint}</p>
                              <div className="mt-1 flex gap-2">
                                <button type="button" onClick={() => fileRefs.current[s.slot]?.click()} className="btn-ghost h-9 px-3 text-[12.5px]">
                                  <ImageIcon className="h-4 w-4" /> Upload
                                </button>
                                {leaf && (
                                  <button
                                    type="button"
                                    onClick={() => onUseReference(s.slot, refPhotoFor(leaf.slug))}
                                    className="btn-soft h-9 px-3 text-[12.5px]"
                                  >
                                    Use reference
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                          <input
                            ref={(el) => { fileRefs.current[s.slot] = el; }}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              onFile(s.slot, e.target.files?.[0]);
                              e.target.value = "";
                            }}
                          />
                        </div>
                      );
                    })}

                    {/* Multi-Photo Wear & Defects Slots */}
                    {defectPhotos.map((dp, idx) => (
                      <div key={dp.id} className="overflow-hidden rounded-2xl border border-[var(--line)] shadow-sm bg-white">
                        <div className="relative group">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={dp.url} alt={`Defects & Wear #${idx + 1}`} className="aspect-[4/3] w-full object-cover" />

                          {dp.timestamp && (
                            <div className="absolute left-2.5 top-2.5 flex items-center gap-1 rounded-full bg-stone-950/75 px-2.5 py-1 text-[10.5px] font-medium text-white backdrop-blur shadow-sm">
                              <Clock className="h-3 w-3 text-amber-400" />
                              {dp.timestamp}
                            </div>
                          )}

                          <div className="absolute right-2.5 top-2.5 flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                activeChangeDefectId.current = dp.id;
                                defectSingleInputRef.current?.click();
                              }}
                              className="flex items-center gap-1 rounded-full bg-stone-950/75 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur transition hover:bg-stone-900 shadow-sm"
                              title="Change photo"
                            >
                              <Camera className="h-3.5 w-3.5 text-stone-300" />
                              <span>Change</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setDefectPhotos((prev) => prev.filter((p) => p.id !== dp.id))}
                              className="flex items-center justify-center rounded-full bg-rose-600/90 p-1.5 text-white backdrop-blur transition hover:bg-rose-700 shadow-sm"
                              title="Delete photo"
                              aria-label="Delete photo"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between">
                            <div className="flex items-center gap-2 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold text-stone-800 backdrop-blur shadow-sm">
                              <span>Defects & Wear #{idx + 1}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Upload Card for Defects & Wear (Upload 1 or more photos) */}
                    <div className="overflow-hidden rounded-2xl border border-dashed border-stone-300 bg-stone-50/60 transition-all hover:border-stone-400">
                      <div className="flex aspect-[4/3] flex-col items-center justify-center gap-2.5 p-5 text-center">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-stone-400 shadow-sm">
                          {defectPhotos.length > 0 ? (
                            <Plus className="h-5 w-5 text-amber-600" strokeWidth={2} />
                          ) : (
                            <Camera className="h-5 w-5" strokeWidth={1.8} />
                          )}
                        </div>
                        <div className="text-[13px] font-bold text-stone-700">
                          {defectPhotos.length > 0 ? "Add Another Defect Photo" : "Defects & Wear"}{" "}
                          <span className="font-medium text-stone-400">(optional)</span>
                        </div>
                        <p className="text-[11.5px] leading-snug text-stone-400">
                          {defectPhotos.length > 0
                            ? "Upload more angles or close-ups of wear"
                            : "Close-up of scratches, stains, or wear (multiple photos allowed)"}
                        </p>
                        <div className="mt-1 flex gap-2">
                          <button
                            type="button"
                            onClick={() => defectMultiInputRef.current?.click()}
                            className="btn-ghost h-9 px-3 text-[12.5px]"
                          >
                            <ImageIcon className="h-4 w-4" /> {defectPhotos.length > 0 ? "Add Photos" : "Upload"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Hidden inputs for multi-defect uploads and single-defect replacement */}
                  <input
                    ref={defectMultiInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      onDefectFiles(e.target.files);
                      e.target.value = "";
                    }}
                  />
                  <input
                    ref={defectSingleInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (activeChangeDefectId.current) {
                        onChangeSingleDefectFile(activeChangeDefectId.current, e.target.files?.[0]);
                      }
                      e.target.value = "";
                    }}
                  />
                </div>

                {/* Video Upload Section */}
                <div className="card p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="font-display text-xl font-semibold text-stone-900">
                        Condition & Walkaround Video
                      </h3>
                      <p className="mt-1 text-[13px] text-stone-500">
                        Show mechanical functions, 360° overview, or condition details
                      </p>
                    </div>
                    {photos["video"] && (
                      <div className="flex items-center gap-2">
                        {photoTimestamps["video"] && (
                          <span className="flex items-center gap-1 rounded-full bg-stone-100 px-2.5 py-1 text-[11px] font-medium text-stone-600">
                            <Clock className="h-3 w-3 text-amber-500" />
                            {photoTimestamps["video"]}
                          </span>
                        )}
                        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11.5px] font-semibold text-emerald-700">
                          Video attached
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 grid gap-3.5 sm:grid-cols-2">
                    {photos["video"] ? (
                      <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-stone-950 shadow-sm">
                        <div className="relative group">
                          <video
                            src={photos["video"]}
                            controls
                            className="aspect-[4/3] w-full object-cover"
                          />

                          {/* Timestamp Badge */}
                          {photoTimestamps["video"] && (
                            <div className="absolute left-2.5 top-2.5 flex items-center gap-1 rounded-full bg-stone-950/75 px-2.5 py-1 text-[10.5px] font-medium text-white backdrop-blur shadow-sm">
                              <Clock className="h-3 w-3 text-amber-400" />
                              {photoTimestamps["video"]}
                            </div>
                          )}

                          {/* Top-Right Action Controls */}
                          <div className="absolute right-2.5 top-2.5 flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => fileRefs.current["video"]?.click()}
                              className="flex items-center gap-1 rounded-full bg-stone-950/75 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur transition hover:bg-stone-900 shadow-sm"
                              title="Change Condition Video"
                            >
                              <Video className="h-3.5 w-3.5 text-stone-300" />
                              <span>Change</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setPhotos((p) => ({ ...p, video: null }));
                                setPhotoTimestamps((t) => {
                                  const next = { ...t };
                                  delete next["video"];
                                  return next;
                                });
                              }}
                              className="flex items-center justify-center rounded-full bg-rose-600/90 p-1.5 text-white backdrop-blur transition hover:bg-rose-700 shadow-sm"
                              title="Delete Condition Video"
                              aria-label="Delete Condition Video"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          {/* Bottom Label */}
                          <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between">
                            <div className="flex items-center gap-2 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold text-stone-800 backdrop-blur shadow-sm">
                              <span>Condition Video</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="overflow-hidden rounded-2xl border border-dashed border-stone-300 bg-stone-50/60 transition-all hover:border-stone-400">
                        <div className="flex aspect-[4/3] flex-col items-center justify-center gap-2.5 p-5 text-center">
                          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-stone-400 shadow-sm">
                            <Video className="h-5 w-5" strokeWidth={1.8} />
                          </div>
                          <div className="text-[13px] font-bold text-stone-700">
                            Condition Video <span className="font-medium text-stone-400">(optional)</span>
                          </div>
                          <p className="text-[11.5px] leading-snug text-stone-400">
                            Show mechanical functions, 360° overview, or condition details
                          </p>
                          <div className="mt-1 flex gap-2">
                            <button
                              type="button"
                              onClick={() => fileRefs.current["video"]?.click()}
                              className="btn-ghost h-9 px-3 text-[12.5px]"
                            >
                              <Video className="h-4 w-4" /> Upload
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                    <input
                      ref={(el) => { fileRefs.current["video"] = el; }}
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={(e) => {
                        onFile("video", e.target.files?.[0]);
                        e.target.value = "";
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ---------------- STEP 1 · SOURCING ---------------- */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="card p-5">
                  <h3 className="font-display text-xl font-semibold text-stone-900">Sourcing & Acquisition</h3>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="label">Source / Supplier</label>
                      <select
                        className="input"
                        value={newSup.open ? "__new__" : supplierId}
                        onChange={(e) => {
                          if (e.target.value === "__new__") {
                            setNewSup((s) => ({ ...s, open: true }));
                          } else {
                            setNewSup((s) => ({ ...s, open: false }));
                            setSupplierId(e.target.value ? Number(e.target.value) : "");
                          }
                        }}
                      >
                        <option value="">— unassigned —</option>
                        {sups.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} · {s.channel}
                          </option>
                        ))}
                        <option value="__new__">+ Add new supplier…</option>
                      </select>
                      {newSup.open && (
                        <div className="mt-2.5 space-y-2 rounded-xl border border-[var(--line)] bg-stone-50/70 p-3">
                          <input
                            className="input"
                            placeholder="Supplier name"
                            value={newSup.name}
                            onChange={(e) => setNewSup((s) => ({ ...s, name: e.target.value }))}
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <select
                              className="input"
                              value={newSup.channel}
                              onChange={(e) => setNewSup((s) => ({ ...s, channel: e.target.value }))}
                            >
                              {["Liquidation", "Downsizing", "Auction", "Lease return", "Direct", "Institutional"].map((c) => (
                                <option key={c}>{c}</option>
                              ))}
                            </select>
                            <input
                              className="input"
                              placeholder="Contact person"
                              value={newSup.contact}
                              onChange={(e) => setNewSup((s) => ({ ...s, contact: e.target.value }))}
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={addSupplier}
                              disabled={newSup.busy || !newSup.name.trim()}
                              className="btn-soft h-9 flex-1 text-[13px]"
                            >
                              {newSup.busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Save supplier
                            </button>
                            <button
                              type="button"
                              onClick={() => setNewSup((s) => ({ ...s, open: false }))}
                              className="btn-ghost h-9 px-3 text-[13px]"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="label">
                        Acquisition Cost <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-stone-400">₱</span>
                        <input
                          className="input pl-8"
                          type="number"
                          min={0}
                          value={acq}
                          onChange={(e) => setAcq(e.target.value)}
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </div>

                  {floor > 0 && (
                    <div className="mt-4 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50/60 px-3.5 py-2.5 text-[12.5px] text-amber-900">
                      <ShieldCheck className="h-4 w-4 shrink-0 text-amber-600" />
                      <span>
                        Estimated price floor:{" "}
                        <span className="font-bold text-stone-900">{fmtMoney(floor)}</span>{" "}
                        <span className="text-stone-500">(effective cost × 1.18)</span>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ---------------- STEP 2 · IDENTITY ---------------- */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="card p-5">
                  <h3 className="font-display text-xl font-semibold text-stone-900">Category Selection</h3>
                  <input
                    className="input"
                    placeholder="Search the taxonomy — e.g. “stand desk”, “filing”…"
                    value={catQuery}
                    onChange={(e) => setCatQuery(e.target.value)}
                  />
                  {catQuery.trim() ? (
                    <div className="mt-3 divide-y divide-stone-100">
                      {catFuse.search(catQuery.trim()).slice(0, 8).map(({ item }) => (
                        <button
                          key={item.c.id}
                          onClick={() => setLeafId(item.c.id)}
                          className={cn(
                            "flex w-full items-center justify-between gap-3 py-2.5 text-left",
                            leafId === item.c.id ? "text-amber-800" : "text-stone-700 hover:text-stone-900"
                          )}
                        >
                          <span className="text-[13.5px]">
                            <span className="text-stone-400">{item.path.split(" › ").slice(0, -1).join(" › ")} › </span>
                            <span className="font-semibold">{item.c.name}</span>
                          </span>
                          {item.c.baseValue ? (
                            <span className="text-[11px] text-stone-400 tabular-nums">ref {fmtMoney(item.c.baseValue)}</span>
                          ) : null}
                        </button>
                      ))}
                      {catFuse.search(catQuery.trim()).length === 0 && (
                        <p className="py-4 text-[13px] text-stone-400">No category matches — extend the tree from the Taxonomy desk.</p>
                      )}
                    </div>
                  ) : (
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1 rounded-xl border border-[var(--line)] p-1.5">
                        {roots.map((r) => (
                          <button
                            key={r.id}
                            onClick={() => setRootId(r.id)}
                            className={cn(
                              "flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-[13.5px] font-medium transition",
                              rootId === r.id ? "bg-stone-900 text-white" : "text-stone-700 hover:bg-stone-100"
                            )}
                          >
                            {r.name}
                            <ChevronRight className={cn("h-4 w-4", rootId === r.id ? "text-amber-300" : "text-stone-300")} />
                          </button>
                        ))}
                      </div>
                      <div className="space-y-1 rounded-xl border border-[var(--line)] bg-stone-50/50 p-1.5">
                        {rootId == null ? (
                          <p className="px-3 py-8 text-center text-[12.5px] text-stone-400">Select a family to see its categories</p>
                        ) : (
                          (childrenOf.get(rootId) ?? [byId.get(rootId)!]).map((c) => (
                            <button
                              key={c.id}
                              onClick={() => setLeafId(c.id)}
                              className={cn(
                                "flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-[13.5px] transition",
                                leafId === c.id
                                  ? "bg-amber-600 font-semibold text-white"
                                  : "text-stone-700 hover:bg-white"
                              )}
                            >
                              {c.name}
                              {c.baseValue ? (
                                <span className={cn("text-[11px] tabular-nums", leafId === c.id ? "text-amber-100" : "text-stone-400")}>
                                  ref {fmtMoney(c.baseValue)}
                                </span>
                              ) : null}
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                  {leaf && (
                    <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl bg-amber-50 px-3.5 py-2.5 text-[13px] text-amber-900">
                      <CircleDot className="h-4 w-4 text-amber-600" />
                      <span className="font-semibold">{pathOfLeaf(leaf)}</span>
                    </div>
                  )}
                </div>

                <div className="card p-5">
                  <h3 className="font-display text-xl font-semibold text-stone-900">Identity & Specifications</h3>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="label">Brand</label>
                      <ComboInput
                        value={brand}
                        onChange={(v) => { setBrand(v); syncName(v, model); }}
                        suggestions={brands}
                        placeholder="Herman Miller, Steelcase…"
                        icon={Factory}
                      />
                    </div>
                    <div>
                      <label className="label">Model</label>
                      <ComboInput
                        value={model}
                        onChange={(v) => { setModel(v); syncName(brand, v); }}
                        suggestions={brandModels[brand] ?? []}
                        placeholder="Aeron Remastered…"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="label">Item name</label>
                      <input
                        className="input"
                        value={name}
                        onChange={(e) => { setNameTouched(true); setName(e.target.value); }}
                        placeholder="Auto-filled from brand + model"
                      />
                    </div>
                    <div>
                      <label className="label">Color</label>
                      <ComboInput value={color} onChange={setColor} suggestions={COLORS} placeholder="Graphite…" />
                    </div>
                    <div>
                      <label className="label">Material</label>
                      <ComboInput
                        value={material}
                        onChange={setMaterial}
                        onSelect={(val) => recordMaterialUsage(val)}
                        suggestions={materialSuggestions}
                        frequencies={materialFreqs}
                        placeholder="Mesh, veneer, steel…"
                        headerLabel="Suggested materials"
                      />
                    </div>
                    <div className="min-w-0">
                      <label className="label">
                        Dimensions (L/W/H) <span className="text-rose-500">*</span>
                      </label>
                      <div className="flex w-full min-w-0 items-center gap-1.5">
                        <input
                          type="text"
                          inputMode="decimal"
                          className="input min-w-0 flex-1 px-1.5 text-center font-medium"
                          placeholder="L"
                          value={dimL}
                          onChange={(e) => updateDims(e.target.value, dimW, dimH, dimensionUnit)}
                          aria-label="Length"
                        />
                        <span className="shrink-0 select-none text-xs font-semibold text-stone-300">×</span>
                        <input
                          type="text"
                          inputMode="decimal"
                          className="input min-w-0 flex-1 px-1.5 text-center font-medium"
                          placeholder="W"
                          value={dimW}
                          onChange={(e) => updateDims(dimL, e.target.value, dimH, dimensionUnit)}
                          aria-label="Width"
                        />
                        <span className="shrink-0 select-none text-xs font-semibold text-stone-300">×</span>
                        <input
                          type="text"
                          inputMode="decimal"
                          className="input min-w-0 flex-1 px-1.5 text-center font-medium"
                          placeholder="H"
                          value={dimH}
                          onChange={(e) => updateDims(dimL, dimW, e.target.value, dimensionUnit)}
                          aria-label="Height"
                        />
                        <select
                          className="input shrink-0 !pl-2.5 !pr-7 !text-left font-medium"
                          style={{ width: "84px", minWidth: "84px", maxWidth: "84px", flex: "0 0 84px" }}
                          value={dimensionUnit}
                          onChange={(e) => updateDims(dimL, dimW, dimH, e.target.value as DimensionUnit)}
                          aria-label="Dimension unit"
                        >
                          <option value="cm">cm</option>
                          <option value="mm">mm</option>
                          <option value="in">in</option>
                          <option value="m">m</option>
                        </select>
                      </div>
                    </div>
                    <div className="min-w-0">
                      <label className="label">Storage Location</label>
                      <select className="input" value={location} onChange={(e) => setLocation(e.target.value)}>
                        {WAREHOUSE_LOCATIONS.map((l) => <option key={l}>{l}</option>)}
                      </select>
                    </div>
                  </div>

                  {catAttrs.length > 0 && (
                    <Fragment>
                      <div className="mt-5 mb-3 border-t border-stone-100 pt-4 text-[11px] font-bold uppercase tracking-[0.14em] text-stone-500">
                        Controlled attributes · {leaf?.name}
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        {catAttrs.map((a) => (
                          <div key={a.id}>
                            <label className="label">
                              {a.name} {a.required && <span className="text-rose-500">*</span>}
                            </label>
                            {a.inputType === "select" && a.options?.length ? (
                              <select
                                className="input"
                                value={attrVals[a.name] ?? ""}
                                onChange={(e) => setAttrVals((s) => ({ ...s, [a.name]: e.target.value }))}
                              >
                                <option value="">— select —</option>
                                {a.options.map((o) => <option key={o} value={o}>{o}</option>)}
                              </select>
                            ) : (
                              <input
                                className="input"
                                value={attrVals[a.name] ?? ""}
                                onChange={(e) => setAttrVals((s) => ({ ...s, [a.name]: e.target.value }))}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </Fragment>
                  )}
                </div>
              </div>
            )}

            {/* ---------------- STEP 3 · INSPECTION ---------------- */}
            {step === 3 && (
              <div className="space-y-4">
                {/* 1. Categorized Checklist at the top */}
                <div className="card p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <h3 className="font-display text-xl font-semibold text-stone-900">Inspection Checklist</h3>
                      <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-semibold text-stone-600">
                        {answered}/{categorizedChecklist.length} inspected
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleMarkAllPass(categorizedChecklist.length)}
                      className="btn-ghost h-9 text-[12.5px]"
                    >
                      <Check className="h-4 w-4" /> Mark all pass
                    </button>
                  </div>

                  <div className="mt-4 space-y-4">
                    {CHECKLIST_CATEGORIES.map((cat) => {
                      const catKey = cat.key;
                      const itemsInCat = categorizedChecklist
                        .map((item, ix) => ({ ...item, ix }))
                        .filter((entry) => (entry.category ?? "surface") === catKey);
                      if (!itemsInCat.length) return null;
                      const passedInCat = itemsInCat.filter((x) => checks[x.ix] === "pass").length;
                      const flaggedInCat = itemsInCat.filter((x) => checks[x.ix] === "flag").length;
                      const failedInCat = itemsInCat.filter((x) => checks[x.ix] === "fail").length;
                      return (
                        <div key={catKey} className="rounded-2xl border border-stone-200/80 bg-stone-50/40 p-3.5 sm:p-4">
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200/60 pb-2.5">
                            <div>
                              <div className="flex items-center gap-2 font-display text-[15px] font-bold text-stone-900">
                                {catKey === "surface" && <Layers className="h-4 w-4 text-amber-600" />}
                                {catKey === "structure" && <ShieldCheck className="h-4 w-4 text-blue-600" />}
                                {catKey === "function" && <Settings className="h-4 w-4 text-emerald-600" />}
                                {catKey === "completeness" && <CheckSquare className="h-4 w-4 text-purple-600" />}
                                {cat.label}
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] font-medium">
                              <span className="rounded-md bg-emerald-100/70 px-1.5 py-0.5 text-emerald-800">{passedInCat} pass</span>
                              {flaggedInCat > 0 && <span className="rounded-md bg-amber-100/70 px-1.5 py-0.5 text-amber-800">{flaggedInCat} flag</span>}
                              {failedInCat > 0 && <span className="rounded-md bg-rose-100/70 px-1.5 py-0.5 text-rose-800">{failedInCat} fail</span>}
                            </div>
                          </div>
                          <div className="mt-3 space-y-2">
                            {itemsInCat.map(({ ix, label }) => {
                              const cur = checks[ix];
                              return (
                                <div key={ix} className="flex flex-wrap items-center gap-3 rounded-xl border border-stone-100 bg-white px-3.5 py-2.5 shadow-sm">
                                  <span className="flex-1 text-[13.5px] text-stone-700">{label}</span>
                                  <div className="flex overflow-hidden rounded-lg border border-stone-200 bg-stone-50">
                                    {(["pass", "flag", "fail"] as const).map((s) => (
                                      <button
                                        key={s}
                                        type="button"
                                        onClick={() => handleCheck(ix, s)}
                                        className={cn(
                                          "px-3 py-1.5 text-[12px] font-semibold capitalize transition",
                                          cur === s
                                            ? s === "pass"
                                              ? "bg-emerald-600 text-white shadow-sm"
                                              : s === "flag"
                                              ? "bg-amber-500 text-white shadow-sm"
                                              : "bg-rose-600 text-white shadow-sm"
                                            : "text-stone-400 hover:bg-stone-100 hover:text-stone-700"
                                        )}
                                      >
                                        {s}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Condition Grade & Valuation */}
                <div className="card p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="font-display text-xl font-semibold text-stone-900">Condition Grade & Valuation</h3>
                    </div>
                    {gradeOverridden && (
                      <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-900">
                        Manually overridden
                      </span>
                    )}
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-4">
                    {GRADE_ORDER.map((g) => {
                      const meta = GRADE_META[g];
                      const theme = GRADE_CARD_THEMES[g];
                      const active = effectiveGrade === g;
                      return (
                        <button
                          key={g}
                          type="button"
                          onClick={() => handleSelectGrade(g)}
                          className={cn(
                            "rounded-2xl border p-3.5 text-left transition relative",
                            active
                              ? theme.activeCard
                              : "border-[var(--line)] bg-white hover:border-stone-300"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span className={cn("chip shadow-sm", theme.chip)}>{g}</span>
                            {active && <CheckCircle2 className={cn("h-4 w-4", theme.checkColor)} />}
                          </div>
                          <div className="mt-2 text-[13.5px] font-bold text-stone-900">{meta.tagline}</div>
                          <div className="mt-1 text-[10.5px] font-semibold uppercase tracking-wide text-stone-400">
                            resells at {Math.round(meta.band[0] * 100)}–{Math.round(meta.band[1] * 100)}% of new
                          </div>
                          <p className="mt-1.5 text-[11.5px] leading-snug text-stone-500">{meta.description}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Condition Notes */}
                <div className="card p-5">
                  <label className="label font-display text-base font-semibold text-stone-900">Condition Notes</label>
                  <textarea
                    className="input min-h-[90px]"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Anything a buyer should know — scratches, replaced parts, wobble…"
                  />
                </div>
              </div>
            )}

            {/* ---------------- STEP 4 · PRICING & PUBLISH ---------------- */}
            {step === 4 && (
              <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                {/* Left Column: Valuation Engine & Margin Calculator */}
                <div className="space-y-4">
                  {/* Valuation Engine */}
                  <div className="card p-5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">Algorithmic baseline</span>
                      <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-[11px] font-semibold text-stone-600">
                        Tier: {tier.name} ({tier.multiplier}×)
                      </span>
                    </div>
                    <div className="mt-3 flex items-baseline gap-3">
                      <span className="font-display text-3xl font-bold tracking-tight text-stone-900">
                        {v.suggested ? fmtMoney(v.suggested) : "—"}
                      </span>
                      {v.band && (
                        <span className="text-xs text-stone-500">
                          band {fmtMoney(v.band[0])} – {fmtMoney(v.band[1])}
                        </span>
                      )}
                    </div>
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[12px] text-stone-500">
                      <div>Base catalog ref: <span className="font-semibold text-stone-700">{baseValue ? fmtMoney(baseValue) : "—"}</span></div>
                      <div>Floor (cost × 1.18): <span className="font-semibold text-stone-700">{fmtMoney(floor)}</span></div>
                    </div>
                  </div>

                  {/* Margin Calculator (Moved directly under Valuation Engine, without subtitle) */}
                  <div className="card p-5">
                    <h3 className="font-display text-xl font-semibold text-stone-900">Margin Calculator</h3>
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div className="min-w-0">
                        <label className="label truncate">Acquisition</label>
                        <div className="input flex h-10 items-center bg-stone-50 tabular-nums text-stone-600 font-medium">{fmtMoney(acqNum)}</div>
                      </div>
                      <div className="min-w-0">
                        <label className="label truncate">Refurb</label>
                        <div className="relative">
                          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-stone-400">₱</span>
                          <input
                            className="input pl-8 font-medium tabular-nums"
                            type="number"
                            min={0}
                            value={refurb}
                            onChange={(e) => setRefurb(e.target.value)}
                            placeholder="0"
                          />
                        </div>
                      </div>
                      <div className="min-w-0">
                        <label className="label truncate">Cleaning</label>
                        <div className="relative">
                          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-stone-400">₱</span>
                          <input
                            className="input pl-8 font-medium tabular-nums"
                            type="number"
                            min={0}
                            value={cleaning}
                            onChange={(e) => setCleaning(e.target.value)}
                            placeholder="0"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="mt-3.5">
                      <label className="label">Ask price</label>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <div className="relative flex-1">
                          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-stone-400">₱</span>
                          <input
                            className="input pl-8 text-base sm:text-lg font-semibold tabular-nums"
                            type="number"
                            min={0}
                            value={price}
                            onChange={(e) => { setPrice(e.target.value); setPriceTouched(true); }}
                            placeholder={suggested ? String(suggested) : "0"}
                          />
                        </div>
                        {suggested != null && priceNum !== suggested && (
                          <button
                            type="button"
                            onClick={() => { setPrice(String(suggested)); setPriceTouched(true); }}
                            className="btn-soft h-10 shrink-0 px-3 text-xs sm:text-[13px]"
                          >
                            Use {fmtMoney(suggested)}
                          </button>
                        )}
                      </div>
                    </div>
                    {priceNum > 0 && (
                      <div className="mt-3 grid grid-cols-3 gap-1.5 sm:gap-2 text-center">
                        {[
                          ["Margin", acqNum + refurbNum + cleaningNum > 0 ? `${Math.round((priceNum / (acqNum + refurbNum + cleaningNum) - 1) * 100)}%` : "—"],
                          ["Gross profit", fmtMoney(priceNum - acqNum - refurbNum - cleaningNum)],
                          ["vs benchmark", v.benchmark ? `${priceNum >= v.benchmark ? "+" : ""}${Math.round((priceNum / v.benchmark - 1) * 100)}%` : "—"],
                        ].map(([l, r]) => (
                          <div key={l} className="rounded-xl bg-stone-50 px-2 py-2.5 min-w-0" title={`${l}: ${r}`}>
                            <div className="text-[10px] sm:text-[10.5px] font-bold uppercase tracking-wider text-stone-400 truncate">{l}</div>
                            <div className="mt-0.5 font-display text-[13px] sm:text-[15px] md:text-[17px] font-bold tabular-nums text-stone-900 truncate">{r}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    {priceTouched && priceNum > 0 && priceNum < floor && (
                      <div className="mt-3 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-[12px] sm:text-[12.5px] text-rose-700">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                        Below the enforced price floor of {fmtMoney(floor)}. Listing is blocked until the ask is raised.
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column: Historical Comparables, Refurb Budget & Publish/Routing */}
                <div className="space-y-4">
                  {/* Historical Comparables */}
                  <div className="card p-5">
                    <div className="flex items-center justify-between">
                      <h4 className="font-display text-base font-semibold text-stone-900">Historical Comparables</h4>
                      <span className="text-xs text-stone-400">{history.count} match(es)</span>
                    </div>
                    {history.rows.length ? (
                      <Fragment>
                        <div className="mt-2 text-xs text-stone-500">
                          Avg sold price: <span className="font-semibold text-stone-800">{history.avg ? fmtMoney(history.avg) : "—"}</span>
                          {history.min && history.max && (
                            <span className="ml-2 text-stone-400">({fmtMoney(history.min)} – {fmtMoney(history.max)})</span>
                          )}
                        </div>
                        <div className="mt-3 divide-y divide-stone-100">
                          {history.rows.map((r) => (
                            <div key={r.id} className="flex items-center justify-between py-2 text-xs">
                              <span className="truncate text-stone-700">{r.name}</span>
                              <span className="shrink-0 text-stone-500">
                                <span className="font-semibold text-stone-800">{fmtMoney(r.soldPrice)}</span>
                                <span className="ml-1.5">{relTime(r.soldAt)}</span>
                              </span>
                            </div>
                          ))}
                        </div>
                      </Fragment>
                    ) : (
                      <p className="mt-2 text-xs text-stone-400">No comparables found.</p>
                    )}
                  </div>

                  {/* Refurbishment & Repair Budget */}
                  <div className="card p-5">
                    <h3 className="font-display text-xl font-semibold text-stone-900">Refurbishment & Repair Budget</h3>
                    <p className="mb-4 mt-1 text-[13px] text-stone-500">
                      Estimated cost for steam cleaning, parts replacement, upholstery, re-veneering, or technician labor.
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="label">Refurb budget</label>
                        <div className="relative">
                          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-stone-400">₱</span>
                          <input
                            className="input pl-8 font-medium tabular-nums"
                            type="number"
                            min={0}
                            value={refurb}
                            onChange={(e) => setRefurb(e.target.value)}
                            placeholder="0"
                          />
                        </div>
                        <p className="mt-1.5 text-[11px] text-stone-400">Added to floor cost calculation (1.18× multiplier).</p>
                      </div>
                      <div className="rounded-xl border border-stone-200 bg-stone-50/70 p-3.5">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-stone-400">Total invested unit cost</div>
                        <div className="mt-1 font-display text-2xl font-bold tabular-nums text-stone-900">
                          {fmtMoney(acqNum + refurbNum + cleaningNum)}
                        </div>
                        <div className="mt-1 text-[11.5px] text-stone-500">
                          Acquisition ({fmtMoney(acqNum)}) + Refurb ({fmtMoney(refurbNum)}) + Cleaning ({fmtMoney(cleaningNum)})
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Publish & Routing */}
                  <div className="card p-5">
                    <h3 className="font-display text-xl font-semibold text-stone-900">Publish & Routing</h3>
                    <div className="mt-3 space-y-2">
                      {([
                        {
                          k: "intake",
                          t: "Keep in intake queue",
                          d: "Park it; pricing, photos, or inspection details can be finished later.",
                          rec: false,
                          recLabel: "",
                        },
                        {
                          k: "for_cleaning",
                          t: "For cleaning",
                          d: "Route to cleaning team for steam cleaning, wipe-down, and sanitization before sale.",
                          rec: effectiveGrade === "A" || effectiveGrade === "B",
                          recLabel: "Recommended for Grade A & B",
                        },
                        {
                          k: "for_refurb",
                          t: "For cleaning & refurbishing",
                          d: "Route to technician queue for mechanical repairs, part replacement, and refurbishing.",
                          rec: effectiveGrade === "B" || effectiveGrade === "C",
                          recLabel: "Recommended for Grade B & C",
                        },
                      ] as const).map((o) => (
                        <button
                          key={o.k}
                          type="button"
                          onClick={() => setListMode(o.k)}
                          className={cn(
                            "flex w-full items-start gap-3 rounded-xl border p-3.5 text-left transition",
                            listMode === o.k ? "border-amber-500 bg-amber-50/50 ring-1 ring-amber-500/40" : "border-[var(--line)] hover:border-stone-300"
                          )}
                        >
                          <span className={cn("mt-0.5 h-3.5 w-3.5 rounded-full border-2 shrink-0", listMode === o.k ? "border-amber-600 bg-amber-600" : "border-stone-300")} />
                          <span className="flex-1">
                            <span className="flex flex-wrap items-center gap-2">
                              <span className="block text-[13.5px] font-semibold text-stone-900">{o.t}</span>
                              {o.rec && (
                                <span className="rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-bold text-teal-800">
                                  {o.recLabel}
                                </span>
                              )}
                            </span>
                            <span className="mt-0.5 block text-[12px] leading-snug text-stone-500">{o.d}</span>
                          </span>
                        </button>
                      ))}
                    </div>

                    {/* Picture thumbnail here */}
                    <div className="mt-4 flex items-center gap-3 rounded-xl bg-stone-50 p-3">
                      <div className="relative shrink-0">
                        <Thumb url={photos.front || photos.back || defectPhotos[0]?.url} alt="" className="h-12 w-16 rounded-lg border border-stone-200 object-cover" />
                      </div>
                      <div className="min-w-0 text-[12.5px]">
                        <div className="truncate font-semibold text-stone-900">{name || "Unnamed item"}</div>
                        <div className="mt-0.5 truncate text-stone-500">{leaf ? pathOfLeaf(leaf) : "—"}</div>
                        <div className="mt-1 flex items-center gap-1.5">
                          <GradeChip grade={effectiveGrade} />
                          {photos.front ? (
                            <span className="text-[11px] font-medium text-emerald-700">• Front photo ready</span>
                          ) : hasAnyMedia ? (
                            <span className="text-[11px] text-emerald-700">• Media uploaded</span>
                          ) : (
                            <span className="text-[11px] text-stone-400">• Front photo</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {error && (
                      <div className="mt-3 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-[12.5px] text-rose-700">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
                      </div>
                    )}

                    <button
                      onClick={submit}
                      disabled={saving}
                      className="btn-accent mt-4 w-full"
                    >
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      {saving ? "Logging unit…" : "Log into inventory"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* footer nav */}
        <div className="mt-4 flex items-center justify-between">
          <button onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0} className="btn-ghost">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <div className="text-[11.5px] tabular-nums text-stone-400">Step {step + 1} of {STEPS.length}</div>
          {step < STEPS.length - 1 ? (
            <button onClick={() => canContinue && setStep((s) => s + 1)} disabled={!canContinue} className="btn-primary">
              Continue <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <span className="w-[118px]" />
          )}
        </div>
        {step === 0 && !hasAnyMedia && (
          <p className="mt-2 flex items-center justify-end gap-1.5 text-[12px] font-medium text-amber-700">
            <AlertTriangle className="h-3.5 w-3.5" /> Media upload is required to continue
          </p>
        )}
        {step > 0 && step < STEPS.length - 1 && !canContinue && (
          <p className="mt-2 flex items-center justify-end gap-1.5 text-[11.5px] text-stone-400">
            <X className="h-3 w-3" /> Complete the required fields above to continue
          </p>
        )}
      </div>
    </div>
  );
}
