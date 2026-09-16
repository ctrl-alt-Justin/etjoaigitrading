import Link from "next/link";
import { Sparkles, Tag, Clock, ArrowRight, ChevronRight, Building2 } from "lucide-react";
import { getShopCatalogData } from "@/lib/queries";
import { ShopHeader } from "@/components/shop-header";
import { ShopFooter } from "@/components/shop-footer";
import { ScrollToTop } from "@/components/scroll-to-top";
import { ProductHoverThumb } from "@/components/ui";
import { fmtMoney } from "@/lib/format";
import type { DbItem, Grade } from "@/db/schema";

export const revalidate = 60;

export const metadata = {
  title: "Special Deals & Curations — ETJOAIGI Collection",
  description: "Curated featured items, items below retail value, and recent inventory drops.",
};

function getGradeBadge(grade: Grade | null | undefined) {
  switch (grade) {
    case "A":
      return { letter: "A", bg: "bg-[#f0d900] text-[#17364b]" };
    case "B":
      return { letter: "B", bg: "bg-[#16a34a] text-white" };
    case "C":
      return { letter: "C", bg: "bg-[#2563eb] text-white" };
    case "D":
      return { letter: "D", bg: "bg-[#dc2626] text-white" };
    default:
      return { letter: "A", bg: "bg-[#f0d900] text-[#17364b]" };
  }
}

