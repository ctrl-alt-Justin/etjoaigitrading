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
  TrendingDown,
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
import { GradeChip, Thumb } from "./ui";

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
  const [grade, setGrade] = useState<Grade>("B");

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
      if (item.grade) setGrade(item.grade);
      if (item.listedPrice) setPrice(String(item.listedPrice));
      else setPrice("");
    }
  };

  const acqNum = Number(acq) || 0;
  const refurbNum = Number(refurb) || 0;
  const cleaningNum = Number(cleaning) || 0;
  const totalCost = acqNum + refurbNum + cleaningNum;

  const brandNewNum = Number(brandNew) || 0;

  // Calculate official pricing formula result
  const formulaResult = useMemo(() => {
    return calculatePricingFormula(
      {
        acquisitionCost: acqNum,
        refurbCost: refurbNum,
        cleaningCost: cleaningNum,
        brandNewPrice: brandNewNum,
        selectedGrade: grade,
      },
      config
    );
  }, [acqNum, refurbNum, cleaningNum, brandNewNum, grade, config]);

  const activeGradeRow = formulaResult.recommendedGradeRow;
  const floor = computeFloor(acqNum, refurbNum + cleaningNum);
  const priceNum = Number(price) || 0;

  const margin = priceNum > 0 && totalCost > 0 ? priceNum / totalCost - 1 : null;
  const deltaVsCap =
    priceNum > 0 && activeGradeRow?.maxAllowedCap ? priceNum / activeGradeRow.maxAllowedCap - 1 : null;

  const verdict = useMemo(() => {
    if (priceNum <= 0) return { tone: "stone", text: "Enter an ask or select a grade cap to price this unit." };
    if (floor > 0 && priceNum < floor) {
      return { tone: "rose", text: `Blocked — below minimum cost floor of ${fmtMoney(floor)}.` };
    }
    if (activeGradeRow && priceNum > activeGradeRow.maxAllowedCap) {
      return {
        tone: "amber",
        text: `Above Grade ${grade} Retail Cap of ${fmtMoney(activeGradeRow.maxAllowedCap)} (${Math.round((deltaVsCap ?? 0) * 100)}% over) — risk of buyer choosing brand new.`,
      };
    }
    if (activeGradeRow && !activeGradeRow.isTargetMet) {
      return {
        tone: "amber",
        text: `Margin Squeeze: Grade ${grade} Cap (${fmtMoney(activeGradeRow.maxAllowedCap)}) is below Cost + Profit Target (${fmtMoney(formulaResult.targetPrice)}).`,
      };
    }
    if (margin != null && margin >= config.targetProfitMultiplier - 1) {
      return { tone: "emerald", text: `Meets company target profit of ${config.targetProfitMultiplier}× (+${Math.round(margin * 100)}% on cost). Green light.` };
    }
    return { tone: "emerald", text: "Healthy trading price within enforced retail ceiling." };
  }, [priceNum, floor, activeGradeRow, deltaVsCap, grade, formulaResult.targetPrice, margin, config.targetProfitMultiplier]);

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
            Enforced retail gap ceilings, condition grade factors, and intake-based costs.
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
                [{it.sku || "NO-SKU"}] {it.name} ({it.grade ? `Grade ${it.grade}` : "Ungraded"}) — Cost ₱{(it.acquisitionCost + it.refurbCost + it.cleaningCost).toLocaleString()}
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
        {/* LEFT COLUMN (5 Cols): Inputs, Costs & Listing Actions              */}
        {/* ================================================================= */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Reference Brand New Price */}
          <div className="rounded-xl border border-stone-200 bg-white p-4">
            <label className="text-xs font-bold uppercase tracking-wider text-stone-700 block mb-1">
              Brand New Price ₱ (Retail Benchmark)
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-stone-400">₱</span>
              <input
                className="input pl-8 h-10 text-sm font-bold tabular-nums"
                type="number"
                min={0}
                placeholder="e.g. 15000"
                value={brandNew}
                onChange={(e) => setBrandNew(e.target.value)}
              />
            </div>
            <p className="mt-1.5 text-[11px] text-stone-500">
              Sets Grade A ceiling: MaxA = Retail × (1 − {Math.round(config.retailGapPct * 100)}% Retail Gap)
            </p>
          </div>

          {/* Condition Grade Selector */}
          <div className="rounded-xl border border-stone-200 bg-white p-4">
            <label className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center justify-between mb-2">
              <span>Condition Grade</span>
              <span className="text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                Multiplier: {formulaResult.grades.find((r) => r.grade === grade)?.gradeFactor.toFixed(2)}×
              </span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(["A", "B", "C", "D"] as const).map((g) => {
                const isSelected = grade === g;
                const factor = config.gradeFactors[g];
                return (
                  <button
                    key={g}
                    type="button"
                    onClick={() => {
                      setGrade(g);
                      const row = formulaResult.grades.find((r) => r.grade === g);
                      if (row) setPrice(String(row.finalListingPrice));
                    }}
                    className={cn(
                      "flex flex-col items-center justify-center py-2.5 px-1 rounded-xl border text-xs font-bold transition",
                      isSelected
                        ? "border-amber-500 bg-amber-500 text-white shadow-sm"
                        : "border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100"
                    )}
                  >
                    <span>Grade {g}</span>
                    <span className={cn("text-[10px] mt-0.5 tabular-nums font-semibold", isSelected ? "text-amber-100" : "text-stone-400")}>
                      {factor.toFixed(2)}×
                    </span>
                    <span className={cn("text-[9.5px]", isSelected ? "text-amber-100" : "text-stone-400")}>
                      {g === "A" ? "Like New" : g === "B" ? "Good" : g === "C" ? "Fair" : "Salvage"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Intake Costs (Acquisition, Refurb, Cleaning) */}
          <div className="rounded-xl border border-stone-200 bg-stone-50/70 p-4 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-stone-700 uppercase tracking-wider text-[11px]">Item Intake Costs</span>
              <span className="text-stone-900 bg-white px-2.5 py-0.5 rounded-md border border-stone-200 tabular-nums font-black">
                Total: {fmtMoney(totalCost)}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10.5px] font-semibold text-stone-600 block">Acquisition</label>
                <input
                  className="input mt-1 h-9 text-xs font-semibold tabular-nums"
                  type="number"
                  min={0}
                  placeholder="0"
                  value={acq}
                  onChange={(e) => setAcq(e.target.value)}
                />
              </div>
              <div>
                <label className="text-[10.5px] font-semibold text-stone-600 block">Refurb</label>
                <input
                  className="input mt-1 h-9 text-xs font-semibold tabular-nums"
                  type="number"
                  min={0}
                  placeholder="0"
                  value={refurb}
                  onChange={(e) => setRefurb(e.target.value)}
                />
              </div>
              <div>
                <label className="text-[10.5px] font-semibold text-stone-600 block">Cleaning</label>
                <input
                  className="input mt-1 h-9 text-xs font-semibold tabular-nums"
                  type="number"
                  min={0}
                  placeholder="0"
                  value={cleaning}
                  onChange={(e) => setCleaning(e.target.value)}
                />
              </div>
            </div>
            <p className="text-[11px] text-stone-500 leading-tight">
              Acquisition ₱{acqNum.toLocaleString()} + Refurb ₱{refurbNum.toLocaleString()} + Cleaning ₱{cleaningNum.toLocaleString()}
            </p>
          </div>

          {/* Enforced Ask Price & Save Action */}
          <div className="rounded-xl border border-stone-200 bg-white p-4 space-y-3">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-stone-700 block mb-1">
                Enforced Ask Price ₱
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-stone-400">₱</span>
                  <input
                    className="input pl-8 h-10 text-base font-bold tabular-nums"
                    type="number"
                    min={0}
                    placeholder={activeGradeRow ? String(activeGradeRow.finalListingPrice) : "0"}
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </div>
                {activeGradeRow && (
                  <button
                    type="button"
                    onClick={() => handleApplyFinalPrice(activeGradeRow.finalListingPrice)}
                    className="btn-soft h-10 shrink-0 px-3 text-xs font-bold whitespace-nowrap"
                  >
                    Use Cap ({fmtMoney(activeGradeRow.finalListingPrice)})
                  </button>
                )}
              </div>
            </div>

            {/* Verdict Alert */}
            <div className={cn("flex items-start gap-2 rounded-lg border px-3 py-2 text-xs font-medium", verdictTone[verdict.tone])}>
              {verdict.tone === "emerald" ? (
                <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0" />
              ) : verdict.tone === "rose" ? (
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
              ) : (
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              )}
              <span>{verdict.text}</span>
            </div>

            {/* Save to Item Button */}
            {selectedItemId && priceNum > 0 && (
              <button
                type="button"
                onClick={handleSaveToItem}
                disabled={savingItem}
                className="btn-accent h-10 w-full text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-sm"
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

        {/* ================================================================= */}
        {/* RIGHT COLUMN (7 Cols): Formula Engine, Matrix Table & Stats       */}
        {/* ================================================================= */}
        <div className="lg:col-span-7 space-y-4 flex flex-col justify-between">
          
          {/* Top Formula KPI Cards (3 Cards) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-xl border border-stone-200 bg-stone-50/60 p-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                1. Cost Target ({config.targetProfitMultiplier}×)
              </span>
              <div className="mt-1 font-display text-xl font-black text-stone-900 tabular-nums">
                {fmtMoney(formulaResult.targetPrice)}
              </div>
              <span className="text-[11px] text-stone-400">
                ₱{totalCost.toLocaleString()} × {config.targetProfitMultiplier}
              </span>
            </div>

            <div className="rounded-xl border border-stone-200 bg-stone-50/60 p-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                2. MaxA Ceiling ({Math.round(config.retailGapPct * 100)}% Gap)
              </span>
              <div className="mt-1 font-display text-xl font-black text-stone-900 tabular-nums">
                {fmtMoney(formulaResult.maxA)}
              </div>
              <span className="text-[11px] text-stone-400">
                ₱{brandNewNum.toLocaleString()} × (1 - {config.retailGapPct})
              </span>
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                3. Grade {grade} Cap ({activeGradeRow?.gradeFactor.toFixed(2)}×)
              </span>
              <div className="mt-1 font-display text-xl font-black text-amber-950 tabular-nums">
                {fmtMoney(activeGradeRow?.maxAllowedCap ?? 0)}
              </div>
              <span className="text-[11px] text-amber-700 font-semibold">
                Max Allowed Cap
              </span>
            </div>
          </div>

          {/* Condition Grade Pricing Matrix Table (Spacious & Clear) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-700">
                Condition Grade Pricing Matrix
              </span>
              <span className="text-[11px] font-medium text-stone-400">
                Click any row to select grade & apply price
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white shadow-sm">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-50/80 text-[10.5px] font-bold uppercase tracking-wider text-stone-500">
                    <th className="py-2.5 px-3.5">Condition Grade</th>
                    <th className="py-2.5 px-3">Grade Factor</th>
                    <th className="py-2.5 px-3">Max Allowed Cap (Max Grade)</th>
                    <th className="py-2.5 px-3">Cost + Profit Target</th>
                    <th className="py-2.5 px-3.5 font-extrabold text-stone-900">Final Listing Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-medium">
                  {formulaResult.grades.map((r) => {
                    const isActive = grade === r.grade;
                    return (
                      <tr
                        key={r.grade}
                        onClick={() => {
                          setGrade(r.grade);
                          handleApplyFinalPrice(r.finalListingPrice);
                        }}
                        className={cn(
                          "cursor-pointer transition-all",
                          isActive
                            ? "bg-amber-50/90 font-bold border-l-4 border-l-amber-500"
                            : "hover:bg-stone-50/80"
                        )}
                      >
                        <td className="py-3 px-3.5">
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "h-2.5 w-2.5 rounded-full",
                              r.grade === "A" ? "bg-amber-500" : r.grade === "B" ? "bg-emerald-500" : r.grade === "C" ? "bg-blue-500" : "bg-rose-500"
                            )} />
                            <span>Grade {r.grade}</span>
                            {isActive && (
                              <span className="rounded bg-amber-200/60 px-1.5 py-0.2 text-[10px] text-amber-900 font-extrabold">
                                Active
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-3 tabular-nums text-stone-600 font-semibold">
                          {r.gradeFactor.toFixed(2)}
                        </td>
                        <td className="py-3 px-3 tabular-nums text-stone-800">
                          ₱{formulaResult.maxA.toLocaleString()} × {r.gradeFactor.toFixed(2)} ={" "}
                          <strong className="font-bold">{fmtMoney(r.maxAllowedCap)}</strong>
                        </td>
                        <td className="py-3 px-3 tabular-nums text-stone-600">
                          {fmtMoney(formulaResult.targetPrice)}
                        </td>
                        <td className="py-3 px-3.5 tabular-nums text-stone-900">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-black text-sm">{fmtMoney(r.finalListingPrice)}</span>
                            {r.isTargetMet ? (
                              <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                                Target Met
                              </span>
                            ) : (
                              <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                                Margin Squeeze
                              </span>
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

          {/* Deal Performance Preview Bar */}
          <div className="rounded-xl border border-stone-200 bg-stone-50/50 p-3.5">
            <div className="text-[10.5px] font-bold uppercase tracking-wider text-stone-400 mb-2">
              Performance Preview for {fmtMoney(priceNum || activeGradeRow?.finalListingPrice || 0)}
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-lg bg-white p-2.5 border border-stone-200">
                <div className="text-[10px] font-bold uppercase text-stone-400">Margin on Cost</div>
                <div className={cn("mt-0.5 font-display text-lg font-black tabular-nums", (margin ?? 0) >= config.targetProfitMultiplier - 1 ? "text-emerald-600" : "text-amber-600")}>
                  {margin != null ? `${Math.round(margin * 100)}%` : "—"}
                </div>
              </div>
              <div className="rounded-lg bg-white p-2.5 border border-stone-200">
                <div className="text-[10px] font-bold uppercase text-stone-400">Gross Profit</div>
                <div className="mt-0.5 font-display text-lg font-black tabular-nums text-stone-900">
                  {fmtMoney(priceNum - totalCost)}
                </div>
              </div>
              <div className="rounded-lg bg-white p-2.5 border border-stone-200">
                <div className="text-[10px] font-bold uppercase text-stone-400">vs Retail Cap</div>
                <div className={cn("mt-0.5 font-display text-lg font-black tabular-nums", (deltaVsCap ?? 0) > 0 ? "text-rose-600" : "text-emerald-600")}>
                  {deltaVsCap != null ? `${deltaVsCap > 0 ? "+" : ""}${Math.round(deltaVsCap * 100)}%` : "0%"}
                </div>
              </div>
            </div>
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

  return (
    <div className="space-y-6">
      {/* ================================================================= */}
      {/* 1. HOUSE PRICING POLICY STRIP WITH TUNING TOGGLE                   */}
      {/* ================================================================= */}
      <div className="card flex flex-wrap items-center justify-between gap-x-6 gap-y-2.5 px-5 py-3.5 text-xs text-stone-500 bg-white border border-stone-200 shadow-sm">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1.5">
          <span className="flex items-center gap-1.5 font-bold text-stone-900">
            <Scale className="h-4 w-4 text-amber-600" /> House Pricing Policy
          </span>
          <span>
            Target Profit: <strong className="text-stone-800">{config.targetProfitMultiplier}×</strong>
          </span>
          <span>
            Retail Gap: <strong className="text-stone-800">{Math.round(config.retailGapPct * 100)}%</strong>
          </span>
          <span>
            Grade Multipliers:{" "}
            <strong className="text-stone-800">
              A: {config.gradeFactors.A} · B: {config.gradeFactors.B} · C: {config.gradeFactors.C} · D: {config.gradeFactors.D}
            </strong>
          </span>
          <span className="hidden sm:inline-flex items-center gap-1 text-emerald-700">
            <ShieldCheck className="h-3.5 w-3.5" /> Floor = Cost × 1.18
          </span>
        </div>

        <button
          type="button"
          onClick={() => setShowConfigPanel((prev) => !prev)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition shadow-sm",
            showConfigPanel
              ? "border-amber-400 bg-amber-50 text-amber-900"
              : "border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100"
          )}
        >
          <Sliders className="h-3.5 w-3.5 text-amber-600" />
          <span>{showConfigPanel ? "Close Multiplier Tuning" : "Tune Multipliers & Policy"}</span>
        </button>
      </div>

      {/* ================================================================= */}
      {/* 2. FULL-WIDTH MULTIPLIER & POLICY TUNING PANEL                    */}
      {/* ================================================================= */}
      {showConfigPanel && (
        <div className="card p-5 rounded-2xl border-2 border-amber-300 bg-amber-50/40 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200/80 pb-3">
            <div>
              <h3 className="font-display text-base font-bold text-amber-950">
                Company Pricing Multipliers & Strategy Thresholds
              </h3>
              <p className="text-xs text-amber-800/80">
                Adjusting these parameters updates the Pricing Desk formula and matrix calculations in real time.
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Target Profit Multiplier Card */}
            <div className="rounded-xl border border-amber-200 bg-white p-4">
              <label className="text-xs font-bold text-stone-800 block">
                Target Profit Multiplier
              </label>
              <p className="text-[11px] text-stone-500 mt-0.5">Markup hurdle over total acquisition & refurb costs</p>
              <div className="mt-2.5 flex items-center gap-2">
                <input
                  className="input h-10 text-sm font-black tabular-nums w-24"
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
              <span className="mt-1.5 block text-[10.5px] text-amber-700 font-semibold">
                Default: 1.40 (40% profit markup)
              </span>
            </div>

            {/* Retail Gap Discount Card */}
            <div className="rounded-xl border border-amber-200 bg-white p-4">
              <label className="text-xs font-bold text-stone-800 block">
                Retail Gap (% vs Brand New)
              </label>
              <p className="text-[11px] text-stone-500 mt-0.5">Discount threshold ensuring secondhand appeal</p>
              <div className="mt-2.5 flex items-center gap-2">
                <input
                  className="input h-10 text-sm font-black tabular-nums w-24"
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
              <span className="mt-1.5 block text-[10.5px] text-amber-700 font-semibold">
                Default: 35% discount threshold
              </span>
            </div>

            {/* Condition Grade Multipliers Card */}
            <div className="rounded-xl border border-amber-200 bg-white p-4">
              <label className="text-xs font-bold text-stone-800 block">
                Condition Grade Multipliers
              </label>
              <p className="text-[11px] text-stone-500 mt-0.5">Ceiling factor relative to Grade A MaxA</p>
              <div className="mt-2 grid grid-cols-4 gap-1.5">
                {(["A", "B", "C", "D"] as const).map((g) => (
                  <div key={g} className="text-center">
                    <span className="text-[10.5px] font-bold text-stone-600 block mb-0.5">Gr {g}</span>
                    <input
                      className="input h-8 px-1 text-center text-xs font-bold tabular-nums w-full"
                      type="number"
                      step="0.05"
                      min="0.1"
                      max="1.5"
                      value={config.gradeFactors[g]}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0.1;
                        const next = {
                          ...config,
                          gradeFactors: { ...config.gradeFactors, [g]: val },
                        };
                        setConfig(next);
                        try {
                          localStorage.setItem(PRICING_CONFIG_STORAGE_KEY, JSON.stringify(next));
                        } catch {}
                      }}
                    />
                  </div>
                ))}
              </div>
              <span className="mt-1.5 block text-[10.5px] text-amber-700 font-semibold">
                Defaults: A: 1.00 · B: 0.85 · C: 0.70 · D: 0.50
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* 3. CORE WORKSTATION: PRICING FORMULA DESK (FULL-WIDTH 2-COLUMN)   */}
      {/* ================================================================= */}
      <MarginCalculator
        baseOptions={baseOptions}
        brands={brands}
        items={items}
        config={config}
        setConfig={setConfig}
      />

      {/* ================================================================= */}
      {/* 4. BALANCED LOWER DECK: ALERTS & BENCHMARK REFERENCE              */}
      {/* ================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side (5 Cols): Price-Aging Alerts & Violations */}
        <div className="lg:col-span-5 space-y-4">
          <div className="card p-5 border border-stone-200/90 shadow-sm bg-white">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-display text-base font-bold text-stone-900">Price-Aging Alerts</h3>
              <span className={cn("chip", visibleAlerts.length ? "border-rose-200 bg-rose-50 text-rose-600" : "border-emerald-200 bg-emerald-50 text-emerald-600")}>
                {visibleAlerts.length ? `${visibleAlerts.length} need markdown` : "all clear"}
              </span>
            </div>

            {/* Violations below floor */}
            {visibleViolations.length > 0 && (
              <div className="mt-3 space-y-2">
                {visibleViolations.map((v) => (
                  <div key={v.id} className="flex flex-wrap items-center gap-2.5 rounded-xl border border-rose-300 bg-rose-50 p-2.5">
                    <ShieldAlert className="h-4 w-4 shrink-0 text-rose-500" />
                    <span className="min-w-0 flex-1 truncate text-xs font-semibold text-rose-800">
                      {v.name} ({v.sku}) is below floor
                    </span>
                    <button
                      onClick={() => fixViolation(v)}
                      disabled={busy === v.id}
                      className="inline-flex h-7 items-center gap-1 rounded bg-rose-600 px-2.5 text-[11px] font-bold text-white transition hover:bg-rose-500 disabled:opacity-50"
                    >
                      {busy === v.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                      Fix Floor
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Alerts List */}
            {visibleAlerts.length === 0 ? (
              <p className="mt-4 rounded-xl border border-dashed border-stone-200 bg-stone-50/60 px-4 py-8 text-center text-xs text-stone-400">
                All listed inventory is rotating within standard markdown windows.
              </p>
            ) : (
              <div className="mt-3 divide-y divide-stone-100 max-h-[360px] overflow-y-auto">
                {visibleAlerts.map((a) => {
                  const t = TIER_STYLE[a.tier];
                  return (
                    <div key={a.id} className="flex items-center justify-between gap-3 py-2.5">
                      <Link href={`/inventory/${a.id}`} className="flex min-w-0 flex-1 items-center gap-2.5">
                        <Thumb url={a.photo} className="h-10 w-12 shrink-0 rounded-lg border border-stone-100 object-cover" />
                        <span className="min-w-0">
                          <span className="block truncate text-xs font-bold text-stone-900">{a.name}</span>
                          <span className="text-[11px] text-stone-400">
                            {a.days}d · {a.grade ? `Grade ${a.grade}` : "Ungraded"}
                          </span>
                        </span>
                      </Link>
                      <div className="text-right text-xs tabular-nums shrink-0">
                        <span className="text-stone-400 line-through mr-1.5">{fmtMoney(a.ask)}</span>
                        <span className="font-bold text-amber-700">{fmtMoney(a.suggested)}</span>
                      </div>
                      <button
                        onClick={() => apply(a)}
                        disabled={busy === a.id || a.suggested == null}
                        className="btn-accent h-8 px-2.5 text-[11px] font-bold shrink-0"
                      >
                        {busy === a.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                        Apply
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Side (7 Cols): Market Benchmark Reference */}
        <div className="lg:col-span-7">
          <div className="card overflow-hidden border border-stone-200/90 shadow-sm bg-white">
            <div className="flex flex-wrap items-center justify-between gap-2 p-4 pb-3 border-b border-stone-100">
              <div>
                <h3 className="font-display text-base font-bold text-stone-900">Market Benchmark Reference</h3>
                <p className="text-xs text-stone-500">
                  Where your asks sit against the market midpoint and realized sales.
                </p>
              </div>
              <div className="flex gap-2.5 text-[10px] font-bold text-stone-400">
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-indigo-400" /> benchmark</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-stone-900" /> ask</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" /> realized</span>
              </div>
            </div>
            <div className="overflow-x-auto max-h-[360px]">
              <table className="w-full min-w-[500px] border-collapse text-xs">
                <thead>
                  <tr className="border-b border-stone-100 bg-stone-50/70 text-left text-[10px] font-bold uppercase tracking-wider text-stone-400">
                    <th className="py-2 px-3">Family</th>
                    <th className="px-2">Grade</th>
                    <th className="px-2 text-center">In Stock</th>
                    <th className="px-2 text-right">Benchmark</th>
                    <th className="px-2 text-right">Avg Ask</th>
                    <th className="px-3 pr-4">Position</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {benchmarks.map((b) => {
                    const max = Math.max(b.avgBenchmark ?? 0, b.avgListed ?? 0, b.avgSold ?? 0) * 1.25 || 1;
                    const x = (v?: number | null) => (v ? `${Math.min(97, (v / max) * 100)}%` : undefined);
                    return (
                      <tr key={`${b.rootSlug}-${b.grade}`} className="hover:bg-stone-50/60">
                        <td className="py-2.5 px-3 font-semibold text-stone-800 truncate max-w-[120px]">{b.rootName}</td>
                        <td className="px-2"><GradeChip grade={b.grade} /></td>
                        <td className="px-2 text-center tabular-nums text-stone-500">{b.stockCount}</td>
                        <td className="px-2 text-right tabular-nums font-semibold text-indigo-700">{fmtMoney(b.avgBenchmark)}</td>
                        <td className="px-2 text-right tabular-nums font-bold text-stone-900">{fmtMoney(b.avgListed)}</td>
                        <td className="px-3 pr-4">
                          <div className="relative h-1.5 w-24 sm:w-28 rounded-full bg-stone-100">
                            {x(b.avgBenchmark) && <span className="absolute top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-indigo-400" style={{ left: x(b.avgBenchmark) }} title={`benchmark ${fmtMoney(b.avgBenchmark)}`} />}
                            {x(b.avgListed) && <span className="absolute top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-stone-900" style={{ left: x(b.avgListed) }} title={`ask ${fmtMoney(b.avgListed)}`} />}
                            {x(b.avgSold) && <span className="absolute top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-emerald-500" style={{ left: x(b.avgSold) }} title={`realized ${fmtMoney(b.avgSold)}`} />}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
