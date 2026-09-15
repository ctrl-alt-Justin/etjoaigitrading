import { 
  Archive, 
  ArrowRight, 
  Armchair, 
  Building2, 
  Check, 
  LampDesk, 
  Table2, 
  Heart, 
  ShoppingBag, 
  Sparkles,
  MapPin,
  ArrowUpRight
} from "lucide-react";
import Link from "next/link";
import { getAllData } from "@/lib/queries";
import { Logo } from "@/components/shell";
import { normalizeRefPhoto } from "@/lib/taxonomy-data";

export const dynamic = "force-dynamic";

const categories = [
  { label: "Chairs", slug: "seating", icon: Armchair, tone: "bg-white hover:border-[#16c4df]/50" },
  { label: "Tables", slug: "tables", icon: Table2, tone: "bg-[#1D5D8B] text-[#FCFDF8] hover:bg-[#164e75]" },
  { label: "Cabinets", slug: "storage", icon: Archive, tone: "bg-white hover:border-[#16c4df]/50" },
  { label: "Partitions", slug: "partitions", icon: Building2, tone: "bg-white hover:border-[#16c4df]/50" },
  { label: "Others", slug: "reception", icon: LampDesk, tone: "bg-white hover:border-[#16c4df]/50 col-span-2 sm:col-span-1" },
];

