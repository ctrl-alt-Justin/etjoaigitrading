/**
 * Server-side data access + metric computation for the trading console.
 * Pages query through here; client components receive plain serialized data.
 */
import { db } from "@/db";
import { desc, eq } from "drizzle-orm";
import {
  categories,
  categoryAttributes,
  itemShares,
  items,
  priceEvents,
  suppliers,
  type DbCategory,
  type DbCategoryAttribute,
  type DbItem,
  type DbItemShare,
  type DbPriceEvent,
  type DbSupplier,
  type Grade,
} from "@/db/schema";
import { agingMarkdown } from "@/lib/valuation";
import {
  daysBetween,
  fmtDate,
  monthStart,
  startOfWeekMonday,
} from "@/lib/format";

export async function getShareByToken(token: string): Promise<DbItemShare | null> {
  const rows = await db.select().from(itemShares).where(eq(itemShares.token, token)).limit(1);
  return rows[0] ?? null;
}

export async function getLatestShareForItem(itemId: number): Promise<DbItemShare | null> {
  const rows = await db
    .select()
    .from(itemShares)
    .where(eq(itemShares.itemId, itemId))
    .orderBy(desc(itemShares.createdAt))
    .limit(1);
  return rows[0] ?? null;
}

export async function getAllData() {
  const [itemRows, catRows, attrRows, supRows, eventRows] = await Promise.all([
    db.select().from(items),
    db.select().from(categories),
    db.select().from(categoryAttributes),
    db.select().from(suppliers),
    db.select().from(priceEvents),
  ]);
  return {
    items: itemRows,
    categories: catRows,
    attributes: attrRows,
    suppliers: supRows,
    events: eventRows,
  };
}

/* ------------------------------------------------------------------ */
/* Category tree helpers                                               */
/* ------------------------------------------------------------------ */

export interface CategoryIndexes {
  byId: Map<number, DbCategory>;
  bySlug: Map<string, DbCategory>;
  childrenOf: Map<number | null, DbCategory[]>;
}

export function buildCategoryIndexes(cats: DbCategory[]): CategoryIndexes {
  const byId = new Map<number, DbCategory>();
  const bySlug = new Map<string, DbCategory>();
  const childrenOf = new Map<number | null, DbCategory[]>();
  for (const c of cats) {
    byId.set(c.id, c);
    bySlug.set(c.slug, c);
    const key = c.parentId ?? null;
    const arr = childrenOf.get(key) ?? [];
    arr.push(c);
    childrenOf.set(key, arr);
  }
  for (const arr of childrenOf.values()) arr.sort((a, b) => a.sortOrder - b.sortOrder);
  return { byId, bySlug, childrenOf };
}

export function rootOf(id: number | null | undefined, byId: Map<number, DbCategory>) {
  let cur = id != null ? byId.get(id) : undefined;
  let guard = 0;
  while (cur && cur.parentId != null && guard < 10) {
    cur = byId.get(cur.parentId);
    guard++;
  }
  return cur ?? null;
}

export function pathOf(id: number | null | undefined, byId: Map<number, DbCategory>) {
  const names: string[] = [];
  let cur = id != null ? byId.get(id) : undefined;
  let guard = 0;
  while (cur && guard < 10) {
    names.unshift(cur.name);
    cur = cur.parentId != null ? byId.get(cur.parentId) : undefined;
    guard++;
  }
  return names.join(" › ");
}

/** Walk up the tree to find the closest defined base value. */
export function nearestBaseValue(
  id: number | null | undefined,
  byId: Map<number, DbCategory>
): number | null {
  let cur = id != null ? byId.get(id) : undefined;
  let guard = 0;
  while (cur && guard < 10) {
    if (cur.baseValue && cur.baseValue > 0) return cur.baseValue;
    cur = cur.parentId != null ? byId.get(cur.parentId) : undefined;
    guard++;
  }
  return null;
}

