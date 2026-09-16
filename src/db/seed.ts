import { supabase } from "@/lib/supabase";
import { snakeizeRow, snakeizeRows } from "@/db/records";
import {
  type ChecklistEntry,
  type Grade,
  type ItemPhoto,
  type ItemStatus,
} from "@/db/schema";
import { brandTier, computeFloor, round50, valuate } from "@/lib/valuation";
import { checklistFor, refPhotoFor, REAL_SETUP_PHOTO, SOLD_CHANNELS, WAREHOUSE_LOCATIONS } from "@/lib/taxonomy-data";

/* Deterministic pseudo-random for stable seed data */
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20260214);
const pick = <T,>(arr: readonly T[]) => arr[Math.floor(rand() * arr.length)];
const chance = (p: number) => rand() < p;
const between = (a: number, b: number) => a + rand() * (b - a);
const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(9 + Math.floor(rand() * 9), Math.floor(rand() * 59), 0, 0);
  return d;
};

/* ------------------------------- taxonomy ------------------------------- */

const ROOTS = [
  { key: "seating", name: "Seating" },
  { key: "desks", name: "Desks & Workstations" },
  { key: "tables", name: "Tables" },
  { key: "storage", name: "Storage" },
  { key: "partitions", name: "Partitions & Screens" },
  { key: "reception", name: "Reception & Lounge" },
] as const;

type AttrDef = { name: string; type?: "select" | "text" | "number"; options?: string[]; required?: boolean };

