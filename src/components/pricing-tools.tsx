"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  BadgeCheck,
  Calculator,
  Check,
  Loader2,
  Scale,
  ShieldAlert,
  ShieldCheck,
  TrendingDown,
} from "lucide-react";
import type { BenchmarkRow } from "@/lib/queries";
import { GRADE_ORDER, brandTier, computeFloor, round50, valuate, type Grade } from "@/lib/valuation";
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

const TIER_STYLE: Record<AlertLite["tier"], { box: string; label: string }> = {
  watch: { box: "bg-amber-50 text-amber-800 border-amber-200", label: "30–59d · −6%" },
  action: { box: "bg-orange-50 text-orange-700 border-orange-200", label: "60–89d · −12%" },
  critical: { box: "bg-rose-50 text-rose-700 border-rose-200", label: "90d+ · −20%" },
};

/* ------------------------------------------------------------------ */

function MarginCalculator({
  baseOptions,
  brands,
}: {
  baseOptions: { id: number; label: string; baseValue: number }[];
  brands: string[];
}) {
  const [catId, setCatId] = useState(baseOptions[0]?.id ?? 0);
  const [brand, setBrand] = useState("Herman Miller");
  const [grade, setGrade] = useState<Grade>("B");
  const [acq, setAcq] = useState("320");
  const [refurb, setRefurb] = useState("25");
  const [price, setPrice] = useState("");

  const cat = baseOptions.find((o) => o.id === catId) ?? null;
  const v = valuate({ baseValue: cat?.baseValue ?? null, brand, grade });
  const tier = brandTier(brand);
  const acqNum = Number(acq) || 0;
  const refurbNum = Number(refurb) || 0;
  const eff = acqNum + refurbNum;
  const floor = computeFloor(acqNum, refurbNum);
  const suggested = v.suggested ? Math.max(floor, v.suggested) : floor || null;
  const priceNum = Number(price) || 0;

  const margin = priceNum > 0 && eff > 0 ? priceNum / eff - 1 : null;
  const delta = priceNum > 0 && v.benchmark ? priceNum / v.benchmark - 1 : null;

  const verdict = useMemo(() => {
    if (priceNum <= 0) return { tone: "stone", text: "Enter an ask to preview the deal quality." };
    if (priceNum < floor) return { tone: "rose", text: `Blocked — below enforced floor of ${fmtMoney(floor)}.` };
    if (delta != null && delta > 0.15) return { tone: "amber", text: `${Math.round(delta * 100)}% above benchmark — expect slower turns.` };
    if (margin != null && margin >= 0.45) return { tone: "emerald", text: "Strong premium margin. Green light." };
    if (margin != null && margin >= 0.22) return { tone: "emerald", text: "Healthy trading margin. Green light." };
    return { tone: "amber", text: "Thin margin — renegotiate acquisition or raise ask." };
  }, [priceNum, floor, delta, margin]);

  const verdictTone: Record<string, string> = {
    stone: "border-stone-200 bg-stone-50 text-stone-500",
    rose: "border-rose-200 bg-rose-50 text-rose-700",
    amber: "border-amber-200 bg-amber-50 text-amber-800",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
  };

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2">
        <Calculator className="h-4 w-4 text-amber-600" />
        <h3 className="font-display text-lg font-semibold text-stone-900">Margin calculator</h3>
      </div>
      <div className="mt-4 space-y-3">
        <div>
          <label className="label">Category</label>
          <select className="input" value={catId} onChange={(e) => setCatId(Number(e.target.value))}>
            {baseOptions.map((o) => (
              <option key={o.id} value={o.id}>{o.label} — ref {fmtMoney(o.baseValue)}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Brand</label>
            <input className="input" list="brand-list" value={brand} onChange={(e) => setBrand(e.target.value)} />
            <datalist id="brand-list">
              {brands.map((b) => <option key={b} value={b} />)}
            </datalist>
            <p className="mt-1 text-[10.5px] text-stone-400">tier {tier.name} ×{tier.multiplier}</p>
          </div>
          <div>
            <label className="label">Grade</label>
            <div className="flex overflow-hidden rounded-xl border border-[var(--line)]">
              {GRADE_ORDER.map((g) => (
                <button
                  key={g}
                  onClick={() => setGrade(g)}
                  className={cn(
                    "h-10 flex-1 text-[13px] font-bold transition",
                    grade === g ? "bg-stone-900 text-white" : "text-stone-400 hover:bg-stone-50"
                  )}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Acquisition ₱</label>
            <input className="input tabular-nums" type="number" min={0} value={acq} onChange={(e) => setAcq(e.target.value)} />
          </div>
          <div>
            <label className="label">Refurb ₱</label>
            <input className="input tabular-nums" type="number" min={0} value={refurb} onChange={(e) => setRefurb(e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 rounded-xl bg-stone-50 p-2.5 text-center">
          {[
            ["Value range", v.low != null ? `${fmtMoney(v.low)}–${fmtMoney(v.high)}` : "—"],
            ["Benchmark", fmtMoney(v.benchmark)],
            ["Floor", fmtMoney(floor)],
          ].map(([l, r]) => (
            <div key={l}>
              <div className="text-[9.5px] font-bold uppercase tracking-wider text-stone-400">{l}</div>
              <div className="mt-0.5 truncate text-[12.5px] font-bold tabular-nums text-stone-800">{r}</div>
            </div>
          ))}
        </div>

        <div>
          <label className="label">Ask price ₱</label>
          <div className="flex gap-2">
            <input
              className="input h-11 text-lg font-bold tabular-nums"
              type="number"
              min={0}
              placeholder={suggested ? String(suggested) : "0"}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
            {suggested != null && (
              <button onClick={() => setPrice(String(suggested))} className="btn-soft h-11 shrink-0">
                Use {fmtMoney(suggested)}
              </button>
            )}
          </div>
        </div>

        {priceNum > 0 && (
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl border border-[var(--line)] px-2 py-2.5">
              <div className="text-[9.5px] font-bold uppercase tracking-wider text-stone-400">Margin</div>
              <div className={cn("mt-0.5 font-display text-xl font-bold tabular-nums", (margin ?? 0) >= 0.22 ? "text-emerald-600" : "text-rose-600")}>
                {margin != null ? `${Math.round(margin * 100)}%` : "—"}
              </div>
            </div>
            <div className="rounded-xl border border-[var(--line)] px-2 py-2.5">
              <div className="text-[9.5px] font-bold uppercase tracking-wider text-stone-400">Gross profit</div>
              <div className="mt-0.5 font-display text-xl font-bold tabular-nums text-stone-900">
                {fmtMoney(priceNum - eff)}
              </div>
            </div>
            <div className="rounded-xl border border-[var(--line)] px-2 py-2.5">
              <div className="text-[9.5px] font-bold uppercase tracking-wider text-stone-400">vs market</div>
              <div className={cn("mt-0.5 font-display text-xl font-bold tabular-nums", (delta ?? 0) > 0.15 ? "text-amber-600" : "text-stone-900")}>
                {delta != null ? `${delta >= 0 ? "+" : ""}${Math.round(delta * 100)}%` : "—"}
              </div>
            </div>
          </div>
        )}

        <div className={cn("flex items-start gap-2 rounded-xl border px-3.5 py-2.5 text-[12.5px] font-medium", verdictTone[verdict.tone])}>
          {verdict.tone === "emerald" ? <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0" /> : verdict.tone === "rose" ? <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />}
          {verdict.text}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

export function PricingTools({
  alerts,
  violations,
  benchmarks,
  baseOptions,
  brands,
}: {
  alerts: AlertLite[];
  violations: ViolationLite[];
  benchmarks: BenchmarkRow[];
  baseOptions: { id: number; label: string; baseValue: number }[];
  brands: string[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<number | null>(null);
  const [done, setDone] = useState<Set<number>>(new Set());

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
    <div className="space-y-5">
      {/* policy strip */}
      <div className="card flex flex-wrap items-center gap-x-6 gap-y-2 px-5 py-3.5 text-[12px] text-stone-500">
        <span className="flex items-center gap-1.5 font-semibold text-stone-700">
          <Scale className="h-3.5 w-3.5 text-amber-600" /> House pricing policy
        </span>
        <span>Floor = effective cost × 1.18</span>
        <span className="flex items-center gap-1"><TrendingDown className="h-3.5 w-3.5 text-amber-600" /> 30d → −6%</span>
        <span>60d → −12%</span>
        <span>90d → −20%</span>
        <span className="flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> markdowns never cross the floor</span>
      </div>

      <div className="grid gap-5 xl:grid-cols-[400px_1fr]">
        <MarginCalculator baseOptions={baseOptions} brands={brands} />

        <div className="space-y-5">
          {/* price-aging alerts */}
          <div className="card p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-display text-lg font-semibold text-stone-900">Price-aging alerts</h3>
              <span className={cn("chip", visibleAlerts.length ? "border-rose-200 bg-rose-50 text-rose-600" : "border-emerald-200 bg-emerald-50 text-emerald-600")}>
                {visibleAlerts.length ? `${visibleAlerts.length} need markdown` : "all clear"}
              </span>
            </div>
            {visibleViolations.length > 0 && (
              <div className="mt-3 space-y-2">
                {visibleViolations.map((v) => (
                  <div key={v.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-rose-300 bg-rose-50 px-3.5 py-2.5">
                    <ShieldAlert className="h-4 w-4 shrink-0 text-rose-500" />
                    <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-rose-800">
                      {v.name} <span className="font-normal text-rose-500">({v.sku})</span> is live below its floor
                    </span>
                    <span className="text-[12px] tabular-nums text-rose-600">ask {fmtMoney(v.ask)} &lt; floor {fmtMoney(v.floor)}</span>
                    <button
                      onClick={() => fixViolation(v)}
                      disabled={busy === v.id}
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-rose-600 px-3 text-[12px] font-bold text-white transition hover:bg-rose-500 disabled:opacity-50"
                    >
                      {busy === v.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                      Raise to floor
                    </button>
                  </div>
                ))}
              </div>
            )}
            {visibleAlerts.length === 0 ? (
              <p className="mt-3 rounded-xl border border-dashed border-stone-200 bg-stone-50/60 px-4 py-6 text-center text-[13px] text-stone-400">
                Nothing has been sitting past its markdown window. Fresh book.
              </p>
            ) : (
              <div className="mt-3 divide-y divide-stone-100">
                {visibleAlerts.map((a) => {
                  const t = TIER_STYLE[a.tier];
                  return (
                    <div key={a.id} className="flex flex-wrap items-center gap-3.5 py-3">
                      <Link href={`/inventory/${a.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                        <Thumb url={a.photo} className="h-11 w-14 shrink-0 rounded-lg border border-stone-100" />
                        <span className="min-w-0">
                          <span className="block truncate text-[13.5px] font-semibold text-stone-900">{a.name}</span>
                          <span className="mt-0.5 flex items-center gap-2 text-[11.5px] text-stone-400">
                            {a.sku} {a.grade && <>· <GradeChip grade={a.grade} /></>}
                          </span>
                        </span>
                      </Link>
                      <span className={cn("chip border", t.box)}>
                        {a.days}d · policy {t.label}
                      </span>
                      <span className="w-[150px] text-right text-[12.5px] tabular-nums text-stone-500">
                        <span className="font-semibold text-stone-900">{fmtMoney(a.ask)}</span>
                        <ArrowUpRight className="mx-1 inline h-3 w-3 rotate-90 text-stone-300" />
                        <span className="font-bold text-amber-700">{fmtMoney(a.suggested)}</span>
                        <span className="block text-[10.5px] text-stone-400">
                          margin after {a.marginAfter != null ? `${Math.round(a.marginAfter * 100)}%` : "—"}
                        </span>
                      </span>
                      <button
                        onClick={() => apply(a)}
                        disabled={busy === a.id || a.suggested == null}
                        className="btn-accent h-9 px-3.5 text-[12.5px]"
                      >
                        {busy === a.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                        Apply
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* benchmarks */}
      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 p-5 pb-3">
          <div>
            <h3 className="font-display text-lg font-semibold text-stone-900">Market benchmark reference</h3>
            <p className="mt-0.5 text-[12.5px] text-stone-500">
              Where your asks sit against the market midpoint and realized sales — by family and grade.
            </p>
          </div>
          <div className="flex gap-3 text-[10.5px] font-semibold text-stone-400">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-indigo-400" /> benchmark</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-stone-900" /> your ask</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" /> realized</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] border-collapse text-sm">
            <thead>
              <tr className="border-y border-[var(--line)] bg-stone-50/70 text-left text-[10.5px] font-bold uppercase tracking-[0.1em] text-stone-400">
                <th className="py-2.5 pl-5 pr-3">Family</th>
                <th className="px-3">Grade</th>
                <th className="px-3 text-center">In stock</th>
                <th className="px-3 text-center">Sold</th>
                <th className="px-3 text-right">Benchmark</th>
                <th className="px-3 text-right">Your avg ask</th>
                <th className="px-3 text-right">Avg realized</th>
                <th className="px-3 pr-5">Position</th>
              </tr>
            </thead>
            <tbody>
              {benchmarks.map((b) => {
                const max = Math.max(b.avgBenchmark ?? 0, b.avgListed ?? 0, b.avgSold ?? 0) * 1.25 || 1;
                const x = (v?: number | null) => (v ? `${Math.min(97, (v / max) * 100)}%` : undefined);
                return (
                  <tr key={`${b.rootSlug}-${b.grade}`} className="border-b border-stone-100 last:border-0 hover:bg-amber-50/40">
                    <td className="py-2.5 pl-5 pr-3 font-semibold text-stone-800">{b.rootName}</td>
                    <td className="px-3"><GradeChip grade={b.grade} /></td>
                    <td className="px-3 text-center tabular-nums text-stone-500">{b.stockCount}</td>
                    <td className="px-3 text-center tabular-nums text-stone-500">{b.soldCount}</td>
                    <td className="px-3 text-right tabular-nums font-semibold text-indigo-700">{fmtMoney(b.avgBenchmark)}</td>
                    <td className="px-3 text-right tabular-nums font-semibold text-stone-900">{fmtMoney(b.avgListed)}</td>
                    <td className="px-3 text-right tabular-nums font-semibold text-emerald-700">{fmtMoney(b.avgSold)}</td>
                    <td className="px-3 pr-5">
                      <div className="relative h-1.5 w-36 rounded-full bg-stone-100">
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
  );
}
