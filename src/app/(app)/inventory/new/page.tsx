import { enrichItems, getAllData } from "@/lib/queries";
import { IntakeWizard, type SoldRef, type SupplierLite } from "@/components/intake-wizard";
import { SeedGate } from "@/components/seed-gate";
import { Reveal } from "@/components/reveal";
import type { DbItem } from "@/db/schema";

export const dynamic = "force-dynamic";

const KNOWN_BRANDS = [
  "Herman Miller", "Steelcase", "Knoll", "Haworth", "Humanscale", "Vitra",
  "HON", "IKEA", "Nucraft", "Fully", "Teknion",
];

export default async function NewIntakePage({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const { items, categories, attributes, suppliers } = await getAllData();
  const { edit } = await searchParams;
  const editItem = edit ? items.find((item) => item.id === Number(edit)) ?? null : null;

  if (categories.length === 0) return <SeedGate />;

  const enriched = enrichItems(items, categories, suppliers);

  const brands = [...new Set([...KNOWN_BRANDS, ...items.map((i) => i.brand).filter((b): b is string => !!b)])].sort();
  const brandModels: Record<string, string[]> = {};
  for (const i of items) {
    if (i.brand && i.model) {
      const arr = brandModels[i.brand] ?? [];
      if (!arr.includes(i.model)) arr.push(i.model);
      brandModels[i.brand] = arr;
    }
  }

  const soldRefs: SoldRef[] = enriched
    .filter((i) => i.status === "sold" && i.soldPrice && i.categoryId != null)
    .map((i) => ({
      id: i.id,
      name: i.name,
      categoryId: i.categoryId!,
      rootSlug: i.rootSlug,
      brand: i.brand,
      grade: i.grade,
      soldPrice: i.soldPrice,
      soldAt: i.soldAt,
    }));

  const supplierLites: SupplierLite[] = suppliers.map((s) => ({ id: s.id, name: s.name, channel: s.channel }));

  return (
    <div className="space-y-5">
      <Reveal>
        <div>
          <div className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-amber-700">
            Intake desk
          </div>
          <h1 className="font-display text-[30px] font-semibold leading-none tracking-tight text-stone-900">
            {editItem ? "Complete item information" : "Log a new unit"}
          </h1>
          <p className="mt-2 max-w-2xl text-[13.5px] text-stone-500">
            {editItem ? "Finish the required information below before this item can be listed for sale." : "Structured intake replaces mental checklists: fixed taxonomy, graded inspection, required photo angles, and an ask calculated from the valuation engine — the same process for everyone."}
          </p>
        </div>
      </Reveal>
      <Reveal delay={0.05}>
        <IntakeWizard
          categories={categories}
          attributes={attributes}
          suppliers={supplierLites}
          soldRefs={soldRefs}
          brands={brands}
          brandModels={brandModels}
          initialItem={editItem as DbItem | null}
        />
      </Reveal>
    </div>
  );
}
