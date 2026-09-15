import {
  boolean,
  doublePrecision,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export type Grade = "A" | "B" | "C" | "D";
export type ItemStatus =
  | "intake"
  | "in_stock"
  | "listed"
  | "reserved"
  | "sold"
  | "archived";

export type ChecklistEntry = {
  key: string;
  label: string;
  status: "pass" | "flag" | "fail";
  note?: string;
};

export type ItemPhoto = {
  slot: string;
  label: string;
  url: string;
};

/** Multi-level, extensible category tree. baseValue = reference retail anchor (new). */
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 140 }).notNull(),
  slug: varchar("slug", { length: 180 }).notNull().unique(),
  parentId: integer("parent_id"),
  sortOrder: integer("sort_order").notNull().default(0),
  baseValue: doublePrecision("base_value"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/** Controlled attribute vocabulary attached to a category. */
export const categoryAttributes = pgTable("category_attributes", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").notNull(),
  name: varchar("name", { length: 80 }).notNull(),
  inputType: varchar("input_type", { length: 16 }).notNull().default("select"),
  options: text("options").array(),
  required: boolean("required").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const suppliers = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 160 }).notNull().unique(),
  channel: varchar("channel", { length: 48 }).notNull().default("Direct"),
  contactPerson: varchar("contact_person", { length: 140 }),
  email: varchar("email", { length: 180 }),
  phone: varchar("phone", { length: 48 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const items = pgTable("items", {
  id: serial("id").primaryKey(),
  sku: varchar("sku", { length: 24 }),
  name: varchar("name", { length: 220 }).notNull(),
  brand: varchar("brand", { length: 140 }),
  model: varchar("model", { length: 140 }),
  categoryId: integer("category_id").notNull(),
  attributes: jsonb("attributes").$type<Record<string, string>>(),
  color: varchar("color", { length: 90 }),
  material: varchar("material", { length: 140 }),
  dimensions: varchar("dimensions", { length: 140 }),
  grade: varchar("grade", { length: 1 }).$type<Grade>(),
  checklist: jsonb("checklist").$type<ChecklistEntry[]>(),
  photos: jsonb("photos").$type<ItemPhoto[]>(),
  conditionNotes: text("condition_notes"),
  acquisitionCost: doublePrecision("acquisition_cost").notNull().default(0),
  refurbCost: doublePrecision("refurb_cost").notNull().default(0),
  listedPrice: doublePrecision("listed_price"),
  floorPrice: doublePrecision("floor_price"),
  benchmarkPrice: doublePrecision("benchmark_price"),
  valueLow: doublePrecision("value_low"),
  valueHigh: doublePrecision("value_high"),
  soldPrice: doublePrecision("sold_price"),
  soldChannel: varchar("sold_channel", { length: 80 }),
  status: varchar("status", { length: 12 }).$type<ItemStatus>().notNull().default("intake"),
  supplierId: integer("supplier_id"),
  location: varchar("location", { length: 90 }),
  intakeAt: timestamp("intake_at").notNull().defaultNow(),
  listedAt: timestamp("listed_at"),
  soldAt: timestamp("sold_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/** Append-only pricing history per item (listing, markdowns, sale). */
export const priceEvents = pgTable("price_events", {
  id: serial("id").primaryKey(),
  itemId: integer("item_id").notNull(),
  kind: varchar("kind", { length: 24 }).notNull(),
  price: doublePrecision("price"),
  note: varchar("note", { length: 240 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/** Customer-facing share links — one active link per item. */
export const itemShares = pgTable("item_shares", {
  id: serial("id").primaryKey(),
  itemId: integer("item_id").notNull(),
  token: varchar("token", { length: 32 }).notNull().unique(),
  remarks: text("remarks"),
  /** optional customer-specific offer price; null = show current ask */
  offerPrice: doublePrecision("offer_price"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type DbCategory = typeof categories.$inferSelect;
export type DbCategoryAttribute = typeof categoryAttributes.$inferSelect;
export type DbSupplier = typeof suppliers.$inferSelect;
export type DbItem = typeof items.$inferSelect;
export type DbPriceEvent = typeof priceEvents.$inferSelect;
export type DbItemShare = typeof itemShares.$inferSelect;