/** Base value + attributes inherited from ancestors (leaf overrides root). */
export function inheritedAttributes(
  id: number | null | undefined,
  byId: Map<number, DbCategory>,
  attrs: DbCategoryAttribute[]
): DbCategoryAttribute[] {
  const chain: DbCategory[] = [];
  let cur = id != null ? byId.get(id) : undefined;
  let guard = 0;
  while (cur && guard < 10) {
    chain.unshift(cur);
    cur = cur.parentId != null ? byId.get(cur.parentId) : undefined;
    guard++;
  }
  const out: DbCategoryAttribute[] = [];
  for (const cat of chain) {
    for (const a of attrs.filter((x) => x.categoryId === cat.id)) out.push(a);
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Item enrichment                                                     */
/* ------------------------------------------------------------------ */

export interface EnrichedItem extends DbItem {
  rootSlug: string;
  rootName: string;
  categoryPath: string;
  categoryName: string;
  supplierName: string | null;
  effectiveCost: number;
  daysInStock: number;
  daysListed: number | null;
  daysToSell: number | null;
  listedMargin: number | null;
  realizedMargin: number | null;
  belowFloor: boolean;
}

export function enrichItems(
  rows: DbItem[],
  cats: DbCategory[],
  sups: DbSupplier[],
  now = new Date()
): EnrichedItem[] {
  const { byId } = buildCategoryIndexes(cats);
  const supById = new Map(sups.map((s) => [s.id, s.name]));
  return rows.map((it) => {
    const root = rootOf(it.categoryId, byId);
    const leaf = byId.get(it.categoryId);
    const eff = (it.acquisitionCost ?? 0) + (it.refurbCost ?? 0);
    const listedAt = it.listedAt ? new Date(it.listedAt) : null;
    const intakeAt = new Date(it.intakeAt);
    const soldAt = it.soldAt ? new Date(it.soldAt) : null;
    return {
      ...it,
      rootSlug: root?.slug ?? "misc",
      rootName: root?.name ?? "Misc",
      categoryPath: pathOf(it.categoryId, byId),
      categoryName: leaf?.name ?? "Uncategorized",
      supplierName: it.supplierId != null ? supById.get(it.supplierId) ?? null : null,
      effectiveCost: eff,
      daysInStock: daysBetween(intakeAt, now),
      daysListed: it.status === "listed" || it.status === "reserved"
        ? listedAt
          ? daysBetween(listedAt, now)
          : null
        : null,
      daysToSell: soldAt && listedAt ? daysBetween(listedAt, soldAt) : null,
      listedMargin:
        it.listedPrice && eff > 0 ? it.listedPrice / eff - 1 : null,
      realizedMargin:
        it.soldPrice && it.soldPrice > 0
          ? (it.soldPrice - eff) / it.soldPrice
          : null,
      belowFloor:
        it.status !== "sold" &&
        it.status !== "archived" &&
        !!it.listedPrice &&
        !!it.floorPrice &&
        it.listedPrice < (it.floorPrice ?? 0),
    };
  });
}

export const ACTIVE_STATUSES = ["intake", "in_stock", "listed", "reserved"] as const;
export const isActive = (s: string) => (ACTIVE_STATUSES as readonly string[]).includes(s);

/* ------------------------------------------------------------------ */
/* Dashboard metrics                                                   */
/* ------------------------------------------------------------------ */

export interface WeeklyBucket {
  label: string;
  intake: number;
  sold: number;
  revenue: number;
}

export interface SupplierStat {
  id: number;
  name: string;
  channel: string;
  supplied: number;
  sold: number;
  sellThrough: number | null;
  avgDaysToSell: number | null;
  avgMargin: number | null;
  revenue: number;
}

export interface AgingAlertRow {
  item: EnrichedItem;
  tier: "watch" | "action" | "critical";
  pct: number;
  suggested: number | null;
}

export interface DashboardData {
  kpis: {
    stockCount: number;
    stockListedValue: number;
    stockCostBasis: number;
    stockPotentialProfit: number;
    soldCountMtd: number;
    revenueMtd: number;
    avgRealizedMargin: number | null;
    avgDaysToSell: number | null;
    intakeThisWeek: number;
    alertCount: number;
  };
  spark: { label: string; value: number }[];
  weekly: WeeklyBucket[];
  categoryValue: { name: string; slug: string; value: number; count: number }[];
  aging: { label: string; count: number; value: number; tone: string }[];
  soldByMonth: { label: string; cost: number; listed: number; sold: number }[];
  topValue: EnrichedItem[];
  slowMovers: AgingAlertRow[];
  recentIntake: EnrichedItem[];
  supplierStats: SupplierStat[];
}

export function supplierStatsOf(enriched: EnrichedItem[], sups: DbSupplier[]): SupplierStat[] {
  return sups
    .map((s) => {
      const mine = enriched.filter((i) => i.supplierId === s.id && i.status !== "archived");
      const sold = mine.filter((i) => i.status === "sold");
      const dts = sold.map((i) => i.daysToSell).filter((x): x is number => x != null);
      const margins = sold
        .map((i) => i.realizedMargin)
        .filter((x): x is number => x != null);
      return {
        id: s.id,
        name: s.name,
        channel: s.channel,
        supplied: mine.length,
        sold: sold.length,
        sellThrough: mine.length ? sold.length / mine.length : null,
        avgDaysToSell: dts.length ? dts.reduce((a, b) => a + b, 0) / dts.length : null,
        avgMargin: margins.length
          ? margins.reduce((a, b) => a + b, 0) / margins.length
          : null,
        revenue: sold.reduce((a, b) => a + (b.soldPrice ?? 0), 0),
      };
    })
    .filter((s) => s.supplied > 0)
    .sort((a, b) => b.revenue - a.revenue);
}

export function agingAlerts(enriched: EnrichedItem[]): AgingAlertRow[] {
  return enriched
    .filter((i) => i.status === "listed" && (i.daysListed ?? 0) >= 30 && i.listedPrice)
    .map((i) => {
      const g = agingMarkdown(i.daysListed ?? 0, i.listedPrice ?? 0, i.floorPrice);
      return {
        item: i,
        tier: g.tier as "watch" | "action" | "critical",
        pct: g.pct,
        suggested: g.suggested,
      };
    })
    .sort((a, b) => (b.item.daysListed ?? 0) - (a.item.daysListed ?? 0));
}

export function computeDashboard(
  enriched: EnrichedItem[],
  sups: DbSupplier[],
  now = new Date()
): DashboardData {
  const active = enriched.filter((i) => isActive(i.status));
  const sold = enriched.filter((i) => i.status === "sold" && i.soldAt);

  const firstOfMonth = monthStart(now);
  const soldMtd = sold.filter((i) => new Date(i.soldAt!) >= firstOfMonth);

  const margins = sold.map((i) => i.realizedMargin).filter((x): x is number => x != null);
  const dts = sold.map((i) => i.daysToSell).filter((x): x is number => x != null);

  const week0 = startOfWeekMonday(now);
  const weekly: WeeklyBucket[] = Array.from({ length: 12 }, (_, ix) => {
    const start = new Date(week0);
    start.setDate(start.getDate() - (11 - ix) * 7);
    return { label: fmtDate(start), intake: 0, sold: 0, revenue: 0 };
  });
  for (const i of enriched) {
    const inStart = startOfWeekMonday(new Date(i.intakeAt));
    const ix = Math.round((week0.getTime() - inStart.getTime()) / (7 * 86_400_000));
    if (ix >= 0 && ix < 12) weekly[11 - ix].intake++;
    if (i.soldAt) {
      const outStart = startOfWeekMonday(new Date(i.soldAt));
      const ox = Math.round((week0.getTime() - outStart.getTime()) / (7 * 86_400_000));
      if (ox >= 0 && ox < 12) {
        weekly[11 - ox].sold++;
        weekly[11 - ox].revenue += i.soldPrice ?? 0;
      }
    }
  }

  const catMap = new Map<string, { name: string; slug: string; value: number; count: number }>();
  for (const i of active) {
    const row = catMap.get(i.rootSlug) ?? { name: i.rootName, slug: i.rootSlug, value: 0, count: 0 };
    row.value += i.listedPrice ?? 0;
    row.count++;
    catMap.set(i.rootSlug, row);
  }
  const categoryValue = [...catMap.values()].sort((a, b) => b.value - a.value);

  const agingDefs = [
    { label: "0–29 days", min: 0, max: 29, tone: "#0e9f6e" },
    { label: "30–59 days", min: 30, max: 59, tone: "#d97706" },
    { label: "60–89 days", min: 60, max: 89, tone: "#ea580c" },
    { label: "90+ days", min: 90, max: 9999, tone: "#e11d48" },
  ];
  const aging = agingDefs.map((d) => {
    const rows = active.filter(
      (i) => i.daysInStock >= d.min && i.daysInStock <= d.max
    );
    return {
      label: d.label,
      count: rows.length,
      value: rows.reduce((a, b) => a + (b.listedPrice ?? b.valueHigh ?? 0), 0),
      tone: d.tone,
    };
  });

  const soldByMonth = Array.from({ length: 6 }, (_, ix) => {
    const m = monthStart(new Date(now.getFullYear(), now.getMonth() - (5 - ix), 1));
    const label = fmtDate(m).split(" ")[0];
    const rows = sold.filter((i) => {
      const s = new Date(i.soldAt!);
      return s.getFullYear() === m.getFullYear() && s.getMonth() === m.getMonth();
    });
    return {
      label,
      cost: rows.reduce((a, b) => a + b.effectiveCost, 0),
      listed: rows.reduce((a, b) => a + (b.listedPrice ?? 0), 0),
      sold: rows.reduce((a, b) => a + (b.soldPrice ?? 0), 0),
    };
  });

  const alerts = agingAlerts(enriched);

  const firstOfWeek = startOfWeekMonday(now).getTime();
  const intakeThisWeek = enriched.filter(
    (i) => new Date(i.intakeAt).getTime() >= firstOfWeek
  ).length;

  return {
    kpis: {
      stockCount: active.length,
      stockListedValue: active.reduce((a, b) => a + (b.listedPrice ?? 0), 0),
      stockCostBasis: active.reduce((a, b) => a + b.effectiveCost, 0),
      stockPotentialProfit: active.reduce(
        (a, b) => a + ((b.listedPrice ?? 0) - b.effectiveCost),
        0
      ),
      soldCountMtd: soldMtd.length,
      revenueMtd: soldMtd.reduce((a, b) => a + (b.soldPrice ?? 0), 0),
      avgRealizedMargin: margins.length
        ? margins.reduce((a, b) => a + b, 0) / margins.length
        : null,
      avgDaysToSell: dts.length ? dts.reduce((a, b) => a + b, 0) / dts.length : null,
      intakeThisWeek,
      alertCount: alerts.length,
    },
    spark: weekly.map((w) => ({ label: w.label, value: w.revenue })),
    weekly,
    categoryValue,
    aging,
    soldByMonth,
    topValue: [...active]
      .filter((i) => i.listedPrice)
      .sort((a, b) => (b.listedPrice ?? 0) - (a.listedPrice ?? 0))
      .slice(0, 6),
    slowMovers: alerts.slice(0, 6),
    recentIntake: [...enriched]
      .sort((a, b) => +new Date(b.intakeAt) - +new Date(a.intakeAt))
      .slice(0, 6),
    supplierStats: supplierStatsOf(enriched, sups),
  };
}

/* ------------------------------------------------------------------ */
/* Pricing intel                                                       */
/* ------------------------------------------------------------------ */

export interface BenchmarkRow {
  rootSlug: string;
  rootName: string;
  grade: Grade;
  stockCount: number;
  soldCount: number;
  avgBenchmark: number | null;
  avgSold: number | null;
  avgListed: number | null;
}

export function benchmarkRows(enriched: EnrichedItem[]): BenchmarkRow[] {
  const map = new Map<string, { rows: EnrichedItem[]; rootName: string; grade: Grade; rootSlug: string }>();
  for (const i of enriched) {
    if (!i.grade) continue;
    const key = `${i.rootSlug}|${i.grade}`;
    const g = map.get(key) ?? { rows: [], rootName: i.rootName, grade: i.grade as Grade, rootSlug: i.rootSlug };
    g.rows.push(i);
    map.set(key, g);
  }
  const avg = (xs: (number | null)[]) => {
    const v = xs.filter((x): x is number => x != null);
    return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
  };
  const gradeRank = { A: 0, B: 1, C: 2, D: 3 } as Record<Grade, number>;
  return [...map.values()]
    .map((g) => ({
      rootSlug: g.rootSlug,
      rootName: g.rootName,
      grade: g.grade,
      stockCount: g.rows.filter((r) => isActive(r.status)).length,
      soldCount: g.rows.filter((r) => r.status === "sold").length,
      avgBenchmark: avg(g.rows.map((r) => r.benchmarkPrice)),
      avgSold: avg(g.rows.filter((r) => r.status === "sold").map((r) => r.soldPrice)),
      avgListed: avg(g.rows.filter((r) => isActive(r.status)).map((r) => r.listedPrice)),
    }))
    .sort((a, b) =>
      a.rootName === b.rootName
        ? gradeRank[a.grade] - gradeRank[b.grade]
        : a.rootName.localeCompare(b.rootName)
    );
}

/** Historical sold reference for a comparable item, scored by similarity. */
export function historicalFor(
  enriched: EnrichedItem[],
  opts: { categoryId: number; rootSlug: string; brand?: string | null; grade?: string | null },
  limit = 5
) {
  const sameRoot = enriched.filter(
    (i) => i.status === "sold" && i.soldPrice && i.rootSlug === opts.rootSlug
  );
  const scored = sameRoot
    .map((i) => {
      let score = 0;
      if (i.categoryId === opts.categoryId) score += 2;
      if (opts.brand && i.brand && i.brand.toLowerCase() === opts.brand.toLowerCase()) score += 2;
      if (opts.grade && i.grade === opts.grade) score += 1;
      return { item: i, score };
    })
    .filter((x) => x.score >= 2)
    .sort((a, b) => +new Date(b.item.soldAt!) - +new Date(a.item.soldAt!));
  const rows = scored.slice(0, limit).map((x) => x.item);
  const prices = sameRoot.map((i) => i.soldPrice!).sort((a, b) => a - b);
  const matched = scored.map((x) => x.item.soldPrice!).sort((a, b) => a - b);
  const median = (xs: number[]) =>
    xs.length ? xs[Math.floor(xs.length / 2)] : null;
  return {
    rows,
    comparableCount: matched.length,
    avg: matched.length ? matched.reduce((a, b) => a + b, 0) / matched.length : null,
    median: median(matched),
    min: matched[0] ?? null,
    max: matched[matched.length - 1] ?? null,
    rootMedian: median(prices),
    rootCount: prices.length,
  };
}
