"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  BadgeCheck,
  Calculator,
  Check,
  ChevronDown,
  ChevronUp,
  Info,
  Loader2,
  RotateCcw,
  Scale,
  Settings2,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Sparkles,
  TrendingDown,
  Search,
  Clock,
  ArrowRight,
  Layers,
  FolderTree,
} from "lucide-react";
import type { BenchmarkRow } from "@/lib/queries";
import {
  GRADE_ORDER,
  brandTier,
  computeFloor,
  round50,
  valuate,
  type Grade,
  calculatePricingFormula,
  DEFAULT_PRICING_CONFIG,
  PRICING_CONFIG_STORAGE_KEY,
  type PricingFormulaConfig,
} from "@/lib/valuation";
import { cn, fmtMoney } from "@/lib/format";
import { Thumb } from "./ui";

export type AlertLite = {
  id: number;
  sku: string | null;
  name: string;
  grade: Grade | null;
  photo: string | null;
  ask: number;
  days: number;
  floor: number | null;
  suggested: number | null;
  pct: number;
  tier: "watch" | "action" | "critical";
  marginAfter: number | null;
};

export type ViolationLite = {
  id: number;
  sku: string | null;
  name: string;
  ask: number;
  floor: number;
};

export type ItemOptionLite = {
  id: number;
  sku: string | null;
  name: string;
  brand: string | null;
  model: string | null;
  grade: Grade | null;
  status: string;
  acquisitionCost: number;
  refurbCost: number;
  cleaningCost: number;
  benchmarkPrice: number;
  listedPrice: number | null;
  floorPrice: number | null;
  categoryId: number | null;
};

const TIER_STYLE: Record<AlertLite["tier"], { box: string; label: string }> = {
  watch: { box: "bg-amber-50 text-amber-800 border-amber-200", label: "30–59d · −6%" },
  action: { box: "bg-orange-50 text-orange-700 border-orange-200", label: "60–89d · −12%" },
  critical: { box: "bg-rose-50 text-rose-700 border-rose-200", label: "90d+ · −20%" },
};

/* ------------------------------------------------------------------ */
/* Formula Pricing Desk Calculator                                     */
/* ------------------------------------------------------------------ */

