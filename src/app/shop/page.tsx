import { 
  Archive, 
  ArrowRight, 
  Armchair, 
  Building2, 
  Check, 
  LampDesk, 
  Table2, 
  Sparkles,
  MapPin,
  ArrowUpRight,
  ShieldCheck,
  Truck,
  RotateCcw,
  Star,
  Layers,
  Clock,
  CheckCircle2,
  Calendar
} from "lucide-react";
import Link from "next/link";
import { getShopCatalogData } from "@/lib/queries";
import { normalizeRefPhoto } from "@/lib/taxonomy-data";
import { ShopHeader } from "@/components/shop-header";
import { ScrollToTop } from "@/components/scroll-to-top";
import { HeroSpotlightCard, FeaturedProductsGrid } from "@/components/shop-home-cards";

export const revalidate = 60;

const CATEGORY_TILES = [
  { 
    label: "Ergonomic Chairs", 
    slug: "seating", 
    icon: Armchair, 
    desc: "Aeron, Leap V2, Embody, Gesture, Zody",
    gradient: "from-sky-500/10 via-sky-500/5 to-transparent",
    accent: "text-sky-600 border-sky-200 bg-sky-50" 
  },
  { 
    label: "Motorized Desks", 
    slug: "desks", 
    icon: Table2, 
    desc: "Dual-motor sit/stand, executive suites & pods",
    gradient: "from-[#1D5D8B]/10 via-[#1D5D8B]/5 to-transparent",
    accent: "text-[#1D5D8B] border-[#1D5D8B]/30 bg-[#1D5D8B]/10" 
  },
  { 
    label: "Conference & Tables", 
    slug: "tables", 
    icon: Table2, 
    desc: "Boardroom tables, training fold-ups & side tables",
    gradient: "from-emerald-500/10 via-emerald-500/5 to-transparent",
    accent: "text-emerald-700 border-emerald-200 bg-emerald-50" 
  },
  { 
    label: "Storage & Credenzas", 
    slug: "storage", 
    icon: Archive, 
    desc: "Lateral files, bookcases, credenzas & lockers",
    gradient: "from-amber-500/10 via-amber-500/5 to-transparent",
    accent: "text-amber-800 border-amber-200 bg-amber-50" 
  },
  { 
    label: "Lounge & Screens", 
    slug: "reception", 
    icon: Building2, 
    desc: "Modular soft seating, reception desks & acoustic PET panels",
    gradient: "from-purple-500/10 via-purple-500/5 to-transparent",
    accent: "text-purple-700 border-purple-200 bg-purple-50" 
  },
];

const TESTIMONIALS = [
  {
    name: "Marco D.",
    role: "Architectural Lead · BGC",
    item: "Herman Miller Aeron Remastered",
    rating: 5,
    text: "Exceptional condition! You can barely tell it was pre-owned. The PostureFit SL makes 10-hour rendering days effortless. Pickup in Muntinlupa was seamless.",
  },
  {
    name: "Patricia S.",
    role: "Studio Director · Makati",
    item: "Steelcase Leap V2",
    rating: 5,
    text: "Saved over ₱25,000 compared to brand new retail without sacrificing ergonomics or durability. The condition grading was 100% accurate.",
  },
  {
    name: "Kenneth L.",
    role: "Agency Founder · Alabang",
    item: "Steelcase Migration SE Desk",
    rating: 5,
    text: "The German Linak dual motors are whisper silent. The team was accommodating when we came to test multiple models at the warehouse.",
  },
];

