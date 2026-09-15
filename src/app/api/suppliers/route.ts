import { NextResponse } from "next/server";
import { db } from "@/db";
import { suppliers } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: { name?: string; channel?: string; contactPerson?: string; email?: string; phone?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const name = (body.name ?? "").trim();
  if (!name) return NextResponse.json({ error: "Supplier name is required" }, { status: 400 });
  try {
    const [row] = await db
      .insert(suppliers)
      .values({
        name,
        channel: body.channel?.trim() || "Direct",
        contactPerson: body.contactPerson?.trim() || null,
        email: body.email?.trim() || null,
        phone: body.phone?.trim() || null,
      })
      .returning();
    return NextResponse.json(row, { status: 201 });
  } catch {
    return NextResponse.json({ error: "A supplier with this name already exists" }, { status: 409 });
  }
}
