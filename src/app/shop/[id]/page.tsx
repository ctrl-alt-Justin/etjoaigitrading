import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Building2 } from "lucide-react";
import { notFound } from "next/navigation";
import { getAllData, buildCategoryIndexes, pathOf, getItemReviews } from "@/lib/queries";
import { ShareGallery } from "@/components/share-gallery";
import { ProductDetailInteractive } from "@/components/product-detail-interactive";
import { ShopHeader } from "@/components/shop-header";
import { ScrollToTop } from "@/components/scroll-to-top";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id: idStr } = await params;
  const { items } = await getAllData();
  const item = items.find((entry) => entry.id === Number(idStr));
  return { title: item ? `${item.name} — ETJOAIGI Collection` : "ETJOAIGI Collection" };
}

export default async function ShopItemPage({ params }: PageProps) {
  const { id: idStr } = await params;
  const id = Number(idStr);
  if (!Number.isInteger(id)) notFound();

  const [{ items, categories }, reviews] = await Promise.all([
    getAllData(),
    getItemReviews(id),
  ]);

  const item = items.find((entry) => entry.id === id && entry.status === "listed" && entry.listedPrice != null);
  if (!item) notFound();

  const { byId } = buildCategoryIndexes(categories);
  const categoryPath = pathOf(item.categoryId, byId);
  const specs: [string, string | null | undefined][] = [
    ["Brand", item.brand],
    ["Model", item.model],
    ["Color", item.color],
    ["Material", item.material],
    ["Dimensions", item.dimensions],
    ...Object.entries(item.attributes ?? {}).map(([key, value]) => [key, value] as [string, string | null]),
  ];

  return (
    <div className="min-h-screen bg-[#FCFDF8] text-[#17364b] antialiased">
      <ShopHeader />

      <main className="mx-auto max-w-6xl px-5 pb-20 pt-6 sm:px-8 sm:pt-8">
        <div className="mb-6">
          <Link
            href="/shop/catalog"
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#1D5D8B] transition hover:text-[#16c4df]"
          >
            <ArrowLeft className="h-4 w-4" /> Back to catalog
          </Link>
        </div>

        <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
          <ShareGallery photos={item.photos ?? []} name={item.name} />

          <ProductDetailInteractive
            item={item}
            initialReviews={reviews}
            categoryPath={categoryPath}
            specs={specs}
          />
        </div>
      </main>

      <footer className="border-t border-[#8ab7d2]/30 bg-white">
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-5 py-7 text-xs font-semibold text-[#557287] sm:px-8">
          <Building2 className="h-4 w-4 text-[#1D5D8B]" /> ETJOAIGI Trading · Muntinlupa City, PH
        </div>
      </footer>

      <ScrollToTop />
    </div>
  );
}
