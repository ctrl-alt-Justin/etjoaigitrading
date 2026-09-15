import { enrichItems, getAllData, isActive } from "@/lib/queries";
import { TaxonomyManager } from "@/components/taxonomy-manager";
import { SeedGate } from "@/components/seed-gate";
import { Reveal } from "@/components/reveal";

export const dynamic = "force-dynamic";

export default async function TaxonomyPage() {
  const { items, categories, attributes, suppliers } = await getAllData();

  if (categories.length === 0) return <SeedGate />;

  const enriched = enrichItems(items, categories, suppliers);
  const counts: Record<number, number> = {};
  for (const i of enriched) {
    if (isActive(i.status)) counts[i.categoryId] = (counts[i.categoryId] ?? 0) + 1;
  }

  return (
    <div className="space-y-5">
      <Reveal>
        <div>
          <div className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-amber-700">
            Taxonomy engine
          </div>
          <h1 className="font-display text-[30px] font-semibold leading-none tracking-tight text-stone-900">
            One vocabulary for the whole company
          </h1>
          <p className="mt-2 max-w-2xl text-[13.5px] text-stone-500">
            A fixed-but-extensible category tree with controlled attribute fields —
            no more “office chair thingy” in one record and “ergonomic seat” in another.
          </p>
        </div>
      </Reveal>
      <Reveal delay={0.05}>
        <TaxonomyManager categories={categories} attributes={attributes} counts={counts} />
      </Reveal>
    </div>
  );
}
