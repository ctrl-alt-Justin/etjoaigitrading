import { getShopCatalogData } from "@/lib/queries";
import { CustomerCatalog } from "@/components/customer-catalog";
import { ShopHeader } from "@/components/shop-header";
import { ShopFooter } from "@/components/shop-footer";
import { ScrollToTop } from "@/components/scroll-to-top";
import { normalizeRefPhoto } from "@/lib/taxonomy-data";

export const revalidate = 60;

export default async function ShopCatalogPage() {
  const { items: forSale, categories } = await getShopCatalogData();
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
              <div className="font-hegarty text-xs font-black uppercase tracking-wider text-white sm:text-sm">
                LANDSKRONA
              </div>
              <div className="text-[11px] font-medium text-stone-200">
                2-seat sofa, dark blue velvet.
              </div>
              <div className="mt-0.5 text-xs font-bold text-white">4799</div>
            </div>

            {/* Bottom Promo Catchphrase */}
            <div className="text-left">
              <h1 className="font-hegarty text-2xl font-black uppercase tracking-tight text-white sm:text-4xl">
                SUPER SUMMER SALE
              </h1>
              <p className="mt-0.5 text-xs font-bold uppercase tracking-wider text-[#16c4df] sm:text-sm">
                UP TO 50% OFF ON SELECTED PRE-OWNED ITEMS
              </p>
            </div>
          </div>
        </section>

        {/* Catalog Main Body (Toolbar + Filters + Grid/List) */}
        <div className="px-6 pt-8 sm:px-12">
          <CustomerCatalog
            items={forSale}
            categories={categories}
          />
        </div>
      </main>

      <ShopFooter />

      <ScrollToTop />
    </div>
  );
}