export default async function ShopHomePage() {
  const { items } = await getAllData();
  const forSale = items.filter((item) => item.status === "listed" && item.listedPrice != null);
  const heroPhoto = forSale.find((item) => item.photos?.[0]?.url)?.photos?.[0]?.url;

  return (
    <div className="min-h-screen bg-[#FCFDF8] text-[#17364b] antialiased">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-[#8ab7d2]/30 bg-[#1D5D8B]/95 backdrop-blur-md text-[#FCFDF8]">
        <div className="mx-auto flex max-w-[1480px] items-center justify-between gap-5 px-5 py-3.5 sm:px-8">
          <Logo light subtitle="Furnitures" />
          <nav className="hidden items-center gap-8 text-[13px] font-bold tracking-wide sm:flex">
            <Link href="/shop/catalog" className="transition-colors hover:text-[#16c4df]">Catalogs</Link>
            <a href="#offers" className="transition-colors hover:text-[#16c4df]">Offers</a>
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

      <main className="mx-auto max-w-[1480px]">
        {/* Hero Section */}
        <section className="relative min-h-[420px] overflow-hidden bg-[#1D5D8B] sm:min-h-[550px]">
          {heroPhoto && (
            <div 
              className="absolute inset-0 bg-cover bg-center opacity-20 scale-105 transition duration-1000" 
              style={{ backgroundImage: `url(${normalizeRefPhoto(heroPhoto)})` }} 
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-[#1D5D8B] via-[#1D5D8B]/90 to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(22,196,223,0.15),transparent_60%)]" />
          
          <div className="relative grid min-h-[420px] grid-cols-1 items-center gap-8 px-6 py-16 sm:min-h-[550px] sm:grid-cols-[0.8fr_1.2fr] sm:px-14">
            {/* Visual Element */}
            <div className="hidden h-full items-center justify-center sm:flex">
              <div className="relative flex h-72 w-72 items-center justify-center rounded-full border border-[#16c4df]/30 bg-[#16c4df]/10 shadow-[0_0_80px_rgba(22,196,223,0.15)] backdrop-blur-sm animate-pulse [animation-duration:8s]">
                <Armchair className="h-44 w-44 text-[#16c4df]" strokeWidth={0.9} />
                <div className="absolute bottom-8 h-[1.5px] w-36 bg-[#16c4df]/60" />
              </div>
            </div>

            {/* Hero Copy */}
            <div className="max-w-2xl text-[#FCFDF8]">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#16c4df]/30 bg-[#16c4df]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#a9e4f1]">
                <Sparkles className="h-3 w-3 text-[#16c4df]" />
                ETJOAIGI HOME · MUNTINLUPA
              </div>
              <h1 className="font-display text-5xl font-black leading-[0.95] tracking-tight sm:text-7xl">
                Affordable finds,<br />furniture you can trust
              </h1>
              <p className="mt-6 max-w-md text-base leading-relaxed text-[#d5e8f2]">
                Bring your dream space to life with stylish furniture, trusted quality inspection, and reliable delivery across Metro Manila.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link href="/shop/catalog" className="inline-flex items-center gap-2 rounded-lg bg-[#16c4df] px-6 py-3 text-sm font-bold text-[#17364b] shadow-[0_8px_25px_rgba(22,196,223,0.25)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#70e2ef] hover:shadow-[0_8px_30px_rgba(22,196,223,0.4)]">
                  Explore Catalog <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Marquee Banner */}
        <div className="overflow-hidden bg-[#16c4df] py-3.5 text-[#17364b] border-y border-[#1D5D8B]/20">
          <div className="flex min-w-max animate-[marquee_25s_linear_infinite] items-center gap-16 text-lg font-extrabold uppercase tracking-widest">
            {Array.from({ length: 6 }).map((_, idx) => (
              <span key={idx} className="flex items-center gap-16">
                <span>NEW ARRIVALS DROP 09/15</span>
                <span className="h-2 w-2 rounded-full bg-[#17364b]" />
                <span>FREE VIEWING IN MUNTINLUPA</span>
                <span className="h-2 w-2 rounded-full bg-[#17364b]" />
              </span>
            ))}
          </div>
        </div>

        {/* Features & Grid Section */}
        <section className="grid min-h-[550px] border-b border-[#8edce8]/60 bg-[#FCFDF8] sm:grid-cols-[1fr_1.35fr]">
          {/* Left Block */}
          <div className="flex items-center justify-center border-b border-[#8edce8]/60 p-8 text-center sm:border-b-0 sm:border-r sm:p-16">
            <div className="max-w-sm">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#e4f4f4] text-[#1D5D8B] shadow-inner">
                <Check className="h-8 w-8 text-[#1D5D8B]" strokeWidth={2.5} />
              </div>
              <h2 className="font-display text-4xl font-black leading-[0.98] text-[#1D5D8B] sm:text-5xl">
                Find your<br />dream products<br />with ease!
              </h2>
              <p className="mx-auto mt-5 text-sm leading-relaxed text-[#3f6175]">
                Every single piece is photographed, condition-graded, and priced clearly before it enters our catalog. No hidden surprises.
              </p>
            </div>
          </div>

          {/* Right Block (Dynamic Grid) */}
          <div className="grid grid-cols-2 gap-px bg-[#8edce8]/60">
            {categories.map(({ label, slug, icon: Icon, tone }) => (
                <Link 
                key={label} 
                  href={`/shop/catalog?category=${slug}`} 
                className={`group flex flex-col items-center justify-center p-8 text-center transition duration-300 hover:z-10 hover:shadow-[0_0_30px_rgba(0,0,0,0.05)] ${tone}`}
              >
                <div className="flex items-center gap-1 text-base font-black">
                  <span>{label}</span>
                  <ArrowUpRight className="h-3.5 w-3.5 opacity-0 transition duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100" />
                </div>
                <Icon 
                  className="mt-6 h-24 w-24 text-inherit opacity-85 transition duration-500 group-hover:scale-105 group-hover:opacity-100" 
                  strokeWidth={1.1} 
                />
              </Link>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer id="offers" className="border-t border-[#8ab7d2]/30 bg-white">
        <div className="mx-auto grid max-w-[1480px] gap-8 px-6 py-12 text-sm text-[#294e65] sm:grid-cols-[1.5fr_1fr_1fr_1fr] sm:px-8">
          <div>
            <div className="font-display text-3xl font-black tracking-tight text-[#1D5D8B]">ETJOAIGI</div>
            <p className="mt-2 max-w-xs text-xs leading-relaxed text-[#4e6d82]">
              Affordable finds, furniture you can trust. Curated with quality in mind to elevate modern living spaces.
            </p>
            <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-[#1d5d8b]">
              <MapPin className="h-3.5 w-3.5" /> Muntinlupa City, PH
            </div>
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
              <p className="cursor-pointer hover:underline">Privacy policy</p>
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