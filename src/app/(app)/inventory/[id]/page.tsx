import { notFound } from "next/navigation";
import { enrichItems, getAllData, getLatestShareForItem, historicalFor } from "@/lib/queries";
import { ItemDetail } from "@/components/item-detail";
import { SeedGate } from "@/components/seed-gate";

export const dynamic = "force-dynamic";

export default async function ItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await params;
  const id = Number(idStr);
  if (!Number.isInteger(id)) notFound();

  const { items, categories, suppliers, events } = await getAllData();
  if (categories.length === 0) return <SeedGate />;

  const raw = items.find((i) => i.id === id);
  if (!raw) notFound();

  const enriched = enrichItems(items, categories, suppliers);
  const item = enriched.find((i) => i.id === id)!;

  const history = historicalFor(enriched, {
    categoryId: item.categoryId,
    rootSlug: item.rootSlug,
    brand: item.brand,
    grade: item.grade,
  });

  const itemEvents = events
    .filter((e) => e.itemId === id)
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

  const share = await getLatestShareForItem(id);

  return <ItemDetail item={item} categories={categories} events={itemEvents} history={history} share={share} />;
}
