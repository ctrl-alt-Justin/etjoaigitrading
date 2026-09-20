import {
  agingAlerts,
  benchmarkRows,
  buildCategoryIndexes,
  enrichItems,
  getAllData,
  nearestBaseValue,
  pathOf,
} from "@/lib/queries";
import { PricingTools, type AlertLite, type ViolationLite } from "@/components/pricing-tools";
import { SeedGate } from "@/components/seed-gate";
import { Reveal } from "@/components/reveal";

export const dynamic = "force-dynamic";

const KNOWN_BRANDS = [
  "Herman Miller", "Steelcase", "Knoll", "Haworth", "Humanscale", "Vitra",
  "HON", "IKEA", "Nucraft", "Fully", "Teknion",
];

export default async function PricingPage() {
  const { items, categories, suppliers } = await getAllData();

  if (categories.length === 0) return <SeedGate />;

  const enriched = enrichItems(items, categories, suppliers);
  const { byId, childrenOf } = buildCategoryIndexes(categories);

  const alerts: AlertLite[] = agingAlerts(enriched).map(({ item, tier, pct, suggested }) => ({
    id: item.id,
    sku: item.sku,
    name: item.name,
    grade: item.grade,
    photo: item.photos?.[0]?.url ?? null,
    ask: item.listedPrice ?? 0,
    days: item.daysListed ?? 0,
    floor: item.floorPrice,
    suggested,
    pct,
    tier,
    marginAfter: suggested != null && item.effectiveCost > 0 ? suggested / item.effectiveCost - 1 : null,
  }));

  const violations: ViolationLite[] = enriched
    .filter((i) => i.belowFloor)
    .map((i) => ({
      id: i.id,
      sku: i.sku,
      name: i.name,
      ask: i.listedPrice ?? 0,
      floor: i.floorPrice ?? 0,
    }));

  const benchmarks = benchmarkRows(enriched);

  const leaves = categories.filter((c) => (childrenOf.get(c.id) ?? []).length === 0);
  const baseOptions = leaves
    .map((c) => ({ id: c.id, label: pathOf(c.id, byId), baseValue: nearestBaseValue(c.id, byId) }))
    .filter((o): o is { id: number; label: string; baseValue: number } => o.baseValue != null)
    .sort((a, b) => a.label.localeCompare(b.label));

  const brands = [...new Set([...KNOWN_BRANDS, ...items.map((i) => i.brand).filter((b): b is string => !!b)])].sort();

  const itemOptions = enriched.map((i) => ({
    id: i.id,
    sku: i.sku,
    name: i.name,
    brand: i.brand,
    model: i.model,
    grade: i.grade,
    status: i.status,
    acquisitionCost: i.acquisitionCost ?? 0,
    refurbCost: i.refurbCost ?? 0,
    cleaningCost: i.attributes?.cleaning_cost ? Number(i.attributes.cleaning_cost) : 0,
    benchmarkPrice: i.benchmarkPrice ?? nearestBaseValue(i.categoryId, byId) ?? 0,
    listedPrice: i.listedPrice,
    floorPrice: i.floorPrice,
    categoryId: i.categoryId,
  }));

  return (
    <div className="space-y-5">
      <Reveal>
        <div>
          <div className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-amber-700">
            Pricing Desk
          </div>
          <h1 className="font-display text-[30px] font-semibold leading-none tracking-tight text-stone-900">
            Pricing & Valuation Desk
          </h1>
          <p className="mt-2 max-w-2xl text-[13.5px] text-stone-500">
            Enforced retail gap ceilings, target profit margins, cost hurdles and aging markdowns.
          </p>
        </div>
      </Reveal>
      <Reveal delay={0.05}>
        <PricingTools
          alerts={alerts}
          violations={violations}
          benchmarks={benchmarks}
          baseOptions={baseOptions}
          brands={brands}
          items={itemOptions}
        />
      </Reveal>
    </div>
  );
}
