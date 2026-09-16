import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Building2 } from "lucide-react";
import { notFound } from "next/navigation";
import { getShopItem, getShopCatalogData, buildCategoryIndexes, pathOf, getItemReviews } from "@/lib/queries";
import { ShareGallery } from "@/components/share-gallery";
import { ProductDetailInteractive } from "@/components/product-detail-interactive";
import { ShopHeader } from "@/components/shop-header";
import { ShopFooter } from "@/components/shop-footer";
import { ScrollToTop } from "@/components/scroll-to-top";

export const revalidate = 60;

type PageProps = { params: Promise<{ id: string }> };

export async function generateStaticParams() {
  const { items } = await getShopCatalogData();
  return items.map((item) => ({ id: String(item.id) }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id: idStr } = await params;
  const id = Number(idStr);
  if (!Number.isInteger(id)) return { title: "ETJOAIGI Collection" };
  const { item } = await getShopItem(id);
  return { title: item ? `${item.name} — ETJOAIGI Collection` : "ETJOAIGI Collection" };
}

export default async function ShopItemPage({ params }: PageProps) {
  const { id: idStr } = await params;
  const id = Number(idStr);
  if (!Number.isInteger(id)) notFound();

  const [{ item, categories }, reviews] = await Promise.all([
    getShopItem(id),
    getItemReviews(id),
  ]);

  if (!item || item.status !== "listed" || item.listedPrice == null) notFound();

  const { byId } = buildCategoryIndexes(categories);
  const categoryPath = pathOf(item.categoryId, byId);
  const specs: [string, string | null | undefined][] = [
    ["Brand", item.brand],
    ["Model", item.model],
    ["Color", item.color],
    ["Material", item.material],
    [
      "Dimensions",
      item.dimensions
        ? /(cm|mm|inch|in|meters|m)$/i.test(item.dimensions.trim())
          ? item.dimensions
          : `${item.dimensions} cm`
        : null,
    ],
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

      <ShopFooter />

      <ScrollToTop />
    </div>
  );
}