function getColorDots(item: DbItem): string[] {
  const colorStr = (item.color ?? "").toLowerCase();
  const dots: string[] = [];
  if (colorStr.includes("black")) dots.push("#1e1e1e");
  if (colorStr.includes("brown") || colorStr.includes("wood") || colorStr.includes("walnut") || colorStr.includes("mahogany") || colorStr.includes("oak")) dots.push("#6d4327");
  if (colorStr.includes("beige") || colorStr.includes("cream") || colorStr.includes("tan")) dots.push("#d6c6b2");
  if (colorStr.includes("blue") || colorStr.includes("navy")) dots.push("#1D5D8B");
  if (colorStr.includes("green") || colorStr.includes("olive")) dots.push("#8da84b");
  if (colorStr.includes("grey") || colorStr.includes("gray") || colorStr.includes("mesh")) dots.push("#78716c");
  if (colorStr.includes("white")) dots.push("#f3f4f6");
  if (colorStr.includes("red") || colorStr.includes("burgundy")) dots.push("#991b1b");
  
  if (dots.length === 0) {
    const hash = item.id % 4;
    if (hash === 0) return ["#6d4327", "#8da84b"];
    if (hash === 1) return ["#1e1e1e", "#d6c6b2"];
    if (hash === 2) return ["#b08882"];
    return ["#1D5D8B", "#6d4327"];
  }
  return dots.slice(0, 2);
}

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
    const gradeBadge = getGradeBadge(item.grade as Grade | null);
    const colorDots = getColorDots(item);

    return (
      <article
        key={item.id}
        className="group relative flex flex-col justify-between overflow-hidden border border-stone-200/80 bg-white text-black p-5 sm:p-6 transition-colors duration-200 hover:bg-[#1D5D8B] hover:text-white"
      >
        {/* Entire card links to product details */}
        <Link
          href={`/shop/${item.id}`}
          className="absolute inset-0 z-0"
          aria-label={`View ${item.name}`}
        />

        {/* Top-left Badge */}
        {badge && (
          <span
            className={`absolute left-4 top-4 z-20 pointer-events-none px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-sm ${badge.tone}`}
          >
            {badge.label}
          </span>
        )}

        {/* Product Image with Hover to Alternate Setup View - Transparent background & no shape outline */}
        <div className="relative z-10 aspect-[4/3] w-full overflow-hidden bg-transparent border-0 border-none outline-none ring-0 shadow-none pointer-events-none flex items-center justify-center">
          <ProductHoverThumb
            photos={item.photos}
            alt={item.name}
            className="h-full w-full object-contain"
            containerClassName="bg-transparent border-none shadow-none"
          />
        </div>

        {/* Product Details Section */}
        <div className="relative z-10 mt-4 flex flex-col pointer-events-none">
          {/* Available Color Swatches & Grade Tag */}
          <div className="flex items-center justify-between gap-2">
            {/* Color Swatch Dots */}
            <div className="flex items-center gap-1.5">
              {colorDots.map((dot, idx) => (
                <span
                  key={idx}
                  className="h-4.5 w-4.5 rounded-full border border-black/20 shadow-sm"
                  style={{ backgroundColor: dot }}
                />
              ))}
            </div>

            {/* Grade Tag (font-normal) */}
            <span
              className={`inline-flex h-5 min-w-5 items-center justify-center px-2 text-xs font-normal ${gradeBadge.bg}`}
            >
              {gradeBadge.letter}
            </span>
          </div>

          {/* Product Name */}
          <h3 className="mt-2.5 font-display text-base sm:text-[17px] font-bold text-black group-hover:text-white truncate transition-colors">
            {item.name}
          </h3>

          {/* Price & Strikethrough Price (relocated to right of current price, color #BCBDBA, no "New:") */}
          <div className="mt-2 flex items-baseline justify-between gap-2">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="font-display text-base sm:text-[17px] font-normal text-black group-hover:text-white transition-colors">
                {fmtMoney(item.listedPrice)}
              </span>
              {item.benchmarkPrice && item.benchmarkPrice > (item.listedPrice ?? 0) && (
                <span className="text-xs font-normal text-[#BCBDBA] line-through transition-colors">
                  {fmtMoney(item.benchmarkPrice)}
                </span>
              )}
            </div>

            <span className="text-xs font-bold text-[#1D5D8B] group-hover:text-[#16c4df] transition">
              View →
            </span>
          </div>
        </div>
      </article>
    );
  };

  return (
    <div className="min-h-screen bg-[#FCFDF8] text-[#17364b] antialiased">
      <ShopHeader />

      <main className="mx-auto max-w-[1480px] px-5 pb-24 pt-6 sm:px-8">
        {/* Page Heading matching Catalog style */}
        <div className="mb-10 flex items-center gap-3 border-b border-stone-200/80 pb-4">
          <ChevronRight className="h-6 w-6 stroke-[3] text-[#17364b]" />
          <h1 className="font-display text-2xl sm:text-3xl font-black tracking-tight text-[#16c4df] uppercase">
            Special Deals & Curations
          </h1>
        </div>

        {/* Section 1: Featured Items */}
        <section id="featured" className="mb-16 scroll-mt-24">
          <div className="mb-6 flex items-end justify-between border-b border-[#8edce8]/40 pb-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-[#16c4df]">
                <Sparkles className="h-4 w-4" /> Editorial Curations
              </div>
              <h2 className="mt-1 font-display text-2xl font-black uppercase text-[#1D5D8B] sm:text-3xl">
                Featured Items ({featured.length})
              </h2>
            </div>
            <Link
              href="/shop/catalog"
              className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-[#1D5D8B] hover:text-[#16c4df] transition"
            >
              See All Drops <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((item) =>
              renderProductCard(item, {
                label: "Featured Pick",
                tone: "bg-[#1D5D8B]",
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
                Below Retail Value ({belowRetail.length})
              </h2>
            </div>
            <Link
              href="/shop/catalog"
              className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-[#1D5D8B] hover:text-[#16c4df] transition"
            >
              See All Drops <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {belowRetail.length === 0 ? (
            <p className="text-sm text-[#557287]">All pieces currently listed at standard pricing.</p>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {belowRetail.slice(0, 8).map((item) =>
                renderProductCard(item, {
                  label: "Markdown",
                  tone: "bg-emerald-600",
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
                Latest Arrivals ({latestArrivals.length})
              </h2>
            </div>
            <Link
              href="/shop/catalog"
              className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-[#1D5D8B] hover:text-[#16c4df] transition"
            >
              See All Drops <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {latestArrivals.map((item) =>
              renderProductCard(item, {
                label: "New Drop",
                tone: "bg-[#c62f57]",
              })
            )}
          </div>
        </section>
      </main>

      <ShopFooter />

      <ScrollToTop />
    </div>
  );
}
