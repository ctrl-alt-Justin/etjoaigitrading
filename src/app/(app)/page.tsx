import Link from "next/link";
import {
  AlarmClockCheck,
  ArrowRight,
  ArrowUpRight,
  BadgeDollarSign,
  Boxes,
  PackagePlus,
  Scale,
  ShoppingBag,
  Wallet,
} from "lucide-react";
import { computeDashboard, enrichItems, getAllData } from "@/lib/queries";
import { fmtInt, fmtMoney, fmtMoneyCompact, relTime } from "@/lib/format";
import { SeedGate } from "@/components/seed-gate";
import { Reveal } from "@/components/reveal";
import { GradeChip, KpiCard, SectionHead, StatusChip, Thumb } from "@/components/ui";
import { AgeDistributionChart, Spark, TriadChart, VolumeChart } from "@/components/charts";
import { DashboardRealtimeClock } from "@/components/dashboard-realtime-clock";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { items, categories, suppliers } = await getAllData();

  if (categories.length === 0) {
    return (
      <>
        <PageHead />
        <SeedGate />
      </>
    );
  }

  const enriched = enrichItems(items, categories, suppliers);
  const dash = computeDashboard(enriched, suppliers);
  const k = dash.kpis;
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <Reveal>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-amber-700">
              Operations
            </div>
            <h1 className="font-display text-[34px] font-semibold leading-none tracking-tight text-stone-900">
              The trading floor, at a glance
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[13.5px] text-stone-500">
              <DashboardRealtimeClock initialDate={today} />
            </div>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <Link
              href="/shop"
              target="_blank"
              className="flex items-center gap-2 rounded-xl border border-[#16c4df]/50 bg-[#16c4df]/15 px-3.5 py-2 text-[13px] font-bold text-[#1D5D8B] transition hover:bg-[#16c4df]/25 hover:border-[#16c4df] shadow-sm"
            >
              <ShoppingBag className="h-4 w-4 text-[#16c4df]" />
              <span>Visit Shop</span>
              <ArrowUpRight className="h-3.5 w-3.5 text-[#16c4df]" />
            </Link>
            <Link href="/inventory/new" className="btn-accent">
              <PackagePlus className="h-4 w-4" /> New intake
            </Link>
            <Link href="/pricing" className="btn-ghost">
              <Scale className="h-4 w-4" /> Pricing desk
            </Link>
          </div>
        </div>
      </Reveal>

      {/* KPI Row (All 5 revised per specifications) */}
      <Reveal delay={0.05}>
        <div className="grid grid-cols-2 gap-3.5 md:grid-cols-3 xl:grid-cols-5">
          {/* 1. Stock on hand */}
          <KpiCard
            label="Stock on hand"
            value={fmtInt(k.stockCount)}
            sub={`${k.intakeThisWeek} taken in this week`}
            icon={Boxes}
            tone="stone"
          />

          {/* 2. Inventory Value */}
          <KpiCard
            label="Inventory Value"
            value={fmtMoneyCompact(k.stockListedValue)}
            sub={`${fmtMoney(k.stockListedValue)} listed inventory value`}
            icon={Wallet}
            tone="amber"
          />

          {/* 3. Items Sold This Month */}
          <KpiCard
            label="Items Sold This Month"
            value={fmtInt(k.soldCountMtd)}
            sub={`${fmtMoney(k.revenueMtd)} revenue`}
            icon={BadgeDollarSign}
            tone="emerald"
            spark={<Spark data={dash.spark} color="#0e9f6e" />}
          />

          {/* 4. Total Profit */}
          <KpiCard
            label="Total Profit"
            value={fmtMoneyCompact(dash.totalProfit)}
            sub={`${fmtInt(dash.lifetimeSalesCount)} lifetime sales`}
            icon={BadgeDollarSign}
            tone="stone"
          />

          {/* 5. Needs Attention */}
          <Link href="/pricing" className="block transition hover:-translate-y-0.5">
            <KpiCard
              label="Needs Attention"
              value={fmtInt(dash.needsAttention.total)}
              sub={`${dash.needsAttention.incomplete} incomplete · ${dash.needsAttention.aging} aging`}
              icon={AlarmClockCheck}
              tone={dash.needsAttention.total > 0 ? "rose" : "emerald"}
              alert={dash.needsAttention.total > 0}
            />
          </Link>
        </div>
      </Reveal>

      {/* Row 1: Intake vs sales AND age distribution (2-column layout) */}
      <Reveal delay={0.08}>
        <div className="grid gap-5 lg:grid-cols-12">
          {/* Intake vs sales — last 12 weeks */}
          <div className="card p-5 lg:col-span-7">
            <SectionHead
              kicker="Flow"
              title="Intake vs sales — last 12 weeks"
              right={
                <div className="flex gap-3 text-[10.5px] font-semibold text-stone-400">
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-sm bg-[#D97706]" /> intake
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-sm bg-[#0e9f6e]" /> sold
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-[#292524]" /> revenue
                  </span>
                </div>
              }
            />
            <div className="mt-4 h-[270px]">
              <VolumeChart data={dash.weekly} />
            </div>
          </div>

          {/* Age Distribution (inventory age vs number of items in that age) */}
          <div className="card p-5 lg:col-span-5">
            <SectionHead
              kicker="Aging"
              title="Age Distribution"
              right={
                <span className="text-[10.5px] font-semibold text-stone-400">
                  {k.stockCount} active items
                </span>
              }
            />
            <div className="mt-4 h-[270px]">
              <AgeDistributionChart data={dash.aging} />
            </div>
          </div>
        </div>
      </Reveal>

      {/* Row 2: Price performance AND high-cost item (2-column layout) */}
      <Reveal delay={0.1}>
        <div className="grid gap-5 lg:grid-cols-12">
          {/* Price Performance */}
          <div className="card p-5 lg:col-span-7">
            <SectionHead
              kicker="Spread"
              title="Price Performance"
              right={
                <div className="flex gap-3 text-[10.5px] font-semibold text-stone-400">
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-sm bg-[#CFC9BC]" /> cost
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-sm bg-[#E9A23B]" /> ask
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-sm bg-[#0e9f6e]" /> sold
                  </span>
                </div>
              }
            />
            <div className="mt-4 h-[270px]">
              <TriadChart data={dash.soldByMonth} />
            </div>
          </div>

          {/* High-Cost Item (Top 5 unsold inventory by cost with age) */}
          <div className="card p-5 lg:col-span-5 flex flex-col justify-between">
            <div>
              <SectionHead
                kicker="Capital"
                title="High-Cost Item"
                right={
                  <Link href="/inventory" className="btn-ghost h-8 px-2.5 text-[11.5px]">
                    Full inventory <ArrowRight className="h-3 w-3" />
                  </Link>
                }
              />
              <div className="mt-3 divide-y divide-stone-100">
                {dash.highCostItems.map((i) => (
                  <Link
                    key={i.id}
                    href={`/inventory/${i.id}`}
                    className="group flex items-center gap-3 py-2.5 transition hover:bg-stone-50/80 rounded-lg px-1"
                  >
                    <Thumb url={i.photos?.[0]?.url} className="h-10 w-12 shrink-0 rounded-lg border border-stone-100 object-cover" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-semibold text-stone-900 transition group-hover:text-amber-800">
                        {i.name}
                      </div>
                      <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-stone-400 truncate">
                        <span>{i.sku}</span>
                        {i.categoryPath && <span>· {i.categoryPath}</span>}
                      </div>
                    </div>
                    <div className="shrink-0">
                      <GradeChip grade={i.grade} />
                    </div>
                    <div className="shrink-0 text-center px-1">
                      <span className="inline-block text-[10.5px] font-semibold text-stone-500 bg-stone-100 px-2 py-0.5 rounded">
                        {i.ageLabel}
                      </span>
                    </div>
                    <div className="w-[84px] text-right shrink-0">
                      <div className="font-semibold tabular-nums text-stone-900 text-[13px]">
                        {fmtMoney(i.effectiveCost)}
                      </div>
                      <div className="text-[10px] text-stone-400">capital</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
            <div className="mt-3 border-t border-stone-100 pt-2.5 text-[11px] text-stone-400 text-center">
              Top 5 capital-heavy items currently tied up in unsold inventory
            </div>
          </div>
        </div>
      </Reveal>

      {/* Row 3: Sourcing opportunities AND recent intake (2-column layout) */}
      <Reveal delay={0.12}>
        <div className="grid gap-5 lg:grid-cols-12">
          {/* Sourcing Opportunities Table */}
          <div className="card overflow-hidden lg:col-span-7 flex flex-col justify-between">
            <div>
              <div className="p-5 pb-3">
                <SectionHead kicker="Procurement" title="Sourcing Opportunities" />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] border-collapse text-sm">
                  <thead>
                    <tr className="border-y border-[var(--line)] bg-stone-50/70 text-left text-[10.5px] font-bold uppercase tracking-[0.1em] text-stone-400">
                      <th className="py-2.5 pl-5 pr-3">Item</th>
                      <th className="px-3 text-center">Grade</th>
                      <th className="px-3 text-center">Sold</th>
                      <th className="px-3 text-center">Avg. Time to Sell</th>
                      <th className="px-3 text-center">In Stock</th>
                      <th className="px-3 pr-5 text-left">Supplier</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dash.sourcingOpportunities.map((s) => (
                      <tr key={s.id} className="border-b border-stone-100 last:border-0 hover:bg-amber-50/40">
                        <td className="py-2.5 pl-5 pr-3 font-semibold text-stone-900 text-xs truncate max-w-[160px]">
                          {s.name}
                        </td>
                        <td className="px-3 text-center">
                          <GradeChip grade={s.grade} />
                        </td>
                        <td className="px-3 text-center tabular-nums text-xs text-stone-700 font-bold">
                          {s.soldCount}
                        </td>
                        <td className="px-3 text-center tabular-nums text-xs text-stone-600">
                          {s.avgDaysToSell != null ? `${s.avgDaysToSell}d` : "—"}
                        </td>
                        <td className="px-3 text-center tabular-nums text-xs">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                              s.inStockCount === 0
                                ? "bg-rose-50 text-rose-700 font-bold"
                                : "bg-emerald-50 text-emerald-700"
                            }`}
                          >
                            {s.inStockCount} in stock
                          </span>
                        </td>
                        <td className="px-3 pr-5 text-xs text-stone-600 truncate max-w-[130px]">
                          {s.supplierName}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="p-4 border-t border-stone-100 bg-stone-50/50 text-[11px] text-stone-500 flex items-center justify-between">
              <span>Fast-turning models to re-order from commercial suppliers</span>
              <Link href="/inventory/new" className="text-[#1D5D8B] font-bold hover:underline">
                Create intake order →
              </Link>
            </div>
          </div>

          {/* Recent Intake (Two-line stacked tags: Status first then Condition Grade) */}
          <div className="card p-5 lg:col-span-5 flex flex-col justify-between">
            <div>
              <SectionHead
                kicker="Inflow"
                title="Recent intake"
                right={
                  <Link href="/inventory/new" className="text-[12px] font-bold text-amber-700 hover:text-amber-600">
                    Add →
                  </Link>
                }
              />
              <div className="mt-2 space-y-1">
                {dash.recentIntake.map((i) => (
                  <Link
                    key={i.id}
                    href={`/inventory/${i.id}`}
                    className="group flex items-center gap-3 rounded-xl px-2 py-2 transition hover:bg-amber-50/60"
                  >
                    <Thumb url={i.photos?.[0]?.url} className="h-10 w-12 shrink-0 rounded-lg border border-stone-100 object-cover" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-semibold text-stone-800">{i.name}</div>
                      <div className="mt-0.5 text-[11px] text-stone-400">{i.sku} · {relTime(i.intakeAt)}</div>
                    </div>

                    {/* Two-line organized tags: Status first, then Condition Grade */}
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <StatusChip status={i.status} />
                      {i.grade && <GradeChip grade={i.grade} />}
                    </div>

                    <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-stone-300 transition group-hover:text-amber-600" />
                  </Link>
                ))}
              </div>
            </div>
            <div className="mt-3 border-t border-stone-100 pt-2.5 text-center">
              <Link href="/inventory" className="text-xs font-bold text-[#1D5D8B] hover:underline">
                View all inventory items →
              </Link>
            </div>
          </div>
        </div>
      </Reveal>
    </div>
  );
}

function PageHead() {
  return (
    <div>
      <div className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-amber-700">
        Operations
      </div>
      <h1 className="font-display text-[34px] font-semibold leading-none tracking-tight text-stone-900">
        The trading floor, at a glance
      </h1>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-[13.5px] text-stone-500">
        <DashboardRealtimeClock />
      </div>
    </div>
  );
}
