import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { camelizeRow, camelizeRows } from "@/db/records";
import type { DbReview } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const itemId = searchParams.get("itemId");

  if (!itemId) {
    return NextResponse.json({ error: "itemId query parameter is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("item_id", Number(itemId))
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(camelizeRows<DbReview>(data));
}

export async function POST(req: Request) {
  let body: {
    itemId?: number;
    rating?: number;
    authorName?: string;
    content?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const itemId = Number(body.itemId);
  const rating = Number(body.rating);
  const authorName = (body.authorName ?? "").trim();
  const content = (body.content ?? "").trim() || null;

  if (!itemId || isNaN(itemId)) {
    return NextResponse.json({ error: "Valid itemId is required" }, { status: 400 });
  }
  if (!rating || isNaN(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
  }
  if (!authorName) {
    return NextResponse.json({ error: "Author name is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("reviews")
    .insert({
      item_id: itemId,
      rating,
      author_name: authorName,
      content,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(camelizeRow<DbReview>(data), { status: 201 });
}
