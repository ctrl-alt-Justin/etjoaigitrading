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

/** Category/brand driven value range — items are always acquired in good condition. */
export function valuate(opts: {
  baseValue: number | null | undefined;
  brand?: string | null;
  grade?: Grade | null | undefined;
}): Valuation {
  const tier = brandTier(opts.brand);
  // Default to standard resale band [0.45, 0.60] since company acquires items in good condition
  const band: [number, number] = opts.grade ? GRADE_META[opts.grade].band : [0.45, 0.60];
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

/* ------------------------------------------------------------------ */
/* Company Profit & Retail Gap Pricing Formula Engine (No Grading)   */
/* ------------------------------------------------------------------ */

export interface PricingFormulaConfig {
  targetProfitMultiplier: number; // default: 1.40 (40% profit markup)
  retailGapPct: number; // default: 0.35 (35% below retail benchmark)
  gradeFactors?: {
    A: number;
    B: number;
    C: number;
    D: number;
  };
}

export const DEFAULT_PRICING_CONFIG: PricingFormulaConfig = {
  targetProfitMultiplier: 1.40,
  retailGapPct: 0.35,
  gradeFactors: {
    A: 1.00,
    B: 0.85,
    C: 0.70,
    D: 0.50,
  },
};

export const PRICING_CONFIG_STORAGE_KEY = "etjoaigi_pricing_desk_config";

export interface PricingFormulaGradeRow {
  grade: Grade;
  gradeFactor: number;
  maxAllowedCap: number; // Retail Cap
  targetPrice: number; // Total Cost * targetProfitMultiplier
  finalListingPrice: number; // Enforced Formula Listing Price
  isTargetMet: boolean; // finalListingPrice >= targetPrice
  profit: number; // finalListingPrice - totalCost
  marginPct: number; // (finalListingPrice - totalCost) / totalCost
}

export interface PricingFormulaResult {
  totalCost: number; // acquisition + refurb + cleaning
  targetProfitMultiplier: number;
  targetPrice: number; // totalCost * targetProfitMultiplier
  brandNewPrice: number;
  retailGapPct: number;
  maxA: number; // retail gap cap
  maxAllowedCap: number; // retail cap
  suggestedListingPrice: number;
  profit: number;
  marginPct: number;
  isTargetMet: boolean;
  grades: PricingFormulaGradeRow[];
  recommendedGradeRow: PricingFormulaGradeRow | null;
}

/**
 * Enforces company pricing formula (all items assumed in good condition):
 * 1. Total Cost = Acquisition + Refurb + Cleaning
 * 2. Target Price = Total Cost × Target Profit Multiplier (default 1.40)
 * 3. Max Allowed Cap = Brand New Price × (1 - Retail Gap) (default 35% gap)
 * 4. Recommended Listing Price = Max Allowed Cap (evaluated against Cost + Profit Target)
 */
export function calculatePricingFormula(
  input: {
    acquisitionCost: number;
    refurbCost: number;
    cleaningCost: number;
    brandNewPrice: number;
    selectedGrade?: Grade | null;
  },
  config: PricingFormulaConfig = DEFAULT_PRICING_CONFIG
): PricingFormulaResult {
  const totalCost = (input.acquisitionCost || 0) + (input.refurbCost || 0) + (input.cleaningCost || 0);
  const targetProfitMultiplier =
    config.targetProfitMultiplier > 0 ? config.targetProfitMultiplier : DEFAULT_PRICING_CONFIG.targetProfitMultiplier;
  const targetPrice = round50(totalCost * targetProfitMultiplier);
  const brandNewPrice = input.brandNewPrice || 0;
  const retailGapPct =
    config.retailGapPct >= 0 && config.retailGapPct < 1 ? config.retailGapPct : DEFAULT_PRICING_CONFIG.retailGapPct;
  const maxAllowedCap = round50(brandNewPrice * (1 - retailGapPct));
  const maxA = maxAllowedCap;

  // Since items are acquired in good condition, listing price targets retail cap while ensuring cost profit
  const suggestedListingPrice = maxAllowedCap > 0 ? maxAllowedCap : targetPrice;
  const isTargetMet = totalCost > 0 ? suggestedListingPrice >= targetPrice : true;
  const profit = totalCost > 0 ? suggestedListingPrice - totalCost : 0;
  const marginPct = totalCost > 0 ? profit / totalCost : 0;

  const standardRow: PricingFormulaGradeRow = {
    grade: "A",
    gradeFactor: 1.0,
    maxAllowedCap,
    targetPrice,
    finalListingPrice: suggestedListingPrice,
    isTargetMet,
    profit,
    marginPct,
  };

  const grades: Grade[] = ["A", "B", "C", "D"];
  const rows: PricingFormulaGradeRow[] = grades.map((g) => ({
    grade: g,
    gradeFactor: 1.0,
    maxAllowedCap,
    targetPrice,
    finalListingPrice: suggestedListingPrice,
    isTargetMet,
    profit,
    marginPct,
  }));

  return {
    totalCost,
    targetProfitMultiplier,
    targetPrice,
    brandNewPrice,
    retailGapPct,
    maxA,
    maxAllowedCap,
    suggestedListingPrice,
    profit,
    marginPct,
    isTargetMet,
    grades: rows,
    recommendedGradeRow: standardRow,
  };
}

