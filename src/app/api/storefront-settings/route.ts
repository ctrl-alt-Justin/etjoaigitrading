import { NextRequest, NextResponse } from "next/server";
import { getStorefrontSettings, saveStorefrontSettings } from "@/lib/storefront-settings";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const settings = await getStorefrontSettings();
    return NextResponse.json({ ok: true, settings });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load storefront settings";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const updated = await saveStorefrontSettings(body);

    // If spotlightItemIds is provided and Supabase is configured, sync is_featured column
    if (Array.isArray(body.spotlightItemIds) && body.spotlightItemIds.length > 0) {
      try {
        const ids = body.spotlightItemIds as number[];
        // Mark selected as featured
        await supabase.from("items").update({ is_featured: true }).in("id", ids);
        // Unmark others
        await supabase
          .from("items")
          .update({ is_featured: false })
          .not("id", "in", `(${ids.join(",")})`);
      } catch (dbErr) {
        console.warn("Supabase is_featured sync skipped or failed:", dbErr);
      }
    }

    return NextResponse.json({ ok: true, settings: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to save storefront settings";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
