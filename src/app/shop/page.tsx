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
  Clock, 
  CheckCircle2, 
  Award,
  Compass,
  Navigation,
  ExternalLink
} from "lucide-react";
import Link from "next/link";
import { getShopCatalogData } from "@/lib/queries";
import { ShopHeader } from "@/components/shop-header";
import { ShopFooter } from "@/components/shop-footer";
import { ScrollToTop } from "@/components/scroll-to-top";
import { HeroSpotlightCard } from "@/components/shop-home-cards";

export const revalidate = 60;

const CATEGORY_TILES = [
  { 
    label: "Ergonomic Chairs", 
    slug: "seating", 
    icon: Armchair, 
    tagline: "Flagship Task Seating",
    desc: "Herman Miller Aeron, Steelcase Leap V2, Embody, Gesture, Haworth Zody",
    gradient: "from-sky-500/15 via-sky-500/5 to-transparent",
    accent: "text-sky-600 border-sky-200 bg-sky-50",
    badge: "Most Popular"
  },
  { 
    label: "Motorized Desks", 
    slug: "desks", 
    icon: Table2, 
    tagline: "Height Adjustable",
    desc: "Dual-motor sit/stand frames, solid wood tops, executive pods & risers",
    gradient: "from-[#1D5D8B]/15 via-[#1D5D8B]/5 to-transparent",
    accent: "text-[#1D5D8B] border-[#1D5D8B]/30 bg-[#1D5D8B]/10",
    badge: "Ergonomic"
  },
  { 
    label: "Conference & Tables", 
    slug: "tables", 
    icon: Table2, 
    tagline: "Team Collaboration",
    desc: "Boardroom tables, training modular fold-ups, round meeting & side tables",
    gradient: "from-emerald-500/15 via-emerald-500/5 to-transparent",
    accent: "text-emerald-700 border-emerald-200 bg-emerald-50",
    badge: "Executive"
  },
  { 
    label: "Storage & Credenzas", 
    slug: "storage", 
    icon: Archive, 
    tagline: "Organization & Filing",
    desc: "Lateral steel files, acoustic bookcases, executive credenzas & lockers",
    gradient: "from-amber-500/15 via-amber-500/5 to-transparent",
    accent: "text-amber-700 border-amber-200 bg-amber-50",
    badge: "Heavy-Duty"
  },
  { 
    label: "Lounge & Reception", 
    slug: "reception", 
    icon: LampDesk, 
    tagline: "Guest & Breakout",
    desc: "Designer reception sofas, breakout barstools, privacy booths & acoustic pods",
    gradient: "from-purple-500/15 via-purple-500/5 to-transparent",
    accent: "text-purple-700 border-purple-200 bg-purple-50",
    badge: "Design Icons"
  },
];

const BRAND_PILLS = [
  "Herman Miller",
  "Steelcase",
  "Haworth",
  "Knoll",
  "Vitra",
  "Humanscale"
];

const TESTIMONIALS = [
  {
    initials: "RM",
    quote: "Exceptional Herman Miller Aeron find",
    text: "Saved over ₱45,000 compared to brand new retail. The Forward Tilt lock and PostureFit work flawlessly with zero mesh sagging. Arrived within 24 hours in BGC fully assembled.",
    author: "Rafael M.",
    role: "Senior Product Designer",
    company: "Fintech Studio",
    location: "BGC, Taguig",
    rating: 5,
    verifiedItem: "Herman Miller Aeron (Size B)"
  },
  {
    initials: "DC",
    quote: "Transparent grading — exactly as photographed",
    text: "Ordered a Steelcase Leap V2 Grade B. The minor scratches mentioned in the listing were honestly documented. The cylinder lift and 4D armrests feel factory-solid. Impressive honesty.",
    author: "Danielle C.",
    role: "Principal Architect",
    company: "Design Workshop",
    location: "Legaspi Village, Makati",
    rating: 5,
    verifiedItem: "Steelcase Leap V2 (Black Fabric)"
  },
  {
    initials: "MS",
    quote: "Fitted our entire 12-person startup office",
    text: "We visited their Muntinlupa showroom on Saturday, test-sat 8 different chairs, and arranged bulk delivery for Monday morning. Transparent pricing and white-glove courier handling.",
    author: "Mark S.",
    role: "Co-founder & CTO",
    company: "Alabang Tech Hub",
    location: "Madrigal Business Park",
    rating: 5,
    verifiedItem: "Haworth Zody & Motorized Desks"
  }
];

