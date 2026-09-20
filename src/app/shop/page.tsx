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
  ExternalLink,
  Camera
} from "lucide-react";
import Link from "next/link";
import { getShopCatalogData } from "@/lib/queries";
import { getStorefrontSettings } from "@/lib/storefront-settings";
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
    verifiedItem: "Herman Miller Aeron (Size B)",
    proofImage: "/images/proofs/proof-bgc-aeron.jpg",
    proofTitle: "Unit Delivered & Inspected in BGC Condo Office",
    proofBadge: "TX-2024-0891A · BGC Taguig"
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
    verifiedItem: "Steelcase Leap V2 (Black Fabric)",
    proofImage: "/images/proofs/proof-makati-leap.jpg",
    proofTitle: "Customer Inspection Proof at Architectural Studio",
    proofBadge: "TX-2024-0944K · Makati"
  },
  {
    initials: "MS",
    quote: "Fitted our entire 12-person startup office",
    text: "We ordered bulk task chairs and motorized desks. White-glove logistics courier handled everything with delivery sign-off on the spot.",
    author: "Mark S.",
    role: "Co-founder & CTO",
    company: "Alabang Tech Hub",
    location: "Madrigal Business Park",
    rating: 5,
    verifiedItem: "Haworth Zody & Motorized Desks",
    proofImage: "/images/proofs/proof-alabang-office.jpg",
    proofTitle: "12-Station Office Delivery & Dispatch Sign-Off",
    proofBadge: "TX-2024-1022B · Alabang"
  }
];

