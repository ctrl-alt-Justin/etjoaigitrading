"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  BadgePercent,
  ShieldCheck,
  ArrowRightCircle
} from "lucide-react";

interface Photo {
  url: string;
}

export interface ProductItem {
  id: string | number;
  name: string;
  condition?: string | null;
  listedPrice?: number | null;
  originalPrice?: number | null;
  photos?: Photo[] | null;
  brand?: string | null;
}

interface HeroSpotlightCardProps {
  items: ProductItem[];
}

export function HeroSpotlightCard({ items }: HeroSpotlightCardProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const AUTO_PLAY_INTERVAL = 6000;
  const total = items.length;

  const handleNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % total);
  }, [total]);

  const handlePrev = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  // Auto-play
  useEffect(() => {
    if (isHovered || total <= 1) return;
    const timer = setInterval(handleNext, AUTO_PLAY_INTERVAL);
    return () => clearInterval(timer);
  }, [isHovered, total, handleNext]);

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const diff = touchStartX.current - touchEndX.current;
    if (diff > 50) handleNext();
    else if (diff < -50) handlePrev();
    touchStartX.current = null;
    touchEndX.current = null;
  };

  if (!items || total === 0) return null;

  const activeItem = items[activeIndex];
  const price = activeItem.listedPrice ?? 0;
  const hasSavings = !!(activeItem.originalPrice && activeItem.originalPrice > price);
  const savingsPercent = hasSavings && activeItem.originalPrice
    ? Math.round(((activeItem.originalPrice - price) / activeItem.originalPrice) * 100)
    : 0;

  return (
    <div
      className="relative w-full select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top Header Row */}
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[#16c4df] animate-pulse" />
          <span className="text-xs font-black uppercase tracking-[0.2em] text-[#a9c8da]">
            Featured Gallery
          </span>
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold text-white tabular-nums">
            {activeIndex + 1} / {total}
          </span>
        </div>

        {/* Navigation arrows */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handlePrev}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-white/80 transition hover:bg-[#16c4df] hover:text-[#071c2e] hover:border-[#16c4df] active:scale-95 shadow-md"
            aria-label="Previous"
            title="Previous"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-white/80 transition hover:bg-[#16c4df] hover:text-[#071c2e] hover:border-[#16c4df] active:scale-95 shadow-md"
            aria-label="Next"
            title="Next"
          >
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Single Item Showcase Stage with Smooth Cross-Fade */}
      <div className="relative w-full py-2 h-[300px] sm:h-[340px] flex items-center justify-center overflow-hidden">
        {items.map((item, idx) => {
          const isActive = idx === activeIndex;
          const itemPrice = item.listedPrice ?? 0;
          const itemSavings = !!(item.originalPrice && item.originalPrice > itemPrice);
          const itemPercent = itemSavings && item.originalPrice
            ? Math.round(((item.originalPrice - itemPrice) / item.originalPrice) * 100)
            : 0;

          return (
            <div
              key={item.id}
              className={`absolute inset-0 flex items-center justify-center transition-all duration-700 ease-in-out ${
                isActive
                  ? "opacity-100 pointer-events-auto z-10 scale-100"
                  : "opacity-0 pointer-events-none z-0 scale-95"
              }`}
              aria-hidden={!isActive}
            >
              <div className="relative w-full max-w-[480px] h-full flex items-center justify-center p-2 sm:p-4">
                {item.photos?.[0]?.url ? (
                  <Link
                    href={`/shop/${item.id}`}
                    className="relative w-full h-full flex items-center justify-center group/img"
                    aria-label={`View details for ${item.name}`}
                  >
                    <Image
                      src={item.photos[0].url}
                      alt={item.name}
                      fill
                      sizes="(max-width: 768px) 90vw, 550px"
                      priority={isActive}
                      className="object-contain w-full h-full drop-shadow-[0_16px_36px_rgba(0,0,0,0.65)] transition-transform duration-500 ease-out group-hover/img:scale-105"
                    />
                  </Link>
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-white/5 text-white/30 text-sm rounded-2xl">
                    No Photo
                  </div>
                )}

                {/* Active Item Badges */}
                {isActive && (
                  <div className="absolute top-2 inset-x-4 flex items-center justify-between gap-1.5 pointer-events-none z-10">
                    {item.condition ? (
                      <span className="rounded-full bg-[#071c2e]/90 border border-sky-400/30 px-2.5 py-0.5 text-[9.5px] font-black uppercase tracking-wider text-sky-200 backdrop-blur-md shadow-md">
                        {item.condition}
                      </span>
                    ) : (
                      <span />
                    )}
                    {itemSavings && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[#16c4df] to-[#0ea5e9] px-2.5 py-0.5 text-[9.5px] font-black uppercase tracking-wider text-[#071c2e] shadow-[0_0_12px_rgba(22,196,223,0.4)]">
                        <BadgePercent className="h-2.5 w-2.5" /> Save {itemPercent}%
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Standalone Borderless Info Deck (Constant Sized with min-h and reserved title space) */}
      <div key={activeItem.id} className="mt-4 pt-3 border-t border-white/10 animate-fade-slide-up min-h-[175px] flex flex-col justify-between">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="h-4 min-h-[16px] flex items-center mb-1">
              {activeItem.brand ? (
                <div className="text-[10.5px] font-black uppercase tracking-[0.2em] text-[#16c4df]">
                  {activeItem.brand}
                </div>
              ) : (
                <div className="text-[10.5px] font-black uppercase tracking-[0.2em] text-[#16c4df]/70">
                  Curated Collection
                </div>
              )}
            </div>
            <div className="h-14 sm:h-16 flex items-start">
              <h3 className="font-display text-lg sm:text-xl font-black text-white leading-tight tracking-tight line-clamp-2">
                {activeItem.name}
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#a9c8da]">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-[#16c4df] shrink-0" />
                <span>Tested & Inspected Condition</span>
              </div>
              <span className="text-white/20">•</span>
              <div>Ready for courier dispatch</div>
            </div>
          </div>

          <div className="flex items-baseline gap-2 sm:flex-col sm:items-end sm:gap-0 sm:justify-end shrink-0 pt-0.5">
            <span className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-none">
              ₱{price.toLocaleString()}
            </span>
            {hasSavings && activeItem.originalPrice ? (
              <span className="text-sm text-white/50 line-through sm:mt-1">
                ₱{activeItem.originalPrice.toLocaleString()}
              </span>
            ) : (
              <span className="h-4 sm:mt-1 hidden sm:block" />
            )}
          </div>
        </div>

        {/* Action Button: Check details (redirects to the item's info page) */}
        <div className="mt-4 flex flex-col sm:flex-row items-center gap-3">
          <Link
            href={`/shop/${activeItem.id}`}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-xl bg-[#16c4df] px-7 py-3 text-xs font-black uppercase tracking-widest text-[#071c2e] shadow-[0_8px_25px_rgba(22,196,223,0.3)] transition duration-300 hover:bg-white hover:-translate-y-0.5 active:scale-95 group/btn"
          >
            Check details
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover/btn:translate-x-1" />
          </Link>

          <span className="text-[11px] font-bold text-white/40 italic">
            * 1 verified unit in stock
          </span>
        </div>
      </div>

      {/* Progress Dots */}
      {total > 1 && (
        <div className="mt-5 flex items-center gap-2 justify-center">
          {items.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
              className="group relative h-1.5 rounded-full overflow-hidden transition-all duration-500"
              style={{
                width: idx === activeIndex ? "36px" : "8px",
                backgroundColor:
                  idx === activeIndex
                    ? "rgba(255,255,255,0.15)"
                    : "rgba(255,255,255,0.2)",
              }}
              aria-label={`Go to slide ${idx + 1}`}
            >
              {idx === activeIndex && (
                <span
                  key={`progress-${activeIndex}-${isHovered}`}
                  className={`absolute inset-y-0 left-0 bg-[#16c4df] rounded-full ${
                    isHovered ? "w-full" : "w-0 animate-spotlight-progress"
                  }`}
                  style={{ animationDuration: `${AUTO_PLAY_INTERVAL}ms` }}
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}