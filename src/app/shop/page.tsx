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
import { ShopFooter } from "@/components/shop-footer";
import { ScrollToTop } from "@/components/scroll-to-top";
import { HeroSpotlightCard } from "@/components/shop-home-cards";

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
    accent: "text-amber-700 border-amber-200 bg-amber-50" 
  },
  { 
    label: "Lounge & Reception", 
    slug: "reception", 
    icon: LampDesk, 
    desc: "Reception sofas, breakout stools & acoustic pods",
    gradient: "from-purple-500/10 via-purple-500/5 to-transparent",
    accent: "text-purple-700 border-purple-200 bg-purple-50" 
  },
];

const TESTIMONIALS = [
  {
    quote: "Exceptional Herman Miller Aeron find",
    text: "Saved over ₱45,000 compared to brand new retail. The Forward Tilt lock and PostureFit work flawlessly, zero mesh sagging. Arrived within 24 hours in BGC.",
    author: "Rafael M.",
    role: "Senior Product Designer",
    company: "Fintech Studio BGC",
    rating: 5,
    verifiedItem: "Herman Miller Aeron (Size B)"
  },
  {
    quote: "Transparent grading — exactly as photographed",
    text: "Ordered a Steelcase Leap V2 Grade B. The minor scratches mentioned in the listing were honestly shown. The cylinder lift and 4D armrests feel factory-solid.",
    author: "Danielle C.",
    role: "Architect & Partner",
    company: "Makati Design Workshop",
    rating: 5,
    verifiedItem: "Steelcase Leap V2"
  },
  {
    quote: "Fitted our entire 12-person startup office",
    text: "We went to their Muntinlupa showroom on Saturday, test-sat 8 different chairs, and arranged bulk delivery for Monday morning. Smooth, honest, highly recommended.",
    author: "Mark S.",
    role: "Co-founder & CTO",
    company: "Alabang Tech Hub",
    rating: 5,
    verifiedItem: "Haworth Zody & Motorized Desks"
  }
];

