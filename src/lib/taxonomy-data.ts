import type { Grade } from "@/db/schema";

/**
 * Controlled taxonomy constants: required photo slots, per-family inspection
 * checklists and reference photography mapping.
 */

export type PhotoSlot = {
  slot: "front" | "back" | "detail" | "after" | "label";
  label: string;
  hint: string;
  required?: boolean;
};

export const PHOTO_SLOTS: PhotoSlot[] = [
  {
    slot: "front",
    label: "Front view",
    hint: "Full item, angled three-quarter, good light",
    required: true,
  },
  {
    slot: "back",
    label: "Back / reverse",
    hint: "Frame, mechanism or rear panels visible",
    required: true,
  },
  {
    slot: "detail",
    label: "Defects & wear",
    hint: "Close-up of every scratch, stain or dent",
    required: true,
  },
  {
    slot: "after",
    label: "After / finished photo",
    hint: "Post-cleaning or refurbished condition (optional for Grade A)",
    required: false,
  },
  {
    slot: "label",
    label: "Label / serial",
    hint: "Manufacturer tag, model sticker or serial plate",
    required: false,
  },
];

export type ChecklistCategory = "surface" | "structure" | "function" | "completeness";

export type CategorizedChecklistItem = {
  category: ChecklistCategory;
  label: string;
};

export const CHECKLIST_CATEGORIES: { key: ChecklistCategory; label: string; desc: string }[] = [
  { key: "surface", label: "Surface & Cosmetics", desc: "Finish, upholstery, edge banding, scratches" },
  { key: "structure", label: "Structural Integrity", desc: "Frame, base, joints, stability" },
  { key: "function", label: "Mechanical & Function", desc: "Hydraulics, motors, wheels, glides, locks" },
  { key: "completeness", label: "Completeness & Hardware", desc: "Accessories, levelers, keys, connectors" },
];

export const CATEGORIZED_CHECKLISTS: Record<string, CategorizedChecklistItem[]> = {
  seating: [
    { category: "surface", label: "Upholstery & mesh clean, free of tears or deep stains" },
    { category: "surface", label: "Arm pads, cushions & surface finish intact" },
    { category: "structure", label: "Base, spine & frame solid with no wobble or hairline cracks" },
    { category: "function", label: "Pneumatic cylinder & height adjustment hold firmly under load" },
    { category: "function", label: "Tilt, recline tension & forward lock mechanisms operate smoothly" },
    { category: "function", label: "Casters & wheels roll smoothly and pivot freely" },
    { category: "completeness", label: "Armrests present, intact and lock at all adjustment heights" },
    { category: "completeness", label: "All adjustment levers, knobs & caps complete" },
  ],
  desks: [
    { category: "surface", label: "Desktop surface clean, free of deep gouges, burns & stains" },
    { category: "surface", label: "Edge banding tight and seamless, no peeling or chipping" },
    { category: "structure", label: "Legs, trestles & frame rock-solid under load without sway" },
    { category: "function", label: "Height-adjust motor or lift mechanism runs smoothly & quietly" },
    { category: "function", label: "Drawers, slides & keyboard trays glide freely without friction" },
    { category: "completeness", label: "Cable management trays, grommet covers & power raceways present" },
    { category: "completeness", label: "Leveling glides & foot pads complete on all legs" },
  ],
  tables: [
    { category: "surface", label: "Tabletop surface clean and clear of laminate lifting or delamination" },
    { category: "surface", label: "Beveled edges, corners & finish in good condition" },
    { category: "structure", label: "Under-table frame, column & base sturdy, no rocking" },
    { category: "function", label: "Flip-top, nesting, or folding mechanisms lock securely" },
    { category: "completeness", label: "Table levelers present, functional, and adjust properly" },
    { category: "completeness", label: "Ganging hardware & connector brackets included" },
  ],
  storage: [
    { category: "surface", label: "Exterior paint or veneer clean, free of deep dents, chips & rust" },
    { category: "surface", label: "Drawer fronts, handles & label holders clean and secure" },
    { category: "structure", label: "Cabinet carcass square, joints true, no frame deflection" },
    { category: "structure", label: "Shelves straight, fully supported, no sagging or bowing" },
    { category: "function", label: "Drawers and tambour doors glide smoothly with soft-close/stops" },
    { category: "function", label: "Lock cores turn smoothly, latch firmly, keys present" },
    { category: "completeness", label: "Shelf clips, file hanging rails & interior dividers complete" },
  ],
  partitions: [
    { category: "surface", label: "Acoustic fabric & glass tiles clean, free of rips, stains & odors" },
    { category: "structure", label: "Extruded frame straight, true, not bent or warped" },
    { category: "function", label: "Built-in wire raceways & conduit channels open and accessible" },
    { category: "completeness", label: "Top caps, hinge connectors, brackets & trim strips complete" },
    { category: "completeness", label: "Leveling glides and stabilization feet present" },
  ],
  reception: [
    { category: "surface", label: "Upholstery & cushion foam clean, resilient, free of stains or tears" },
    { category: "surface", label: "Transaction countertop & greeting ledge finish intact" },
    { category: "structure", label: "Main counter frame, desk module & return solid, no wobble" },
    { category: "function", label: "Integrated drawers, cable pass-throughs & task lights work" },
    { category: "completeness", label: "Modesty panels, standoff hardware & decorative brackets complete" },
  ],
};

