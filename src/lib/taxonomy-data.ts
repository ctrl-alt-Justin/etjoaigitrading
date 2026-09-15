/**
 * Controlled taxonomy constants: required photo slots, per-family inspection
 * checklists and reference photography mapping.
 */

export const PHOTO_SLOTS = [
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
    slot: "label",
    label: "Label / serial",
    hint: "Manufacturer tag, model sticker or serial plate",
    required: false,
  },
] as const;

export const CHECKLISTS: Record<string, string[]> = {
  seating: [
    "Casters & wheels roll smoothly",
    "Gas lift & height adjustment hold",
    "Tilt / recline mechanism works",
    "Armrests intact and adjust",
    "Upholstery / mesh free of tears",
    "Base & frame stable, no wobble",
  ],
  desks: [
    "Surface free of deep scratches & stains",
    "Edge banding intact, no peeling",
    "Frame & legs stable under load",
    "Height-adjust motor runs (if electric)",
    "Cable management present",
    "Drawer glides smooth (if fitted)",
  ],
  tables: [
    "Top surface condition acceptable",
    "Edges & corners not chipped",
    "Legs / base stable, no rocking",
    "Folding or flip mechanism works (if any)",
    "Levelers present and functional",
  ],
  storage: [
    "Doors / drawers glide on runners",
    "Locks work, keys present",
    "Hinges & handles secure",
    "Shelves straight, no sagging",
    "Carcass free of dents & rust",
  ],
  partitions: [
    "Fabric / acoustic surface clean",
    "Frame straight, not warped",
    "Connectors & brackets included",
    "Leveling feet present",
  ],
  reception: [
    "Upholstery free of stains & tears",
    "Frame & joints solid",
    "Cushion foam still resilient",
    "Surface finish acceptable",
    "Legs & hardware complete",
  ],
};

const GENERIC_CHECKLIST = [
  "Structure solid, no damage",
  "Surfaces & finish acceptable",
  "All moving parts functional",
  "Hardware & fixings complete",
];

export function checklistFor(rootSlug: string): string[] {
  return CHECKLISTS[rootSlug] ?? GENERIC_CHECKLIST;
}

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
