import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { supabase } from "@/lib/supabase";
import { camelizeRow, camelizeRows } from "@/db/records";
import type { DbItem, DbPriceEvent } from "@/db/schema";
import { computeFloor } from "@/lib/valuation";
import { fmtMoney } from "@/lib/format";
import { invalidateAllDataCache } from "@/lib/queries";

export const dynamic = "force-dynamic";

function revalidateAll(id: number) {
  invalidateAllDataCache();
  try {
    revalidatePath("/shop", "layout");
    revalidatePath("/shop/catalog");
    revalidatePath("/shop/offers");
    revalidatePath(`/shop/${id}`);
    revalidatePath("/inventory", "layout");
    revalidatePath(`/inventory/${id}`);
    revalidateTag("inventory-data", "max");
  } catch {
    // Ignore cache error in non-request environments
  }
}

type Action =
  | {
      action: "edit";
      name?: string;
      brand?: string | null;
      model?: string | null;
      color?: string | null;
      material?: string | null;
      dimensions?: string | null;
      grade?: "A" | "B" | "C" | "D" | null;
      conditionNotes?: string | null;
      checklist?: DbItem["checklist"];
      photos?: DbItem["photos"];
      attributes?: DbItem["attributes"];
      supplierId?: number | null;
      status?: "draft" | "intake" | "for_cleaning" | "for_refurb" | "for_refurbishing" | "in_stock" | "listed" | "reserved" | "sold" | "archived";
      acquisitionCost?: number;
      refurbCost?: number;
      listedPrice?: number | null;
      location?: string | null;
      categoryId?: number | null;
    }
  | { action: "list"; price: number }
  | { action: "price"; price: number }
  | { action: "sold"; price: number; channel?: string }
  | { action: "reserve" }
  | { action: "release" }
  | { action: "unlist" }
  | { action: "archive" }
  | { action: "restore" };

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await ctx.params;
  const id = Number(idStr);
  if (!Number.isInteger(id)) return NextResponse.json({ error: "Bad id" }, { status: 400 });

  const { data: itemRow, error: itemError } = await supabase.from("items").select("*").eq("id", id).maybeSingle();
  if (itemError) throw itemError;
  const item = itemRow ? camelizeRow<DbItem>(itemRow) : null;
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let body: Action;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const now = new Date();
  const floor = item.floorPrice ?? computeFloor(item.acquisitionCost, item.refurbCost);

  const fail = (status: number, payload: Record<string, unknown>) =>
    NextResponse.json(payload, { status });

  if (body.action === "edit") {
    const acquisitionCost = Number(body.acquisitionCost ?? item.acquisitionCost);
    const refurbCost = Number(body.refurbCost ?? item.refurbCost);
    if (!Number.isFinite(acquisitionCost) || acquisitionCost < 0 || !Number.isFinite(refurbCost) || refurbCost < 0)
      return fail(400, { error: "Costs must be valid non-negative numbers" });
    const nextFloor = computeFloor(acquisitionCost, refurbCost);
    const listedPrice = body.listedPrice == null ? null : Number(body.listedPrice);
    if (listedPrice != null && (!Number.isFinite(listedPrice) || listedPrice <= 0))
      return fail(400, { error: "Listed price must be a positive number or empty" });
    if (listedPrice != null && listedPrice < nextFloor)
      return fail(409, { error: "BELOW_FLOOR", message: `Listed price is below the enforced floor of ${fmtMoney(nextFloor)}`, floor: nextFloor });
    if (body.name !== undefined && !body.name.trim()) return fail(400, { error: "Item name is required" });
    if (body.categoryId != null && (!Number.isInteger(body.categoryId) || body.categoryId <= 0)) return fail(400, { error: "Category is invalid" });
    const { error } = await supabase.from("items").update({
      name: body.name?.trim() ?? item.name,
      brand: body.brand?.trim() || null,
      model: body.model?.trim() || null,
      color: body.color?.trim() || null,
      material: body.material?.trim() || null,
      dimensions: body.dimensions?.trim() || null,
      grade: body.grade ?? null,
      condition_notes: body.conditionNotes?.trim() || null,
      checklist: body.checklist ?? [],
      photos: body.photos ?? item.photos ?? [],
      attributes: body.attributes ?? item.attributes ?? {},
      supplier_id: body.supplierId ?? item.supplierId,
      acquisition_cost: acquisitionCost,
      refurb_cost: refurbCost,
      listed_price: listedPrice,
      floor_price: nextFloor,
      location: body.location?.trim() || null,
      category_id: body.categoryId ?? item.categoryId,
      updated_at: now.toISOString(),
      status: body.status ?? item.status,
      listed_at: body.status === "listed" ? new Date().toISOString() : item.listedAt,
    }).eq("id", id);
    if (error) throw error;
    revalidateAll(id);
    return NextResponse.json({ ok: true });
  }

  switch (body.action) {
    case "list": {
      const price = Number(body.price);
      if (!Number.isFinite(price) || price <= 0) return fail(400, { error: "Price required" });
      const hasCompleteInfo = item.categoryId != null && item.name.trim().length > 1 && item.name !== "Information required" && item.dimensions?.trim().length && item.acquisitionCost > 0 && item.grade != null && (item.checklist?.length ?? 0) > 0 && (item.photos?.length ?? 0) > 0;
      if (!hasCompleteInfo) return fail(409, { error: "INFORMATION_REQUIRED", message: "Complete the category, identity, cost, grade, checklist, and photos before listing this item." });
      if (price < floor)
        return fail(409, { error: "BELOW_FLOOR", message: `Price floor enforced at ${fmtMoney(floor)}`, floor });
      const { error } = await supabase.from("items").update({ status: "listed", listed_price: price, listed_at: item.listedAt ?? now.toISOString(), updated_at: now.toISOString() }).eq("id", id);
      if (error) throw error;
      const { error: eventError } = await supabase.from("price_events").insert({ item_id: id, kind: "listed", price, created_at: now.toISOString() });
      if (eventError) throw eventError;
      revalidateAll(id);
      return NextResponse.json({ ok: true });
    }
    case "price": {
      const price = Number(body.price);
      if (!Number.isFinite(price) || price <= 0) return fail(400, { error: "Price required" });
      if (price < floor)
        return fail(409, { error: "BELOW_FLOOR", message: `Price floor enforced at ${fmtMoney(floor)}`, floor });
      const kind = item.listedPrice && price < item.listedPrice ? "markdown" : "price_update";
      const { error } = await supabase.from("items").update({ listed_price: price, updated_at: now.toISOString() }).eq("id", id);
      if (error) throw error;
      const { error: eventError } = await supabase.from("price_events").insert({ item_id: id, kind, price, created_at: now.toISOString() });
      if (eventError) throw eventError;
      revalidateAll(id);
      return NextResponse.json({ ok: true });
    }
    case "sold": {
      const price = Number(body.price);
      if (!Number.isFinite(price) || price <= 0) return fail(400, { error: "Sold price required" });
      const { error } = await supabase.from("items").update({ status: "sold", sold_price: price, sold_at: now.toISOString(), sold_channel: body.channel || null, updated_at: now.toISOString() }).eq("id", id);
      if (error) throw error;
      const { error: eventError } = await supabase.from("price_events").insert({ item_id: id, kind: "sold", price, note: body.channel || null, created_at: now.toISOString() });
      if (eventError) throw eventError;
      revalidateAll(id);
      return NextResponse.json({ ok: true });
    }
    case "reserve": {
      const { error } = await supabase.from("items").update({ status: "reserved", updated_at: now.toISOString() }).eq("id", id);
      if (error) throw error;
      invalidateAllDataCache();
      return NextResponse.json({ ok: true });
    }
    case "release": {
      const { error } = await supabase.from("items").update({ status: "listed", updated_at: now.toISOString() }).eq("id", id);
      if (error) throw error;
      invalidateAllDataCache();
      return NextResponse.json({ ok: true });
    }
    case "unlist": {
      const { error } = await supabase.from("items").update({ status: "in_stock", updated_at: now.toISOString() }).eq("id", id);
      if (error) throw error;
      invalidateAllDataCache();
      return NextResponse.json({ ok: true });
    }
    case "archive": {
      const { error } = await supabase.from("items").update({ status: "archived", updated_at: now.toISOString() }).eq("id", id);
      if (error) throw error;
      invalidateAllDataCache();
      return NextResponse.json({ ok: true });
    }
    case "restore": {
      const { error } = await supabase.from("items").update({ status: "in_stock", updated_at: now.toISOString() }).eq("id", id);
      if (error) throw error;
      invalidateAllDataCache();
      return NextResponse.json({ ok: true });
    }
    default:
      return fail(400, { error: "Unknown action" });
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await ctx.params;
  const id = Number(idStr);
  if (!Number.isInteger(id)) return NextResponse.json({ error: "Bad id" }, { status: 400 });
  const { error: eventError } = await supabase.from("price_events").delete().eq("item_id", id);
  if (eventError) throw eventError;
  const { error } = await supabase.from("items").delete().eq("id", id);
  if (error) throw error;
  revalidateAll(id);
  return NextResponse.json({ ok: true });
}

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await ctx.params;
  const id = Number(idStr);
  if (!Number.isInteger(id)) return NextResponse.json({ error: "Bad id" }, { status: 400 });
  const { data: itemRow, error: itemError } = await supabase.from("items").select("*").eq("id", id).maybeSingle();
  if (itemError) throw itemError;
  const item = itemRow ? camelizeRow<DbItem>(itemRow) : null;
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const { data: eventRows, error: eventError } = await supabase.from("price_events").select("*").eq("item_id", id).order("created_at", { ascending: false });
  if (eventError) throw eventError;
  const events = camelizeRows<DbPriceEvent>(eventRows);
  return NextResponse.json({ item, events });
}
