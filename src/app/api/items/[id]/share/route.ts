import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { supabase } from "@/lib/supabase";
import { camelizeRow } from "@/db/records";
import type { DbItem, DbItemShare } from "@/db/schema";
import { fmtMoney } from "@/lib/format";
import { getLatestShareForItem } from "@/lib/queries";

export const dynamic = "force-dynamic";

async function parseId(ctx: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await ctx.params;
  return Number(idStr);
}

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const id = await parseId(ctx);
  if (!Number.isInteger(id)) return NextResponse.json({ error: "Bad id" }, { status: 400 });
  const share = await getLatestShareForItem(id);
  return NextResponse.json({ share });
}

/** Create or refresh the share link for an item. */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const id = await parseId(ctx);
  if (!Number.isInteger(id)) return NextResponse.json({ error: "Bad id" }, { status: 400 });

  const { data: itemRow, error: itemError } = await supabase.from("items").select("*").eq("id", id).maybeSingle();
  if (itemError) throw itemError;
  const item = itemRow ? camelizeRow<DbItem>(itemRow) : null;
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (item.status === "sold" || item.status === "archived")
    return NextResponse.json({ error: "Sold or archived items cannot be shared" }, { status: 400 });

  let body: { remarks?: string; offerPrice?: number | null };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  let offerPrice: number | null = null;
  if (body.offerPrice != null && body.offerPrice !== ("" as unknown)) {
    const p = Number(body.offerPrice);
    if (!Number.isFinite(p) || p <= 0)
      return NextResponse.json({ error: "Offer price must be a positive number" }, { status: 400 });
    offerPrice = p;
  }

  const floor = item.floorPrice ?? 0;
  if (offerPrice != null && floor > 0 && offerPrice < floor)
    return NextResponse.json(
      { error: "BELOW_FLOOR", message: `Offer is below the enforced floor of ${fmtMoney(floor)}`, floor },
      { status: 409 }
    );

  const remarks = (body.remarks ?? "").trim().slice(0, 900) || null;
  const existing = await getLatestShareForItem(id);

  if (existing) {
    const { data, error } = await supabase.from("item_shares").update({ remarks, offer_price: offerPrice, active: true, updated_at: new Date().toISOString() }).eq("id", existing.id).select().single();
    if (error) throw error;
    return NextResponse.json({ share: camelizeRow<DbItemShare>(data) });
  }

  let token = randomBytes(6).toString("hex");
  for (let attempt = 0; attempt < 3; attempt++) {
    const { data: clash, error } = await supabase.from("item_shares").select("id").eq("token", token);
    if (error) throw error;
    if (!clash.length) break;
    token = randomBytes(6).toString("hex");
  }

  const { data, error } = await supabase.from("item_shares").insert({ item_id: id, token, remarks, offer_price: offerPrice, active: true }).select().single();
  if (error) throw error;
  return NextResponse.json({ share: camelizeRow<DbItemShare>(data) }, { status: 201 });
}

/** Deactivate the share link. */
export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const id = await parseId(ctx);
  if (!Number.isInteger(id)) return NextResponse.json({ error: "Bad id" }, { status: 400 });
  const existing = await getLatestShareForItem(id);
  if (!existing) return NextResponse.json({ share: null });
  const { data, error } = await supabase.from("item_shares").update({ active: false, updated_at: new Date().toISOString() }).eq("id", existing.id).select().single();
  if (error) throw error;
  return NextResponse.json({ share: camelizeRow<DbItemShare>(data) });
}
