import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { categoryAttributes } from "@/db/schema";

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
  const [row] = await db
    .insert(categoryAttributes)
    .values({
      categoryId: body.categoryId,
      name,
      inputType,
      options: inputType === "select" ? options : null,
      required: !!body.required,
    })
    .returning();
  return NextResponse.json(row, { status: 201 });
}

export async function DELETE(req: Request) {
  let body: { id?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await db.delete(categoryAttributes).where(eq(categoryAttributes.id, body.id));
  return NextResponse.json({ ok: true });
}
