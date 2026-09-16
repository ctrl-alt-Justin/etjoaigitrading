import Link from "next/link";
import { Sparkles, Tag, Clock, ArrowRight, ArrowLeft, Building2 } from "lucide-react";
import { getShopCatalogData } from "@/lib/queries";
import { ShopHeader } from "@/components/shop-header";
import { ScrollToTop } from "@/components/scroll-to-top";
import { QuickAddButton } from "@/components/quick-add-button";
import { Thumb, GradeChip, ProductHoverThumb } from "@/components/ui";
import { fmtMoney } from "@/lib/format";
import type { DbItem, Grade } from "@/db/schema";

export const revalidate = 60;

export const metadata = {
  title: "Special Offers & Featured Pieces — ETJOAIGI Collection",
  description: "Curated featured items, items below retail value, and recent inventory drops.",
};

export default async function ShopOffersPage() {
  const { items: forSale } = await getShopCatalogData();

  // 1. Featured items (where isFeatured is true; if none exist, fall back to top grade pieces)
  let featured = forSale.filter((item) => item.isFeatured === true);
  if (featured.length === 0) {
    featured = forSale.slice(0, 4);
  }

  // 2. Below Retail Value (Sales / Big discounts compared to benchmark price)
  const belowRetail = forSale
    .filter(
      (item) =>
        (item.benchmarkPrice != null && item.listedPrice! < item.benchmarkPrice) ||
        (item.valueHigh != null && item.listedPrice! < item.valueHigh * 0.7)
    )
    .sort((a, b) => {
      const saveA = (a.benchmarkPrice ?? 0) - (a.listedPrice ?? 0);
      const saveB = (b.benchmarkPrice ?? 0) - (b.listedPrice ?? 0);
      return saveB - saveA;
    });

  // 3. Latest Arrivals (New drops sorted by listedAt desc)
  const latestArrivals = [...forSale]
    .sort(
      (a, b) =>
        new Date(b.listedAt ?? b.createdAt).getTime() -
        new Date(a.listedAt ?? a.createdAt).getTime()
    )
    .slice(0, 8);

  const renderProductCard = (item: DbItem, badge?: { label: string; tone: string }) => {
    const savings =
      item.benchmarkPrice && item.listedPrice && item.listedPrice < item.benchmarkPrice
        ? item.benchmarkPrice - item.listedPrice
        : null;

    return (
      <article
        key={item.id}
        className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[#d8e2e7] bg-white transition duration-300 hover:border-[#16c4df] hover:shadow-lg"
      >
        <Link href={`/shop/${item.id}`} className="block">
          <div className="relative h-56 w-full overflow-hidden bg-[#f3f5f1]">
            <ProductHoverThumb
              photos={item.photos}
              alt={item.name}
              className="h-full w-full p-4"
            />
            {badge && (
              <span
                className={`absolute left-3 top-3 rounded-md px-2.5 py-1 text-[10px] font-black uppercase tracking-wider shadow-sm ${badge.tone}`}
              >
                {badge.label}
              </span>
            )}
            {savings != null && (
              <span className="absolute right-3 top-3 rounded-md bg-emerald-700 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                Save {fmtMoney(savings)}
              </span>
            )}
          </div>

          <div className="p-5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#557287]">
                {item.brand || "Inspected Piece"}
              </span>
              <GradeChip grade={item.grade as Grade | null} />
            </div>

            <h3 className="mt-2 font-display text-base font-bold text-[#17364b] line-clamp-1 group-hover:text-[#1D5D8B] transition">
              {item.name}
            </h3>

            <div className="mt-1 flex gap-2 text-xs text-[#557287]">
              {item.color && <span>{item.color}</span>}
              {item.dimensions && <span>• {item.dimensions}</span>}
            </div>

            <div className="mt-4 flex items-baseline justify-between border-t border-stone-100 pt-3">
              <div>
                <div className="font-display text-xl font-black text-[#17364b]">
                  {fmtMoney(item.listedPrice)}
                </div>
                {item.benchmarkPrice && (
                  <div className="text-[11px] text-[#557287] line-through">
                    New: {fmtMoney(item.benchmarkPrice)}
                  </div>
                )}
              </div>
            </div>
          </div>
        </Link>

        {/* Quick Add Button at card bottom right */}
        <div className="px-5 pb-5 pt-0">
          <div className="flex items-center justify-between gap-2">
            <Link
              href={`/shop/${item.id}`}
              className="text-xs font-bold text-[#1D5D8B] hover:text-[#16486B]"
            >
              View details →
            </Link>
            <QuickAddButton item={item} className="h-9 w-9" />
          </div>
        </div>
      </article>
    );
  };

  return (
    <div className="min-h-screen bg-[#FCFDF8] text-[#17364b] antialiased">
      <ShopHeader />

      <main className="mx-auto max-w-[1480px] px-5 pb-24 pt-6 sm:px-8">
        {/* Banner Section */}
        <section className="relative mb-12 overflow-hidden rounded-3xl bg-gradient-to-r from-[#1D5D8B] to-[#123D5B] p-8 text-white shadow-md sm:p-12">
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#16c4df]/30 bg-[#16c4df]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#a9e4f1]">
              <Sparkles className="h-3 w-3 text-[#16c4df]" /> Special Deals & Curations
            </div>
            <h1 className="mt-4 font-display text-4xl font-black tracking-tight sm:text-6xl">
              Curated Offers & Drops
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-[#d5e8f2] sm:text-base">
              Explore pre-inspected items priced significantly below retail value, hand-picked featured pieces, and our freshest inventory releases.
            </p>
            <div className="mt-6 flex flex-wrap gap-4">
              <a
                href="#featured"
                className="rounded-xl bg-[#16c4df] px-5 py-2.5 text-xs font-bold text-[#17364b] shadow-sm transition hover:bg-[#70e2ef]"
              >
                Featured Picks
              </a>
              <a
                href="#below-retail"
                className="rounded-xl bg-white/10 px-5 py-2.5 text-xs font-bold text-white backdrop-blur-sm transition hover:bg-white/20"
              >
                Below Retail Value
              </a>
              <a
                href="#latest-arrivals"
                className="rounded-xl bg-white/10 px-5 py-2.5 text-xs font-bold text-white backdrop-blur-sm transition hover:bg-white/20"
              >
                Latest Drops
              </a>
            </div>
          </div>
          <div className="absolute right-0 top-0 h-full w-1/3 bg-[radial-gradient(circle_at_top_right,rgba(22,196,223,0.2),transparent_70%)] pointer-events-none" />
        </section>

        {/* Section 1: Featured Items */}
        <section id="featured" className="mb-16 scroll-mt-24">
          <div className="mb-6 flex items-end justify-between border-b border-[#8edce8]/40 pb-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-[#16c4df]">
                <Sparkles className="h-4 w-4" /> Editorial Curations
              </div>
              <h2 className="mt-1 font-display text-2xl font-black uppercase text-[#1D5D8B] sm:text-3xl">
                Featured Items
              </h2>
            </div>
            <span className="text-xs font-semibold text-[#557287]">
              {featured.length} highlighted
            </span>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((item) =>
              renderProductCard(item, {
                label: "Featured Pick",
                tone: "bg-[#1D5D8B] text-white",
              })
            )}
          </div>
        </section>

        {/* Section 2: Below Retail Value (Sales) */}
        <section id="below-retail" className="mb-16 scroll-mt-24">
          <div className="mb-6 flex items-end justify-between border-b border-[#8edce8]/40 pb-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-emerald-600">
                <Tag className="h-4 w-4" /> Exceptional Value
              </div>
              <h2 className="mt-1 font-display text-2xl font-black uppercase text-[#1D5D8B] sm:text-3xl">
                Below Retail Value
              </h2>
            </div>
            <span className="text-xs font-semibold text-[#557287]">
              {belowRetail.length} pieces on sale
            </span>
          </div>

          {belowRetail.length === 0 ? (
            <p className="text-sm text-[#557287]">All pieces currently listed at standard pricing.</p>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {belowRetail.slice(0, 8).map((item) =>
                renderProductCard(item, {
                  label: "Markdown",
                  tone: "bg-emerald-600 text-white",
                })
              )}
            </div>
          )}
        </section>

        {/* Section 3: Latest Arrivals (New Drops) */}
        <section id="latest-arrivals" className="scroll-mt-24">
          <div className="mb-6 flex items-end justify-between border-b border-[#8edce8]/40 pb-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-[#1D5D8B]">
                <Clock className="h-4 w-4" /> Fresh Showroom Stock
              </div>
              <h2 className="mt-1 font-display text-2xl font-black uppercase text-[#1D5D8B] sm:text-3xl">
                Latest Arrivals
              </h2>
            </div>
            <Link
              href="/shop/catalog"
              className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-[#1D5D8B] hover:text-[#16c4df]"
            >
              See All Drops <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {latestArrivals.map((item) =>
              renderProductCard(item, {
                label: "New Drop",
                tone: "bg-[#c62f57] text-white",
              })
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#8ab7d2]/30 bg-white">
        <div className="mx-auto flex max-w-[1480px] items-center justify-between px-6 py-8 text-xs font-semibold text-[#557287] sm:px-8">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-[#1D5D8B]" /> ETJOAIGI Trading · Muntinlupa City, PH
          </div>
          <div>All pieces certified and inspected</div>
        </div>
      </footer>

      <ScrollToTop />
    </div>
  );
}
