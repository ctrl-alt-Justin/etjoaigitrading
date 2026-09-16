import Link from "next/link";
import {
  AlarmClockCheck,
  ArrowRight,
  ArrowUpRight,
  BadgeDollarSign,
  Boxes,
  PackagePlus,
  Percent,
  Scale,
  ShoppingBag,
  Wallet,
} from "lucide-react";
import { computeDashboard, enrichItems, getAllData } from "@/lib/queries";
import { fmtInt, fmtMoney, fmtMoneyCompact, fmtPct, relTime } from "@/lib/format";
import { SeedGate } from "@/components/seed-gate";
import { Reveal } from "@/components/reveal";
import { AgingChip, GradeChip, KpiCard, MarginPill, SectionHead, StatusChip, Thumb } from "@/components/ui";
import { AgingChart, CategoryValueChart, Spark, TriadChart, VolumeChart } from "@/components/charts";

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
      {/* header */}
      <Reveal>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-amber-700">
              Operations · ETJOAIGI Trading
            </div>
            <h1 className="font-display text-[34px] font-semibold leading-none tracking-tight text-stone-900">
              The trading floor, at a glance
            </h1>
            <p className="mt-2 text-[13.5px] text-stone-500">{today} — everything bought, graded, listed and sold.</p>
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

      {/* KPI row */}
      <Reveal delay={0.05}>
        <div className="grid grid-cols-2 gap-3.5 md:grid-cols-3 xl:grid-cols-5">
          <KpiCard
            label="Stock on hand"
            value={fmtInt(k.stockCount)}
            sub={`${k.intakeThisWeek} taken in this week · ${k.avgDaysToSell != null ? `${Math.round(k.avgDaysToSell)}d avg to sell` : "no sales yet"}`}
            icon={Boxes}
            tone="stone"
          />
          <KpiCard
            label="Listed inventory value"
            value={fmtMoneyCompact(k.stockListedValue)}
            sub={`${fmtMoneyCompact(k.stockCostBasis)} cost basis · ${fmtMoneyCompact(k.stockPotentialProfit)} potential gross`}
            icon={Wallet}
            tone="amber"
          />
          <KpiCard
            label="Sold this month"
            value={fmtInt(k.soldCountMtd)}
            sub={`${fmtMoneyCompact(k.revenueMtd)} revenue booked`}
            icon={BadgeDollarSign}
            tone="emerald"
            spark={<Spark data={dash.spark} color="#0e9f6e" />}
          />
          <KpiCard
            label="Avg realized margin"
            value={fmtPct(k.avgRealizedMargin)}
            sub={`on ${fmtInt(enriched.filter((i) => i.status === "sold").length)} lifetime sales`}
            icon={Percent}
            tone="stone"
          />
          <Link href="/pricing" className="block transition hover:-translate-y-0.5">
            <KpiCard
              label="Price-aging alerts"
              value={fmtInt(k.alertCount)}
              sub={k.alertCount ? "policy markdowns due — review" : "book is fresh"}
              icon={AlarmClockCheck}
              tone={k.alertCount ? "rose" : "emerald"}
              alert={k.alertCount > 0}
            />
          </Link>
        </div>
      </Reveal>

      {/* volume + aging */}
      <Reveal delay={0.08}>
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="card p-5 lg:col-span-2">
            <SectionHead
              kicker="Flow"
              title="Intake vs sales — last 12 weeks"
              sub="Units in against units out, with weekly revenue."
              right={
                <div className="flex gap-3 text-[10.5px] font-semibold text-stone-400">
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-amber-600" /> intake</span>
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-emerald-600" /> sold</span>
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-stone-800" /> revenue</span>
                </div>
              }
            />
            <div className="mt-4 h-[260px]">
              <VolumeChart data={dash.weekly} />
            </div>
          </div>
          <div className="card p-5">
            <SectionHead kicker="Aging" title="Stock age profile" sub="Days since intake, value at ask." />
            <div className="mt-4 h-[260px]">
              <AgingChart data={dash.aging} />
            </div>
          </div>
        </div>
      </Reveal>

      {/* value by category + triad */}
      <Reveal delay={0.1}>
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="card p-5">
            <SectionHead kicker="Book" title="Listed value by family" sub={`${fmtInt(k.stockCount)} active units`} />
            <div className="mt-4 h-[250px]">
              <CategoryValueChart data={dash.categoryValue} />
            </div>
          </div>
          <div className="card p-5 lg:col-span-2">
            <SectionHead
              kicker="Spread"
              title="Cost vs ask vs realized — sold cohorts"
              sub="Per month: what we paid, what we asked, what we booked."
              right={
                <div className="flex gap-3 text-[10.5px] font-semibold text-stone-400">
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-[#CFC9BC]" /> cost</span>
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-[#E9A23B]" /> ask</span>
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-emerald-600" /> sold</span>
                </div>
              }
            />
            <div className="mt-4 h-[250px]">
              <TriadChart data={dash.soldByMonth} />
            </div>
          </div>
        </div>
      </Reveal>

      {/* high value + slow movers */}
      <Reveal delay={0.12}>
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="card p-5 lg:col-span-2">
            <SectionHead
              kicker="Watchlist"
              title="Highest-value stock"
              sub="Where the capital sits right now."
              right={<Link href="/inventory" className="btn-ghost h-9 px-3 text-[12.5px]">Full inventory <ArrowRight className="h-3.5 w-3.5" /></Link>}
            />
            <div className="mt-2 divide-y divide-stone-100">
              {dash.topValue.map((i) => (
                <Link key={i.id} href={`/inventory/${i.id}`} className="group flex items-center gap-3.5 py-2.5">
                  <Thumb url={i.photos?.[0]?.url} className="h-11 w-14 shrink-0 rounded-lg border border-stone-100" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13.5px] font-semibold text-stone-900 transition group-hover:text-amber-800">{i.name}</div>
                    <div className="mt-0.5 flex items-center gap-2 text-[11px] text-stone-400">
                      {i.sku} · {i.categoryPath}
                    </div>
                  </div>
                  <GradeChip grade={i.grade} />
                  <div className="w-[110px] text-right">
                    <div className="font-semibold tabular-nums text-stone-900">{fmtMoney(i.listedPrice)}</div>
                    <div className="text-[10.5px] text-stone-400 tabular-nums">cost {fmtMoney(i.effectiveCost)}</div>
                  </div>
                  <MarginPill margin={i.listedMargin} className="hidden sm:inline-flex" />
                </Link>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <SectionHead
              kicker="Stale"
              title="Slow movers"
              sub="Past the markdown window."
              right={<Link href="/pricing" className="text-[12px] font-bold text-amber-700 hover:text-amber-600">Pricing desk →</Link>}
            />
            {dash.slowMovers.length === 0 ? (
              <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-6 text-center text-[13px] font-medium text-emerald-700">
                Nothing stale — the book is turning.
              </div>
            ) : (
              <div className="mt-2 space-y-1">
                {dash.slowMovers.map(({ item: i, suggested, pct }) => (
                  <Link key={i.id} href={`/inventory/${i.id}`} className="group block rounded-xl px-2 py-2.5 transition hover:bg-amber-50/60">
                    <div className="flex items-center justify-between gap-2">
                      <span className="min-w-0 truncate text-[13px] font-semibold text-stone-800">{i.name}</span>
                      <AgingChip days={i.daysListed} />
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[11.5px] text-stone-500 tabular-nums">
                      <span>ask {fmtMoney(i.listedPrice)}</span>
                      {suggested != null && (
                        <span className="font-semibold text-amber-700">→ {fmtMoney(suggested)} (−{Math.round(pct * 100)}%)</span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </Reveal>

      {/* suppliers + recent intake */}
      <Reveal delay={0.14}>
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="card overflow-hidden lg:col-span-2">
            <div className="p-5 pb-3">
              <SectionHead kicker="Sourcing" title="Supplier performance" sub="Ranked by booked revenue." />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-sm">
                <thead>
                  <tr className="border-y border-[var(--line)] bg-stone-50/70 text-left text-[10.5px] font-bold uppercase tracking-[0.1em] text-stone-400">
                    <th className="py-2.5 pl-5 pr-3">Supplier</th>
                    <th className="px-3 text-center">Supplied</th>
                    <th className="px-3 text-center">Sold</th>
                    <th className="px-3">Sell-through</th>
                    <th className="px-3 text-center">Avg to sell</th>
                    <th className="px-3 text-center">Margin</th>
                    <th className="px-3 pr-5 text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {dash.supplierStats.map((s) => (
                    <tr key={s.id} className="border-b border-stone-100 last:border-0 hover:bg-amber-50/40">
                      <td className="py-3 pl-5 pr-3">
                        <div className="font-semibold text-stone-900">{s.name}</div>
                        <div className="mt-0.5 text-[11px] text-stone-400">{s.channel}</div>
                      </td>
                      <td className="px-3 text-center tabular-nums text-stone-600">{s.supplied}</td>
                      <td className="px-3 text-center tabular-nums text-stone-600">{s.sold}</td>
                      <td className="px-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-stone-100">
                            <div
                              className="h-full rounded-full bg-emerald-500"
                              style={{ width: `${Math.round((s.sellThrough ?? 0) * 100)}%` }}
                            />
                          </div>
                          <span className="text-[12px] tabular-nums text-stone-600">{fmtPct(s.sellThrough)}</span>
                        </div>
                      </td>
                      <td className="px-3 text-center tabular-nums text-stone-600">
                        {s.avgDaysToSell != null ? `${Math.round(s.avgDaysToSell)}d` : "—"}
                      </td>
                      <td className="px-3 text-center"><MarginPill margin={s.avgMargin} /></td>
                      <td className="px-3 pr-5 text-right font-semibold tabular-nums text-stone-900">
                        {fmtMoney(s.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card p-5">
            <SectionHead
              kicker="Inflow"
              title="Recent intake"
              sub="Latest units into the book."
              right={<Link href="/inventory/new" className="text-[12px] font-bold text-amber-700 hover:text-amber-600">Add →</Link>}
            />
            <div className="mt-2 space-y-1">
              {dash.recentIntake.map((i) => (
                <Link key={i.id} href={`/inventory/${i.id}`} className="group flex items-center gap-3 rounded-xl px-2 py-2 transition hover:bg-amber-50/60">
                  <Thumb url={i.photos?.[0]?.url} className="h-10 w-12 shrink-0 rounded-lg border border-stone-100" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-semibold text-stone-800">{i.name}</div>
                    <div className="mt-0.5 text-[11px] text-stone-400">{i.sku} · {relTime(i.intakeAt)}</div>
                  </div>
                  <StatusChip status={i.status} />
                  <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-stone-300 transition group-hover:text-amber-600" />
                </Link>
              ))}
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
        Operations · ETJOAIGI Trading
      </div>
      <h1 className="font-display text-[34px] font-semibold leading-none tracking-tight text-stone-900">
        The trading floor, at a glance
      </h1>
    </div>
  );
}