/** baseValue = reference NEW retail anchor in Philippine pesos (mid-market tier). */
const LEAVES: { root: string; slug: string; name: string; baseValue: number; sort: number; attrs: AttrDef[] }[] = [
  { root: "seating", slug: "task-chairs", name: "Task Chairs", baseValue: 52500, sort: 1, attrs: [
    { name: "Size", options: ["A", "B", "C", "One-size"] },
    { name: "Arms", options: ["Fixed", "Height-adjustable", "Fully adjustable", "Armless"], required: true },
    { name: "Mechanism", options: ["Synchro-tilt", "PostureFit SL", "Weight-sensitive", "Basic tilt"] },
    { name: "Lumbar", options: ["Integrated", "Adjustable add-on", "None"] },
  ]},
  { root: "seating", slug: "executive-chairs", name: "Executive Chairs", baseValue: 77000, sort: 2, attrs: [
    { name: "Upholstery", options: ["Leather", "Mesh", "Fabric"], required: true },
    { name: "Arms", options: ["Fixed", "Adjustable"] },
    { name: "Tilt lock", options: ["Yes", "No"] },
  ]},
  { root: "seating", slug: "conference-chairs", name: "Conference Chairs", baseValue: 23000, sort: 3, attrs: [
    { name: "Frame", options: ["4-leg", "Cantilever", "Sled", "Swivel"], required: true },
    { name: "Stackable", options: ["Yes", "No"] },
    { name: "Upholstery", options: ["Fabric", "Mesh", "Plastic shell"] },
  ]},
  { root: "seating", slug: "lounge-chairs", name: "Lounge Chairs", baseValue: 60500, sort: 4, attrs: [
    { name: "Upholstery", options: ["Leather", "Fabric", "Wool blend"], required: true },
    { name: "Ottoman", options: ["Included", "Not included"] },
  ]},
  { root: "desks", slug: "standing-desks", name: "Standing Desks", baseValue: 49500, sort: 1, attrs: [
    { name: "Width", options: ["140 cm", "160 cm", "180 cm"] },
    { name: "Motor", options: ["Single", "Dual"], required: true },
    { name: "Controller", options: ["Basic up/down", "Programmable memory"] },
  ]},
  { root: "desks", slug: "executive-desks", name: "Executive Desks", baseValue: 88000, sort: 2, attrs: [
    { name: "Configuration", options: ["Straight", "L-shaped", "U-shaped"], required: true },
    { name: "Return side", options: ["Left", "Right", "None"] },
    { name: "Pedestal", options: ["Included", "Not included"] },
  ]},
  { root: "desks", slug: "bench-desks", name: "Bench Desk Pods", baseValue: 132000, sort: 3, attrs: [
    { name: "Seats", options: ["2", "4", "6", "8"], required: true },
    { name: "Privacy screens", options: ["Included", "Not included"] },
    { name: "Cable spine", options: ["Yes", "No"] },
  ]},
  { root: "tables", slug: "conference-tables", name: "Conference Tables", baseValue: 99000, sort: 1, attrs: [
    { name: "Seats", options: ["6", "8", "10", "12"], required: true },
    { name: "Shape", options: ["Boat", "Racetrack", "Rectangular", "Round"] },
    { name: "Power modules", options: ["Yes", "No"] },
  ]},
  { root: "tables", slug: "training-tables", name: "Training Tables", baseValue: 26500, sort: 2, attrs: [
    { name: "Flip-top", options: ["Yes", "No"], required: true },
    { name: "Width", options: ["120 cm", "140 cm", "160 cm"] },
    { name: "Modesty panel", options: ["Yes", "No"] },
  ]},
  { root: "tables", slug: "side-tables", name: "Side Tables", baseValue: 14500, sort: 3, attrs: [
    { name: "Shape", options: ["Round", "Square", "Soft-square"] },
    { name: "Diameter", options: ["40 cm", "50 cm", "60 cm"] },
  ]},
  { root: "storage", slug: "filing-cabinets", name: "Filing Cabinets", baseValue: 23000, sort: 1, attrs: [
    { name: "Drawers", options: ["2", "3", "4", "5"], required: true },
    { name: "Orientation", options: ["Vertical", "Lateral"], required: true },
    { name: "Lock", options: ["With key", "No lock", "Lock, key missing"] },
  ]},
  { root: "storage", slug: "bookcases", name: "Bookcases", baseValue: 21000, sort: 2, attrs: [
    { name: "Shelves", options: ["3", "4", "5"], required: true },
    { name: "Adjustable shelves", options: ["Yes", "No"] },
  ]},
  { root: "storage", slug: "credenzas", name: "Credenzas", baseValue: 49500, sort: 3, attrs: [
    { name: "Doors", options: ["Sliding", "Hinged", "Open"], required: true },
    { name: "Length", options: ["150 cm", "180 cm", "200 cm"] },
  ]},
  { root: "storage", slug: "lockers", name: "Lockers", baseValue: 66000, sort: 4, attrs: [
    { name: "Compartments", options: ["2", "4", "6"], required: true },
    { name: "Lock type", options: ["Key", "Hasp", "Digital"] },
  ]},
  { root: "partitions", slug: "cubicle-panels", name: "Cubicle Panel Runs", baseValue: 88000, sort: 1, attrs: [
    { name: "Panels in run", options: ["3", "4", "6", "8"], required: true },
    { name: "Connectors", options: ["Included", "Missing"] },
  ]},
  { root: "partitions", slug: "acoustic-panels", name: "Acoustic Screens", baseValue: 28500, sort: 2, attrs: [
    { name: "Mount", options: ["Freestanding", "Desk-mounted", "Wall"], required: true },
    { name: "Height", options: ["120 cm", "140 cm", "160 cm"] },
  ]},
  { root: "reception", slug: "reception-desks", name: "Reception Desks", baseValue: 121000, sort: 1, attrs: [
    { name: "Configuration", options: ["Straight", "Curved", "L-shaped"], required: true },
    { name: "Counter", options: ["Raised transaction", "Flush"] },
  ]},
  { root: "reception", slug: "sofas", name: "Sofas & Soft Seating", baseValue: 104500, sort: 2, attrs: [
    { name: "Seats", options: ["2", "3", "4"], required: true },
    { name: "Upholstery", options: ["Fabric", "Wool", "Leather"] },
    { name: "Legs", options: ["Oak", "Black metal", "Chrome"] },
  ]},
];

/* ------------------------------ inventory ------------------------------- */

type Template = {
  b: string; m: string; cat: string; n: number;
  colors?: string[]; mat?: string; dims?: string;
};

