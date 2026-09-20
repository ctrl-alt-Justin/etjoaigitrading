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
  const current = photos[Math.min(ix, photos.length - 1)];
  const isVideo = current?.slot === "video" || current?.url?.startsWith("data:video/") || /\.(mp4|webm|mov)(\?|$)/i.test(current?.url ?? "");

  return (
    <div>
      <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[#fbfcfd] shadow-sm flex items-center justify-center">
        {isVideo ? (
          <video src={current.url} controls className="aspect-[4/3] sm:aspect-[16/11] w-full bg-stone-950 object-contain" />
        ) : (
          <Thumb url={current.url} alt={name} className="aspect-[4/3] sm:aspect-[16/11] w-full object-contain p-3" fit="contain" />
        )}
      </div>
      {photos.length > 1 && (
        <div className="mt-3 grid grid-cols-4 gap-2.5">
          {photos.map((p, i) => (
            <button
              key={i}
              onClick={() => setIx(i)}
              className={cn(
                "overflow-hidden rounded-xl border-2 transition bg-[#fbfcfd]",
                i === ix ? "border-[#1D5D8B] ring-2 ring-[#1D5D8B]/20" : "border-transparent opacity-70 hover:opacity-100"
              )}
            >
              <Thumb url={p.url} alt={p.label} className="aspect-[4/3] w-full object-contain p-1" fit="contain" />
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
