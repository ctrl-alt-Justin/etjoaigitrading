import { NextResponse } from "next/server";
import { and, eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { items, priceEvents } from "@/db/schema";
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

  const [item] = await db.select().from(items).where(eq(items.id, id));
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
      await db.update(items).set({ status: "listed", listedPrice: price, listedAt: item.listedAt ?? now, updatedAt: now }).where(eq(items.id, id));
      await db.insert(priceEvents).values({ itemId: id, kind: "listed", price, createdAt: now });
      return NextResponse.json({ ok: true });
    }
    case "price": {
      const price = Number(body.price);
      if (!Number.isFinite(price) || price <= 0) return fail(400, { error: "Price required" });
      if (price < floor)
        return fail(409, { error: "BELOW_FLOOR", message: `Price floor enforced at ${fmtMoney(floor)}`, floor });
      const kind = item.listedPrice && price < item.listedPrice ? "markdown" : "price_update";
      await db.update(items).set({ listedPrice: price, updatedAt: now }).where(eq(items.id, id));
      await db.insert(priceEvents).values({ itemId: id, kind, price, createdAt: now });
      return NextResponse.json({ ok: true });
    }
    case "sold": {
      const price = Number(body.price);
      if (!Number.isFinite(price) || price <= 0) return fail(400, { error: "Sold price required" });
      await db
        .update(items)
        .set({ status: "sold", soldPrice: price, soldAt: now, soldChannel: body.channel || null, updatedAt: now })
        .where(eq(items.id, id));
      await db.insert(priceEvents).values({ itemId: id, kind: "sold", price, note: body.channel || null, createdAt: now });
      return NextResponse.json({ ok: true });
    }
    case "reserve": {
      await db.update(items).set({ status: "reserved", updatedAt: now }).where(eq(items.id, id));
      return NextResponse.json({ ok: true });
    }
    case "release": {
      await db.update(items).set({ status: "listed", updatedAt: now }).where(eq(items.id, id));
      return NextResponse.json({ ok: true });
    }
    case "unlist": {
      await db.update(items).set({ status: "in_stock", updatedAt: now }).where(eq(items.id, id));
      return NextResponse.json({ ok: true });
    }
    case "archive": {
      await db.update(items).set({ status: "archived", updatedAt: now }).where(eq(items.id, id));
      return NextResponse.json({ ok: true });
    }
    case "restore": {
      await db.update(items).set({ status: "in_stock", updatedAt: now }).where(eq(items.id, id));
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
  await db.delete(priceEvents).where(eq(priceEvents.itemId, id));
  await db.delete(items).where(and(eq(items.id, id)));
  return NextResponse.json({ ok: true });
}

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await ctx.params;
  const id = Number(idStr);
  if (!Number.isInteger(id)) return NextResponse.json({ error: "Bad id" }, { status: 400 });
  const [item] = await db.select().from(items).where(eq(items.id, id));
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const events = await db
    .select()
    .from(priceEvents)
    .where(eq(priceEvents.itemId, id))
    .orderBy(desc(priceEvents.createdAt));
  return NextResponse.json({ item, events });
}