const CATALOG: Template[] = [
  { b: "Herman Miller", m: "Aeron Remastered", cat: "task-chairs", n: 7, colors: ["Graphite", "Carbon", "Mineral"], mat: "Pellicle mesh · alloy base", dims: "W 68 × D 67 × H 98–104 cm" },
  { b: "Herman Miller", m: "Embody", cat: "task-chairs", n: 2, colors: ["Charcoal", "Berry Blue"], mat: "Pixelated matrix back", dims: "W 72 × D 70 × H 101 cm" },
  { b: "Steelcase", m: "Leap V2", cat: "task-chairs", n: 5, colors: ["Black", "Blue Jay", "Burgundy"], mat: "Fabric · LiveBack frame", dims: "W 69 × D 62 × H 99 cm" },
  { b: "Steelcase", m: "Gesture", cat: "task-chairs", n: 3, colors: ["Cogent Graphite", "Licorice"], mat: "360 Arms · shell back", dims: "W 68 × D 60 × H 100 cm" },
  { b: "Haworth", m: "Zody", cat: "task-chairs", n: 3, colors: ["Black", "Fog"], mat: "Mesh back · lumbar PAL", dims: "W 67 × D 66 × H 98 cm" },
  { b: "Humanscale", m: "Diffrient World", cat: "task-chairs", n: 2, colors: ["Pinstripe Black", "White"], mat: "Form-sensing mesh", dims: "W 66 × D 63 × H 100 cm" },
  { b: "HON", m: "Ignition 2.0", cat: "task-chairs", n: 3, colors: ["Black", "Iron Ore"], mat: "ilira-stretch mesh", dims: "W 68 × D 68 × H 107 cm" },
  { b: "IKEA", m: "Markus", cat: "task-chairs", n: 2, colors: ["Vissle dark grey"], mat: "Polyester mesh", dims: "W 62 × D 60 × H 129 cm" },
  { b: "Vitra", m: "ID Mesh", cat: "task-chairs", n: 2, colors: ["Nero", "Silk grey"], mat: "Technical mesh · FlowMotion", dims: "W 68 × D 68 × H 110 cm" },
  { b: "Herman Miller", m: "Eames Soft Pad EA217", cat: "executive-chairs", n: 2, colors: ["Black leather", "Tan leather"], mat: "Leather · polished aluminium", dims: "W 58 × D 60 × H 86 cm" },
  { b: "Knoll", m: "Life Executive", cat: "executive-chairs", n: 2, colors: ["Black", "Slate"], mat: "Knit back · leather seat", dims: "W 66 × D 66 × H 103 cm" },
  { b: "Steelcase", m: "Cobi Guest", cat: "conference-chairs", n: 4, colors: ["Nickel", "Wasabi"], mat: "Flexing back shell", dims: "W 60 × D 57 × H 87 cm" },
  { b: "Vitra", m: "HAL Tube", cat: "conference-chairs", n: 3, colors: ["White", "Basalt"], mat: "Polypropylene shell", dims: "W 52 × D 49 × H 79 cm" },
  { b: "Herman Miller", m: "Eames Lounge Chair & Ottoman", cat: "lounge-chairs", n: 2, colors: ["Walnut / black leather", "Palisander / tan"], mat: "Molded veneer · leather", dims: "W 84 × D 88 × H 96 cm" },
  { b: "Steelcase", m: "Coalesse SW_1 Lounge", cat: "lounge-chairs", n: 2, colors: ["Heather grey", "Nutmeg"], mat: "Wool blend", dims: "W 76 × D 81 × H 74 cm" },
  { b: "IKEA", m: "Bekant Sit/Stand 160", cat: "standing-desks", n: 4, colors: ["White", "Oak veneer / white"], mat: "Melamine · steel frame", dims: "W 160 × D 80 × H 65–125 cm" },
  { b: "Steelcase", m: "Migration SE", cat: "standing-desks", n: 3, colors: ["Arctic white top", "Maple top"], mat: "Laminate · T-leg", dims: "W 150 × D 74 × H 72–122 cm" },
  { b: "Fully", m: "Jarvis Laminate 150", cat: "standing-desks", n: 2, colors: ["White laminate", "Walnut laminate"], mat: "Dual motor · 3-stage", dims: "W 150 × D 76 × H 63–129 cm" },
  { b: "Herman Miller", m: "Renew Sit-to-Stand", cat: "standing-desks", n: 2, colors: ["White ash", "Walnut"], mat: "Veneer · C-leg", dims: "W 152 × D 76 × H 68–122 cm" },
  { b: "Knoll", m: "Reff Executive Desk", cat: "executive-desks", n: 2, colors: ["Dark walnut", "Medium cherry"], mat: "Wood veneer", dims: "W 183 × D 91 × H 74 cm" },
  { b: "Steelcase", m: "Elective Elements Desk", cat: "executive-desks", n: 2, colors: ["Walnut", "Natural maple"], mat: "Veneer · steel frame", dims: "W 198 × D 96 × H 74 cm" },
  { b: "Herman Miller", m: "Layout Studio Bench 4-Pod", cat: "bench-desks", n: 3, colors: ["White / white screens"], mat: "Laminate · steel spine", dims: "W 280 × D 150 × H 74 cm" },
  { b: "Steelcase", m: "FrameOne Bench 4", cat: "bench-desks", n: 2, colors: ["Arctic white"], mat: "MFC · aluminium frame", dims: "W 320 × D 140 × H 74 cm" },
  { b: "Nucraft", m: "Cambia Conference 240", cat: "conference-tables", n: 2, colors: ["Walnut"], mat: "Veneer boat top", dims: "W 240 × D 120 × H 74 cm" },
  { b: "Steelcase", m: "Convene Boat 300", cat: "conference-tables", n: 2, colors: ["Natural walnut"], mat: "Veneer · power trough", dims: "W 300 × D 127 × H 74 cm" },
  { b: "IKEA", m: "Trotten Training", cat: "training-tables", n: 3, colors: ["White", "Beige"], mat: "Melamine · A-frame", dims: "W 140 × D 70 × H 75 cm" },
  { b: "Herman Miller", m: "Everywhere Side Table", cat: "side-tables", n: 2, colors: ["White round"], mat: "Laminate · column base", dims: "Ø 50 × H 57 cm" },
  { b: "HON", m: "510 Series Vertical File", cat: "filing-cabinets", n: 4, colors: ["Putty", "Black"], mat: "Steel", dims: "W 38 × D 64 × H 132 cm" },
  { b: "Steelcase", m: "Universal Lateral 2D", cat: "filing-cabinets", n: 3, colors: ["Arctic white", "Merle"], mat: "Steel", dims: "W 91 × D 46 × H 71 cm" },
  { b: "IKEA", m: "Galant Bookcase", cat: "bookcases", n: 3, colors: ["Birch", "White"], mat: "Veneer · steel pins", dims: "W 80 × D 35 × H 198 cm" },
  { b: "Knoll", m: "Calibre Credenza", cat: "credenzas", n: 2, colors: ["Walnut", "Oak"], mat: "Veneer · sliding doors", dims: "W 183 × D 50 × H 66 cm" },
  { b: "Steelcase", m: "WorkValet Locker Bank", cat: "lockers", n: 2, colors: ["Merle grey"], mat: "Steel · digital cam locks", dims: "W 120 × D 45 × H 180 cm" },
  { b: "Steelcase", m: "Answer Panel Run", cat: "cubicle-panels", n: 2, colors: ["Graphite fabric"], mat: "Acoustic core · steel frame", dims: "W 360 × H 165 cm run" },
  { b: "Herman Miller", m: "Locale Acoustic Screen", cat: "acoustic-panels", n: 3, colors: ["Oatmeal", "Slate"], mat: "PET felt · maple base", dims: "W 150 × H 140 cm" },
  { b: "Vitra", m: "Soft Modular Sofa 3S", cat: "sofas", n: 2, colors: ["Heather grey wool"], mat: "Wool · oak legs", dims: "W 220 × D 90 × H 78 cm" },
  { b: "Haworth", m: "Riverbend Lobby Sofa", cat: "sofas", n: 2, colors: ["Terracotta", "Sage"], mat: "Bouclé", dims: "W 196 × D 85 × H 76 cm" },
  { b: "Nucraft", m: "Tesano Reception Desk", cat: "reception-desks", n: 2, colors: ["Walnut / white counter"], mat: "Veneer · Corian transaction top", dims: "W 300 × D 95 × H 110 cm" },
];

