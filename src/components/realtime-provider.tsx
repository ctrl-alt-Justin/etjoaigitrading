"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase-client";

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const client = getSupabaseBrowserClient();
    if (!client) return;

    const triggerRefresh = () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      refreshTimeoutRef.current = setTimeout(() => {
        router.refresh();
      }, 120);
    };

    const channel = client
      .channel("global-realtime-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "items" },
        (payload) => {
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("supabase:items:change", { detail: payload }));
          }
          triggerRefresh();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "price_events" },
        (payload) => {
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("supabase:price_events:change", { detail: payload }));
          }
          triggerRefresh();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "item_shares" },
        (payload) => {
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("supabase:item_shares:change", { detail: payload }));
          }
          triggerRefresh();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "categories" },
        () => {
          triggerRefresh();
        }
      )
      .subscribe();

    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      client.removeChannel(channel);
    };
  }, [router]);

  return <>{children}</>;
}
