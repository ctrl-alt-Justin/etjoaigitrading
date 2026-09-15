import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { items, priceEvents, type ChecklistEntry, type Grade, type ItemPhoto } from "@/db/schema";
import { computeFloor, valuate, type Valuation } from "@/lib/valuation";
import { fmtMoney } from "@/lib/format";
import { buildCategoryIndexes, getAllData, nearestBaseValue } from "@/lib/queries";

export const dynamic = "force-dynamic";

function num(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

type CreatePayload = {
  name?: string;
  brand?: string;
  model?: string;
  categoryId?: number;
  attributes?: Record<string, string>;
  color?: string;
  material?: string;
  dimensions?: string;
  grade?: Grade;
  checklist?: ChecklistEntry[];
  photos?: ItemPhoto[];
  conditionNotes?: string;
  acquisitionCost?: number;
  refurbCost?: number;
  listedPrice?: number | null;
  status?: "intake" | "in_stock" | "listed";
  supplierId?: number | null;
  location?: string;
};

export async function POST(req: Request) {
  let body: CreatePayload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = (body.name ?? "").trim();
  if (!name) return NextResponse.json({ error: "Item name is required" }, { status: 400 });
  if (!body.categoryId) return NextResponse.json({ error: "Category is required" }, { status: 400 });

  const acquisitionCost = num(body.acquisitionCost) ?? 0;
  if (acquisitionCost <= 0)
    return NextResponse.json({ error: "Acquisition cost must be greater than zero" }, { status: 400 });
  const refurbCost = num(body.refurbCost) ?? 0;
  const floor = computeFloor(acquisitionCost, refurbCost);

  const status = body.status ?? "in_stock";
  let listedPrice = num(body.listedPrice);
  if (status === "listed") {
    if (!listedPrice)
      return NextResponse.json({ error: "A listed price is required to list an item" }, { status: 400 });
    if (listedPrice < floor)
      return NextResponse.json(
        { error: "BELOW_FLOOR", message: `Listed price is below the enforced floor of ${fmtMoney(floor)}`, floor },
        { status: 409 }
      );
  } else {
    listedPrice = status === "in_stock" ? listedPrice : null;
  }

  // Re-derive valuation server-side from the category tree.
  const { categories: cats } = await getAllData();
  const { byId } = buildCategoryIndexes(cats);
  const baseValue = nearestBaseValue(body.categoryId, byId);
  const grade = body.grade && ["A", "B", "C", "D"].includes(body.grade) ? body.grade : null;
  const v: Valuation = valuate({ baseValue, brand: body.brand, grade });

  const now = new Date();
  const [row] = await db
    .insert(items)
    .values({
      name,
      brand: body.brand?.trim() || null,
      model: body.model?.trim() || null,
      categoryId: body.categoryId,
      attributes: body.attributes ?? {},
      color: body.color?.trim() || null,
      material: body.material?.trim() || null,
      dimensions: body.dimensions?.trim() || null,
      grade,
      checklist: body.checklist ?? [],
      photos: body.photos ?? [],
      conditionNotes: body.conditionNotes?.trim() || null,
      acquisitionCost,
      refurbCost,
      listedPrice,
      floorPrice: floor,
      benchmarkPrice: v.benchmark,
      valueLow: v.low,
      valueHigh: v.high,
      status,
      supplierId: num(body.supplierId),
      location: body.location?.trim() || null,
      intakeAt: now,
      listedAt: status === "listed" ? now : null,
      updatedAt: now,
    })
    .returning({ id: items.id });

  const sku = `RF-${String(row.id).padStart(4, "0")}`;
  await db.execute(sql`UPDATE items SET sku = ${sku} WHERE id = ${row.id}`);

  await db.insert(priceEvents).values([
    { itemId: row.id, kind: "intake", price: acquisitionCost, note: "Intake recorded", createdAt: now },
    ...(status === "listed" && listedPrice
      ? [{ itemId: row.id, kind: "listed" as const, price: listedPrice, createdAt: now }]
      : []),
  ]);

  return NextResponse.json({ ok: true, id: row.id, sku }, { status: 201 });
}