const NOTES: Record<Grade, string[]> = {
  A: [
    "No visible wear. Full function verified, surfaces detailed.",
    "Open-box condition — protective film still on surfaces.",
    "Single-user unit, functions like new.",
  ],
  B: [
    "Light scuffs consistent with normal office use.",
    "Minor marks on high-touch areas, mechanism flawless.",
    "Small finish blemishes; photographed in detail shots.",
  ],
  C: [
    "Visible wear to surfaces and touch points.",
    "Function works but second-stage adjustment sticks.",
    "Staining on upholstery, priced as refurb candidate.",
  ],
  D: [
    "Heavy wear; sold as-is for parts or deep refurb.",
    "Mechanism fault logged — buyer to repair.",
    "Structural wear, suitable for donor parts.",
  ],
};

const GRADE_POOL: Grade[] = ["A", "A", "B", "B", "B", "B", "C", "C", "C", "D"];

export async function seedIfEmpty() {
  const { data: existing, error: existingError } = await supabase.from("categories").select("id").limit(1);
  if (existingError) throw existingError;
  if (existing.length > 0) return { seeded: false as const };

  // suppliers (Philippine sourcing channels)
  const { data: supRows, error: supplierError } = await supabase
    .from("suppliers")
    .insert(snakeizeRows([
      { name: "Makati Office Liquidations", channel: "Liquidation", contactPerson: "Dana Villanueva", email: "dana@makatioliq.example", phone: "+63 917 555 0184" },
      { name: "Cebu Corporate Surplus", channel: "Downsizing", contactPerson: "RJ Ramos", email: "rj@cebusurplus.example", phone: "+63 32 555 0119" },
      { name: "Kapitolyo Auction House", channel: "Auction", contactPerson: "Liza Mercado", email: "liza@kapitolyoauc.example", phone: "+63 917 555 0142" },
      { name: "GreenCycle Reuse Network", channel: "Lease return", contactPerson: "Tomás Reyes", email: "tomas@greencycle.example", phone: "+63 917 555 0177" },
      { name: "Alabang Relocation Services", channel: "Direct", contactPerson: "Ingrid Ocampo", email: "ingrid@alabangreloc.example", phone: "+63 917 555 0133" },
      { name: "UP Diliman Property Surplus", channel: "Institutional", contactPerson: "Marcos Bellen", email: "mbellen@upd-surplus.example", phone: "+63 2 555 0160" },
    ]))
    .select("id");
  if (supplierError) throw supplierError;
  const supIds = supRows.map((r) => r.id);

  // categories
  const rootId: Record<string, number> = {};
  for (const [ix, r] of ROOTS.entries()) {
    const { data: row, error } = await supabase
      .from("categories")
      .insert(snakeizeRow({ name: r.name, slug: r.key, parentId: null, sortOrder: ix + 1 }))
      .select("id")
      .single();
    if (error) throw error;
    rootId[r.key] = row.id;
  }
  const leafId: Record<string, number> = {};
  for (const leaf of LEAVES) {
    const { data: row, error } = await supabase
      .from("categories")
      .insert(snakeizeRow({ name: leaf.name, slug: leaf.slug, parentId: rootId[leaf.root], sortOrder: leaf.sort, baseValue: leaf.baseValue }))
      .select("id")
      .single();
    if (error) throw error;
    leafId[leaf.slug] = row.id;
    if (leaf.attrs.length) {
      const { error: attributeError } = await supabase.from("category_attributes").insert(snakeizeRows(
        leaf.attrs.map((a, ix) => ({
          categoryId: row.id,
          name: a.name,
          inputType: a.type ?? "select",
          options: a.options ?? null,
          required: a.required ?? false,
          sortOrder: ix + 1,
        }))
      ));
      if (attributeError) throw attributeError;
    }
  }

  // status pool (~68 items)
  const pool: ItemStatus[] = [
    ...Array<ItemStatus>(24).fill("sold"),
    ...Array<ItemStatus>(22).fill("listed"),
    ...Array<ItemStatus>(10).fill("in_stock"),
    ...Array<ItemStatus>(6).fill("intake"),
    ...Array<ItemStatus>(3).fill("reserved"),
    ...Array<ItemStatus>(3).fill("archived"),
  ];
  // shuffle
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  const baseMap = new Map(LEAVES.map((l) => [l.slug, l.baseValue]));
  const attrMap = new Map(LEAVES.map((l) => [l.slug, l.attrs]));
  const rootOfLeaf = new Map(LEAVES.map((l) => [l.slug, l.root]));

  // expand templates to item specs
  const specs = CATALOG.flatMap((t) => Array.from({ length: t.n }, () => t));
  // adjust spec/status counts to match pool length
  while (specs.length < pool.length) specs.push(pick(CATALOG));
  specs.length = pool.length;

  type EventSeed = { itemId: number; kind: string; price: number | null; note?: string; createdAt: Date };
  const eventSeeds: EventSeed[] = [];
  type ReviewSeed = { itemId: number; rating: number; authorName: string; content: string; createdAt: Date };
  const reviewSeeds: ReviewSeed[] = [];

  const SAMPLE_REVIEWS = [
    { rating: 5, authorName: "Marco D.", content: "Exceptional condition! You can barely tell it was pre-owned. The ergonomics on this chair have transformed my workspace." },
    { rating: 5, authorName: "Patricia S.", content: "Smooth viewing and pickup in Muntinlupa. Exactly as described in the condition checklist." },
    { rating: 4, authorName: "Rafael C.", content: "Very solid piece. Minor scuff on the base as clearly noted in the inspection photos, but mechanically 100% flawless." },
    { rating: 5, authorName: "Liza T.", content: "Superb value compared to brand new retail! Will definitely look here first for future office furniture." },
    { rating: 4, authorName: "Carlo M.", content: "Sturdy and high quality. The team assisted with loading into our vehicle during pickup." },
    { rating: 5, authorName: "Bea A.", content: "Top notch quality control. Everything functions like brand new, highly recommended." },
  ];

  for (const [ix, spec] of specs.entries()) {
    const status = pool[ix];
    const grade = pick(GRADE_POOL);
    const base = baseMap.get(spec.cat)! * brandTier(spec.b).multiplier;
    const v = valuate({ baseValue: baseMap.get(spec.cat), brand: spec.b, grade });
    const listed = v.suggested
      ? round50(v.suggested * between(0.96, 1.09))
      : round50(base * between(0.3, 0.5));
    const refurb = chance(0.35) ? round50(listed * between(0.015, 0.05)) : 0;
    const acquisition = round50(listed * between(0.42, 0.62));
    const floor = computeFloor(acquisition, refurb);
    const rootSlug = rootOfLeaf.get(spec.cat)!;
    const attrs = Object.fromEntries(
      (attrMap.get(spec.cat) ?? []).map((a) => [a.name, a.options ? pick(a.options) : ""])
    );

    const cl: ChecklistEntry[] = checklistFor(rootSlug).map((label, kx) => {
      const roll = rand();
      const s: ChecklistEntry["status"] =
        grade === "A" ? (roll < 0.95 ? "pass" : "flag")
        : grade === "B" ? (roll < 0.78 ? "pass" : roll < 0.97 ? "flag" : "fail")
        : grade === "C" ? (roll < 0.55 ? "pass" : roll < 0.88 ? "flag" : "fail")
        : roll < 0.3 ? "pass" : roll < 0.65 ? "flag" : "fail";
      return { key: `c${kx}`, label, status: s };
    });

    const photos: ItemPhoto[] = status === "intake"
      ? []
      : [
          { slot: "front", label: "Front view", url: refPhotoFor(spec.cat) },
          ...(grade === "A" || chance(0.6)
            ? [{ slot: "back", label: "Back / reverse", url: refPhotoFor(spec.cat) }]
            : []),
          ...(grade === "C" || grade === "D"
            ? [{ slot: "detail", label: "Defects & wear", url: refPhotoFor(spec.cat) }]
            : []),
          ...(chance(0.65)
            ? [{ slot: "setup", label: "Setup/Preview", url: REAL_SETUP_PHOTO }]
            : []),
        ];

    // lifecycle dates
    let intakeAt: Date, listedAt: Date | null = null, soldAt: Date | null = null;
    let soldPrice: number | null = null;
    let finalListed: number | null = null;
    let soldChannel: string | null = null;

    if (status === "sold") {
      soldAt = daysAgo(Math.floor(Math.pow(rand(), 1.6) * 120) + 1);
      intakeAt = daysAgo(Math.min(150, Math.floor((Date.now() - soldAt.getTime()) / 86_400_000) + 4 + Math.floor(rand() * 70)));
      listedAt = new Date(intakeAt.getTime() + between(1, 6) * 86_400_000);
      finalListed = listed;
      soldPrice = round50(listed * between(0.92, 1.02));
      soldChannel = pick(SOLD_CHANNELS);
    } else if (status === "listed" || status === "reserved") {
      const age = status === "reserved" ? Math.floor(between(4, 30)) : Math.floor(Math.pow(rand(), 1.35) * 100);
      listedAt = daysAgo(age);
      intakeAt = daysAgo(age + 2 + Math.floor(rand() * 7));
      const currentPrice =
        age > 35 && chance(0.3) ? round50(listed * between(0.9, 0.96)) : listed;
      finalListed = currentPrice;
    } else if (status === "in_stock") {
      intakeAt = daysAgo(5 + Math.floor(rand() * 30));
      finalListed = listed;
    } else if (status === "intake") {
      intakeAt = daysAgo(Math.floor(rand() * 6));
      finalListed = null;
    } else {
      intakeAt = daysAgo(60 + Math.floor(rand() * 100));
      finalListed = null;
    }

    const supplierId = pick(supIds);
    const isFeatured = (status === "listed" && chance(0.35)) || chance(0.12);
    const { data: row, error: itemError } = await supabase
      .from("items")
      .insert(snakeizeRow({
        name: `${spec.b} ${spec.m}`,
        brand: spec.b,
        model: spec.m,
        categoryId: leafId[spec.cat],
        attributes: attrs,
        color: spec.colors ? pick(spec.colors) : null,
        material: spec.mat ?? null,
        dimensions: spec.dims ?? null,
        grade,
        checklist: cl,
        photos,
        conditionNotes: pick(NOTES[grade]),
        acquisitionCost: acquisition,
        refurbCost: refurb,
        listedPrice: status === "intake" || status === "archived" ? null : finalListed,
        floorPrice: floor,
        benchmarkPrice: v.benchmark,
        valueLow: v.low,
        valueHigh: v.high,
        soldPrice,
        soldChannel,
        status,
        supplierId,
        location: pick(WAREHOUSE_LOCATIONS),
        isFeatured,
        intakeAt,
        listedAt,
        soldAt,
        createdAt: intakeAt,
        updatedAt: soldAt ?? listedAt ?? intakeAt,
      }))
      .select("id")
      .single();
    if (itemError) throw itemError;

    const sku = `RF-${String(row.id).padStart(4, "0")}`;
    const { error: skuError } = await supabase.from("items").update({ sku }).eq("id", row.id);
    if (skuError) throw skuError;

    eventSeeds.push({ itemId: row.id, kind: "intake", price: acquisition, note: "Acquired into stock", createdAt: intakeAt });
    if (listedAt && finalListed != null) {
      eventSeeds.push({ itemId: row.id, kind: "listed", price: listed, createdAt: listedAt });
      if (listed !== finalListed) {
        eventSeeds.push({
          itemId: row.id,
          kind: "markdown",
          price: finalListed,
          note: "Price-aging markdown",
          createdAt: new Date(listedAt.getTime() + between(10, 30) * 86_400_000),
        });
      }
    }
    if (soldAt && soldPrice != null) {
      eventSeeds.push({ itemId: row.id, kind: "sold", price: soldPrice, note: soldChannel ?? undefined, createdAt: soldAt });
    }

    if ((status === "listed" || status === "sold") && chance(0.7)) {
      const numReviews = Math.floor(between(1, 4));
      for (let r = 0; r < numReviews; r++) {
        const sample = pick(SAMPLE_REVIEWS);
        const reviewDate = daysAgo(Math.floor(between(1, 45)));
        reviewSeeds.push({
          itemId: row.id,
          rating: sample.rating,
          authorName: sample.authorName,
          content: sample.content,
          createdAt: reviewDate,
        });
      }
    }
  }

  const { error: eventError } = await supabase.from("price_events").insert(
    eventSeeds.map((e) => snakeizeRow({ itemId: e.itemId, kind: e.kind, price: e.price, note: e.note, createdAt: e.createdAt }))
  );
  if (eventError) throw eventError;

  if (reviewSeeds.length > 0) {
    const { error: reviewError } = await supabase.from("reviews").insert(
      reviewSeeds.map((r) => snakeizeRow({ itemId: r.itemId, rating: r.rating, authorName: r.authorName, content: r.content, createdAt: r.createdAt }))
    );
    if (reviewError) {
      // Gracefully log if reviews table isn't migrated yet
      console.warn("Could not insert reviews in seed:", reviewError.message);
    }
  }

  return { seeded: true as const, items: specs.length, categories: 6 + LEAVES.length, suppliers: 6, reviews: reviewSeeds.length };
}
