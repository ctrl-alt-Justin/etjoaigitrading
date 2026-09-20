import Link from "next/link";
import { ArrowLeft } from "lucide-react";
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
          {editItem ? (
            <div className="mb-3">
              <div className="flex items-center justify-between gap-3">
                <Link
                  href={`/inventory/${editItem.id}`}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-900 transition"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Back to Item Record
                </Link>
                <span className="rounded-full bg-amber-100 border border-amber-300 px-2.5 py-0.5 text-[11px] font-bold text-amber-900">
                  Editing: {editItem.sku ?? "No SKU"}
                </span>
              </div>
              <h1 className="mt-2 font-display text-[28px] sm:text-[32px] font-semibold leading-tight tracking-tight text-stone-900">
                Edit Item · {editItem.name || "Untitled Item"}
              </h1>
              <p className="mt-1.5 max-w-2xl text-[13.5px] text-stone-500">
                Navigate freely between any step below to update specifications, inspection records, media, or pricing. Incomplete steps are marked in red.
              </p>
            </div>
          ) : (
            <div>
              <div className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-amber-700">
                Intake Desk
              </div>
              <h1 className="font-display text-[30px] font-semibold leading-none tracking-tight text-stone-900">
                Log a New Unit
              </h1>
              <p className="mt-2 max-w-2xl text-[13.5px] text-stone-500">
                Structured intake replaces mental checklists: fixed taxonomy, quality inspection, required photo angles, and an ask calculated from the valuation engine — the same process for everyone.
              </p>
            </div>
          )}
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
