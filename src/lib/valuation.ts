/**
 * Central valuation engine.
 * Auto-calculates value ranges from category base value × brand tier × grade band,
 * plus cost-based price floors and price-aging markdown guidance.
 * All amounts in Philippine pesos (₱); prices round to the nearest ₱50.
 */

export type Grade = "A" | "B" | "C" | "D";

export const GRADE_ORDER: Grade[] = ["A", "B", "C", "D"];

export const GRADE_META: Record<
  Grade,
  {
    label: string;
    tagline: string;
    description: string;
    /** fraction of the reference "new" value this grade typically resells for */
    band: [number, number];
    /** tailwind chip classes */
    chip: string;
    dot: string;
  }
> = {
  A: {
    label: "Grade A",
    tagline: "Like New",
    description:
      "Under 1 year of light use. No visible wear, fully functional, all parts original.",
    band: [0.5, 0.62],
    chip: "bg-[#fefce8] text-[#854d0e] border-[#f0d900]",
    dot: "bg-[#f0d900]",
  },
  B: {
    label: "Grade B",
    tagline: "Good",
    description:
      "Light cosmetic wear such as faint scuffs. Fully functional with no structural issues.",
    band: [0.35, 0.46],
    chip: "bg-[#f0fdf4] text-[#15803d] border-[#16a34a]/40",
    dot: "bg-[#16a34a]",
  },
  C: {
    label: "Grade C",
    tagline: "Fair",
    description:
      "Visible wear, stains or scratches. Minor functional quirks. Refurbishment candidate.",
    band: [0.2, 0.3],
    chip: "bg-[#eff6ff] text-[#1d4ed8] border-[#2563eb]/40",
    dot: "bg-[#2563eb]",
  },
  D: {
    label: "Grade D",
    tagline: "Poor",
    description:
      "Heavy wear or functional faults. Sold for parts, repair or deep-discount clearance.",
    band: [0.08, 0.15],
    chip: "bg-[#fff1f2] text-[#be123c] border-[#e11d48]/40",
    dot: "bg-[#e11d48]",
  },
};

export const BRAND_TIERS: { name: string; multiplier: number; brands: string[] }[] = [
  {
    name: "Premium",
    multiplier: 1.35,
    brands: ["herman miller", "steelcase", "knoll", "haworth", "humanscale", "vitra"],
  },
  {
    name: "Mid-market",
    multiplier: 1.0,
    brands: ["hon", "teknion", "nucraft", "fully", "national", "uplift desk"],
  },
  { name: "Value", multiplier: 0.62, brands: ["ikea", "generic", "unbranded"] },
];

const INDEPENDENT_TIER = { name: "Independent", multiplier: 0.85 };

export function brandTier(brand?: string | null) {
  const b = (brand ?? "").trim().toLowerCase();
  for (const tier of BRAND_TIERS) {
    if (tier.brands.some((x) => b.includes(x))) {
      return { name: tier.name, multiplier: tier.multiplier };
    }
  }
  return INDEPENDENT_TIER;
}

/** Peso pricing rounds to the nearest ₱50. */
export const round50 = (n: number) => Math.round(n / 50) * 50;

export interface Valuation {
  low: number | null;
  high: number | null;
  benchmark: number | null;
  suggested: number | null;
  tierName: string;
  tierMultiplier: number;
  band: [number, number] | null;
}

/** Grade/category/brand driven value range — independent of purchase cost. */
export function valuate(opts: {
  baseValue: number | null | undefined;
  brand?: string | null;
  grade: Grade | null | undefined;
}): Valuation {
  const tier = brandTier(opts.brand);
  const band = opts.grade ? GRADE_META[opts.grade].band : null;
  const effective =
    opts.baseValue && opts.baseValue > 0 ? opts.baseValue * tier.multiplier : null;

  const low = effective && band ? round50(effective * band[0]) : null;
  const high = effective && band ? round50(effective * band[1]) : null;
  const benchmark =
    effective && band ? round50(effective * ((band[0] + band[1]) / 2) * 1.05) : null;
  const suggested = low != null && high != null ? round50((low + high) / 2) : null;

  return {
    low,
    high,
    benchmark,
    suggested,
    tierName: tier.name,
    tierMultiplier: tier.multiplier,
    band,
  };
}

/** Minimum sellable price: effective cost + required 18% margin buffer. */
export function computeFloor(acquisitionCost: number | null | undefined, refurbCost?: number | null) {
  const eff = (acquisitionCost ?? 0) + (refurbCost ?? 0);
  if (eff <= 0) return 0;
  return round50(eff * 1.18);
}

export interface AgingGuidance {
  tier: "ok" | "watch" | "action" | "critical";
  pct: number;
  suggested: number | null;
  label: string;
}

/** Price-aging markdown policy: 30 / 60 / 90 day tiers, never below floor. */
export function agingMarkdown(
  daysListed: number,
  listedPrice: number,
  floorPrice: number | null | undefined
): AgingGuidance {
  const floor = floorPrice ?? 0;
  const clamp = (pct: number) => Math.max(floor, round50(listedPrice * (1 - pct)));
  if (daysListed >= 90)
    return { tier: "critical", pct: 0.2, suggested: listedPrice ? clamp(0.2) : null, label: "90+ days" };
  if (daysListed >= 60)
    return { tier: "action", pct: 0.12, suggested: listedPrice ? clamp(0.12) : null, label: "60–89 days" };
  if (daysListed >= 30)
    return { tier: "watch", pct: 0.06, suggested: listedPrice ? clamp(0.06) : null, label: "30–59 days" };
  return { tier: "ok", pct: 0, suggested: null, label: "Under 30 days" };
}

export const SUPPLIER_CHANNELS = [
  "Liquidation",
  "Downsizing",
  "Auction",
  "Lease return",
  "Direct",
  "Institutional",
] as const;
