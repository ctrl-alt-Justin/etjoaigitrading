"use client";

import { Fragment, useMemo, useRef, useState } from "react";
import Link from "next/link";
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
  ChevronRight,
  CircleDot,
  Factory,
  ImageIcon,
  Loader2,
  Plus,
  ShieldCheck,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import type { DbCategory, DbCategoryAttribute, Grade } from "@/db/schema";
import {
  GRADE_META,
  GRADE_ORDER,
  brandTier,
  computeFloor,
  valuate,
} from "@/lib/valuation";
import { PHOTO_SLOTS, WAREHOUSE_LOCATIONS, checklistFor, refPhotoFor } from "@/lib/taxonomy-data";
import { cn, fmtMoney, relTime } from "@/lib/format";
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

const STEPS = ["Category", "Identity", "Inspection", "Photos", "Pricing & publish"];

const COLORS = [
  "Black", "Graphite", "White", "Grey", "Walnut", "Oak", "Birch", "Cherry",
  "Maple", "Beige", "Navy", "Burgundy", "Forest", "Tan", "Aluminium",
];

/* ------------------------------------------------------------------ */

function ComboInput({
  value,
  onChange,
  suggestions,
  placeholder,
  icon: Icon,
}: {
  value: string;
  onChange: (v: string) => void;
  suggestions: string[];
  placeholder?: string;
  icon?: typeof Factory;
}) {
  const [open, setOpen] = useState(false);
  const filtered = useMemo(() => {
    const q = value.trim().toLowerCase();
    const list = q ? suggestions.filter((s) => s.toLowerCase().includes(q)) : suggestions;
    return list.filter((s) => s.toLowerCase() !== q).slice(0, 7);
  }, [value, suggestions]);
  return (
    <div className="relative">
      {Icon && (
        <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
      )}
      <input
        className={cn("input", Icon && "pl-9")}
        value={value}
        placeholder={placeholder}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 140)}
      />
      {open && filtered.length > 0 && (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 overflow-hidden rounded-xl border border-stone-200 bg-white shadow-xl">
          <div className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-[0.14em] text-stone-400">
            Suggestions
          </div>
          {filtered.map((s) => (
            <button
              key={s}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(s);
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-stone-700 transition hover:bg-amber-50"
            >
              <Sparkles className="h-3 w-3 text-stone-300" />
              {s}
            </button>
          ))}
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
}: {
  categories: DbCategory[];
  attributes: DbCategoryAttribute[];
  suppliers: SupplierLite[];
  soldRefs: SoldRef[];
  brands: string[];
  brandModels: Record<string, string[]>;
}) {
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
  const [step, setStep] = useState(0);
  const [rootId, setRootId] = useState<number | null>(null);
  const [leafId, setLeafId] = useState<number | null>(null);
  const [catQuery, setCatQuery] = useState("");

  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [name, setName] = useState("");
  const [nameTouched, setNameTouched] = useState(false);
  const [attrVals, setAttrVals] = useState<Record<string, string>>({});
  const [color, setColor] = useState("");
  const [material, setMaterial] = useState("");
  const [dimensions, setDimensions] = useState("");
  const [sups, setSups] = useState<SupplierLite[]>(suppliers);
  const [supplierId, setSupplierId] = useState<number | "">("");
  const [newSup, setNewSup] = useState<{ open: boolean; name: string; channel: string; contact: string; busy: boolean }>({ open: false, name: "", channel: "Direct", contact: "", busy: false });
  const [location, setLocation] = useState(WAREHOUSE_LOCATIONS[0]);
  const [acq, setAcq] = useState("");
  const [refurb, setRefurb] = useState("");

  const [grade, setGrade] = useState<Grade | null>(null);
  const [checks, setChecks] = useState<Record<number, "pass" | "flag" | "fail">>({});
  const [notes, setNotes] = useState("");

  const [photos, setPhotos] = useState<Record<string, string | null>>({});
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const [listMode, setListMode] = useState<"intake" | "stock" | "listed">("stock");
  const [price, setPrice] = useState("");
  const [priceTouched, setPriceTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ id: number; sku: string } | null>(null);

  /* ---- derived ---- */
  const leaf = leafId != null ? byId.get(leafId) ?? null : null;
  const root = leafId != null ? rootOf(leafId) : null;
  const rootSlug = root?.slug ?? "";
  const baseValue = leafId != null ? baseOf(leafId) : null;
  const checkList = useMemo(() => checklistFor(rootSlug), [rootSlug]);
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

  const v = useMemo(() => valuate({ baseValue, brand, grade }), [baseValue, brand, grade]);
  const tier = brandTier(brand);
  const acqNum = Number(acq) || 0;
  const refurbNum = Number(refurb) || 0;
  const floor = computeFloor(acqNum, refurbNum);
  const suggested = v.suggested ? Math.max(floor, v.suggested) : floor || null;
  const priceNum = Number(price) || 0;

  const history = useMemo(() => {
    const same = soldRefs
      .filter((r) => r.rootSlug === rootSlug && r.soldPrice)
      .map((r) => {
        let score = 0;
        if (leafId && r.categoryId === leafId) score += 2;
        if (brand && r.brand && r.brand.toLowerCase() === brand.toLowerCase()) score += 2;
        if (grade && r.grade === grade) score += 1;
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
  }, [soldRefs, rootSlug, leafId, brand, grade]);

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
  const answered = checkList.filter((_, ix) => checks[ix] != null).length;
  const requiredPhotos = PHOTO_SLOTS.filter((s) => s.required);
  const photosOk = requiredPhotos.every((s) => photos[s.slot]);
  const mustAttrsOk = catAttrs.filter((a) => a.required).every((a) => (attrVals[a.name] ?? "").trim() !== "");
  const canContinue = [
    leafId != null,
    name.trim().length > 1 && acqNum > 0 && mustAttrsOk,
    grade != null && answered === checkList.length,
    photosOk,
    listMode !== "listed" ? true : priceNum >= floor && priceNum > 0,
  ][step];

  const syncName = (b: string, m: string) => {
    if (!nameTouched) setName([b, m].filter(Boolean).join(" "));
  };

  const onFile = (slot: string, f: File | undefined) => {
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setPhotos((p) => ({ ...p, [slot]: String(reader.result) }));
    reader.readAsDataURL(f);
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
      const res = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          brand: brand.trim() || null,
          model: model.trim() || null,
          categoryId: leafId,
          attributes: attrVals,
          color: color.trim() || null,
          material: material.trim() || null,
          dimensions: dimensions.trim() || null,
          grade,
          checklist: checkList.map((label, ix) => ({ key: `c${ix}`, label, status: checks[ix] })),
          photos: PHOTO_SLOTS.filter((s) => photos[s.slot]).map((s) => ({
            slot: s.slot,
            label: s.label,
            url: photos[s.slot]!,
          })),
          conditionNotes: notes.trim() || null,
          acquisitionCost: acqNum,
          refurbCost: refurbNum,
          listedPrice: listMode === "listed" ? priceNum : listMode === "stock" ? priceNum || null : null,
          status: listMode === "listed" ? "listed" : listMode === "stock" ? "in_stock" : "intake",
          supplierId: supplierId === "" ? null : supplierId,
          location,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 409 && data.error === "BELOW_FLOOR") {
        setError(`Price floor enforced — the ask must be at least ${fmtMoney(data.floor)} for this unit.`);
        setStep(4);
      } else if (!res.ok) {
        setError(data.error ?? "Could not save the item. Please try again.");
      } else {
        setResult({ id: data.id, sku: data.sku });
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
    setAttrVals({}); setColor(""); setMaterial(""); setDimensions("");
    setSupplierId(""); setAcq(""); setRefurb(""); setGrade(null);
    setChecks({}); setNotes(""); setPhotos({}); setListMode("stock");
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
          Logged into the book
        </h2>
        <p className="mt-1.5 text-sm text-stone-500">
          <span className="font-semibold text-stone-800">{name}</span> is now tracked as{" "}
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
            {/* ---------------- STEP 0 · CATEGORY ---------------- */}
            {step === 0 && (
              <div className="card p-5">
                <h3 className="font-display text-xl font-semibold text-stone-900">What is it?</h3>
                <p className="mb-4 mt-1 text-[13px] text-stone-500">
                  One controlled taxonomy for the whole company. Pick the leaf category, or fuzzy-search the tree.
                </p>
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
                    {baseValue && (
                      <span className="ml-auto text-[12px] tabular-nums">
                        valuation reference <span className="font-bold">{fmtMoney(baseValue)}</span>
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ---------------- STEP 1 · IDENTITY ---------------- */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="card p-5">
                  <h3 className="font-display text-xl font-semibold text-stone-900">Identity & acquisition</h3>
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
                      <p className="mt-1.5 text-[11px] text-stone-400">
                        Valuation tier: <span className="font-semibold text-stone-600">{tier.name} ×{tier.multiplier}</span>
                      </p>
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
                      <input className="input" value={material} onChange={(e) => setMaterial(e.target.value)} placeholder="Mesh, veneer, steel…" />
                    </div>
                    <div>
                      <label className="label">Dimensions <span className="font-normal normal-case tracking-normal text-stone-300">(optional)</span></label>
                      <input className="input" value={dimensions} onChange={(e) => setDimensions(e.target.value)} placeholder="W 160 × D 80 × H 74 cm" />
                    </div>
                    <div>
                      <label className="label">Storage location</label>
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

                <div className="card p-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="label">Source / supplier</label>
                      <div className="flex gap-2">
                        <select className="input" value={supplierId} onChange={(e) => setSupplierId(e.target.value ? Number(e.target.value) : "")}>
                          <option value="">— unassigned —</option>
                          {sups.map((s) => <option key={s.id} value={s.id}>{s.name} · {s.channel}</option>)}
                        </select>
                        <button type="button" onClick={() => setNewSup((s) => ({ ...s, open: !s.open }))} className="btn-ghost shrink-0 px-3" title="Add supplier">
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      {newSup.open && (
                        <div className="mt-2.5 space-y-2 rounded-xl border border-[var(--line)] bg-stone-50/70 p-3">
                          <input className="input" placeholder="Supplier name" value={newSup.name} onChange={(e) => setNewSup((s) => ({ ...s, name: e.target.value }))} />
                          <div className="grid grid-cols-2 gap-2">
                            <select className="input" value={newSup.channel} onChange={(e) => setNewSup((s) => ({ ...s, channel: e.target.value }))}>
                              {["Liquidation", "Downsizing", "Auction", "Lease return", "Direct", "Institutional"].map((c) => <option key={c}>{c}</option>)}
                            </select>
                            <input className="input" placeholder="Contact person" value={newSup.contact} onChange={(e) => setNewSup((s) => ({ ...s, contact: e.target.value }))} />
                          </div>
                          <button type="button" onClick={addSupplier} disabled={newSup.busy || !newSup.name.trim()} className="btn-soft h-9 w-full text-[13px]">
                            {newSup.busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Save supplier
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="label">Acquisition cost *</label>
                        <input className="input" type="number" min={0} value={acq} onChange={(e) => setAcq(e.target.value)} placeholder="0" />
                      </div>
                      <div>
                        <label className="label">Refurb budget</label>
                        <input className="input" type="number" min={0} value={refurb} onChange={(e) => setRefurb(e.target.value)} placeholder="0" />
                      </div>
                    </div>
                  </div>
                  {floor > 0 && (
                    <p className="mt-3 flex items-center gap-1.5 text-[12px] text-stone-500">
                      <ShieldCheck className="h-3.5 w-3.5 text-amber-600" />
                      Price floor will be enforced at <span className="font-semibold text-stone-800">{fmtMoney(floor)}</span> (effective cost × 1.18)
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* ---------------- STEP 2 · INSPECTION ---------------- */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="card p-5">
                  <h3 className="font-display text-xl font-semibold text-stone-900">Condition grade</h3>
                  <p className="mb-4 mt-1 text-[13px] text-stone-500">One scale for the whole company — no more “looks fine to me”.</p>
                  <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
                    {GRADE_ORDER.map((g) => {
                      const meta = GRADE_META[g];
                      const active = grade === g;
                      return (
                        <button
                          key={g}
                          onClick={() => setGrade(g)}
                          className={cn(
                            "rounded-2xl border p-3.5 text-left transition",
                            active
                              ? "border-amber-500 bg-amber-50/60 ring-2 ring-amber-500/40"
                              : "border-[var(--line)] bg-white hover:border-stone-300"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span className={cn("chip", meta.chip)}>{g}</span>
                            {active && <CheckCircle2 className="h-4 w-4 text-amber-600" />}
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

                <div className="card p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="font-display text-xl font-semibold text-stone-900">Inspection checklist</h3>
                      <p className="mt-1 text-[13px] text-stone-500">
                        {root?.name ?? "Item"} standard · {answered}/{checkList.length} inspected
                      </p>
                    </div>
                    <button
                      onClick={() => setChecks(Object.fromEntries(checkList.map((_, ix) => [ix, "pass"])))}
                      className="btn-ghost h-9 text-[12.5px]"
                    >
                      <Check className="h-4 w-4" /> Mark all pass
                    </button>
                  </div>
                  <div className="mt-4 space-y-2">
                    {checkList.map((label, ix) => {
                      const cur = checks[ix];
                      return (
                        <div key={label} className="flex flex-wrap items-center gap-3 rounded-xl border border-stone-100 bg-stone-50/50 px-3.5 py-2.5">
                          <span className="flex-1 text-[13.5px] text-stone-700">{label}</span>
                          <div className="flex overflow-hidden rounded-lg border border-stone-200 bg-white">
                            {(["pass", "flag", "fail"] as const).map((s) => (
                              <button
                                key={s}
                                onClick={() => setChecks((c) => ({ ...c, [ix]: s }))}
                                className={cn(
                                  "px-3 py-1.5 text-[12px] font-semibold capitalize transition",
                                  cur === s
                                    ? s === "pass" ? "bg-emerald-600 text-white" : s === "flag" ? "bg-amber-500 text-white" : "bg-rose-600 text-white"
                                    : "text-stone-400 hover:bg-stone-50"
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
                  <div className="mt-4">
                    <label className="label">Condition notes</label>
                    <textarea
                      className="input"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Anything a buyer should know — scratches, replaced parts, wobble…"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ---------------- STEP 3 · PHOTOS ---------------- */}
            {step === 3 && (
              <div className="card p-5">
                <h3 className="font-display text-xl font-semibold text-stone-900">Photo capture</h3>
                <p className="mb-4 mt-1 text-[13px] text-stone-500">
                  Required angles for a sellable listing. Upload from the device, or use the studio reference shot for this category.
                </p>
                <div className="grid gap-3.5 sm:grid-cols-2">
                  {PHOTO_SLOTS.map((s) => {
                    const url = photos[s.slot];
                    return (
                      <div key={s.slot} className={cn("overflow-hidden rounded-2xl border", url ? "border-[var(--line)]" : "border-dashed border-stone-300")}>
                        {url ? (
                          <div className="relative">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={url} alt={s.label} className="aspect-[4/3] w-full object-cover" />
                            <button
                              onClick={() => setPhotos((p) => ({ ...p, [s.slot]: null }))}
                              className="absolute right-2.5 top-2.5 rounded-full bg-stone-950/60 p-1.5 text-white backdrop-blur transition hover:bg-stone-950/80"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                            <div className="absolute bottom-2.5 left-2.5 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold text-stone-800 backdrop-blur">
                              {s.label}
                            </div>
                          </div>
                        ) : (
                          <div className="flex aspect-[4/3] flex-col items-center justify-center gap-2.5 bg-stone-50/60 p-5 text-center">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-stone-400 shadow-sm">
                              <Camera className="h-5 w-5" strokeWidth={1.8} />
                            </div>
                            <div className="text-[13px] font-bold text-stone-700">
                              {s.label} {s.required ? <span className="text-rose-500">*</span> : <span className="font-medium text-stone-400">(optional)</span>}
                            </div>
                            <p className="text-[11.5px] leading-snug text-stone-400">{s.hint}</p>
                            <div className="mt-1 flex gap-2">
                              <button onClick={() => fileRefs.current[s.slot]?.click()} className="btn-ghost h-9 px-3 text-[12.5px]">
                                <ImageIcon className="h-4 w-4" /> Upload
                              </button>
                              {leaf && (
                                <button
                                  onClick={() => setPhotos((p) => ({ ...p, [s.slot]: refPhotoFor(leaf.slug) }))}
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
                          onChange={(e) => onFile(s.slot, e.target.files?.[0])}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ---------------- STEP 4 · PRICING ---------------- */}
            {step === 4 && (
              <div className="grid gap-4 xl:grid-cols-2">
                <div className="space-y-4">
                  <div className="card p-5">
                    <h3 className="font-display text-xl font-semibold text-stone-900">Valuation engine</h3>
                    <div className="mt-3 space-y-2 text-[13px]">
                      {[
                        ["Category reference (new)", baseValue ? fmtMoney(baseValue) : "—", false],
                        [`Brand tier · ${tier.name}`, `× ${tier.multiplier}`, false],
                        [`Grade band · ${grade ?? "—"}`, v.band ? `${Math.round(v.band[0] * 100)}–${Math.round(v.band[1] * 100)}%` : "—", false],
                      ].map(([l, r]) => (
                        <div key={String(l)} className="flex items-center justify-between border-b border-dashed border-stone-100 pb-2">
                          <span className="text-stone-500">{l}</span>
                          <span className="font-semibold tabular-nums text-stone-800">{r}</span>
                        </div>
                      ))}
                      <div className="flex items-center justify-between rounded-xl bg-amber-50 px-3 py-2.5">
                        <span className="font-semibold text-amber-900">Auto base value range</span>
                        <span className="font-display text-[17px] font-bold tabular-nums text-amber-900">
                          {v.low != null ? `${fmtMoney(v.low)} – ${fmtMoney(v.high)}` : "—"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between px-1 pt-1 text-stone-500">
                        <span>Market benchmark</span>
                        <span className="font-semibold tabular-nums text-indigo-700">{fmtMoney(v.benchmark)}</span>
                      </div>
                      <div className="flex items-center justify-between px-1 text-stone-500">
                        <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-amber-600" /> Enforced floor</span>
                        <span className="font-semibold tabular-nums text-rose-600">{fmtMoney(floor)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="card p-5">
                    <h4 className="text-[11px] font-bold uppercase tracking-[0.14em] text-stone-500">From your sold history</h4>
                    {history.count ? (
                      <Fragment>
                        <div className="mt-2.5 flex flex-wrap gap-1.5 text-[12px]">
                          <span className="chip border-stone-200 bg-stone-50 text-stone-600">{history.count} comparable{history.count === 1 ? "" : "s"}</span>
                          <span className="chip border-stone-200 bg-stone-50 text-stone-700">avg {fmtMoney(history.avg)}</span>
                          <span className="chip border-stone-200 bg-stone-50 text-stone-500">{fmtMoney(history.min)} – {fmtMoney(history.max)}</span>
                        </div>
                        <div className="mt-3 space-y-2">
                          {history.rows.map((r) => (
                            <div key={r.id} className="flex items-center justify-between gap-2 text-[12.5px]">
                              <span className="min-w-0 truncate text-stone-600">
                                {r.name}
                                <span className="ml-1.5 text-stone-300">{r.grade}</span>
                              </span>
                              <span className="shrink-0 tabular-nums text-stone-500">
                                <span className="font-semibold text-stone-800">{fmtMoney(r.soldPrice)}</span>
                                <span className="ml-1.5">{relTime(r.soldAt)}</span>
                              </span>
                            </div>
                          ))}
                        </div>
                      </Fragment>
                    ) : (
                      <p className="mt-2 text-[12.5px] text-stone-400">No close comparables sold yet in this family — the valuation band is the reference.</p>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="card p-5">
                    <h3 className="font-display text-xl font-semibold text-stone-900">Margin calculator</h3>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <div>
                        <label className="label">Acquisition</label>
                        <div className="input flex h-10 items-center bg-stone-50 tabular-nums text-stone-600">{fmtMoney(acqNum)}</div>
                      </div>
                      <div>
                        <label className="label">Refurb</label>
                        <div className="input flex h-10 items-center bg-stone-50 tabular-nums text-stone-600">{fmtMoney(refurbNum)}</div>
                      </div>
                    </div>
                    <div className="mt-3">
                      <label className="label">Ask price</label>
                      <div className="flex gap-2">
                        <input
                          className="input text-lg font-semibold tabular-nums"
                          type="number"
                          min={0}
                          value={price}
                          onChange={(e) => { setPrice(e.target.value); setPriceTouched(true); }}
                          placeholder={suggested ? String(suggested) : "0"}
                        />
                        {suggested != null && priceNum !== suggested && (
                          <button onClick={() => { setPrice(String(suggested)); setPriceTouched(true); }} className="btn-soft shrink-0">
                            Use {fmtMoney(suggested)}
                          </button>
                        )}
                      </div>
                    </div>
                    {priceNum > 0 && (
                      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                        {[
                          ["Margin", acqNum + refurbNum > 0 ? `${Math.round((priceNum / (acqNum + refurbNum) - 1) * 100)}%` : "—"],
                          ["Gross profit", fmtMoney(priceNum - acqNum - refurbNum)],
                          ["vs benchmark", v.benchmark ? `${priceNum >= v.benchmark ? "+" : ""}${Math.round((priceNum / v.benchmark - 1) * 100)}%` : "—"],
                        ].map(([l, r]) => (
                          <div key={l} className="rounded-xl bg-stone-50 px-2 py-2.5">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400">{l}</div>
                            <div className="mt-0.5 font-display text-[17px] font-bold tabular-nums text-stone-900">{r}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    {priceTouched && priceNum > 0 && priceNum < floor && (
                      <div className="mt-3 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-[12.5px] text-rose-700">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                        Below the enforced price floor of {fmtMoney(floor)}. Listing is blocked until the ask is raised.
                      </div>
                    )}
                  </div>

                  <div className="card p-5">
                    <h3 className="font-display text-xl font-semibold text-stone-900">Publish</h3>
                    <div className="mt-3 space-y-2">
                      {([
                        { k: "listed", t: "List for sale now", d: "Goes live on the book at the ask price above." },
                        { k: "stock", t: "Save to stock", d: "Priced and ready — list later from the item page." },
                        { k: "intake", t: "Keep in intake queue", d: "Park it; pricing can be finished by the desk later." },
                      ] as const).map((o) => (
                        <button
                          key={o.k}
                          onClick={() => setListMode(o.k)}
                          className={cn(
                            "flex w-full items-start gap-3 rounded-xl border p-3.5 text-left transition",
                            listMode === o.k ? "border-amber-500 bg-amber-50/50 ring-1 ring-amber-500/40" : "border-[var(--line)] hover:border-stone-300"
                          )}
                        >
                          <span className={cn("mt-0.5 h-3.5 w-3.5 rounded-full border-2", listMode === o.k ? "border-amber-600 bg-amber-600" : "border-stone-300")} />
                          <span>
                            <span className="block text-[13.5px] font-semibold text-stone-900">{o.t}</span>
                            <span className="mt-0.5 block text-[12px] leading-snug text-stone-500">{o.d}</span>
                          </span>
                        </button>
                      ))}
                    </div>

                    <div className="mt-4 flex items-center gap-3 rounded-xl bg-stone-50 p-3">
                      <Thumb url={photos.front} alt="" className="h-12 w-16 rounded-lg border border-stone-200" />
                      <div className="min-w-0 text-[12.5px]">
                        <div className="truncate font-semibold text-stone-900">{name || "Unnamed item"}</div>
                        <div className="mt-0.5 truncate text-stone-500">{leaf ? pathOfLeaf(leaf) : "—"}</div>
                        <div className="mt-1 flex items-center gap-1.5"><GradeChip grade={grade} /></div>
                      </div>
                    </div>

                    {error && (
                      <div className="mt-3 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-[12.5px] text-rose-700">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
                      </div>
                    )}

                    <button
                      onClick={submit}
                      disabled={saving || (listMode === "listed" && (priceNum < floor || priceNum <= 0))}
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
        {step < STEPS.length - 1 && !canContinue && (
          <p className="mt-2 flex items-center justify-end gap-1.5 text-[11.5px] text-stone-400">
            <X className="h-3 w-3" /> Complete the required fields above to continue
          </p>
        )}
      </div>
    </div>
  );
}
