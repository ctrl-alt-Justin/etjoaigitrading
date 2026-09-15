import { ArrowLeft, Search, Heart, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { getAllData } from "@/lib/queries";
import { CustomerCatalog } from "@/components/customer-catalog";
import { Logo } from "@/components/shell";
import { normalizeRefPhoto } from "@/lib/taxonomy-data";

export const dynamic = "force-dynamic";

export default async function ShopCatalogPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { items, categories } = await getAllData();
  const { category } = await searchParams;
  const selectedCategory = categories.find((item) => item.slug === category)?.id;
  const forSale = items.filter((item) => item.status === "listed" && item.listedPrice != null);
  const heroPhoto = forSale.find((item) => item.photos?.[0]?.url)?.photos?.[0]?.url;

  return (
    <div className="min-h-screen bg-[#FCFDF8] text-[#17364b] antialiased">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-[#8ab7d2]/30 bg-[#1D5D8B]/95 backdrop-blur-md text-[#FCFDF8]">
        <div className="mx-auto flex max-w-[1480px] items-center justify-between gap-5 px-5 py-3.5 sm:px-8">
          <Link href="/shop" className="transition duration-200 hover:opacity-90">
            <Logo light />
          </Link>
          <nav className="hidden items-center gap-8 text-[13px] font-bold tracking-wide sm:flex">
            <Link href="/shop/catalog" className="text-[#16c4df]">Catalogs</Link>
            <Link href="/shop#offers" className="transition-colors hover:text-[#16c4df]">Offers</Link>
          </nav>
          <div className="flex items-center gap-4">
            <button aria-label="Favorites" className="relative p-2 text-[#FCFDF8] transition hover:text-[#16c4df] hover:scale-105">
              <Heart className="h-5 w-5" strokeWidth={2} />
              <span className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#16c4df] text-[9px] font-bold text-[#17364b]">0</span>
            </button>
            <button aria-label="Shopping bag" className="p-2 text-[#FCFDF8] transition hover:text-[#16c4df] hover:scale-105">
              <ShoppingBag className="h-5 w-5" strokeWidth={2} />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1480px] pb-24">
        {/* Collection Banner Header */}
        <section className="relative h-[180px] overflow-hidden bg-[#1D5D8B] sm:h-[240px]">
          {heroPhoto && (
            <div 
              className="absolute inset-0 bg-cover bg-center opacity-30 scale-105" 
              style={{ backgroundImage: `url(${normalizeRefPhoto(heroPhoto)})` }} 
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#1D5D8B] via-[#1D5D8B]/70 to-[#1D5D8B]/40" />
          
          <div className="relative flex h-full items-end justify-between px-6 pb-8 sm:px-12">
            <div>
              <div className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-[#a9e4f1]">
                ETJOAIGI COLLECTION
              </div>
              <h1 className="mt-2 font-display text-4xl font-black uppercase tracking-tight text-white sm:text-6xl">
                New Drops
              </h1>
            </div>
            <div className="hidden text-right text-xs font-semibold leading-relaxed text-[#d5e8f2] sm:block">
              Inspected pre-loved pieces<br />ready for their next home
            </div>
          </div>
        </section>

        {/* Filter Breadcrumb Bar */}
        <div className="flex items-center justify-between border-b border-[#8edce8]/40 px-6 py-6 sm:px-12">
          <div className="flex items-center gap-2.5 text-lg font-extrabold text-[#1D5D8B]">
            <span className="text-2xl text-[#16c4df]">/</span> 
            <span>All Products</span>
            <span className="ml-1 rounded-full bg-[#e4f4f4] px-2.5 py-0.5 text-xs font-bold text-[#1D5D8B]">
              {forSale.length}
            </span>
          </div>
          <Link 
            href="/shop" 
            className="group flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#1d5d8b] transition-all hover:text-[#16c4df]"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" /> 
            Shop Home
          </Link>
        </div>

        {/* Catalog Grid Area */}
        <div className="px-6 pt-8 sm:px-12">
          <CustomerCatalog items={forSale} categories={categories} initialCategory={selectedCategory == null ? "all" : String(selectedCategory)} />
        </div>
      </main>

      {/* Footer */}
      <footer id="offers" className="border-t border-[#8ab7d2]/30 bg-white">
        <div className="mx-auto grid max-w-[1480px] gap-8 px-6 py-12 text-sm text-[#294e65] sm:grid-cols-[1.5fr_1fr_1fr_1fr] sm:px-8">
          <div>
            <div className="font-display text-3xl font-black tracking-tight text-[#1D5D8B]">ETJOAIGI</div>
            <p className="mt-2 max-w-xs text-xs leading-relaxed text-[#4e6d82]">
              Affordable finds, furniture you can trust. Curated with quality in mind to elevate modern living spaces.
            </p>
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#17364b]">Customer service</div>
            <div className="mt-3 space-y-2 text-xs">
              <p className="cursor-pointer hover:underline">Contact us</p>
              <p className="cursor-pointer hover:underline">FAQs</p>
              <p className="cursor-pointer hover:underline">Viewing & delivery</p>
            </div>
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#17364b]">Company</div>
            <div className="mt-3 space-y-2 text-xs">
              <p className="cursor-pointer hover:underline">About ETJOAIGI</p>
              <p className="cursor-pointer hover:underline">Terms & conditions</p>
            </div>
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#17364b]">Follow us</div>
            <p className="mt-3 text-xs text-[#4e6d82]">Join our social drops and fresh showroom arrivals.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}