export default async function ShopHomePage() {
  const { items } = await getShopCatalogData();

  // Listed items only
  const forSale = items.filter((i) => i.status === "listed" && i.listedPrice != null);

  // Find featured or best spotlight piece
  const spotlightItem = 
    forSale.find((i) => i.isFeatured && i.photos?.[0]?.url) ||
    forSale.find((i) => i.photos?.[0]?.url) ||
    forSale[0] ||
    null;

  return (
    <div className="min-h-screen bg-[#FCFDF8] text-[#17364b] antialiased selection:bg-[#1D5D8B] selection:text-white">
      <ShopHeader />

      <main className="w-full">
        {/* ================================================================= */}
        {/* 1. HERO SECTION WITH SPOTLIGHT PRODUCT CARD & MARQUEE             */}
        {/* ================================================================= */}
        <div className="relative w-full flex flex-col lg:min-h-[calc(100dvh-64px)] lg:max-h-[calc(100dvh-64px)]">
          <section className="relative w-full flex-1 flex flex-col justify-center overflow-hidden bg-gradient-to-br from-[#071c2e] via-[#103a57] to-[#1D5D8B] text-[#FCFDF8]">
            {/* Ambient Lighting & Geometric Texture */}
            <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-[#16c4df]/20 blur-3xl pointer-events-none" />
            <div className="absolute top-1/3 -right-32 h-[600px] w-[600px] rounded-full bg-[#16c4df]/15 blur-3xl pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:28px_28px] opacity-70 pointer-events-none" />

            <div className="relative mx-auto w-full max-w-[1760px] 2xl:max-w-[1840px] px-6 sm:px-10 lg:px-14 xl:px-16 2xl:px-20 py-8 sm:py-10 lg:py-4 xl:py-6 my-auto">
              <div className="grid items-center gap-6 lg:gap-10 xl:gap-14 lg:grid-cols-12">
                
                {/* Left Column: Headline, Brand Pills, CTAs, and Trust Matrix */}
                <div className="lg:col-span-7 xl:col-span-7 flex flex-col justify-center">
                  
                  {/* Live Status Pill */}
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="inline-flex items-center gap-2 rounded-full border border-[#16c4df]/40 bg-[#16c4df]/15 px-3 py-1 text-[11px] font-bold text-[#bbf3fb] backdrop-blur-md">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#16c4df] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#16c4df]"></span>
                      </span>
                      Showroom Open in Muntinlupa · Metro Manila Delivery
                    </div>
                    <span className="hidden sm:inline-block text-[11px] font-semibold text-white/50">
                      {forSale.length} verified pieces in stock
                    </span>
                  </div>

                  {/* Primary Hero Heading */}
                  <h1 className="mt-3 sm:mt-4 font-display text-3xl sm:text-5xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-extrabold leading-[1.05] tracking-tight">
                    Iconic design.<br />
                    Inspected condition.<br />
                    <span className="bg-gradient-to-r from-[#16c4df] via-[#68e0ee] to-[#a9e4f1] bg-clip-text text-transparent">
                      Honest prices.
                    </span>
                  </h1>

                  {/* Subtitle */}
                  <p className="mt-3 sm:mt-3.5 max-w-xl text-xs sm:text-sm xl:text-base leading-relaxed text-[#dbeaf2]/90">
                    Acquire authentic Herman Miller, Steelcase, Vitra, Haworth, and Knoll workspace furniture at up to 60% off retail. Every piece is cleaned, mechanically tested, and condition-graded.
                  </p>

                  {/* Brand Selection Pills */}
                  <div className="mt-3 sm:mt-3.5 flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#a9c8da] mr-1">
                      Featured Brands:
                    </span>
                    {BRAND_PILLS.map((brand) => (
                      <Link
                        key={brand}
                        href={`/shop/catalog?q=${encodeURIComponent(brand)}`}
                        className="rounded-full border border-white/20 bg-white/10 px-2.5 py-0.5 text-[11px] font-semibold text-[#f1f8fc] backdrop-blur-sm transition duration-200 hover:border-[#16c4df] hover:bg-[#16c4df] hover:text-[#071c2e]"
                      >
                        {brand}
                      </Link>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-4 sm:mt-5 flex flex-wrap items-center gap-3">
                    <Link
                      href="/shop/catalog"
                      className="inline-flex items-center gap-2 rounded-xl bg-[#16c4df] px-5 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-black text-[#071c2e] shadow-[0_8px_25px_rgba(22,196,223,0.35)] transition duration-300 hover:-translate-y-0.5 hover:bg-[#68e0ee] hover:shadow-[0_12px_30px_rgba(22,196,223,0.45)] active:scale-95"
                    >
                      Explore Catalog ({forSale.length}) <ArrowRight className="h-4 w-4 stroke-[2.5]" />
                    </Link>
                    <Link
                      href="/shop/offers"
                      className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-5 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-white backdrop-blur-md transition duration-300 hover:bg-white/20 hover:border-white/50"
                    >
                      Today&apos;s Drops & Offers
                    </Link>
                    <Link
                      href="#showroom"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#bbf3fb] hover:text-white transition underline-offset-4 hover:underline sm:ml-1"
                    >
                      <MapPin className="h-3.5 w-3.5 text-[#16c4df]" /> Muntinlupa Showroom
                    </Link>
                  </div>

                  {/* Quick Trust Cards Grid */}
                  <div className="mt-4 sm:mt-5 grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-3.5 sm:pt-4 border-t border-white/15">
                    <div className="rounded-xl border border-white/15 bg-white/10 p-2.5 sm:p-3 backdrop-blur-md transition hover:bg-white/15">
                      <div className="flex items-center gap-2">
                        <Award className="h-3.5 w-3.5 text-[#16c4df] shrink-0" />
                        <div className="font-bold text-white text-xs sm:text-sm">100% Genuine</div>
                      </div>
                      <div className="text-[11px] text-[#a9c8da] mt-0.5">
                        Herman Miller, Steelcase & more
                      </div>
                    </div>

                    <div className="rounded-xl border border-white/15 bg-white/10 p-2.5 sm:p-3 backdrop-blur-md transition hover:bg-white/15">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="h-3.5 w-3.5 text-[#16c4df] shrink-0" />
                        <div className="font-bold text-white text-xs sm:text-sm">Grade A / B / C</div>
                      </div>
                      <div className="text-[11px] text-[#a9c8da] mt-0.5">
                        Transparent condition grading
                      </div>
                    </div>

                    <div className="rounded-xl border border-white/15 bg-white/10 p-2.5 sm:p-3 backdrop-blur-md transition hover:bg-white/15">
                      <div className="flex items-center gap-2">
                        <Truck className="h-3.5 w-3.5 text-[#16c4df] shrink-0" />
                        <div className="font-bold text-white text-xs sm:text-sm">Ready to Ship</div>
                      </div>
                      <div className="text-[11px] text-[#a9c8da] mt-0.5">
                        Metro courier or free showroom pickup
                      </div>
                    </div>
                  </div>

                </div>

                {/* Right Column: Hero Spotlight Product Showcase */}
                <div className="lg:col-span-5 xl:col-span-5 flex justify-center lg:justify-end w-full">
                  <div className="w-full max-w-lg xl:max-w-xl">
                    {spotlightItem ? (
                      <HeroSpotlightCard item={spotlightItem} />
                    ) : (
                      <div className="rounded-2xl border border-white/20 bg-white/10 p-8 text-center backdrop-blur-xl">
                        <Armchair className="mx-auto h-20 w-20 text-[#16c4df]" strokeWidth={1} />
                        <div className="mt-3 font-bold text-white text-base">No active items for sale</div>
                        <p className="mt-1 text-xs text-white/70">Check back soon for new inventory drops.</p>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          </section>

          {/* ================================================================= */}
          {/* MOVING AD BANNER (MARQUEE) - ANCHORED AT BOTTOM OF INITIAL SCREEN */}
          {/* ================================================================= */}
          <div className="shrink-0 w-full overflow-hidden bg-[#16c4df] py-2 sm:py-2.5 text-[#17364b] border-y border-[#1D5D8B]/20 shadow-inner">
            <div className="flex min-w-max animate-[marquee_25s_linear_infinite] items-center gap-12 text-xs sm:text-[13px] font-black uppercase tracking-widest">
              {Array.from({ length: 6 }).map((_, idx) => (
                <span key={idx} className="flex items-center gap-12">
                  <span>NEW ARRIVALS DROP DAILY</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-[#17364b]" />
                  <span>FREE VIEWING IN MUNTINLUPA</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-[#17364b]" />
                  <span>AUTHENTIC PRE-OWNED FURNITURE</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-[#17364b]" />
                  <span>DOOR-TO-DOOR METRO MANILA DELIVERY</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-[#17364b]" />
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ================================================================= */}
        {/* 2. VALUE PROPOSITION RIBBON (FULL-WIDTH EXPANSIVE)                */}
        {/* ================================================================= */}
        <section className="w-full border-b border-stone-200/80 bg-white py-10 sm:py-12 shadow-sm">
          <div className="mx-auto max-w-[1760px] 2xl:max-w-[1840px] px-6 sm:px-10 lg:px-14 xl:px-16 2xl:px-20">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              
              <div className="group flex items-start gap-4 rounded-2xl border border-stone-200/80 bg-[#fbfdfd] p-5 sm:p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#16c4df]/60 hover:shadow-md hover:bg-white">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#16c4df]/15 text-[#1D5D8B] transition duration-300 group-hover:scale-110 group-hover:bg-[#16c4df]/25">
                  <ShieldCheck className="h-6 w-6 text-[#1D5D8B]" />
                </div>
                <div>
                  <div className="font-display text-sm font-extrabold text-stone-900">
                    Multi-Point Inspection
                  </div>
                  <div className="mt-1.5 text-xs leading-relaxed text-stone-500">
                    Cylinders, tilt locks, armpad tension, and castors are verified by furniture technicians.
                  </div>
                  <span className="mt-3 inline-block rounded bg-stone-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#1D5D8B]">
                    Mechanically Tested
                  </span>
                </div>
              </div>

              <div className="group flex items-start gap-4 rounded-2xl border border-stone-200/80 bg-[#fbfdfd] p-5 sm:p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-emerald-300 hover:shadow-md hover:bg-white">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 transition duration-300 group-hover:scale-110 group-hover:bg-emerald-200">
                  <Truck className="h-6 w-6 text-emerald-700" />
                </div>
                <div>
                  <div className="font-display text-sm font-extrabold text-stone-900">
                    Metro Manila Delivery
                  </div>
                  <div className="mt-1.5 text-xs leading-relaxed text-stone-500">
                    Carefully handled door-to-door courier dispatch, delivered fully assembled and ready for work.
                  </div>
                  <span className="mt-3 inline-block rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                    Fully Assembled
                  </span>
                </div>
              </div>

              <div className="group flex items-start gap-4 rounded-2xl border border-stone-200/80 bg-[#fbfdfd] p-5 sm:p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-sky-300 hover:shadow-md hover:bg-white">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-700 transition duration-300 group-hover:scale-110 group-hover:bg-sky-200">
                  <RotateCcw className="h-6 w-6 text-sky-700" />
                </div>
                <div>
                  <div className="font-display text-sm font-extrabold text-stone-900">
                    48-Hour Functional Guarantee
                  </div>
                  <div className="mt-1.5 text-xs leading-relaxed text-stone-500">
                    Test the ergonomic adjustments in your home office setup with full mechanical peace of mind.
                  </div>
                  <span className="mt-3 inline-block rounded bg-sky-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sky-700">
                    Zero Risk Testing
                  </span>
                </div>
              </div>

              <div className="group flex items-start gap-4 rounded-2xl border border-stone-200/80 bg-[#fbfdfd] p-5 sm:p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-amber-300 hover:shadow-md hover:bg-white">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 transition duration-300 group-hover:scale-110 group-hover:bg-amber-200">
                  <MapPin className="h-6 w-6 text-amber-700" />
                </div>
                <div>
                  <div className="font-display text-sm font-extrabold text-stone-900">
                    Muntinlupa Showroom
                  </div>
                  <div className="mt-1.5 text-xs leading-relaxed text-stone-500">
                    Sit in Herman Miller and Steelcase pieces before deciding. Walk-ins and appointments welcome.
                  </div>
                  <span className="mt-3 inline-block rounded bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700">
                    Km 23 West Service Rd
                  </span>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* 3. BROWSE BY CATEGORY (FULL WIDTH 5-COL GRID)                     */}
        {/* ================================================================= */}
        <section className="w-full border-b border-stone-200/80 bg-[#fafcfb] py-16 sm:py-20">
          <div className="mx-auto max-w-[1760px] 2xl:max-w-[1840px] px-6 sm:px-10 lg:px-14 xl:px-16 2xl:px-20">
            
            {/* Header row with catalog action */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-[#1D5D8B]/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-[#1D5D8B]">
                  <Compass className="h-3.5 w-3.5 text-[#1D5D8B]" /> Curated Workspace Categories
                </div>
                <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-stone-900 sm:text-4xl lg:text-5xl">
                  Explore by Category
                </h2>
                <p className="mt-2 text-sm text-stone-500 max-w-xl">
                  Select a category to view tested inventory, condition ratings, and price markdown benchmarks.
                </p>
              </div>

              <Link 
                href="/shop/catalog" 
                className="inline-flex items-center gap-2 rounded-xl bg-white border border-stone-300/80 px-5 py-3 text-xs font-black uppercase tracking-wider text-[#1D5D8B] shadow-sm transition hover:border-[#16c4df] hover:bg-[#edf7f9] hover:text-[#17364b]"
              >
                View Full Catalog ({forSale.length}) <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* 5-Column Grid */}
            <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {CATEGORY_TILES.map((cat) => {
                const Icon = cat.icon;
                return (
                  <Link
                    key={cat.slug}
                    href={`/shop/catalog?category=${cat.slug}`}
                    className="group relative flex flex-col justify-between rounded-2xl border border-stone-200/90 bg-white p-7 shadow-sm transition duration-300 hover:-translate-y-1.5 hover:border-[#16c4df] hover:shadow-xl"
                  >
                    <div>
                      {/* Top icon and badge row */}
                      <div className="flex items-center justify-between">
                        <div className={`inline-flex h-14 w-14 items-center justify-center rounded-xl border ${cat.accent} transition duration-300 group-hover:scale-110 group-hover:shadow-sm`}>
                          <Icon className="h-7 w-7" strokeWidth={1.8} />
                        </div>
                        <span className="rounded-full bg-stone-100 px-2.5 py-1 text-[10.5px] font-bold text-stone-600 group-hover:bg-[#16c4df]/20 group-hover:text-[#17364b] transition">
                          {cat.badge}
                        </span>
                      </div>

                      {/* Title & Tagline */}
                      <div className="mt-5">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                          {cat.tagline}
                        </div>
                        <h3 className="mt-1 font-display text-xl font-bold text-stone-900 group-hover:text-[#1D5D8B] transition">
                          {cat.label}
                        </h3>
                        <p className="mt-2 text-xs leading-relaxed text-stone-500">
                          {cat.desc}
                        </p>
                      </div>
                    </div>

                    {/* Bottom action link */}
                    <div className="mt-8 flex items-center justify-between border-t border-stone-100 pt-4 text-xs font-black text-[#1D5D8B]">
                      <span>Explore collection</span>
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-stone-50 transition duration-300 group-hover:bg-[#16c4df] group-hover:text-[#17364b] group-hover:translate-x-1">
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

          </div>
        </section>

        {/* ================================================================= */}
        {/* 4. THE ETJOAIGI STANDARD: INSPECTION & GRADING EXPLAINER          */}
        {/* ================================================================= */}
        <section id="grading" className="w-full border-b border-stone-200/80 bg-gradient-to-b from-stone-50 via-white to-stone-50/60 py-16 sm:py-24">
          <div className="mx-auto max-w-[1760px] 2xl:max-w-[1840px] px-6 sm:px-10 lg:px-14 xl:px-16 2xl:px-20">
            
            <div className="mx-auto max-w-3xl text-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#1D5D8B]/10 px-4 py-1.5 text-xs font-black uppercase tracking-wider text-[#1D5D8B]">
                <ShieldCheck className="h-4 w-4" /> Transparent Inspection
              </div>
              <h2 className="mt-4 font-display text-3xl font-black text-stone-900 sm:text-4xl lg:text-5xl">
                The Etjoaigi Grading Standard
              </h2>
              <p className="mt-3 text-base leading-relaxed text-stone-600">
                We eliminate the uncertainty of buying pre-owned office furniture. Every single piece is graded by certified condition criteria, photographed in high definition, and guaranteed.
              </p>
            </div>

            {/* 3 Tier Grading Cards Grid */}
            <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3 lg:gap-8">
              
              {/* Grade A */}
              <div className="relative overflow-hidden rounded-2xl border-2 border-amber-400 bg-white p-7 shadow-sm transition duration-300 hover:shadow-xl hover:-translate-y-1">
                <div className="absolute top-0 right-0 h-24 w-24 bg-amber-400/10 rounded-bl-full pointer-events-none" />
                <div className="flex items-center justify-between">
                  <span className="rounded-md bg-amber-400 px-3.5 py-1 text-xs font-black text-[#17364b] shadow-sm">
                    Grade A · Like New
                  </span>
                  <CheckCircle2 className="h-6 w-6 text-amber-500" />
                </div>
                <h3 className="mt-5 font-display text-2xl font-bold text-stone-900">
                  Immaculate Executive State
                </h3>
                <p className="mt-2 text-xs text-stone-500">
                  Premium condition items from brief executive deployments or showroom floor displays.
                </p>

                <ul className="mt-6 space-y-3 border-t border-stone-100 pt-5 text-xs text-stone-700">
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-amber-600 shrink-0 stroke-[3]" /> Zero stains, tears, or deep scratches
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-amber-600 shrink-0 stroke-[3]" /> 100% pneumatic lift & tilt lock tested
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-amber-600 shrink-0 stroke-[3]" /> PostureFit / LiveBack fully responsive
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-amber-600 shrink-0 stroke-[3]" /> Factory smooth dual-wheel castors
                  </li>
                </ul>

                <div className="mt-8 rounded-xl bg-amber-50 border border-amber-200/80 p-3 text-center">
                  <span className="text-xs font-bold text-amber-800">
                    Typical Savings: 35% – 45% below retail
                  </span>
                </div>
              </div>

              {/* Grade B */}
              <div className="relative overflow-hidden rounded-2xl border-2 border-emerald-500 bg-white p-7 shadow-sm transition duration-300 hover:shadow-xl hover:-translate-y-1">
                <div className="absolute top-0 right-0 h-24 w-24 bg-emerald-500/10 rounded-bl-full pointer-events-none" />
                <div className="flex items-center justify-between">
                  <span className="rounded-md bg-emerald-600 px-3.5 py-1 text-xs font-black text-white shadow-sm">
                    Grade B · Good Condition
                  </span>
                  <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                </div>
                <h3 className="mt-5 font-display text-2xl font-bold text-stone-900">
                  Everyday Professional Use
                </h3>
                <p className="mt-2 text-xs text-stone-500">
                  Normal light corporate usage with fully functioning mechanisms and cleaned upholstery.
                </p>

                <ul className="mt-6 space-y-3 border-t border-stone-100 pt-5 text-xs text-stone-700">
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0 stroke-[3]" /> Faint cosmetic scuffs photographed in detail
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0 stroke-[3]" /> All adjustment levers and armpads functional
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0 stroke-[3]" /> Deep foam shampoo & steam sanitation done
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0 stroke-[3]" /> 48-Hour return guarantee if unsatisfied
                  </li>
                </ul>

                <div className="mt-8 rounded-xl bg-emerald-50 border border-emerald-200/80 p-3 text-center">
                  <span className="text-xs font-bold text-emerald-800">
                    Typical Savings: 50% – 60% below retail
                  </span>
                </div>
              </div>

              {/* Grade C */}
              <div className="relative overflow-hidden rounded-2xl border-2 border-sky-600 bg-white p-7 shadow-sm transition duration-300 hover:shadow-xl hover:-translate-y-1">
                <div className="absolute top-0 right-0 h-24 w-24 bg-sky-600/10 rounded-bl-full pointer-events-none" />
                <div className="flex items-center justify-between">
                  <span className="rounded-md bg-sky-600 px-3.5 py-1 text-xs font-black text-white shadow-sm">
                    Grade C · Fair / Deep Value
                  </span>
                  <CheckCircle2 className="h-6 w-6 text-sky-600" />
                </div>
                <h3 className="mt-5 font-display text-2xl font-bold text-stone-900">
                  Refurbished & Maximum Savings
                </h3>
                <p className="mt-2 text-xs text-stone-500">
                  Visible exterior wear but mechanically repaired and lubricated for continued heavy daily use.
                </p>

                <ul className="mt-6 space-y-3 border-t border-stone-100 pt-5 text-xs text-stone-700">
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-sky-600 shrink-0 stroke-[3]" /> Visible cosmetic marks clearly noted & priced in
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-sky-600 shrink-0 stroke-[3]" /> Serviced cylinders & lubricated tilt gears
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-sky-600 shrink-0 stroke-[3]" /> Steepest price markdown (up to 70% off)
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-sky-600 shrink-0 stroke-[3]" /> Ideal for fast-growing startups on budget
                  </li>
                </ul>

                <div className="mt-8 rounded-xl bg-sky-50 border border-sky-200/80 p-3 text-center">
                  <span className="text-xs font-bold text-sky-800">
                    Typical Savings: 65% – 75% below retail
                  </span>
                </div>
              </div>

            </div>

            {/* Bottom Reassurance Banner */}
            <div className="mt-12 rounded-2xl border border-stone-200 bg-white p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#1D5D8B]/10 text-[#1D5D8B]">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-display text-base font-bold text-stone-900">
                    What you see is the exact serial and unit delivered to your door.
                  </h4>
                  <p className="text-xs text-stone-500 mt-0.5">
                    No generic stock mockups. We capture high-resolution photos of every specific inventory piece.
                  </p>
                </div>
              </div>

              <Link
                href="/shop/catalog"
                className="shrink-0 rounded-xl bg-[#1D5D8B] px-5 py-3 text-xs font-bold text-white transition hover:bg-[#16486B]"
              >
                Browse Graded Inventory
              </Link>
            </div>

          </div>
        </section>

        {/* ================================================================= */}
        {/* 5. VERIFIED CUSTOMER REVIEWS (FULL-WIDTH EXPANSIVE)               */}
        {/* ================================================================= */}
        <section id="reviews" className="w-full border-b border-stone-200/80 bg-white py-16 sm:py-24">
          <div className="mx-auto max-w-[1760px] 2xl:max-w-[1840px] px-6 sm:px-10 lg:px-14 xl:px-16 2xl:px-20">
            
            <div className="text-center max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#1D5D8B]/10 px-4 py-1.5 text-xs font-black uppercase tracking-wider text-[#1D5D8B]">
                <Star className="h-4 w-4 text-amber-500 fill-amber-500" /> Real Experiences
              </div>
              <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-stone-900 sm:text-4xl lg:text-5xl">
                Trusted by Professionals Across Metro Manila
              </h2>
              <p className="mt-3 text-base text-stone-500">
                From remote tech engineers and architects to commercial offices in BGC, Makati, and Alabang.
              </p>
            </div>

            <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3 lg:gap-8">
              {TESTIMONIALS.map((t, idx) => (
                <div
                  key={idx}
                  className="group relative flex flex-col justify-between rounded-2xl border border-stone-200/90 bg-[#fbfdfd] p-7 shadow-sm transition duration-300 hover:shadow-xl hover:border-[#16c4df]/60 hover:bg-white"
                >
                  <div>
                    {/* Stars and location */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-amber-500">
                        {Array.from({ length: t.rating }).map((_, r) => (
                          <Star key={r} className="h-4 w-4 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                      <span className="text-[11px] font-semibold text-stone-400">
                        {t.location}
                      </span>
                    </div>

                    {/* Headline quote */}
                    <h3 className="mt-4 font-display text-lg font-bold text-stone-900 group-hover:text-[#1D5D8B] transition">
                      &ldquo;{t.quote}&rdquo;
                    </h3>

                    {/* Review text */}
                    <p className="mt-3 text-xs leading-relaxed text-stone-600">
                      &ldquo;{t.text}&rdquo;
                    </p>
                  </div>

                  {/* Customer author footer */}
                  <div className="mt-8 border-t border-stone-100 pt-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1D5D8B] text-xs font-black text-white shadow-sm">
                        {t.initials}
                      </div>
                      <div>
                        <div className="font-display font-bold text-stone-900 text-sm">
                          {t.author}
                        </div>
                        <div className="text-[11.5px] text-stone-500">
                          {t.role} · {t.company}
                        </div>
                      </div>
                    </div>

                    <div className="hidden sm:inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200/60 px-2.5 py-1 text-[10.5px] font-bold text-emerald-700">
                      <CheckCircle2 className="h-3 w-3" /> Verified
                    </div>
                  </div>

                  {/* Mobile verified item chip */}
                  <div className="mt-3 pt-2 border-t border-dashed border-stone-200 sm:border-0 sm:mt-1 sm:pt-0">
                    <span className="text-[11px] text-stone-500">
                      Purchased: <strong className="text-stone-700">{t.verifiedItem}</strong>
                    </span>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* ================================================================= */}
        {/* 6. SHOWROOM VISIT & FREE VIEWING INVITATION (FULL-WIDTH LUXURY)  */}
        {/* ================================================================= */}
        <section id="showroom" className="w-full bg-gradient-to-br from-[#071c2e] via-[#103a57] to-[#1D5D8B] text-white py-16 sm:py-24 relative overflow-hidden">
          {/* Ambient Lighting Background */}
          <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-[#16c4df]/20 blur-3xl pointer-events-none" />
          <div className="absolute top-10 right-10 h-80 w-80 rounded-full bg-[#16c4df]/15 blur-3xl pointer-events-none" />

          <div className="relative mx-auto max-w-[1760px] 2xl:max-w-[1840px] px-6 sm:px-10 lg:px-14 xl:px-16 2xl:px-20">
            <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-14">
              
              {/* Left 7 Columns: Showroom Invitation & Address */}
              <div className="lg:col-span-7">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-[#a9e4f1] backdrop-blur-md">
                  <MapPin className="h-4 w-4 text-[#16c4df]" /> In-Person Showroom Viewing
                </span>

                <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight sm:text-5xl text-white">
                  Test the comfort before you take it home.
                </h2>

                <p className="mt-4 text-sm sm:text-base leading-relaxed text-[#dbeaf2]/90 max-w-2xl">
                  Ergonomics is personal. We welcome you to visit our Muntinlupa warehouse showroom to sit in chairs, adjust lumbar tension, test motorized desk heights, and inspect physical conditions in person.
                </p>

                {/* Location & Operating Hours Cards */}
                <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-[#dbeaf2]">
                  <div className="rounded-xl border border-white/15 bg-white/10 p-4 backdrop-blur-md">
                    <div className="flex items-center gap-2 text-white font-bold text-sm">
                      <MapPin className="h-4 w-4 text-[#16c4df] shrink-0" />
                      Showroom & Warehouse
                    </div>
                    <p className="mt-2 leading-relaxed text-[#c6dfec]">
                      Km 23 West Service Road, Cupang, Muntinlupa City, Metro Manila
                    </p>
                    <div className="mt-3 flex items-center gap-3">
                      <a
                        href="https://maps.google.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-bold text-[#16c4df] hover:underline"
                      >
                        Google Maps <ExternalLink className="h-3 w-3" />
                      </a>
                      <span className="text-white/30">·</span>
                      <a
                        href="https://waze.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-bold text-[#16c4df] hover:underline"
                      >
                        Waze <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/15 bg-white/10 p-4 backdrop-blur-md">
                    <div className="flex items-center gap-2 text-white font-bold text-sm">
                      <Clock className="h-4 w-4 text-[#16c4df] shrink-0" />
                      Viewing Hours
                    </div>
                    <p className="mt-2 leading-relaxed text-[#c6dfec]">
                      Monday to Saturday, 9:00 AM – 6:00 PM<br />
                      Walk-ins and scheduled appointments welcome.
                    </p>
                    <div className="mt-3 text-[11px] font-semibold text-[#16c4df]">
                      Free parking available on site
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-8 flex flex-wrap gap-4">
                  <Link
                    href="/shop/catalog"
                    className="inline-flex items-center gap-2 rounded-xl bg-[#16c4df] px-7 py-3.5 text-xs font-black text-[#071c2e] shadow-[0_8px_25px_rgba(22,196,223,0.35)] transition duration-300 hover:bg-[#68e0ee] hover:scale-105 active:scale-95"
                  >
                    Browse Available Stock <ArrowRight className="h-4 w-4" />
                  </Link>
                  <a
                    href="https://maps.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-6 py-3.5 text-xs font-bold text-white backdrop-blur transition hover:bg-white/20"
                  >
                    <Navigation className="h-3.5 w-3.5 text-[#16c4df]" /> Get Driving Directions
                  </a>
                </div>
              </div>

              {/* Right 5 Columns: 2x2 Metric Performance Matrix */}
              <div className="lg:col-span-5">
                <div className="rounded-2xl border border-white/20 bg-white/10 p-7 sm:p-8 backdrop-blur-xl shadow-2xl">
                  <div className="flex items-center justify-between border-b border-white/15 pb-4 mb-6">
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-widest text-[#a9e4f1]">
                        The Etjoaigi Guarantee
                      </div>
                      <div className="font-display text-lg font-black text-white">
                        Inspected Workspace Excellence
                      </div>
                    </div>
                    <ShieldCheck className="h-6 w-6 text-[#16c4df]" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-xl border border-white/10 bg-white/10 p-5 text-center transition hover:bg-white/15">
                      <div className="font-display text-3xl sm:text-4xl font-black text-[#16c4df]">100%</div>
                      <div className="mt-1 text-xs font-bold text-white">Pre-Inspected</div>
                      <div className="mt-1 text-[10.5px] text-[#c6dfec]">Full multi-point check logged before listing</div>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-white/10 p-5 text-center transition hover:bg-white/15">
                      <div className="font-display text-3xl sm:text-4xl font-black text-[#16c4df]">24-48h</div>
                      <div className="mt-1 text-xs font-bold text-white">Metro Delivery</div>
                      <div className="mt-1 text-[10.5px] text-[#c6dfec]">Handled with care by furniture couriers</div>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-white/10 p-5 text-center transition hover:bg-white/15">
                      <div className="font-display text-3xl sm:text-4xl font-black text-[#16c4df]">Up to 65%</div>
                      <div className="mt-1 text-xs font-bold text-white">Below Retail</div>
                      <div className="mt-1 text-[10.5px] text-[#c6dfec]">Authentic Herman Miller & Steelcase pieces</div>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-white/10 p-5 text-center transition hover:bg-white/15">
                      <div className="font-display text-3xl sm:text-4xl font-black text-[#16c4df]">0 Hidden</div>
                      <div className="mt-1 text-xs font-bold text-white">Flaws or Surprises</div>
                      <div className="mt-1 text-[10.5px] text-[#c6dfec]">Photographed down to minor cosmetic scuffs</div>
                    </div>
                  </div>

                  <div className="mt-6 rounded-xl border border-white/10 bg-black/20 p-3.5 text-center text-xs text-[#dbeaf2]">
                    Corporate bulk orders & liquidation inquiries: <span className="font-bold text-white">Inquire at Showroom</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>
      </main>

      <ShopFooter />

      <ScrollToTop />
    </div>
  );
}