import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { itemShares, items } from "@/db/schema";
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

  const [item] = await db.select().from(items).where(eq(items.id, id));
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
    const [row] = await db
      .update(itemShares)
      .set({ remarks, offerPrice, active: true, updatedAt: new Date() })
      .where(eq(itemShares.id, existing.id))
      .returning();
    return NextResponse.json({ share: row });
  }

  let token = randomBytes(6).toString("hex");
  for (let attempt = 0; attempt < 3; attempt++) {
    const clash = await db.select({ id: itemShares.id }).from(itemShares).where(eq(itemShares.token, token));
    if (!clash.length) break;
    token = randomBytes(6).toString("hex");
  }

  const [row] = await db
    .insert(itemShares)
    .values({ itemId: id, token, remarks, offerPrice, active: true })
    .returning();
  return NextResponse.json({ share: row }, { status: 201 });
}

/** Deactivate the share link. */
export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const id = await parseId(ctx);
  if (!Number.isInteger(id)) return NextResponse.json({ error: "Bad id" }, { status: 400 });
  const existing = await getLatestShareForItem(id);
  if (!existing) return NextResponse.json({ share: null });
  const [row] = await db
    .update(itemShares)
    .set({ active: false, updatedAt: new Date() })
    .where(eq(itemShares.id, existing.id))
    .returning();
  return NextResponse.json({ share: row });
}
