import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { seedIfEmpty } from "@/db/seed";

export const dynamic = "force-dynamic";

export async function GET() {
  const [{ c: cats }] = (await db.execute(sql`select count(*)::int as c from categories`)).rows as { c: number }[];
  const [{ c: itms }] = (await db.execute(sql`select count(*)::int as c from items`)).rows as { c: number }[];
  return NextResponse.json({ seeded: cats > 0, categories: cats, items: itms });
}

export async function POST(req: Request) {
  try {
    const force = new URL(req.url).searchParams.get("force") === "1";
    if (force) {
      await db.execute(sql`delete from price_events`);
      await db.execute(sql`delete from items`);
      await db.execute(sql`delete from category_attributes`);
      await db.execute(sql`delete from categories`);
      await db.execute(sql`delete from suppliers`);
    }
    const result = await seedIfEmpty();
    return NextResponse.json(result, { status: result.seeded ? 201 : 200 });
  } catch (err) {
    console.error("seed failed", err);
    return NextResponse.json({ error: "Seed failed" }, { status: 500 });
  }
}
