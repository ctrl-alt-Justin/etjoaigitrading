import Link from "next/link";
import { PackagePlus } from "lucide-react";
import { enrichItems, getAllData } from "@/lib/queries";
import { InventoryTable } from "@/components/inventory-table";
import { SeedGate } from "@/components/seed-gate";
import { Reveal } from "@/components/reveal";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const { items, categories, suppliers } = await getAllData();

  if (categories.length === 0) return <SeedGate />;

  const enriched = enrichItems(items, categories, suppliers);
  const roots = categories
    .filter((c) => c.parentId == null)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((c) => ({ slug: c.slug, name: c.name }));

  const tableItems = enriched.map((i) => ({
    ...i,
    photos: i.photos?.slice(0, 1) ?? [],
    checklist: null,
  }));

  return (
    <div className="space-y-5">
      <Reveal>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-amber-700">
              Inventory
            </div>
            <h1 className="font-display text-[30px] font-semibold leading-none tracking-tight text-stone-900">
              The book
            </h1>
            <p className="mt-2 text-[13.5px] text-stone-500">
              Every unit, graded and priced by the same rules. Fuzzy search covers typos and partial SKUs.
            </p>
          </div>
          <Link href="/inventory/new" className="btn-accent">
            <PackagePlus className="h-4 w-4" /> New intake
          </Link>
        </div>
      </Reveal>
      <Reveal delay={0.05}>
        <InventoryTable items={tableItems} roots={roots} />
      </Reveal>
    </div>
  );
}
