import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { camelizeRow } from "@/db/records";
import type { DbCategory } from "@/db/schema";
import { slugify } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: { name?: string; parentId?: number | null; baseValue?: number | null };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const name = (body.name ?? "").trim();
  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  let slug = slugify(name);
  if (!slug) return NextResponse.json({ error: "Invalid name" }, { status: 400 });

  // ensure unique slug
  const { data: clash, error: clashError } = await supabase.from("categories").select("id").eq("slug", slug);
  if (clashError) throw clashError;
  if (clash.length) slug = `${slug}-${Math.floor(Math.random() * 9000 + 1000)}`;

  const { data, error } = await supabase
    .from("categories")
    .insert({
      name,
      slug,
      parent_id: body.parentId ?? null,
      base_value: body.baseValue != null && body.baseValue > 0 ? body.baseValue : null,
    })
    .select()
    .single();
  if (error) throw error;
  return NextResponse.json(camelizeRow<DbCategory>(data), { status: 201 });
}

export async function PATCH(req: Request) {
  let body: { id?: number; name?: string; baseValue?: number | null };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const patch: Record<string, unknown> = {};
  if (body.name?.trim()) patch.name = body.name.trim();
  if (body.baseValue !== undefined)
    patch.base_value = body.baseValue != null && body.baseValue > 0 ? body.baseValue : null;
  if (Object.keys(patch).length === 0) return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  const { data, error } = await supabase.from("categories").update(patch).eq("id", body.id).select().maybeSingle();
  if (error) throw error;
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(camelizeRow<DbCategory>(data));
}
