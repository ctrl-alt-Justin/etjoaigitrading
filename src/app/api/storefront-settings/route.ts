import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { getStorefrontSettings, saveStorefrontSettings } from "@/lib/storefront-settings";
import { invalidateAllDataCache } from "@/lib/queries";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

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
    if (Array.isArray(body.spotlightItemIds)) {
      try {
        const ids = body.spotlightItemIds as number[];
        if (ids.length > 0) {
          // Mark selected as featured
          await supabase.from("items").update({ is_featured: true }).in("id", ids);
          // Unmark others
          await supabase
            .from("items")
            .update({ is_featured: false })
            .not("id", "in", `(${ids.join(",")})`);
        } else {
          // Unmark all
          await supabase.from("items").update({ is_featured: false }).neq("id", 0);
        }
      } catch (dbErr) {
        console.warn("Supabase is_featured sync skipped or failed:", dbErr);
      }
    }

    // Invalidate server queries cache and Next.js ISR caches
    invalidateAllDataCache();
    try {
      revalidatePath("/shop", "layout");
      revalidatePath("/shop");
      revalidatePath("/shop/catalog");
      revalidatePath("/shop/offers");
      revalidatePath("/");
      revalidateTag("inventory-data", "max");
    } catch {
      // Ignore cache error in non-request environments
    }

    return NextResponse.json({ ok: true, settings: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to save storefront settings";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