export default async function ShopHomePage() {
  const { items, categories } = await getShopCatalogData();

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
              <h1 className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl lg:text-[68px]">
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
                    <div className="mt-4 font-bold text-white">No active items for sale</div>
                    <p className="mt-1 text-xs text-white/70">Check back soon for new inventory drops.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* 2. VALUE PROPOSITION RIBBON                                      */}
        {/* ================================================================= */}
        <section className="border-y border-stone-200/80 bg-white py-8 px-6 sm:px-12 lg:px-14">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#16c4df]/15 text-[#16486B]">
                <ShieldCheck className="h-5 w-5 text-[#1D5D8B]" />
              </div>
              <div>
                <div className="font-display text-sm font-extrabold text-stone-900">
                  Strict Multi-Point Inspection
                </div>
                <div className="mt-1 text-xs leading-relaxed text-stone-500">
                  Every chair cylinder, tilt lock, foam tension, and castor is mechanically verified.
                </div>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <Truck className="h-5 w-5" />
              </div>
              <div>
                <div className="font-display text-sm font-extrabold text-stone-900">
                  Metro Manila Delivery
                </div>
                <div className="mt-1 text-xs leading-relaxed text-stone-500">
                  Carefully handled door-to-door courier dispatch, fully assembled and ready to use.
                </div>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
                <RotateCcw className="h-5 w-5" />
              </div>
              <div>
                <div className="font-display text-sm font-extrabold text-stone-900">
                  48-Hour Functional Guarantee
                </div>
                <div className="mt-1 text-xs leading-relaxed text-stone-500">
                  Test the ergonomic adjustments in your home office with full peace of mind.
                </div>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <div className="font-display text-sm font-extrabold text-stone-900">
                  Muntinlupa Showroom
                </div>
                <div className="mt-1 text-xs leading-relaxed text-stone-500">
                  Try out chairs in person before deciding. Appointments and walk-ins welcome.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* 3. BROWSE BY CATEGORY                                             */}
        {/* ================================================================= */}
        <section className="px-6 py-14 sm:px-12 lg:px-14 border-b border-stone-200/80">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#1D5D8B]">
                Curated Workspaces
              </div>
              <h2 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-stone-900 sm:text-4xl">
                Explore by Category
              </h2>
            </div>
            <Link 
              href="/shop/catalog" 
              className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-[#1D5D8B] hover:text-[#16c4df]"
            >
              View Full Catalog ({forSale.length}) <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {CATEGORY_TILES.map((cat) => {
              const Icon = cat.icon;
              return (
                <Link
                  key={cat.slug}
                  href={`/shop/catalog?category=${cat.slug}`}
                  className="group relative flex flex-col justify-between border border-stone-200/90 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-[#16c4df] hover:shadow-lg"
                >
                  <div>
                    <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl border ${cat.accent} transition group-hover:scale-110`}>
                      <Icon className="h-6 w-6" strokeWidth={1.75} />
                    </div>
                    <div className="mt-4 font-display text-lg font-bold text-stone-900 group-hover:text-[#1D5D8B]">
                      {cat.label}
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-stone-500">
                      {cat.desc}
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
        {/* 4. THE ETJOAIGI STANDARD: INSPECTION & GRADING EXPLAINER          */}
        {/* ================================================================= */}
        <section id="grading" className="px-6 py-16 sm:px-12 lg:px-14 border-b border-stone-200/80 bg-gradient-to-b from-stone-50 to-white">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#1D5D8B]/10 px-3 py-1 text-[10.5px] font-black uppercase tracking-wider text-[#1D5D8B]">
              <ShieldCheck className="h-3.5 w-3.5" /> Transparent Inspection
            </div>
            <h2 className="mt-4 font-display text-3xl font-black text-stone-900 sm:text-4xl">
              The Etjoaigi Grading Standard
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-stone-600">
              We eliminate the uncertainty of buying pre-owned office furniture.
            </p>
          </div>

          {/* 3 Tier Grading Cards */}
          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Grade A */}
            <div className="border-2 border-[#f0d900] bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="bg-[#f0d900] px-3 py-1 text-xs font-black text-[#17364b]">
                  Grade A · Like New
                </span>
                <CheckCircle2 className="h-5 w-5 text-amber-500" />
              </div>
              <h3 className="mt-4 font-display text-xl font-bold text-stone-900">
                Immaculate Executive State
              </h3>
              <ul className="mt-4 space-y-2 border-t border-stone-100 pt-4 text-xs text-stone-600">
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-amber-500 shrink-0" /> Zero stains, tears or deep scratches
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-amber-500 shrink-0" /> 100% pneumatic lift & tilt lock tested
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-amber-500 shrink-0" /> PostureFit / LiveBack fully responsive
                </li>
              </ul>
            </div>

            {/* Grade B */}
            <div className="border-2 border-[#16a34a] bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="bg-[#16a34a] px-3 py-1 text-xs font-black text-white">
                  Grade B · Good Condition
                </span>
                <CheckCircle2 className="h-5 w-5 text-[#16a34a]" />
              </div>
              <h3 className="mt-4 font-display text-xl font-bold text-stone-900">
                Everyday Professional Use
              </h3>
              <ul className="mt-4 space-y-2 border-t border-stone-100 pt-4 text-xs text-stone-600">
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-[#16a34a] shrink-0" /> Faint cosmetic scuffs photographed in detail
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-[#16a34a] shrink-0" /> All adjustment levers and armpads functional
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-[#16a34a] shrink-0" /> Deep foam shampoo & steam sanitation done
                </li>
              </ul>
            </div>

            {/* Grade C */}
            <div className="border-2 border-[#2563eb] bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="bg-[#2563eb] px-3 py-1 text-xs font-black text-white">
                  Grade C · Fair / Deep Value
                </span>
                <CheckCircle2 className="h-5 w-5 text-[#2563eb]" />
              </div>
              <h3 className="mt-4 font-display text-xl font-bold text-stone-900">
                Refurbished & Maximum Savings
              </h3>
              <ul className="mt-4 space-y-2 border-t border-stone-100 pt-4 text-xs text-stone-600">
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-[#2563eb] shrink-0" /> Visible cosmetic marks clearly noted
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-[#2563eb] shrink-0" /> Serviced cylinders & lubricated tilt gears
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-[#2563eb] shrink-0" /> Steepest price markdown (up to 70% off)
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* 5. VERIFIED CUSTOMER REVIEWS                                      */}
        {/* ================================================================= */}
        <section id="reviews" className="px-6 py-16 sm:px-12 lg:px-14 border-b border-stone-200/80 bg-white">
          <div className="mb-10 text-center">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#1D5D8B]/10 px-3.5 py-1 text-[10.5px] font-black uppercase tracking-wider text-[#1D5D8B]">
              <Star className="h-3.5 w-3.5 text-[#16c4df]" /> Real Experiences
            </div>
            <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-stone-900 sm:text-4xl">
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
                  <div className="mt-3 font-display text-sm font-bold text-stone-900">
                    &ldquo;{t.quote}&rdquo;
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-stone-600">
                    &ldquo;{t.text}&rdquo;
                  </p>
                </div>

                <div className="mt-6 border-t border-stone-100 pt-4">
                  <div className="font-display font-bold text-stone-900 text-sm">
                    {t.author}
                  </div>
                  <div className="text-xs text-stone-500">
                    {t.role} · {t.company}
                  </div>
                  <div className="mt-2 inline-flex items-center gap-1.5 rounded bg-emerald-50 px-2 py-0.5 text-[10.5px] font-semibold text-emerald-700">
                    <CheckCircle2 className="h-3 w-3" /> Verified: {t.verifiedItem}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ================================================================= */}
        {/* 6. SHOWROOM VISIT & FREE VIEWING INVITATION                      */}
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

      <ShopFooter />

      <ScrollToTop />
    </div>
  );
}