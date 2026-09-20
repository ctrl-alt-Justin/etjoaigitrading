import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { supabase } from "@/lib/supabase";
import { camelizeRow } from "@/db/records";
import type { DbCategoryAttribute } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: {
    categoryId?: number;
    name?: string;
    inputType?: "select" | "text" | "number";
    options?: string[];
    required?: boolean;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const name = (body.name ?? "").trim();
  if (!body.categoryId || !name)
    return NextResponse.json({ error: "categoryId and name are required" }, { status: 400 });
  const inputType = body.inputType === "text" || body.inputType === "number" ? body.inputType : "select";
  const options = (body.options ?? []).map((o) => o.trim()).filter(Boolean);
  if (inputType === "select" && options.length === 0)
    return NextResponse.json({ error: "Select fields need at least one option" }, { status: 400 });
  const { data, error } = await supabase
    .from("category_attributes")
    .insert({
      category_id: body.categoryId,
      name,
      input_type: inputType,
      options: inputType === "select" ? options : null,
      required: !!body.required,
    })
    .select()
    .single();
  if (error) {
    console.error("Failed to insert category attribute:", error);
    return NextResponse.json({ error: error.message || "Failed to insert attribute" }, { status: 500 });
  }
  revalidateTag("inventory-data", "max");
  return NextResponse.json(camelizeRow<DbCategoryAttribute>(data), { status: 201 });
}

export async function DELETE(req: Request) {
  let body: { id?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const { error } = await supabase.from("category_attributes").delete().eq("id", body.id);
  if (error) {
    console.error("Failed to delete category attribute:", error);
    return NextResponse.json({ error: error.message || "Failed to delete attribute" }, { status: 500 });
  }
  revalidateTag("inventory-data", "max");
  return NextResponse.json({ ok: true });
}
