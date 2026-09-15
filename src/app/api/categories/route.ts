import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { categories } from "@/db/schema";
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
  const clash = await db.select({ id: categories.id }).from(categories).where(eq(categories.slug, slug));
  if (clash.length) slug = `${slug}-${Math.floor(Math.random() * 9000 + 1000)}`;

  const [row] = await db
    .insert(categories)
    .values({
      name,
      slug,
      parentId: body.parentId ?? null,
      baseValue: body.baseValue != null && body.baseValue > 0 ? body.baseValue : null,
    })
    .returning();
  return NextResponse.json(row, { status: 201 });
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
    patch.baseValue = body.baseValue != null && body.baseValue > 0 ? body.baseValue : null;
  if (Object.keys(patch).length === 0) return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  const [row] = await db.update(categories).set(patch).where(eq(categories.id, body.id)).returning();
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(row);
}
