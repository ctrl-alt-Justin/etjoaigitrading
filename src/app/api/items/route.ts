import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { supabase } from "@/lib/supabase";
import { type ChecklistEntry, type Grade, type ItemPhoto } from "@/db/schema";
import { computeFloor, valuate, type Valuation } from "@/lib/valuation";
import { fmtMoney } from "@/lib/format";
import { buildCategoryIndexes, getAllData, invalidateAllDataCache, nearestBaseValue } from "@/lib/queries";

export const dynamic = "force-dynamic";

function num(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

type CreatePayload = {
  name?: string;
  brand?: string;
  model?: string;
  categoryId?: number | null;
  attributes?: Record<string, string>;
  color?: string;
  material?: string;
  dimensions?: string;
  grade?: Grade;
  checklist?: ChecklistEntry[];
  photos?: ItemPhoto[];
  conditionNotes?: string;
  acquisitionCost?: number;
  refurbCost?: number;
  cleaningCost?: number;
  listedPrice?: number | null;
  status?: "draft" | "intake" | "for_cleaning" | "for_refurb" | "in_stock" | "listed" | "reserved" | "sold" | "archived";
  supplierId?: number | null;
  location?: string;
};

export async function POST(req: Request) {
  let body: CreatePayload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const status = body.status ?? "in_stock";
  const isDraft = status === "draft";
  const name = (body.name ?? "").trim() || (isDraft ? "Information required" : "");
  if (!name) return NextResponse.json({ error: "Item name is required" }, { status: 400 });
  if (!body.categoryId && !isDraft) return NextResponse.json({ error: "Category is required" }, { status: 400 });

  const acquisitionCost = num(body.acquisitionCost) ?? 0;
  if (acquisitionCost <= 0 && !isDraft)
    return NextResponse.json({ error: "Acquisition cost must be greater than zero" }, { status: 400 });
  const cleaningCost = num(body.cleaningCost) ?? 0;
  const refurbCost = (num(body.refurbCost) ?? 0) + cleaningCost;
  const floor = computeFloor(acquisitionCost, refurbCost);

  let listedPrice = num(body.listedPrice);
  if (status === "listed") {
    if (!listedPrice)
      return NextResponse.json({ error: "A listed price is required to list an item" }, { status: 400 });
    if (listedPrice < floor)
      return NextResponse.json(
        { error: "BELOW_FLOOR", message: `Listed price is below the enforced floor of ${fmtMoney(floor)}`, floor },
        { status: 409 }
      );
  } else {
    listedPrice = (status === "in_stock" || status === "for_cleaning" || status === "for_refurb") ? listedPrice : null;
  }

  // Re-derive valuation server-side from the category tree.
  const { categories: cats } = await getAllData();
  const { byId } = buildCategoryIndexes(cats);
  const baseValue = nearestBaseValue(body.categoryId, byId);
  const grade = body.grade && ["A", "B", "C", "D"].includes(body.grade) ? body.grade : null;
  const v: Valuation = valuate({ baseValue, brand: body.brand, grade });

  const now = new Date();
  const { data: row, error: insertError } = await supabase
    .from("items")
    .insert({
      name,
      brand: body.brand?.trim() || null,
      model: body.model?.trim() || null,
      category_id: body.categoryId ?? null,
      attributes: body.attributes ?? {},
      color: body.color?.trim() || null,
      material: body.material?.trim() || null,
      dimensions: body.dimensions?.trim() || null,
      grade,
      checklist: body.checklist ?? [],
      photos: body.photos ?? [],
      condition_notes: body.conditionNotes?.trim() || null,
      acquisition_cost: acquisitionCost,
      refurb_cost: refurbCost,
      listed_price: listedPrice,
      floor_price: floor,
      benchmark_price: v.benchmark,
      value_low: v.low,
      value_high: v.high,
      status,
      supplier_id: num(body.supplierId),
      location: body.location?.trim() || null,
      intake_at: now.toISOString(),
      listed_at: status === "listed" ? now.toISOString() : null,
      updated_at: now.toISOString(),
    })
    .select("id")
    .single();
  if (insertError) {
    console.error("item insert failed", insertError);
    return NextResponse.json(
      {
        error: insertError.code === "23502" && insertError.message.includes("category_id")
          ? "DATABASE_MIGRATION_REQUIRED"
          : "ITEM_INSERT_FAILED",
        message: insertError.message,
      },
      { status: 500 }
    );
  }

  const sku = `RF-${String(row.id).padStart(4, "0")}`;
  const { error: skuError } = await supabase.from("items").update({ sku }).eq("id", row.id);
  if (skuError) {
    console.error("item sku update failed", skuError);
    return NextResponse.json({ error: "ITEM_SKU_UPDATE_FAILED", message: skuError.message }, { status: 500 });
  }

  const events = [
    { item_id: row.id, kind: "intake", price: acquisitionCost, note: "Intake recorded", created_at: now.toISOString() },
    ...(status === "listed" && listedPrice
      ? [{ item_id: row.id, kind: "listed" as const, price: listedPrice, created_at: now.toISOString() }]
      : []),
  ];
  const { error: eventError } = await supabase.from("price_events").insert(events);
  if (eventError) {
    console.error("item event insert failed", eventError);
    return NextResponse.json({ error: "ITEM_EVENT_INSERT_FAILED", message: eventError.message }, { status: 500 });
  }

  invalidateAllDataCache();
  try {
    revalidatePath("/shop", "layout");
    revalidatePath("/shop/catalog");
    revalidatePath("/inventory", "layout");
    revalidateTag("inventory-data", "max");
  } catch {
    // Ignore cache error in non-request environments
  }

  return NextResponse.json({ ok: true, id: row.id, sku }, { status: 201 });
}
