export type Grade = "A" | "B" | "C" | "D";
export type ItemStatus =
  | "intake"
  | "draft"
  | "for_cleaning"
  | "for_refurb"
  | "for_refurbishing"
  | "in_stock"
  | "listed"
  | "reserved"
  | "sold"
  | "archived";

export type ChecklistEntry = {
  key: string;
  label: string;
  status: "pass" | "flag" | "fail";
  category?: "surface" | "structure" | "function" | "completeness";
  note?: string;
};

export type ItemPhoto = {
  slot: string;
  label: string;
  url: string;
  timestamp?: string;
};

export type DbCategory = {
  id: number;
  name: string;
  slug: string;
  parentId: number | null;
  sortOrder: number;
  baseValue: number | null;
  createdAt: string;
};

export type DbCategoryAttribute = {
  id: number;
  categoryId: number;
  name: string;
  inputType: string;
  options: string[] | null;
  required: boolean;
  sortOrder: number;
};

export type DbSupplier = {
  id: number;
  name: string;
  channel: string;
  contactPerson: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  createdAt: string;
};

export type DbItem = {
  id: number;
  sku: string | null;
  name: string;
  brand: string | null;
  model: string | null;
  categoryId: number | null;
  attributes: Record<string, string> | null;
  color: string | null;
  material: string | null;
  dimensions: string | null;
  grade: Grade | null;
  checklist: ChecklistEntry[] | null;
  photos: ItemPhoto[] | null;
  conditionNotes: string | null;
  acquisitionCost: number;
  refurbCost: number;
  listedPrice: number | null;
  floorPrice: number | null;
  benchmarkPrice: number | null;
  valueLow: number | null;
  valueHigh: number | null;
  soldPrice: number | null;
  soldChannel: string | null;
  status: ItemStatus;
  supplierId: number | null;
  location: string | null;
  isFeatured?: boolean;
  intakeAt: string;
  listedAt: string | null;
  soldAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type DbPriceEvent = {
  id: number;
  itemId: number;
  kind: string;
  price: number | null;
  note: string | null;
  createdAt: string;
};

export type DbItemShare = {
  id: number;
  itemId: number;
  token: string;
  remarks: string | null;
  offerPrice: number | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type DbReview = {
  id: number;
  itemId: number;
  rating: number;
  authorName: string;
  content: string | null;
  createdAt: string;
};