export const GENERIC_CATEGORIZED_CHECKLIST: CategorizedChecklistItem[] = [
  { category: "surface", label: "All external surfaces, finish & upholstery clean and acceptable" },
  { category: "structure", label: "Structural frame, legs & load-bearing joints solid with no wobble" },
  { category: "function", label: "All moving components, mechanisms & adjustments fully operational" },
  { category: "completeness", label: "All hardware, fasteners, feet & original accessories complete" },
];

export function categorizedChecklistFor(rootSlug: string): CategorizedChecklistItem[] {
  return CATEGORIZED_CHECKLISTS[rootSlug] ?? GENERIC_CATEGORIZED_CHECKLIST;
}

export function checklistFor(rootSlug: string): string[] {
  return categorizedChecklistFor(rootSlug).map((item) => item.label);
}

export function calculateAutoGrade(checks: Record<number, "pass" | "flag" | "fail">): Grade | null {
  const entries = Object.values(checks);
  if (entries.length === 0) return null;
  const fails = entries.filter((s) => s === "fail").length;
  const flags = entries.filter((s) => s === "flag").length;

  if (fails >= 2) return "D";
  if (fails === 1 || flags >= 3) return "C";
  if (flags >= 1) return "B";
  return "A";
}

export const MIN_CLEANING_COST = 350;

/** Reference photography per leaf category slug. */
export const REF_PHOTOS: Record<string, string> = {
  "task-chairs": "/images/reference-furniture.svg",
  "executive-chairs": "/images/reference-furniture.svg",
  "conference-chairs": "/images/reference-furniture.svg",
  "lounge-chairs": "/images/reference-furniture.svg",
  "standing-desks": "/images/reference-furniture.svg",
  "executive-desks": "/images/reference-furniture.svg",
  "bench-desks": "/images/reference-furniture.svg",
  "conference-tables": "/images/reference-furniture.svg",
  "training-tables": "/images/reference-furniture.svg",
  "side-tables": "/images/reference-furniture.svg",
  "filing-cabinets": "/images/reference-furniture.svg",
  "bookcases": "/images/reference-furniture.svg",
  "credenzas": "/images/reference-furniture.svg",
  "lockers": "/images/reference-furniture.svg",
  "cubicle-panels": "/images/reference-furniture.svg",
  "acoustic-panels": "/images/reference-furniture.svg",
  "reception-desks": "/images/reference-furniture.svg",
  "sofas": "/images/reference-furniture.svg",
};

export function refPhotoFor(leafSlug: string): string {
  return REF_PHOTOS[leafSlug] ?? "/images/reference-furniture.svg";
}

export function normalizeRefPhoto(url: string): string {
  return url.startsWith("/images/ref-") ? "/images/reference-furniture.svg" : url;
}

export const SOLD_CHANNELS = [
  "Direct buyer",
  "Office outfitter",
  "Marketplace",
  "Dealer wholesale",
  "Internal reuse",
];

export const WAREHOUSE_LOCATIONS = [
  "WH-A · Rack 01",
  "WH-A · Rack 02",
  "WH-A · Rack 03",
  "WH-B · Rack 01",
  "WH-B · Rack 02",
  "WH-B · Floor 04",
  "Showroom · Bay 1",
  "Refurb · Bench 2",
];
