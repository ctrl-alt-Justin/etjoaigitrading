"use client";

import { useEffect, useState } from "react";

export function DashboardRealtimeClock({ initialDate }: { initialDate?: string }) {
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setMounted(true);
    setNow(new Date());
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!mounted || !now) {
    return (
      <span className="inline-flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Live
        </span>
        <span className="font-medium text-stone-700">{initialDate || "Live trading floor"}</span>
      </span>
    );
  }

  const dateStr = now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const timeStr = now.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  return (
    <span className="inline-flex items-center gap-2">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200 shadow-sm">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
        Live
      </span>
      <span className="font-medium text-stone-700">
        {dateStr} · <span className="tabular-nums font-semibold text-stone-900">{timeStr}</span>
      </span>
    </span>
  );
}
