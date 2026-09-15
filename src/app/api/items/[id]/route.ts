import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { camelizeRow, camelizeRows } from "@/db/records";
import type { DbItem, DbPriceEvent } from "@/db/schema";
import { computeFloor } from "@/lib/valuation";
import { fmtMoney } from "@/lib/format";

export const dynamic = "force-dynamic";

type Action =
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

  switch (body.action) {
    case "list": {
      const price = Number(body.price);
      if (!Number.isFinite(price) || price <= 0) return fail(400, { error: "Price required" });
      if (price < floor)
        return fail(409, { error: "BELOW_FLOOR", message: `Price floor enforced at ${fmtMoney(floor)}`, floor });
      const { error } = await supabase.from("items").update({ status: "listed", listed_price: price, listed_at: item.listedAt ?? now.toISOString(), updated_at: now.toISOString() }).eq("id", id);
      if (error) throw error;
      const { error: eventError } = await supabase.from("price_events").insert({ item_id: id, kind: "listed", price, created_at: now.toISOString() });
      if (eventError) throw eventError;
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
      return NextResponse.json({ ok: true });
    }
    case "sold": {
      const price = Number(body.price);
      if (!Number.isFinite(price) || price <= 0) return fail(400, { error: "Sold price required" });
      const { error } = await supabase.from("items").update({ status: "sold", sold_price: price, sold_at: now.toISOString(), sold_channel: body.channel || null, updated_at: now.toISOString() }).eq("id", id);
      if (error) throw error;
      const { error: eventError } = await supabase.from("price_events").insert({ item_id: id, kind: "sold", price, note: body.channel || null, created_at: now.toISOString() });
      if (eventError) throw eventError;
      return NextResponse.json({ ok: true });
    }
    case "reserve": {
      const { error } = await supabase.from("items").update({ status: "reserved", updated_at: now.toISOString() }).eq("id", id);
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }
    case "release": {
      const { error } = await supabase.from("items").update({ status: "listed", updated_at: now.toISOString() }).eq("id", id);
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }
    case "unlist": {
      const { error } = await supabase.from("items").update({ status: "in_stock", updated_at: now.toISOString() }).eq("id", id);
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }
    case "archive": {
      const { error } = await supabase.from("items").update({ status: "archived", updated_at: now.toISOString() }).eq("id", id);
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }
    case "restore": {
      const { error } = await supabase.from("items").update({ status: "in_stock", updated_at: now.toISOString() }).eq("id", id);
      if (error) throw error;
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
