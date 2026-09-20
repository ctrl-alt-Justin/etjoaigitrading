import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import fs from "fs";
import path from "path";

export interface ReservationItem {
  id: string;
  itemId: number;
  itemName: string;
  itemPrice?: number;
  itemPhoto?: string;
  itemSku?: string | null;
  customerName: string;
  customerContact: string;
  notes?: string;
  status: "pending" | "confirmed" | "released";
  createdAt: string;
}

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "reservations.json");

// In-memory fallback
let memoryReservations: ReservationItem[] = [
  {
    id: "res-demo-1",
    itemId: 1,
    itemName: "Herman Miller Aeron (Size B, PostureFit)",
    itemPrice: 38500,
    itemPhoto: "https://images.unsplash.com/photo-1580481077195-c328ad45be4e?auto=format&fit=crop&w=400&q=80",
    itemSku: "HM-AER-001",
    customerName: "Juan Carlos Dela Cruz",
    customerContact: "0917-882-9102",
    notes: "Requesting viewing and pickup this Saturday afternoon.",
    status: "pending",
    createdAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(), // 18m ago
  },
  {
    id: "res-demo-2",
    itemId: 2,
    itemName: "Steelcase Leap V2 Ergonomic Task Chair",
    itemPrice: 28000,
    itemPhoto: "https://images.unsplash.com/photo-1505843490538-5133c6c7d0e1?auto=format&fit=crop&w=400&q=80",
    itemSku: "SC-LP2-004",
    customerName: "Maria Santos",
    customerContact: "msantos.design@gmail.com",
    notes: "Interested in courier delivery to Makati.",
    status: "pending",
    createdAt: new Date(Date.now() - 1000 * 60 * 55).toISOString(), // 55m ago
  },
];

function loadReservations(): ReservationItem[] {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, "utf-8");
      return JSON.parse(content);
    }
  } catch {
    // fallback to memory
  }
  return memoryReservations;
}

function saveReservations(items: ReservationItem[]) {
  memoryReservations = items;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(items, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to save reservations to file:", err);
  }
}

export async function GET() {
  const list = loadReservations();
  return NextResponse.json({ reservations: list });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      items = [], 
      customerName, 
      customerContact, 
      notes = "" 
    } = body;

    if (!customerName || !customerContact) {
      return NextResponse.json({ error: "Customer name and contact are required" }, { status: 400 });
    }

    const current = loadReservations();
    const newReservations: ReservationItem[] = [];

    // Support single item or array of items
    const itemsToReserve = Array.isArray(items) && items.length > 0 
      ? items 
      : body.itemId 
        ? [{ 
            id: body.itemId, 
            name: body.itemName || "Reserved Piece", 
            price: body.itemPrice, 
            photo: body.itemPhoto, 
            sku: body.itemSku 
          }] 
        : [];

    for (const item of itemsToReserve) {
      const resItem: ReservationItem = {
        id: `res-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        itemId: Number(item.id),
        itemName: item.name || "Reserved Piece",
        itemPrice: item.price != null ? Number(item.price) : undefined,
        itemPhoto: item.photo,
        itemSku: item.sku,
        customerName: customerName.trim(),
        customerContact: customerContact.trim(),
        notes: notes.trim(),
        status: "pending",
        createdAt: new Date().toISOString(),
      };

      newReservations.push(resItem);

      // Automatically update item status to "reserved" in database if possible
      try {
        if (item.id) {
          await supabase
            .from("items")
            .update({ 
              status: "reserved", 
              updated_at: new Date().toISOString() 
            })
            .eq("id", Number(item.id));
        }
      } catch (dbErr) {
        console.warn("Could not update item status in Supabase:", dbErr);
      }
    }

    const updated = [...newReservations, ...current];
    saveReservations(updated);

    return NextResponse.json({ 
      ok: true, 
      created: newReservations,
      count: newReservations.length 
    });
  } catch (err) {
    console.error("Error creating reservation:", err);
    return NextResponse.json({ error: "Failed to create reservation" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, status } = await req.json();
    if (!id || !status) {
      return NextResponse.json({ error: "ID and status required" }, { status: 400 });
    }

    const current = loadReservations();
    const target = current.find((r) => r.id === id);

    if (!target) {
      return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
    }

    target.status = status;
    saveReservations(current);

    // If released, set status back to listed in Supabase
    if (status === "released" && target.itemId) {
      try {
        await supabase
          .from("items")
          .update({ 
            status: "listed", 
            updated_at: new Date().toISOString() 
          })
          .eq("id", target.itemId);
      } catch (dbErr) {
        console.warn("Could not update item status in Supabase:", dbErr);
      }
    }

    return NextResponse.json({ ok: true, reservation: target });
  } catch (err) {
    console.error("Error updating reservation:", err);
    return NextResponse.json({ error: "Failed to update reservation" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    const current = loadReservations();
    const updated = current.filter((r) => r.id !== id);
    saveReservations(updated);

    return NextResponse.json({ ok: true, remainingCount: updated.length });
  } catch (err) {
    console.error("Error deleting reservation:", err);
    return NextResponse.json({ error: "Failed to delete reservation" }, { status: 500 });
  }
}
