"use client";

import { useState } from "react";
import type { ItemPhoto } from "@/db/schema";
import { Thumb } from "./ui";
import { cn } from "@/lib/format";

export function ShareGallery({ photos, name }: { photos: ItemPhoto[]; name: string }) {
  const [ix, setIx] = useState(0);
  if (photos.length === 0) {
    return <Thumb className="aspect-[4/3] w-full rounded-2xl" iconClassName="h-20 w-20" />;
  }
  return (
    <div>
      <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-sm">
        <Thumb url={photos[Math.min(ix, photos.length - 1)].url} alt={name} className="aspect-[4/3] w-full" />
      </div>
      {photos.length > 1 && (
        <div className="mt-3 grid grid-cols-4 gap-2.5">
          {photos.map((p, i) => (
            <button
              key={i}
              onClick={() => setIx(i)}
              className={cn(
                "overflow-hidden rounded-xl border-2 transition",
                i === ix ? "border-amber-500" : "border-transparent opacity-70 hover:opacity-100"
              )}
            >
              <Thumb url={p.url} alt={p.label} className="aspect-[4/3] w-full" />
              <span className="block truncate bg-white px-1.5 py-1 text-[10px] font-semibold text-stone-500">
                {p.label}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
