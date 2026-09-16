import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { seedIfEmpty } from "@/db/seed";

export const dynamic = "force-dynamic";

export async function GET() {
  const [{ count: cats }, { count: itms }] = await Promise.all([
    supabase.from("categories").select("id", { count: "exact", head: true }),
    supabase.from("items").select("id", { count: "exact", head: true }),
  ]);
  return NextResponse.json({ seeded: (cats ?? 0) > 0, categories: cats ?? 0, items: itms ?? 0 });
}

export async function POST(req: Request) {
  try {
    const force = new URL(req.url).searchParams.get("force") === "1";
    if (force) {
      for (const table of ["reviews", "item_shares", "price_events", "items", "category_attributes", "categories", "suppliers"]) {
        const { error } = await supabase.from(table).delete().not("id", "is", null);
        if (error) throw error;
      }
    }
    const result = await seedIfEmpty();
    return NextResponse.json(result, { status: result.seeded ? 201 : 200 });
  } catch (err) {
    console.error("seed failed", err);
    return NextResponse.json({ error: "Seed failed" }, { status: 500 });
  }
}