export default async function ShopHomePage() {
  const [{ items }, storefrontSettings] = await Promise.all([
    getShopCatalogData(),
    getStorefrontSettings(),
  ]);

  // Listed items only
  const forSale = items.filter((i) => i.status === "listed" && i.listedPrice != null);

  // Multiple spotlight pieces configured from dashboard
  const savedIds = storefrontSettings.spotlightItemIds || [];
  let spotlightItems: typeof forSale = [];

  if (savedIds.length > 0) {
    for (const id of savedIds) {
      const match = forSale.find((i) => i.id === id);
      if (match && match.photos?.[0]?.url) {
        spotlightItems.push(match);
      }
    }
  }

  // Backfill with other featured / listed items if needed
  if (spotlightItems.length < 3) {
    const featuredWithPhotos = forSale.filter(
      (i) => i.isFeatured && i.photos?.[0]?.url && !spotlightItems.some((s) => s.id === i.id)
    );
    const otherWithPhotos = forSale.filter(
      (i) => !i.isFeatured && i.photos?.[0]?.url && !spotlightItems.some((s) => s.id === i.id)
    );
    spotlightItems = [...spotlightItems, ...featuredWithPhotos, ...otherWithPhotos].slice(0, 8);
  }

  const spotlightItem = spotlightItems[0] || null;

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#FCFDF8] text-[#17364b] antialiased selection:bg-[#1D5D8B] selection:text-white">
      <ShopHeader />

      <main className="w-full overflow-x-hidden">
        {/* ================================================================= */}
        {/* 1. HERO SECTION WITH SPOTLIGHT PRODUCT CARD & MARQUEE             */}
        {/* ================================================================= */}
        <div className="relative w-full flex flex-col min-h-[calc(100dvh-64px)] overflow-x-clip">
          <section className="relative w-full flex-1 flex flex-col justify-center overflow-x-clip bg-gradient-to-br from-[#071c2e] via-[#103a57] to-[#1D5D8B] text-[#FCFDF8] py-8 sm:py-12 lg:py-10">
            {/* Ambient Lighting & Geometric Texture */}
            <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-[#16c4df]/20 blur-3xl pointer-events-none" />
            <div className="absolute top-1/3 -right-32 h-[600px] w-[600px] rounded-full bg-[#16c4df]/15 blur-3xl pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:28px_28px] opacity-70 pointer-events-none" />

            <div className="relative mx-auto w-full max-w-[1760px] 2xl:max-w-[1840px] px-6 sm:px-10 lg:px-14 xl:px-16 2xl:px-20 my-auto">
              <div className="grid items-center gap-8 lg:gap-10 xl:gap-14 lg:grid-cols-12">

                {/* Left Column: Headline, Brand Pills, CTAs, and Trust Matrix */}
                <div className="lg:col-span-6 xl:col-span-6 2xl:col-span-5 flex flex-col justify-center">

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
                    Acquire authentic Herman Miller, Steelcase, Vitra, Haworth, and Knoll workspace furniture at up to 60% off retail. Every piece is cleaned, mechanically tested, and verified in good condition.
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
                      href="#reviews"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#bbf3fb] hover:text-white transition underline-offset-4 hover:underline sm:ml-1"
                    >
                      <Star className="h-3.5 w-3.5 text-[#16c4df]" /> Customer Reviews & Proofs
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
                        <div className="font-bold text-white text-xs sm:text-sm">Inspected Quality</div>
                      </div>
                      <div className="text-[11px] text-[#a9c8da] mt-0.5">
                        Verified good condition
                      </div>
                    </div>

                    <div className="rounded-xl border border-white/15 bg-white/10 p-2.5 sm:p-3 backdrop-blur-md transition hover:bg-white/15">
                      <div className="flex items-center gap-2">
                        <Truck className="h-3.5 w-3.5 text-[#16c4df] shrink-0" />
                        <div className="font-bold text-white text-xs sm:text-sm">Ready to Ship</div>
                      </div>
                      <div className="text-[11px] text-[#a9c8da] mt-0.5">
                        Metro courier or quick pickup
                      </div>
                    </div>
                  </div>

                </div>

                {/* Right Column: Hero Spotlight Product Showcase */}
                <div className="lg:col-span-6 xl:col-span-6 2xl:col-span-7 flex items-center justify-center w-full overflow-visible py-2 sm:py-4">
                  <div className="w-full max-w-lg xl:max-w-xl 2xl:max-w-2xl">
                    {spotlightItems.length > 0 ? (
                      <HeroSpotlightCard items={spotlightItems} />
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
        {/* 4. VERIFIED CUSTOMER REVIEWS & TRANSACTION PHOTO PROOFS          */}
        {/* ================================================================= */}
        <section id="reviews" className="w-full border-b border-stone-200/80 bg-gradient-to-b from-stone-50/70 via-white to-stone-50/40 py-16 sm:py-24">
          <div className="mx-auto max-w-[1760px] 2xl:max-w-[1840px] px-6 sm:px-10 lg:px-14 xl:px-16 2xl:px-20">

            <div className="text-center max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#1D5D8B]/10 px-4 py-1.5 text-xs font-black uppercase tracking-wider text-[#1D5D8B]">
                <Star className="h-4 w-4 text-amber-500 fill-amber-500" /> Real Experiences & Verified Proofs
              </div>
              <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-stone-900 sm:text-4xl lg:text-5xl">
                Delivered Across Metro Manila
              </h2>
              <p className="mt-3 text-base text-stone-600">
                Real transaction snapshots and experiences from remote software engineers, architects, and corporate startups in BGC, Makati, and Alabang.
              </p>
            </div>

            <div className="mt-14 grid grid-cols-1 gap-8 md:grid-cols-3 lg:gap-10">
              {TESTIMONIALS.map((t, idx) => (
                <div
                  key={idx}
                  className="group relative flex flex-col justify-between rounded-3xl border border-stone-200/90 bg-white p-6 sm:p-7 shadow-sm transition duration-300 hover:shadow-2xl hover:border-[#16c4df]/70"
                >
                  <div>
                    {/* Stars and location */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-amber-500">
                        {Array.from({ length: t.rating }).map((_, r) => (
                          <Star key={r} className="h-4 w-4 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                      <span className="text-[11.5px] font-bold text-stone-400">
                        {t.location}
                      </span>
                    </div>

                    {/* Transaction Proof Photo */}
                    <div className="relative mt-4 mb-4 overflow-hidden rounded-2xl border border-stone-200 bg-stone-100 shadow-inner group/img">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={t.proofImage}
                        alt={t.proofTitle}
                        className="h-52 w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                      <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1 rounded-full bg-emerald-500/90 text-white px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider backdrop-blur-md shadow-sm">
                        <CheckCircle2 className="h-3 w-3" /> Transaction Proof
                      </div>
                      <div className="absolute bottom-2.5 left-2.5 right-2.5 z-10 text-white">
                        <div className="flex items-center gap-1.5 text-[10.5px] font-bold text-[#8edce8]">
                          <Camera className="h-3 w-3 text-[#16c4df]" />
                          <span>{t.proofBadge}</span>
                        </div>
                        <div className="mt-0.5 text-xs font-semibold text-white/95 truncate">
                          {t.proofTitle}
                        </div>
                      </div>
                    </div>

                    {/* Headline quote */}
                    <h3 className="font-display text-lg font-bold text-stone-900 group-hover:text-[#1D5D8B] transition">
                      &ldquo;{t.quote}&rdquo;
                    </h3>

                    {/* Review text */}
                    <p className="mt-2.5 text-xs leading-relaxed text-stone-600">
                      &ldquo;{t.text}&rdquo;
                    </p>
                  </div>

                  {/* Customer author footer */}
                  <div className="mt-6 border-t border-stone-100 pt-5">
                    <div className="flex items-center justify-between">
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

                      <div className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200/60 px-2.5 py-1 text-[10.5px] font-bold text-emerald-700">
                        <CheckCircle2 className="h-3 w-3" /> Verified Buyer
                      </div>
                    </div>

                    {/* Verified item purchased tag */}
                    <div className="mt-3.5 flex items-center justify-between rounded-xl bg-stone-50 px-3 py-2 text-[11px] text-stone-600 border border-stone-100">
                      <span className="text-stone-400 font-medium">Delivered Unit:</span>
                      <strong className="text-stone-800 font-bold">{t.verifiedItem}</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Callout */}
            <div className="mt-14 rounded-3xl border border-stone-200/80 bg-white p-8 sm:p-10 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-700 mb-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  100% Genuine Surplus & Authenticity Verified
                </div>
                <h3 className="font-display text-2xl font-bold text-stone-900">
                  Ready to upgrade your personal or team workspace?
                </h3>
                <p className="mt-1.5 text-sm text-stone-500 leading-relaxed">
                  Browse our live verified inventory of Herman Miller, Steelcase, Haworth and motorized desks with immediate courier dispatch across Metro Manila.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <Link
                  href="/shop/catalog"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#1D5D8B] px-6 py-3.5 text-xs font-bold text-white shadow-md transition hover:bg-[#16486B] hover:shadow-lg"
                >
                  Browse Available Catalog <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/shop/offers"
                  className="inline-flex items-center gap-2 rounded-xl border border-stone-300 bg-white px-5 py-3.5 text-xs font-bold text-stone-700 transition hover:bg-stone-50"
                >
                  View Today&apos;s Drops
                </Link>
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