export default async function ShopHomePage() {
  const { items: forSale, categories } = await getShopCatalogData();

  // Find featured or best spotlight piece
  const spotlightItem = 
    forSale.find((i) => i.isFeatured && i.photos?.[0]?.url) ||
    forSale.find((i) => i.photos?.[0]?.url) ||
    forSale[0] ||
    null;

  const featuredPool = forSale.filter((i) => i.id !== spotlightItem?.id);
  const displayItems = featuredPool.length > 0 ? featuredPool : forSale;

  return (
    <div className="min-h-screen bg-[#FCFDF8] text-[#17364b] antialiased selection:bg-[#1D5D8B] selection:text-white">
      <ShopHeader />

      {/* Trust Announcement Bar */}
      <div className="border-b border-[#1D5D8B]/15 bg-[#16486B] text-white">
        <div className="mx-auto flex max-w-[1480px] flex-wrap items-center justify-between gap-3 px-5 py-2 text-xs font-semibold sm:px-8">
          <div className="flex items-center gap-2">
            <Truck className="h-3.5 w-3.5 text-[#16c4df]" />
            <span>Fast Courier Delivery Across Metro Manila</span>
          </div>
          <div className="hidden items-center gap-2 md:flex">
            <ShieldCheck className="h-3.5 w-3.5 text-[#16c4df]" />
            <span>Every Item Condition-Graded & Inspected</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 text-[#16c4df]" />
            <Link href="#showroom" className="hover:text-[#16c4df] underline underline-offset-2">
              Free Showroom Viewing in Muntinlupa
            </Link>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-[1480px]">
        {/* ================================================================= */}
        {/* 1. HERO SECTION WITH SPOTLIGHT PRODUCT CARD                       */}
        {/* ================================================================= */}
        <section className="relative overflow-hidden bg-gradient-to-br from-[#0a2338] via-[#16486B] to-[#1D5D8B] text-[#FCFDF8]">
          {/* Subtle ambient light halos */}
          <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-[#16c4df]/20 blur-3xl pointer-events-none" />
          <div className="absolute top-1/2 -right-32 h-[500px] w-[500px] rounded-full bg-[#16c4df]/15 blur-3xl pointer-events-none" />
          
          <div className="relative grid min-h-[540px] items-center gap-10 px-6 py-14 sm:py-20 lg:grid-cols-[1.2fr_0.8fr] sm:px-12 lg:px-14">
            {/* Hero Copy */}
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#16c4df]/40 bg-[#16c4df]/15 px-3.5 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-[#a9e4f1] backdrop-blur-md">
                <Sparkles className="h-3.5 w-3.5 text-[#16c4df]" />
                Certified Pre-Owned Workspace Furniture
              </div>

              <h1 className="mt-5 font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl lg:text-[68px]">
                Iconic design.<br />
                Inspected condition.<br />
                <span className="text-[#16c4df]">Honest prices.</span>
              </h1>

              <p className="mt-6 max-w-xl text-base leading-relaxed text-[#dbeaf2] sm:text-lg">
                Acquire authentic Herman Miller, Steelcase, Vitra, Haworth, and Knoll workspace furniture at up to 60% off retail. Every piece is cleaned, mechanically tested, and condition-graded.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  href="/shop/catalog"
                  className="inline-flex items-center gap-2 bg-[#16c4df] px-6 py-3.5 text-sm font-black text-[#17364b] shadow-[0_8px_30px_rgba(22,196,223,0.35)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#68e0ee] active:scale-95"
                >
                  Explore Catalog <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/shop/offers"
                  className="inline-flex items-center gap-2 border border-white/25 bg-white/10 px-6 py-3.5 text-sm font-bold text-white backdrop-blur-md transition duration-200 hover:bg-white/20 hover:border-white/40"
                >
                  Today&apos;s Drops & Offers
                </Link>
              </div>

              {/* Quick Trust Badges */}
              <div className="mt-10 grid grid-cols-3 gap-4 border-t border-white/15 pt-6 text-xs text-[#dbeaf2]">
                <div>
                  <div className="font-bold text-white text-sm">100% Genuine</div>
                  <div className="text-[11px] text-[#a9c8da] mt-0.5">Herman Miller, Steelcase & more</div>
                </div>
                <div>
                  <div className="font-bold text-white text-sm">Grade A / B / C</div>
                  <div className="text-[11px] text-[#a9c8da] mt-0.5">Transparent condition notes</div>
                </div>
                <div>
                  <div className="font-bold text-white text-sm">Ready to Ship</div>
                  <div className="text-[11px] text-[#a9c8da] mt-0.5">Or free Muntinlupa pickup</div>
                </div>
              </div>
            </div>

            {/* Spotlight Card */}
            <div className="flex justify-center lg:justify-end">
              <div className="w-full max-w-md">
                {spotlightItem ? (
                  <HeroSpotlightCard item={spotlightItem} />
                ) : (
                  <div className="border border-white/20 bg-white/10 p-8 text-center backdrop-blur">
                    <Armchair className="mx-auto h-24 w-24 text-[#16c4df]" strokeWidth={1} />
                    <div className="mt-4 font-display text-2xl font-bold text-white">Curated Selection</div>
                    <p className="mt-1 text-xs text-white/70">Top ergonomic brands tested and priced for immediate use.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* 2. DYNAMIC MARQUEE TICKER                                         */}
        {/* ================================================================= */}
        <div className="overflow-hidden bg-[#16c4df] py-3 text-[#17364b] border-y border-[#1D5D8B]/20 select-none">
          <div className="flex min-w-max animate-[marquee_24s_linear_infinite] items-center gap-12 text-sm font-extrabold uppercase tracking-widest">
            {Array.from({ length: 6 }).map((_, idx) => (
              <span key={idx} className="flex items-center gap-12">
                <span>HERMAN MILLER</span>
                <span className="h-2 w-2 rounded-full bg-[#17364b]" />
                <span>STEELCASE LEAP V2</span>
                <span className="h-2 w-2 rounded-full bg-[#17364b]" />
                <span>VITRA DESIGN</span>
                <span className="h-2 w-2 rounded-full bg-[#17364b]" />
                <span>CERTIFIED MULTI-POINT INSPECTION</span>
                <span className="h-2 w-2 rounded-full bg-[#17364b]" />
                <span>FREE MUNTINLUPA SHOWROOM VIEWING</span>
                <span className="h-2 w-2 rounded-full bg-[#17364b]" />
              </span>
            ))}
          </div>
        </div>

        {/* ================================================================= */}
        {/* 3. VISUAL CATEGORY SELECTOR                                       */}
        {/* ================================================================= */}
        <section className="px-6 py-14 sm:px-12 lg:px-14 border-b border-stone-200/80">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#1D5D8B]">
                Curated Collections
              </div>
              <h2 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-stone-900 sm:text-4xl">
                Browse by Workspace Category
              </h2>
            </div>
            <Link
              href="/shop/catalog"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1D5D8B] hover:underline"
            >
              See all categories <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {CATEGORY_TILES.map((tile) => {
              const Icon = tile.icon;
              const count = forSale.filter((item) => {
                const cat = categories.find((c) => c.id === item.categoryId);
                if (!cat) return false;
                if (cat.slug === tile.slug) return true;
                const parent = categories.find((c) => c.id === cat.parentId);
                return parent?.slug === tile.slug;
              }).length;

              return (
                <Link
                  key={tile.slug}
                  href={`/shop/catalog?category=${tile.slug}`}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-stone-200 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1.5 hover:border-[#16c4df] hover:shadow-xl"
                >
                  <div className={`absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-br ${tile.gradient} opacity-50 blur-xl transition group-hover:scale-150`} />

                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-stone-100 text-[#1D5D8B] transition duration-300 group-hover:bg-[#16c4df]/20 group-hover:text-[#1D5D8B]">
                        <Icon className="h-6 w-6" strokeWidth={1.5} />
                      </div>
                      <span className={`rounded-full border px-2 py-0.5 text-[10.5px] font-bold ${tile.accent}`}>
                        {count} {count === 1 ? "unit" : "units"}
                      </span>
                    </div>

                    <h3 className="mt-4 font-display text-lg font-bold text-stone-900 group-hover:text-[#1D5D8B] transition">
                      {tile.label}
                    </h3>
                    <p className="mt-1 text-xs text-stone-500 leading-relaxed line-clamp-2">
                      {tile.desc}
                    </p>
                  </div>

                  <div className="mt-6 flex items-center gap-1 text-xs font-bold text-[#1D5D8B] transition group-hover:translate-x-1">
                    <span>Explore items</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* ================================================================= */}
        {/* 4. FEATURED SHOWROOM DROPS (REAL PRODUCTS GRID)                   */}
        {/* ================================================================= */}
        <section className="px-6 py-14 sm:px-12 lg:px-14 border-b border-stone-200/80 bg-white">
          <div className="mb-6">
            <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#1D5D8B]">
              Showroom Highlights
            </div>
            <h2 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-stone-900 sm:text-4xl">
              Fresh From Multi-Point Inspection
            </h2>
            <p className="mt-2 text-sm text-stone-500 max-w-xl">
              Each unit has undergone mechanical testing, gas cylinder load assessment, and cosmetic shampooing before listing.
            </p>
          </div>

          <FeaturedProductsGrid items={displayItems} categories={categories} />
        </section>

        {/* ================================================================= */}
        {/* 5. THE ETJOAIGI STANDARD: INSPECTION & GRADING EXPLAINER          */}
        {/* ================================================================= */}
        <section className="px-6 py-16 sm:px-12 lg:px-14 border-b border-stone-200/80 bg-gradient-to-b from-stone-50 to-white">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#1D5D8B]/10 px-3 py-1 text-[10.5px] font-black uppercase tracking-wider text-[#1D5D8B]">
              <ShieldCheck className="h-3.5 w-3.5" /> Transparent Inspection
            </div>
            <h2 className="mt-4 font-display text-3xl font-black text-stone-900 sm:text-4xl">
              The Etjoaigi Grading Standard
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-stone-600">
              We eliminate the uncertainty of buying pre-owned office furniture. Every single piece is graded by strict mechanical and cosmetic criteria.
            </p>
          </div>

          {/* 3 Tier Grading Cards */}
          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Grade A */}
            <div className="border-2 border-emerald-300 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-800">
                  Grade A · Like New
                </span>
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
              <h3 className="mt-4 font-display text-xl font-bold text-stone-900">
                Immaculate Executive State
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-stone-600">
                Units sourced from short corporate leases or corporate executive floors. Surfaces are pristine, meshes are taut with zero sagging, and mechanical functions operate as new.
              </p>
              <ul className="mt-4 space-y-2 border-t border-stone-100 pt-4 text-xs text-stone-600">
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" /> Zero stains, tears or deep scratches
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" /> 100% pneumatic lift & tilt lock tested
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" /> PostureFit / LiveBack fully responsive
                </li>
              </ul>
            </div>

            {/* Grade B */}
            <div className="border border-sky-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="bg-sky-100 px-3 py-1 text-xs font-black text-sky-800">
                  Grade B · Good Condition
                </span>
                <CheckCircle2 className="h-5 w-5 text-sky-600" />
              </div>
              <h3 className="mt-4 font-display text-xl font-bold text-stone-900">
                Everyday Professional Use
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-stone-600">
                Normal signs of office life — minor paint rubs on wheel bases or faint marks on plastic housings. Mechanically 100% functional, solid, and deep-cleaned.
              </p>
              <ul className="mt-4 space-y-2 border-t border-stone-100 pt-4 text-xs text-stone-600">
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-sky-600 shrink-0" /> Faint cosmetic scuffs photographed in detail
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-sky-600 shrink-0" /> All adjustment levers and armpads functional
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-sky-600 shrink-0" /> Deep foam shampoo & steam sanitation done
                </li>
              </ul>
            </div>

            {/* Grade C */}
            <div className="border border-amber-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="bg-amber-100 px-3 py-1 text-xs font-black text-amber-800">
                  Grade C · Fair / Deep Value
                </span>
                <CheckCircle2 className="h-5 w-5 text-amber-600" />
              </div>
              <h3 className="mt-4 font-display text-xl font-bold text-stone-900">
                Refurbished & Maximum Savings
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-stone-600">
                Pieces with noticeable aesthetic patina or serviced components. An unbeatable price for premium brand ergonomics when budget is the top priority.
              </p>
              <ul className="mt-4 space-y-2 border-t border-stone-100 pt-4 text-xs text-stone-600">
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-amber-600 shrink-0" /> Visible cosmetic marks clearly noted
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-amber-600 shrink-0" /> Serviced cylinders & lubricated tilt gears
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-amber-600 shrink-0" /> Steepest price markdown (up to 70% off)
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* 6. VERIFIED CUSTOMER REVIEWS                                      */}
        {/* ================================================================= */}
        <section className="px-6 py-16 sm:px-12 lg:px-14 border-b border-stone-200/80 bg-white">
          <div className="mb-10 text-center">
            <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#1D5D8B]">
              Real Experiences
            </div>
            <h2 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-stone-900 sm:text-4xl">
              Trusted by Professionals Across Metro Manila
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((t, idx) => (
              <div
                key={idx}
                className="flex flex-col justify-between border border-stone-200/90 bg-[#fbfdfd] p-6 shadow-sm transition hover:shadow-md"
              >
                <div>
                  <div className="flex items-center gap-1 text-amber-500">
                    {Array.from({ length: t.rating }).map((_, r) => (
                      <Star key={r} className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-stone-700 italic">
                    &ldquo;{t.text}&rdquo;
                  </p>
                </div>

                <div className="mt-6 border-t border-stone-100 pt-4">
                  <div className="font-bold text-stone-900 text-sm">{t.name}</div>
                  <div className="text-xs text-stone-500">{t.role}</div>
                  <div className="mt-1.5 inline-block bg-stone-100 px-2 py-0.5 text-[10px] font-semibold text-[#1D5D8B]">
                    Purchased: {t.item}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ================================================================= */}
        {/* 7. SHOWROOM VISIT & FREE VIEWING INVITATION                      */}
        {/* ================================================================= */}
        <section id="showroom" className="px-6 py-16 sm:px-12 lg:px-14 bg-[#16486B] text-white">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#a9e4f1]">
                <MapPin className="h-3.5 w-3.5 text-[#16c4df]" /> In-Person Viewing
              </span>
              <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight sm:text-4xl text-white">
                Test the comfort before you take it home.
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-[#dbeaf2]">
                Ergonomics is personal. We welcome you to visit our Muntinlupa warehouse showroom to sit in chairs, test motorized desk heights, and feel the finishes in person.
              </p>

              <div className="mt-6 space-y-3 text-xs text-[#dbeaf2]">
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-[#16c4df] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white">Showroom & Warehouse:</span><br />
                    Km 23 West Service Road, Cupang, Muntinlupa City, Metro Manila
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="h-4 w-4 text-[#16c4df] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white">Viewing Hours:</span><br />
                    Monday to Saturday, 9:00 AM – 6:00 PM (By appointment or walk-in)
                  </div>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/shop/catalog"
                  className="bg-[#16c4df] px-6 py-3 text-xs font-black text-[#17364b] transition hover:bg-[#6be2ee]"
                >
                  Browse Available Stock
                </Link>
                <a
                  href="https://maps.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border border-white/30 bg-white/10 px-6 py-3 text-xs font-bold text-white transition hover:bg-white/20"
                >
                  Get Driving Directions ↗
                </a>
              </div>
            </div>

            {/* Warehouse Visual Feature Box */}
            <div className="border border-white/15 bg-white/5 p-8 backdrop-blur-sm">
              <div className="grid grid-cols-2 gap-4">
                <div className="border border-white/10 bg-white/10 p-5 text-center">
                  <div className="font-display text-3xl font-black text-[#16c4df]">100%</div>
                  <div className="mt-1 text-xs font-bold text-white">Pre-Inspected</div>
                  <div className="mt-1 text-[10.5px] text-white/70">Checklist logged before listing</div>
                </div>
                <div className="border border-white/10 bg-white/10 p-5 text-center">
                  <div className="font-display text-3xl font-black text-[#16c4df]">24-48h</div>
                  <div className="mt-1 text-xs font-bold text-white">Metro Delivery</div>
                  <div className="mt-1 text-[10.5px] text-white/70">Handled by furniture couriers</div>
                </div>
                <div className="border border-white/10 bg-white/10 p-5 text-center">
                  <div className="font-display text-3xl font-black text-[#16c4df]">Up to 65%</div>
                  <div className="mt-1 text-xs font-bold text-white">Below Retail</div>
                  <div className="mt-1 text-[10.5px] text-white/70">Enterprise-grade furnishings</div>
                </div>
                <div className="border border-white/10 bg-white/10 p-5 text-center">
                  <div className="font-display text-3xl font-black text-[#16c4df]">0 Hidden</div>
                  <div className="mt-1 text-xs font-bold text-white">Flaws or Surprises</div>
                  <div className="mt-1 text-[10.5px] text-white/70">Photographed down to minor scuffs</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* =================================================================== */}
      {/* 8. FOOTER                                                          */}
      {/* =================================================================== */}
      <footer id="offers" className="border-t border-stone-200 bg-white">
        <div className="mx-auto grid max-w-[1480px] gap-8 px-6 py-14 text-sm text-stone-600 sm:grid-cols-[1.6fr_1fr_1fr_1fr] sm:px-12">
          <div>
            <div className="font-display text-2xl font-black tracking-tight text-[#1D5D8B]">
              ETJOAIGI
            </div>
            <p className="mt-3 max-w-sm text-xs leading-relaxed text-stone-500">
              Sustainable design, certified condition, and honest pricing. Sourcing iconic office furniture to elevate workspaces across Metro Manila.
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-[#1D5D8B]">
              <MapPin className="h-3.5 w-3.5" /> Muntinlupa City, Metro Manila, Philippines
            </div>
          </div>

          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-stone-900">
              Workspace Categories
            </div>
            <div className="mt-3 space-y-2 text-xs">
              <p><Link href="/shop/catalog?category=seating" className="hover:text-[#1D5D8B] hover:underline">Ergonomic Task Chairs</Link></p>
              <p><Link href="/shop/catalog?category=desks" className="hover:text-[#1D5D8B] hover:underline">Motorized Standing Desks</Link></p>
              <p><Link href="/shop/catalog?category=tables" className="hover:text-[#1D5D8B] hover:underline">Conference & Meeting Tables</Link></p>
              <p><Link href="/shop/catalog?category=storage" className="hover:text-[#1D5D8B] hover:underline">Filing & Credenzas</Link></p>
              <p><Link href="/shop/catalog?category=reception" className="hover:text-[#1D5D8B] hover:underline">Lounge Seating & Partitions</Link></p>
            </div>
          </div>

          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-stone-900">
              Customer Support
            </div>
            <div className="mt-3 space-y-2 text-xs">
              <p><Link href="/shop/catalog" className="hover:text-[#1D5D8B] hover:underline">Online Catalog</Link></p>
              <p><Link href="/shop/offers" className="hover:text-[#1D5D8B] hover:underline">Special Offers & Drops</Link></p>
              <p><Link href="#showroom" className="hover:text-[#1D5D8B] hover:underline">Free Showroom Viewing</Link></p>
              <p><Link href="/shop/cart" className="hover:text-[#1D5D8B] hover:underline">My Cart</Link></p>
            </div>
          </div>

          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-stone-900">
              Transparency
            </div>
            <p className="mt-3 text-xs leading-relaxed text-stone-500">
              All listed items are authentic and condition-graded (Grade A, B, or C). High-resolution photos show true physical condition.
            </p>
            <div className="mt-4 rounded-xl border border-stone-200 bg-stone-50 p-3 text-[11px] text-stone-600">
              Need bulk office liquidation or corporate outfitting? Visit our Muntinlupa warehouse.
            </div>
          </div>
        </div>

        <div className="border-t border-stone-100 py-6 text-center text-xs text-stone-400">
          © {new Date().getFullYear()} ETJOAIGI Trading. All rights reserved.
        </div>
      </footer>

      <ScrollToTop />
    </div>
  );
}