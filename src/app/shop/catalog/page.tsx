import { getShopCatalogData } from "@/lib/queries";
import { CustomerCatalog } from "@/components/customer-catalog";
import { ShopHeader } from "@/components/shop-header";
import { ScrollToTop } from "@/components/scroll-to-top";
import { normalizeRefPhoto } from "@/lib/taxonomy-data";

export const dynamic = "force-dynamic";

export default async function ShopCatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const { items: forSale, categories } = await getShopCatalogData();
  const { category } = await searchParams;
  const selectedCategory = categories.find((item) => item.slug === category)?.id;
  const heroPhoto = forSale.find((item) => item.photos?.[0]?.url)?.photos?.[0]?.url;

  return (
    <div className="min-h-screen bg-[#FCFDF8] text-[#17364b] antialiased">
      <ShopHeader />

      <main className="mx-auto max-w-[1480px] pb-24">
        {/* Promotional Hero Banner Matching Mockups */}
        <section className="relative h-[220px] overflow-hidden bg-gradient-to-r from-[#0b2b47] via-[#103d63] to-[#0c6b8c] sm:h-[280px]">
          {heroPhoto && (
            <div
              className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-overlay scale-105"
              style={{ backgroundImage: `url(${normalizeRefPhoto(heroPhoto)})` }}
            />
          )}
          {/* Subtle sofa visual effect overlay */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(22,196,223,0.3),transparent_70%)]" />

          <div className="relative flex h-full flex-col justify-between px-6 py-8 sm:px-12">
            {/* Top Product Note */}
            <div className="text-left">
              <div className="font-display text-xs font-black uppercase tracking-wider text-white sm:text-sm">
                LANDSKRONA
              </div>
              <div className="text-[11px] font-medium text-stone-200">
                2-seat sofa, dark blue velvet.
              </div>
              <div className="mt-0.5 text-xs font-bold text-white">4799</div>
            </div>

            {/* Bottom Big Drop Text */}
            <div className="text-right">
              <div className="font-display text-2xl font-black tracking-tight text-[#ff4a68] sm:text-4xl">
                09/14/26
              </div>
              <div className="font-display text-5xl font-black uppercase tracking-tight text-[#16c4df] drop-shadow-[0_4px_12px_rgba(22,196,223,0.4)] sm:text-8xl">
                NEW DROP
              </div>
            </div>
          </div>
        </section>

        {/* Catalog Main Body (Toolbar + Filters + Grid/List) */}
        <div className="px-6 pt-8 sm:px-12">
          <CustomerCatalog
            items={forSale}
            categories={categories}
            initialCategory={selectedCategory == null ? "all" : String(selectedCategory)}
          />
        </div>
      </main>

      {/* Footer Matching Mockup */}
      <footer className="border-t border-[#8ab7d2]/30 bg-white">
        <div className="mx-auto grid max-w-[1480px] gap-8 px-6 py-12 text-sm text-[#294e65] sm:grid-cols-[1.5fr_1fr_1fr_1fr] sm:px-8">
          <div>
            <div className="font-display text-3xl font-black tracking-tight text-[#1D5D8B]">
              ETJOAIGI
            </div>
            <div className="mt-1 text-xs font-bold text-[#16c4df]">
              Affordable Finds, Furniture You Can Trust
            </div>
            <p className="mt-2 max-w-xs text-xs leading-relaxed text-[#4e6d82]">
              Bring your dream space to life with stylish furniture, trusted service, and designs made for your lifestyle.
            </p>
            <div className="mt-6 text-[10px] text-stone-400">
              All Rights Reserved © 2023 Eve
            </div>
          </div>

          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#17364b]">
              CUSTOMER SERVICE
            </div>
            <div className="mt-3 space-y-2 text-xs">
              <p className="cursor-pointer hover:underline">Contact Us</p>
              <p className="cursor-pointer hover:underline">FAQs</p>
              <p className="cursor-pointer hover:underline">Return & Refund</p>
            </div>
          </div>

          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#17364b]">
              COMPANY
            </div>
            <div className="mt-3 space-y-2 text-xs">
              <p className="cursor-pointer hover:underline">About Us</p>
              <p className="cursor-pointer hover:underline">Terms & Conditions</p>
              <p className="cursor-pointer hover:underline">Privacy Policy</p>
            </div>
          </div>

          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#17364b]">
              FOLLOW US
            </div>
            <div className="mt-3 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded border border-stone-800 text-xs font-bold text-stone-900 cursor-pointer hover:bg-stone-100">
                f
              </div>
              <div className="flex h-7 w-7 items-center justify-center rounded border border-stone-800 text-xs font-bold text-stone-900 cursor-pointer hover:bg-stone-100">
                d
              </div>
            </div>
          </div>
        </div>
      </footer>

      <ScrollToTop />
    </div>
  );
}