function MarginCalculator({
  items = [],
  config,
  setConfig,
  baseOptions,
  brands,
}: {
  items?: ItemOptionLite[];
  config: PricingFormulaConfig;
  setConfig: React.Dispatch<React.SetStateAction<PricingFormulaConfig>>;
  baseOptions?: { id: number; label: string; baseValue: number }[];
  brands?: string[];
}) {
  const router = useRouter();
  const [selectedItemId, setSelectedItemId] = useState<number | "">("");

  // Costs are based strictly on what was inputted when intaking the item (no dummy defaults)
  const [acq, setAcq] = useState("");
  const [refurb, setRefurb] = useState("");
  const [cleaning, setCleaning] = useState("");
  const [brandNew, setBrandNew] = useState("");
  const [price, setPrice] = useState("");

  const [savingItem, setSavingItem] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // When an intaken item is selected, load its exact intaken costs and attributes
  const handleSelectItem = (idVal: number | "") => {
    setSelectedItemId(idVal);
    setSavedSuccess(false);

    if (idVal === "") {
      // Manual mode: reset inputs to empty
      setAcq("");
      setRefurb("");
      setCleaning("");
      setBrandNew("");
      setPrice("");
      return;
    }

    const item = items.find((i) => i.id === idVal);
    if (item) {
      setAcq(item.acquisitionCost ? String(item.acquisitionCost) : "0");
      setRefurb(item.refurbCost ? String(item.refurbCost) : "0");
      setCleaning(item.cleaningCost ? String(item.cleaningCost) : "0");
      if (item.benchmarkPrice) {
        setBrandNew(String(item.benchmarkPrice));
      } else {
        setBrandNew("");
      }
      if (item.listedPrice) setPrice(String(item.listedPrice));
      else setPrice("");
    }
  };

  const acqNum = Number(acq) || 0;
  const refurbNum = Number(refurb) || 0;
  const cleaningNum = Number(cleaning) || 0;
  const totalCost = acqNum + refurbNum + cleaningNum;

  const brandNewNum = Number(brandNew) || 0;

  // Calculate official pricing formula result (profit-based, condition grading removed)
  const formulaResult = useMemo(() => {
    return calculatePricingFormula(
      {
        acquisitionCost: acqNum,
        refurbCost: refurbNum,
        cleaningCost: cleaningNum,
        brandNewPrice: brandNewNum,
      },
      config
    );
  }, [acqNum, refurbNum, cleaningNum, brandNewNum, config]);

  const floor = computeFloor(acqNum, refurbNum + cleaningNum);
  const priceNum = Number(price) || 0;

  const margin = priceNum > 0 && totalCost > 0 ? priceNum / totalCost - 1 : null;
  const deltaVsCap =
    priceNum > 0 && formulaResult.maxAllowedCap ? priceNum / formulaResult.maxAllowedCap - 1 : null;

  const verdict = useMemo(() => {
    if (priceNum <= 0) return { tone: "stone", text: "Enter an ask or use the formula price to list this unit." };
    if (floor > 0 && priceNum < floor) {
      return { tone: "rose", text: `Blocked — below minimum cost floor of ${fmtMoney(floor)}.` };
    }
    if (formulaResult.maxAllowedCap > 0 && priceNum > formulaResult.maxAllowedCap) {
      return {
        tone: "amber",
        text: `Above Retail Gap Cap of ${fmtMoney(formulaResult.maxAllowedCap)} (${Math.round((deltaVsCap ?? 0) * 100)}% over) — risk of buyer choosing brand new.`,
      };
    }
    if (!formulaResult.isTargetMet) {
      return {
        tone: "amber",
        text: `Margin Squeeze: Retail Cap (${fmtMoney(formulaResult.maxAllowedCap)}) is below Cost + Profit Target (${fmtMoney(formulaResult.targetPrice)}).`,
      };
    }
    if (margin != null && margin >= config.targetProfitMultiplier - 1) {
      return { tone: "emerald", text: `Meets company target profit of ${config.targetProfitMultiplier}× (+${Math.round(margin * 100)}% on cost). Green light.` };
    }
    return { tone: "emerald", text: "Healthy trading price within enforced retail ceiling." };
  }, [priceNum, floor, deltaVsCap, formulaResult.maxAllowedCap, formulaResult.targetPrice, formulaResult.isTargetMet, margin, config.targetProfitMultiplier]);

  const verdictTone: Record<string, string> = {
    stone: "border-stone-200 bg-stone-50 text-stone-500",
    rose: "border-rose-200 bg-rose-50 text-rose-700",
    amber: "border-amber-200 bg-amber-50 text-amber-800",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
  };

  const handleApplyFinalPrice = (priceVal: number) => {
    setPrice(String(priceVal));
  };

  const handleSaveToItem = async () => {
    if (!selectedItemId || priceNum <= 0) return;
    setSavingItem(true);
    setSavedSuccess(false);
    try {
      await fetch(`/api/items/${selectedItemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "price", price: priceNum }),
      });
      setSavedSuccess(true);
      router.refresh();
      setTimeout(() => setSavedSuccess(false), 3000);
    } finally {
      setSavingItem(false);
    }
  };

  const selectedItemObj = items.find((i) => i.id === selectedItemId);

  return (
    <div className="card p-6 border border-stone-200/90 shadow-sm bg-white space-y-6">
      {/* Top Header Bar with Item Picker */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-100 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-amber-600" />
            <h2 className="font-display text-xl font-bold text-stone-900">Pricing Formula Workstation</h2>
          </div>
          <p className="mt-0.5 text-xs sm:text-sm text-stone-500">
            Enforced retail gap ceilings, target profit margins, and intake-based costs.
          </p>
        </div>

        {/* Intaken Item Selector */}
        <div className="w-full md:w-auto min-w-[320px] max-w-md">
          <label className="text-[11px] font-bold uppercase tracking-wider text-stone-500 block mb-1">
            Intake Inventory Record
          </label>
          <select
            className="input text-xs sm:text-[13px] font-semibold h-10 w-full bg-stone-50 hover:bg-white transition"
            value={selectedItemId}
            onChange={(e) => handleSelectItem(e.target.value ? Number(e.target.value) : "")}
          >
            <option value="">— Select item from intake or test custom inputs —</option>
            {items.map((it) => (
              <option key={it.id} value={it.id}>
                [{it.sku || "NO-SKU"}] {it.name} — Cost ₱{(it.acquisitionCost + it.refurbCost + it.cleaningCost).toLocaleString()}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Selected Item Informational Badge Strip */}
      {selectedItemObj && (
        <div className="-mt-2 flex flex-wrap items-center gap-2 rounded-xl bg-amber-50/70 border border-amber-200/80 px-4 py-2.5 text-xs">
          <span className="font-bold text-amber-900">Active Intake Record:</span>
          <span className="font-semibold text-stone-900">[{selectedItemObj.sku || "NO-SKU"}] {selectedItemObj.name}</span>
          {selectedItemObj.brand && (
            <span className="rounded bg-white/90 border border-amber-200 px-2 py-0.5 font-medium text-stone-600">
              {selectedItemObj.brand}
            </span>
          )}
          <span className="rounded bg-white/90 border border-amber-200 px-2 py-0.5 font-medium text-stone-600">
            Intake Cost: {fmtMoney(selectedItemObj.acquisitionCost + selectedItemObj.refurbCost + selectedItemObj.cleaningCost)}
          </span>
          {selectedItemObj.listedPrice ? (
            <span className="rounded bg-white/90 border border-amber-200 px-2 py-0.5 font-bold text-amber-900">
              Live Listed Ask: {fmtMoney(selectedItemObj.listedPrice)}
            </span>
          ) : (
            <span className="rounded bg-white/90 border border-amber-200 px-2 py-0.5 font-medium text-stone-400">
              Not Yet Listed
            </span>
          )}
        </div>
      )}

      {/* Main 2-Column Workstation Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        
        {/* ================================================================= */}
        {/* LEFT COLUMN (6 Cols): Required Inputs Outlined in Green Neon      */}
        {/* ================================================================= */}
        <div className="lg:col-span-6 space-y-4">
          
          {/* Reference Brand New Price — Outlined with Green Neon */}
          <div className="rounded-2xl border-2 border-[#00e676] shadow-[0_0_14px_rgba(0,230,118,0.35)] ring-2 ring-[#00e676]/20 bg-white p-4 space-y-1.5 transition-all">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-800">
                Brand New Price ₱ (Retail Benchmark)
              </label>
              <span className="rounded-full bg-[#00e676]/15 border border-[#00e676]/40 px-2 py-0.5 text-[10.5px] font-extrabold text-emerald-800">
                Required Input
              </span>
            </div>
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-stone-400">₱</span>
              <input
                style={{ paddingLeft: "2.2rem" }}
                className="input h-11 text-base font-bold tabular-nums border-2 border-[#00e676]/70 focus:border-[#00e676]"
                type="number"
                min={0}
                placeholder="e.g. 15000"
                value={brandNew}
                onChange={(e) => setBrandNew(e.target.value)}
              />
            </div>
            <p className="text-[11px] text-stone-500">
              Sets retail cap: Max Cap = Retail × (1 − {Math.round(config.retailGapPct * 100)}% Retail Gap).
            </p>
          </div>

          {/* Company Profit Target & Condition Policy */}
          <div className="rounded-2xl border-2 border-[#00e676] shadow-[0_0_14px_rgba(0,230,118,0.35)] ring-2 ring-[#00e676]/20 bg-white p-4 space-y-2.5 transition-all">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-800">
                Profit Hurdle & Policy
              </label>
              <span className="rounded-full bg-[#00e676]/15 border border-[#00e676]/40 px-2 py-0.5 text-[10.5px] font-extrabold text-emerald-800">
                Verified Good Condition
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-xl border border-stone-200 bg-stone-50 p-2.5">
                <div className="text-[10px] font-bold uppercase text-stone-400">Target Profit Markup</div>
                <div className="font-display text-base font-black text-emerald-700 mt-0.5 tabular-nums">
                  {config.targetProfitMultiplier.toFixed(2)}× (+{Math.round((config.targetProfitMultiplier - 1) * 100)}%)
                </div>
                <div className="text-[10px] text-stone-500 mt-0.5">Target ask: {fmtMoney(formulaResult.targetPrice)}</div>
              </div>
              <div className="rounded-xl border border-stone-200 bg-stone-50 p-2.5">
                <div className="text-[10px] font-bold uppercase text-stone-400">Retail Benchmark Gap</div>
                <div className="font-display text-base font-black text-stone-900 mt-0.5 tabular-nums">
                  {Math.round(config.retailGapPct * 100)}% off retail
                </div>
                <div className="text-[10px] text-stone-500 mt-0.5">Cap: {fmtMoney(formulaResult.maxAllowedCap)}</div>
              </div>
            </div>
            <p className="text-[11px] text-stone-500">
              All inventory is acquired in good condition. Standardized pricing ensures guaranteed margin without subjective condition grading penalties.
            </p>
          </div>

          {/* Intake Costs (Acquisition, Refurb, Cleaning) */}
          <div className="rounded-2xl border border-stone-200 bg-stone-50/70 p-4 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-stone-700 uppercase tracking-wider text-[11px]">Item Intake Costs</span>
              <span className="text-stone-900 bg-white px-2.5 py-0.5 rounded-md border border-stone-200 tabular-nums font-black">
                Total: {fmtMoney(totalCost)}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10.5px] font-semibold text-stone-600 block">Acquisition</label>
                <div className="relative mt-1">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400 select-none">₱</span>
                  <input
                    style={{ paddingLeft: "2.1rem" }}
                    className="input h-9 text-xs font-semibold tabular-nums"
                    type="number"
                    min={0}
                    placeholder="0"
                    value={acq}
                    onChange={(e) => setAcq(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="text-[10.5px] font-semibold text-stone-600 block">Refurb</label>
                <div className="relative mt-1">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400 select-none">₱</span>
                  <input
                    style={{ paddingLeft: "2.1rem" }}
                    className="input h-9 text-xs font-semibold tabular-nums"
                    type="number"
                    min={0}
                    placeholder="0"
                    value={refurb}
                    onChange={(e) => setRefurb(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="text-[10.5px] font-semibold text-stone-600 block">Cleaning</label>
                <div className="relative mt-1">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400 select-none">₱</span>
                  <input
                    style={{ paddingLeft: "2.1rem" }}
                    className="input h-9 text-xs font-semibold tabular-nums"
                    type="number"
                    min={0}
                    placeholder="0"
                    value={cleaning}
                    onChange={(e) => setCleaning(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <p className="text-[11px] text-stone-500 leading-tight">
              Acquisition ₱{acqNum.toLocaleString()} + Refurb ₱{refurbNum.toLocaleString()} + Cleaning ₱{cleaningNum.toLocaleString()}
            </p>
          </div>

        </div>

        {/* ================================================================= */}
        {/* RIGHT COLUMN (6 Cols): Direct Formula Outcome & Listing Action     */}
        {/* ================================================================= */}
        <div className="lg:col-span-6 space-y-4">
          
          {/* Direct Formula Recommendation Card */}
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-emerald-600" />
                Official Formula Recommendation
              </span>
              <span className="text-[11px] font-bold text-emerald-800 bg-white border border-emerald-200 px-2 py-0.5 rounded-md">
                Retail Cap ({Math.round(config.retailGapPct * 100)}% Gap)
              </span>
            </div>
            <div className="flex flex-wrap items-baseline justify-between gap-3 pt-1">
              <div>
                <div className="font-display text-3xl sm:text-4xl font-black text-emerald-950 tabular-nums">
                  {fmtMoney(formulaResult.suggestedListingPrice)}
                </div>
                <p className="mt-1 text-xs text-emerald-700 font-medium">
                  Formula: ₱{brandNewNum.toLocaleString()} (New) × (1 − {Math.round(config.retailGapPct * 100)}% Gap)
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleApplyFinalPrice(formulaResult.suggestedListingPrice)}
                className="btn-accent h-10 shrink-0 px-4 text-xs sm:text-sm font-black shadow-sm"
              >
                Use Formula Price
              </button>
            </div>
          </div>

          {/* Enforced Ask Price & Save Action — Outlined in Green Neon */}
          <div className="rounded-2xl border-2 border-[#00e676] shadow-[0_0_15px_rgba(0,230,118,0.35)] ring-2 ring-[#00e676]/20 bg-white p-4 space-y-3 transition-all">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-800">
                Enforced Ask Price ₱
              </label>
              <span className="rounded-full bg-[#00e676]/15 border border-[#00e676]/40 px-2 py-0.5 text-[10.5px] font-extrabold text-emerald-800">
                Set Live Ask
              </span>
            </div>

            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-base font-semibold text-stone-400">₱</span>
              <input
                style={{ paddingLeft: "2.2rem" }}
                className="input h-12 text-xl font-black tabular-nums border-2 border-[#00e676]/70 focus:border-[#00e676]"
                type="number"
                min={0}
                placeholder={formulaResult.suggestedListingPrice ? String(formulaResult.suggestedListingPrice) : "0"}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>

            {/* Verdict Alert */}
            <div className={cn("flex items-start gap-2 rounded-xl border px-3.5 py-2.5 text-xs font-semibold", verdictTone[verdict.tone])}>
              {verdict.tone === "emerald" ? (
                <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0" />
              ) : verdict.tone === "rose" ? (
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
              ) : (
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              )}
              <span>{verdict.text}</span>
            </div>

            {/* Deal Performance Preview */}
            <div className="grid grid-cols-3 gap-2 text-center pt-1">
              <div className="rounded-xl bg-stone-50 p-2.5 border border-stone-200">
                <div className="text-[10px] font-bold uppercase text-stone-400">Margin on Cost</div>
                <div className={cn("mt-0.5 font-display text-base sm:text-lg font-black tabular-nums", (margin ?? 0) >= config.targetProfitMultiplier - 1 ? "text-emerald-600" : "text-amber-600")}>
                  {margin != null ? `${Math.round(margin * 100)}%` : "—"}
                </div>
              </div>
              <div className="rounded-xl bg-stone-50 p-2.5 border border-stone-200">
                <div className="text-[10px] font-bold uppercase text-stone-400">Gross Profit</div>
                <div className="mt-0.5 font-display text-base sm:text-lg font-black tabular-nums text-stone-900">
                  {fmtMoney(priceNum - totalCost)}
                </div>
              </div>
              <div className="rounded-xl bg-stone-50 p-2.5 border border-stone-200">
                <div className="text-[10px] font-bold uppercase text-stone-400">vs Retail Cap</div>
                <div className={cn("mt-0.5 font-display text-base sm:text-lg font-black tabular-nums", (deltaVsCap ?? 0) > 0 ? "text-rose-600" : "text-emerald-600")}>
                  {deltaVsCap != null ? `${deltaVsCap > 0 ? "+" : ""}${Math.round(deltaVsCap * 100)}%` : "0%"}
                </div>
              </div>
            </div>

            {/* Save to Item Button */}
            {selectedItemId && priceNum > 0 && (
              <button
                type="button"
                onClick={handleSaveToItem}
                disabled={savingItem}
                className="btn-accent h-11 w-full text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-sm"
              >
                {savingItem ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Updating price in database…
                  </>
                ) : savedSuccess ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-300" /> Ask updated to {fmtMoney(priceNum)}!
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" /> Save {fmtMoney(priceNum)} as Live Ask for {selectedItemObj?.sku || "Item"}
                  </>
                )}
              </button>
            )}
          </div>
        </div>

      </div>

      {/* ================================================================= */}
      {/* FULL-WIDTH PROFIT & RETAIL GAP ECONOMICS BREAKDOWN                */}
      {/* ================================================================= */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-black uppercase tracking-wider text-stone-900">
                Profit & Retail Gap Economics
              </h4>
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                Verified Good Condition
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Live mathematical breakdown of intake costs, target profit hurdle, and retail gap ceiling.
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleApplyFinalPrice(formulaResult.suggestedListingPrice)}
            className="btn-accent h-8.5 px-3.5 text-xs font-bold self-start sm:self-auto shadow-2xs"
          >
            Apply Suggested Ask {fmtMoney(formulaResult.suggestedListingPrice)}
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          <div className="rounded-xl border border-stone-200 bg-stone-50/70 p-3">
            <span className="text-[10.5px] font-bold uppercase text-stone-400 block">Total Intake Cost</span>
            <span className="font-display text-lg font-black text-stone-900 tabular-nums mt-0.5 block">
              {fmtMoney(totalCost)}
            </span>
            <span className="text-[10.5px] text-stone-500 block mt-0.5">Acq ₱{acqNum.toLocaleString()} + Refurb ₱{refurbNum.toLocaleString()} + Clean ₱{cleaningNum.toLocaleString()}</span>
          </div>
          <div className="rounded-xl border border-stone-200 bg-stone-50/70 p-3">
            <span className="text-[10.5px] font-bold uppercase text-stone-400 block">Target Profit Hurdle</span>
            <span className="font-display text-lg font-black text-emerald-700 tabular-nums mt-0.5 block">
              {fmtMoney(formulaResult.targetPrice)}
            </span>
            <span className="text-[10.5px] text-stone-500 block mt-0.5">{config.targetProfitMultiplier.toFixed(2)}× markup (+{Math.round((config.targetProfitMultiplier - 1) * 100)}% on cost)</span>
          </div>
          <div className="rounded-xl border border-stone-200 bg-stone-50/70 p-3">
            <span className="text-[10.5px] font-bold uppercase text-stone-400 block">Retail Benchmark Cap</span>
            <span className="font-display text-lg font-black text-stone-900 tabular-nums mt-0.5 block">
              {fmtMoney(formulaResult.maxAllowedCap)}
            </span>
            <span className="text-[10.5px] text-stone-500 block mt-0.5">{Math.round(config.retailGapPct * 100)}% under brand new</span>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3">
            <span className="text-[10.5px] font-bold uppercase text-emerald-800 block">Suggested Listing Ask</span>
            <span className="font-display text-lg font-black text-emerald-950 tabular-nums mt-0.5 block">
              {fmtMoney(formulaResult.suggestedListingPrice)}
            </span>
            <span className="text-[10.5px] text-emerald-700 font-semibold block mt-0.5">
              Net Profit: +{fmtMoney(formulaResult.profit)} ({Math.round(formulaResult.marginPct * 100)}%)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Pricing Tools Main View                                            */
/* ------------------------------------------------------------------ */

export function PricingTools({
  alerts,
  violations,
  benchmarks,
  baseOptions,
  brands,
  items = [],
}: {
  alerts: AlertLite[];
  violations: ViolationLite[];
  benchmarks: BenchmarkRow[];
  baseOptions: { id: number; label: string; baseValue: number }[];
  brands: string[];
  items?: ItemOptionLite[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<number | null>(null);
  const [done, setDone] = useState<Set<number>>(new Set());

  // Config state initialized from localStorage with fallback to default values from the image
  const [config, setConfig] = useState<PricingFormulaConfig>(DEFAULT_PRICING_CONFIG);
  const [showConfigPanel, setShowConfigPanel] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(PRICING_CONFIG_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setConfig((prev) => ({
          ...prev,
          ...parsed,
          gradeFactors: {
            ...prev.gradeFactors,
            ...(parsed.gradeFactors || {}),
          },
        }));
      }
    } catch {}
  }, []);

  const apply = async (a: AlertLite) => {
    if (a.suggested == null) return;
    setBusy(a.id);
    await fetch(`/api/items/${a.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "price", price: a.suggested }),
    });
    setBusy(null);
    setDone((s) => new Set(s).add(a.id));
    router.refresh();
  };

  const fixViolation = async (v: ViolationLite) => {
    setBusy(v.id);
    await fetch(`/api/items/${v.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "price", price: round50(v.floor) }),
    });
    setBusy(null);
    setDone((s) => new Set(s).add(v.id));
    router.refresh();
  };

  const visibleAlerts = alerts.filter((a) => !done.has(a.id));
  const visibleViolations = violations.filter((v) => !done.has(v.id));

  const [activeTab, setActiveTab] = useState<"calculator" | "alerts" | "benchmarks" | "policy">("calculator");
  const [alertSearch, setAlertSearch] = useState("");
  const [alertTierFilter, setAlertTierFilter] = useState<"all" | "watch" | "action" | "critical">("all");
  const [benchmarkSearch, setBenchmarkSearch] = useState("");
  const [batchApplying, setBatchApplying] = useState(false);

  const filteredAlerts = useMemo(() => {
    return visibleAlerts.filter((a) => {
      if (alertTierFilter !== "all" && a.tier !== alertTierFilter) return false;
      if (alertSearch.trim()) {
        const q = alertSearch.toLowerCase();
        return a.name.toLowerCase().includes(q) || (a.sku && a.sku.toLowerCase().includes(q));
      }
      return true;
    });
  }, [visibleAlerts, alertTierFilter, alertSearch]);

  const filteredBenchmarks = useMemo(() => {
    if (!benchmarkSearch.trim()) return benchmarks;
    const q = benchmarkSearch.toLowerCase();
    return benchmarks.filter((b) => b.rootName.toLowerCase().includes(q) || b.rootSlug.toLowerCase().includes(q));
  }, [benchmarks, benchmarkSearch]);

  const applyAllMarkdowns = async () => {
    if (!confirm(`Apply suggested markdowns to ${filteredAlerts.length} items?`)) return;
    setBatchApplying(true);
    try {
      for (const a of filteredAlerts) {
        if (a.suggested != null) {
          await fetch(`/api/items/${a.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "price", price: a.suggested }),
          });
          setDone((s) => new Set(s).add(a.id));
        }
      }
      router.refresh();
    } catch (err) {
      console.error("Batch apply failed:", err);
    } finally {
      setBatchApplying(false);
    }
  };

  const fixAllViolations = async () => {
    setBatchApplying(true);
    try {
      for (const v of visibleViolations) {
        await fetch(`/api/items/${v.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "price", price: round50(v.floor) }),
        });
        setDone((s) => new Set(s).add(v.id));
      }
      router.refresh();
    } catch (err) {
      console.error("Fix violations failed:", err);
    } finally {
      setBatchApplying(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ================================================================= */}
      {/* 1. EXECUTIVE KPI SUMMARY HUD                                      */}
      {/* ================================================================= */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 xl:grid-cols-5">
        {/* Target Profit Hurdle */}
        <div className="card p-3.5 border border-amber-200/90 bg-amber-50/50 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-amber-900">
            <span>Target Profit Hurdle</span>
            <Scale className="h-4 w-4 text-amber-600" />
          </div>
          <div className="mt-2 font-display text-2xl font-bold text-amber-950 tabular-nums">
            {config.targetProfitMultiplier}×
          </div>
          <p className="mt-1 text-[11px] text-amber-800/80">
            +{Math.round((config.targetProfitMultiplier - 1) * 100)}% markup on cost
          </p>
        </div>

        {/* Retail Gap Ceiling */}
        <div className="card p-3.5 border border-sky-200/90 bg-sky-50/50 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#1D5D8B]">
            <span>Retail Gap Ceiling</span>
            <TrendingDown className="h-4 w-4 text-[#16c4df]" />
          </div>
          <div className="mt-2 font-display text-2xl font-bold text-[#17364b] tabular-nums">
            {Math.round(config.retailGapPct * 100)}%
          </div>
          <p className="mt-1 text-[11px] text-[#3e6074]">
            Discount vs brand-new retail
          </p>
        </div>

        {/* Minimum Cost Floor */}
        <div className="card p-3.5 border border-stone-200/90 bg-stone-50/60 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-stone-700">
            <span>Floor Protection</span>
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2 font-display text-2xl font-bold text-stone-900 tabular-nums">
            1.18×
          </div>
          <p className="mt-1 text-[11px] text-stone-500">
            Guaranteed cost recovery threshold
          </p>
        </div>

        {/* Aging Inventory Alerts */}
        <button
          type="button"
          onClick={() => setActiveTab("alerts")}
          className={cn(
            "card p-3.5 text-left border shadow-sm transition hover:shadow",
            visibleAlerts.length > 0
              ? "border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50 hover:border-amber-400"
              : "border-stone-200 bg-white"
          )}
        >
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-amber-900">
            <span>Aging Alerts</span>
            <Clock className="h-4 w-4 text-amber-600" />
          </div>
          <div className="mt-2 font-display text-2xl font-bold text-amber-950 tabular-nums">
            {visibleAlerts.length}
          </div>
          <p className="mt-1 text-[11px] text-amber-800">
            {visibleAlerts.length > 0 ? "Units needing markdown →" : "All listed inventory clear"}
          </p>
        </button>

        {/* Floor Violations */}
        <button
          type="button"
          onClick={() => setActiveTab("alerts")}
          className={cn(
            "card p-3.5 text-left border shadow-sm transition hover:shadow",
            visibleViolations.length > 0
              ? "border-rose-300 bg-gradient-to-br from-rose-50 to-red-50 hover:border-rose-400"
              : "border-stone-200 bg-white"
          )}
        >
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-rose-900">
            <span>Floor Breaches</span>
            <ShieldAlert className="h-4 w-4 text-rose-600" />
          </div>
          <div className="mt-2 font-display text-2xl font-bold text-rose-950 tabular-nums">
            {visibleViolations.length}
          </div>
          <p className="mt-1 text-[11px] text-rose-800">
            {visibleViolations.length > 0 ? "Items priced below floor →" : "Zero floor breaches"}
          </p>
        </button>
      </div>

      {/* Floor Violations Urgent Banner */}
      {visibleViolations.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-rose-300 bg-rose-50 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <div className="font-bold text-sm text-rose-950">
                {visibleViolations.length} item{visibleViolations.length > 1 ? "s" : ""} listed below company cost floor
              </div>
              <div className="text-xs text-rose-800">
                Current ask prices do not meet the minimum cost hurdle of 1.18×. Fix them to protect gross margin.
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fixAllViolations}
              disabled={batchApplying}
              className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-rose-700 disabled:opacity-50"
            >
              {batchApplying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              Auto-Fix All Violations
            </button>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* 2. MODERN WORKSPACE TABS                                          */}
      {/* ================================================================= */}
      <div className="card p-2 bg-white border border-stone-200 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab("calculator")}
              className={cn(
                "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition",
                activeTab === "calculator"
                  ? "bg-stone-900 text-white shadow-sm"
                  : "text-stone-600 hover:bg-stone-100"
              )}
            >
              <Calculator className="h-3.5 w-3.5 text-[#16c4df]" />
              <span>Valuation Calculator</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("alerts")}
              className={cn(
                "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition",
                activeTab === "alerts"
                  ? "bg-stone-900 text-white shadow-sm"
                  : "text-stone-600 hover:bg-stone-100"
              )}
            >
              <Clock className="h-3.5 w-3.5 text-amber-500" />
              <span>Aging Markdowns Queue</span>
              {visibleAlerts.length > 0 && (
                <span className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-black",
                  activeTab === "alerts" ? "bg-amber-400 text-stone-950" : "bg-amber-100 text-amber-900"
                )}>
                  {visibleAlerts.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("benchmarks")}
              className={cn(
                "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition",
                activeTab === "benchmarks"
                  ? "bg-stone-900 text-white shadow-sm"
                  : "text-stone-600 hover:bg-stone-100"
              )}
            >
              <FolderTree className="h-3.5 w-3.5 text-indigo-500" />
              <span>Market Benchmarks</span>
              <span className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                activeTab === "benchmarks" ? "bg-stone-700 text-stone-200" : "bg-stone-100 text-stone-500"
              )}>
                {benchmarks.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("policy")}
              className={cn(
                "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition",
                activeTab === "policy"
                  ? "bg-stone-900 text-white shadow-sm"
                  : "text-stone-600 hover:bg-stone-100"
              )}
            >
              <Sliders className="h-3.5 w-3.5 text-amber-600" />
              <span>Strategy Multipliers & Policy</span>
            </button>
          </div>

          <div className="hidden lg:flex items-center gap-3 text-xs text-stone-500 pr-2">
            <span>Target: <strong className="text-stone-900">{config.targetProfitMultiplier}×</strong></span>
            <span>·</span>
            <span>Retail Gap: <strong className="text-stone-900">{Math.round(config.retailGapPct * 100)}%</strong></span>
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* 3. TAB CONTENT: VALUATION CALCULATOR                              */}
      {/* ================================================================= */}
      {activeTab === "calculator" && (
        <div className="space-y-6">
          <MarginCalculator
            baseOptions={baseOptions}
            brands={brands}
            items={items}
            config={config}
            setConfig={setConfig}
          />

          {/* Bottom Quick-Glance Dual Panels */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Quick Aging Panel */}
            <div className="lg:col-span-6 card p-4 bg-white border border-stone-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-600" />
                  <h4 className="font-display text-sm font-bold text-stone-900">
                    Price-Aging Alerts
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab("alerts")}
                  className="text-xs font-bold text-[#1D5D8B] hover:underline"
                >
                  Open Full Queue ({visibleAlerts.length}) →
                </button>
              </div>

              {visibleAlerts.length === 0 ? (
                <p className="text-xs text-stone-400 py-3 text-center">
                  All listed inventory is rotating within standard markdown windows.
                </p>
              ) : (
                <div className="divide-y divide-stone-100">
                  {visibleAlerts.slice(0, 3).map((a) => (
                    <div key={a.id} className="flex items-center justify-between gap-3 py-2 text-xs">
                      <div className="min-w-0 flex-1 truncate font-semibold text-stone-800">
                        {a.name}
                        <span className="ml-1.5 text-[10.5px] text-stone-400 font-normal">
                          {a.days}d in stock
                        </span>
                      </div>
                      <div className="text-right tabular-nums shrink-0">
                        <span className="text-stone-400 line-through mr-1.5">{fmtMoney(a.ask)}</span>
                        <span className="font-bold text-amber-700">{fmtMoney(a.suggested)}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => apply(a)}
                        disabled={busy === a.id || a.suggested == null}
                        className="btn-accent h-7 px-2 text-[10.5px] font-bold shrink-0"
                      >
                        {busy === a.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Apply"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Benchmark Panel */}
            <div className="lg:col-span-6 card p-4 bg-white border border-stone-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FolderTree className="h-4 w-4 text-indigo-600" />
                  <h4 className="font-display text-sm font-bold text-stone-900">
                    Category Benchmarks
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab("benchmarks")}
                  className="text-xs font-bold text-[#1D5D8B] hover:underline"
                >
                  View All ({benchmarks.length}) Categories →
                </button>
              </div>

              <div className="divide-y divide-stone-100 text-xs">
                {benchmarks.slice(0, 3).map((b, idx) => (
                  <div key={`${b.rootSlug}-${idx}`} className="flex items-center justify-between gap-3 py-2">
                    <span className="font-semibold text-stone-800 truncate">{b.rootName}</span>
                    <span className="text-stone-400">{b.stockCount} in stock</span>
                    <span className="tabular-nums font-semibold text-indigo-700">
                      Mkt: {fmtMoney(b.avgBenchmark)}
                    </span>
                    <span className="tabular-nums font-bold text-stone-900">
                      Ask: {fmtMoney(b.avgListed)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* 4. TAB CONTENT: FULL AGING MARKDOWNS QUEUE                        */}
      {/* ================================================================= */}
      {activeTab === "alerts" && (
        <div className="card p-5 bg-white border border-stone-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
            <div>
              <h3 className="font-display text-lg font-bold text-stone-900">
                Price-Aging Markdown Queue
              </h3>
              <p className="text-xs text-stone-500">
                Standard markdown cycles automatically trigger based on days in showroom to maintain inventory velocity.
              </p>
            </div>

            {filteredAlerts.length > 0 && (
              <button
                type="button"
                onClick={applyAllMarkdowns}
                disabled={batchApplying}
                className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-amber-700 disabled:opacity-50 shrink-0"
              >
                {batchApplying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                Apply All {filteredAlerts.length} Markdowns
              </button>
            )}
          </div>

          {/* Tier Filters & Search Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <button
                type="button"
                onClick={() => setAlertTierFilter("all")}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-bold transition",
                  alertTierFilter === "all"
                    ? "bg-stone-900 text-white"
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                )}
              >
                All ({visibleAlerts.length})
              </button>
              <button
                type="button"
                onClick={() => setAlertTierFilter("watch")}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-bold transition",
                  alertTierFilter === "watch"
                    ? "bg-amber-600 text-white"
                    : "bg-amber-50 text-amber-800 hover:bg-amber-100"
                )}
              >
                Watch (30–59d · −6%)
              </button>
              <button
                type="button"
                onClick={() => setAlertTierFilter("action")}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-bold transition",
                  alertTierFilter === "action"
                    ? "bg-orange-600 text-white"
                    : "bg-orange-50 text-orange-800 hover:bg-orange-100"
                )}
              >
                Action (60–89d · −12%)
              </button>
              <button
                type="button"
                onClick={() => setAlertTierFilter("critical")}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-bold transition",
                  alertTierFilter === "critical"
                    ? "bg-rose-600 text-white"
                    : "bg-rose-50 text-rose-800 hover:bg-rose-100"
                )}
              >
                Critical (90d+ · −20%)
              </button>
            </div>

            <div className="relative w-full sm:w-60">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={alertSearch}
                onChange={(e) => setAlertSearch(e.target.value)}
                placeholder="Search unit by name or SKU..."
                className="input h-9 w-full pl-9 text-xs"
              />
            </div>
          </div>

          {/* Table */}
          {filteredAlerts.length === 0 ? (
            <div className="py-12 text-center text-xs text-stone-400 rounded-xl border border-dashed border-stone-200 bg-stone-50/50">
              No inventory units currently meet markdown criteria for this filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] border-collapse text-xs">
                <thead>
                  <tr className="border-b border-stone-100 bg-stone-50/70 text-left text-[10.5px] font-bold uppercase tracking-wider text-stone-400">
                    <th className="py-2.5 px-3">Inventory Unit</th>
                    <th className="px-3">Days Listed</th>
                    <th className="px-3">Aging Tier</th>
                    <th className="px-3 text-right">Current Ask</th>
                    <th className="px-3 text-right">Markdown Ask</th>
                    <th className="px-3 text-right">Margin After</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredAlerts.map((a) => {
                    const t = TIER_STYLE[a.tier];
                    return (
                      <tr key={a.id} className="hover:bg-stone-50/60 transition">
                        <td className="py-3 px-3">
                          <Link href={`/inventory/${a.id}`} className="flex items-center gap-2.5 group">
                            <Thumb url={a.photo} className="h-9 w-11 shrink-0 rounded border border-stone-200 object-contain p-0.5 bg-white" />
                            <div className="min-w-0">
                              <span className="block font-bold text-stone-900 group-hover:text-[#1D5D8B] truncate max-w-[240px]">
                                {a.name}
                              </span>
                              <span className="text-[11px] text-stone-400">
                                {a.sku ? `SKU: ${a.sku}` : "No SKU"}
                              </span>
                            </div>
                          </Link>
                        </td>
                        <td className="px-3 font-semibold text-stone-700">
                          {a.days} days
                        </td>
                        <td className="px-3">
                          <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10.5px] font-bold", t.box)}>
                            {t.label}
                          </span>
                        </td>
                        <td className="px-3 text-right font-semibold text-stone-400 line-through tabular-nums">
                          {fmtMoney(a.ask)}
                        </td>
                        <td className="px-3 text-right font-bold text-amber-700 tabular-nums text-sm">
                          {fmtMoney(a.suggested)}
                        </td>
                        <td className="px-3 text-right tabular-nums font-semibold text-emerald-700">
                          {a.marginAfter != null ? `+${Math.round(a.marginAfter * 100)}%` : "—"}
                        </td>
                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => apply(a)}
                            disabled={busy === a.id || a.suggested == null}
                            className="btn-accent h-8 px-3 text-[11px] font-bold"
                          >
                            {busy === a.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                            Apply Markdown
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ================================================================= */}
      {/* 5. TAB CONTENT: MARKET BENCHMARK REFERENCE DICTIONARY             */}
      {/* ================================================================= */}
      {activeTab === "benchmarks" && (
        <div className="card p-5 bg-white border border-stone-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
            <div>
              <h3 className="font-display text-lg font-bold text-stone-900">
                Market Benchmark Reference Matrix
              </h3>
              <p className="text-xs text-stone-500">
                Category baseline values calculated from catalog research, prevailing secondhand averages, and historical sales.
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={benchmarkSearch}
                onChange={(e) => setBenchmarkSearch(e.target.value)}
                placeholder="Search category family..."
                className="input h-9 w-full pl-9 text-xs"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] border-collapse text-xs">
              <thead>
                <tr className="border-b border-stone-100 bg-stone-50/70 text-left text-[10.5px] font-bold uppercase tracking-wider text-stone-400">
                  <th className="py-3 px-3">Category Family</th>
                  <th className="px-3 text-center">Active In Stock</th>
                  <th className="px-3 text-right">Market Benchmark</th>
                  <th className="px-3 text-right">Average Listed Ask</th>
                  <th className="px-3 text-right">Average Realized</th>
                  <th className="py-3 px-4 text-center">Market Position</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredBenchmarks.map((b, idx) => {
                  const max = Math.max(b.avgBenchmark ?? 0, b.avgListed ?? 0, b.avgSold ?? 0) * 1.25 || 1;
                  const x = (v?: number | null) => (v ? `${Math.min(97, (v / max) * 100)}%` : undefined);
                  return (
                    <tr key={`${b.rootSlug}-${idx}`} className="hover:bg-stone-50/60 transition">
                      <td className="py-3 px-3 font-semibold text-stone-900 text-[13px]">
                        {b.rootName}
                      </td>
                      <td className="px-3 text-center tabular-nums font-semibold text-stone-600">
                        {b.stockCount} units
                      </td>
                      <td className="px-3 text-right tabular-nums font-bold text-indigo-700">
                        {fmtMoney(b.avgBenchmark)}
                      </td>
                      <td className="px-3 text-right tabular-nums font-bold text-stone-900">
                        {fmtMoney(b.avgListed)}
                      </td>
                      <td className="px-3 text-right tabular-nums font-semibold text-emerald-700">
                        {b.avgSold ? fmtMoney(b.avgSold) : "—"}
                      </td>
                      <td className="py-3 px-4">
                        <div className="mx-auto relative h-2 w-32 sm:w-40 rounded-full bg-stone-100">
                          {x(b.avgBenchmark) && (
                            <span
                              className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-indigo-500 shadow-sm"
                              style={{ left: x(b.avgBenchmark) }}
                              title={`Benchmark: ${fmtMoney(b.avgBenchmark)}`}
                            />
                          )}
                          {x(b.avgListed) && (
                            <span
                              className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-stone-900 shadow-sm"
                              style={{ left: x(b.avgListed) }}
                              title={`Ask: ${fmtMoney(b.avgListed)}`}
                            />
                          )}
                          {x(b.avgSold) && (
                            <span
                              className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-emerald-500 shadow-sm"
                              style={{ left: x(b.avgSold) }}
                              title={`Realized: ${fmtMoney(b.avgSold)}`}
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* 6. TAB CONTENT: STRATEGY MULTIPLIERS & POLICY TUNING             */}
      {/* ================================================================= */}
      {activeTab === "policy" && (
        <div className="card p-6 bg-white border border-stone-200 shadow-sm space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 pb-4">
            <div>
              <h3 className="font-display text-lg font-bold text-stone-950">
                Company Pricing Multipliers & Strategy Tuning
              </h3>
              <p className="text-xs text-stone-500">
                Calibrate markup hurdles, retail discount minimums, and automated floor rules across all pricing desks.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setConfig(DEFAULT_PRICING_CONFIG);
                try {
                  localStorage.removeItem(PRICING_CONFIG_STORAGE_KEY);
                } catch {}
              }}
              className="inline-flex items-center gap-1 text-xs font-bold text-amber-900 hover:underline"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset to Image Defaults
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Target Profit Multiplier */}
            <div className="rounded-2xl border border-stone-200 bg-stone-50/50 p-5 space-y-2">
              <label className="text-xs font-bold text-stone-900 block uppercase tracking-wider">
                Target Profit Multiplier
              </label>
              <p className="text-xs text-stone-500">Markup hurdle over total acquisition, refurb, and cleaning costs</p>
              <div className="pt-2 flex items-center gap-2">
                <input
                  className="input h-11 text-base font-black tabular-nums w-28 bg-white"
                  type="number"
                  step="0.05"
                  min="1.0"
                  max="3.0"
                  value={config.targetProfitMultiplier}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 1.0;
                    const next = { ...config, targetProfitMultiplier: val };
                    setConfig(next);
                    try {
                      localStorage.setItem(PRICING_CONFIG_STORAGE_KEY, JSON.stringify(next));
                    } catch {}
                  }}
                />
                <span className="text-xs font-bold text-stone-600">× Total Cost</span>
              </div>
              <span className="block text-[11px] text-amber-700 font-semibold pt-1">
                Default: 1.40 (enforces +40% profit markup)
              </span>
            </div>

            {/* Retail Gap Discount */}
            <div className="rounded-2xl border border-stone-200 bg-stone-50/50 p-5 space-y-2">
              <label className="text-xs font-bold text-stone-900 block uppercase tracking-wider">
                Retail Gap Discount Ceiling
              </label>
              <p className="text-xs text-stone-500">Minimum required savings percentage vs brand new retail price</p>
              <div className="pt-2 flex items-center gap-2">
                <input
                  className="input h-11 text-base font-black tabular-nums w-28 bg-white"
                  type="number"
                  step="1"
                  min="5"
                  max="80"
                  value={Math.round(config.retailGapPct * 100)}
                  onChange={(e) => {
                    const val = Math.max(0.01, Math.min(0.9, (parseFloat(e.target.value) || 35) / 100));
                    const next = { ...config, retailGapPct: val };
                    setConfig(next);
                    try {
                      localStorage.setItem(PRICING_CONFIG_STORAGE_KEY, JSON.stringify(next));
                    } catch {}
                  }}
                />
                <span className="text-xs font-bold text-stone-600">% off retail</span>
              </div>
              <span className="block text-[11px] text-amber-700 font-semibold pt-1">
                Default: 35% discount threshold
              </span>
            </div>

            {/* Price Floor Rule */}
            <div className="rounded-2xl border border-stone-200 bg-stone-50/50 p-5 space-y-2">
              <label className="text-xs font-bold text-stone-900 block uppercase tracking-wider">
                Price Floor Protection Rule
              </label>
              <p className="text-xs text-stone-500">Hard stop pricing barrier to protect against selling at or below cost</p>
              <div className="pt-2 flex items-center gap-2">
                <div className="h-11 flex items-center px-4 rounded-xl border border-stone-200 bg-white text-base font-black text-emerald-800">
                  1.18×
                </div>
                <span className="text-xs font-bold text-stone-600">× (Acq + Refurb + Cleaning)</span>
              </div>
              <span className="block text-[11px] text-emerald-700 font-semibold pt-1">
                Strict loss prevention (enforced on intake & markdowns)
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
