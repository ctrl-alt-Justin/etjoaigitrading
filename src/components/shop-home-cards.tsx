"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Heart, 
  ShoppingBag, 
  Check, 
  ArrowRight, 
  Sparkles, 
  Eye, 
  ShieldCheck, 
  Award,
  ChevronRight
} from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { useFavorites } from "@/components/favorites-provider";
import { fmtMoney } from "@/lib/format";
import { Thumb, ProductHoverThumb } from "@/components/ui";
import { type DbItem } from "@/db/schema";
import { normalizeRefPhoto } from "@/lib/taxonomy-data";

interface Props {
  spotlightItem?: DbItem | null;
  featuredItems: DbItem[];
  categories: { id: number; slug: string; name: string; parentId: number | null }[];
}

export function HeroSpotlightCard({ item }: { item: DbItem }) {
  const { addToCart } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [added, setAdded] = useState(false);

  const fav = isFavorite(item.id);
  const photoUrl = item.photos?.[0]?.url;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!item.listedPrice) return;
    addToCart({
      id: item.id,
      name: item.name,
      price: item.listedPrice,
      photo: photoUrl,
      brand: item.brand,
      model: item.model,
      grade: item.grade,
      color: item.color,
      sku: item.sku,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  const handleFav = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!item.listedPrice) return;
    toggleFavorite({
      id: item.id,
      name: item.name,
      price: item.listedPrice,
      photo: photoUrl,
      brand: item.brand,
      model: item.model,
      grade: item.grade,
      color: item.color,
      sku: item.sku,
    });
  };

  const discountPct = item.benchmarkPrice && item.listedPrice
    ? Math.round(((item.benchmarkPrice - item.listedPrice) / item.benchmarkPrice) * 100)
    : null;

  return (
    <div className="relative group overflow-hidden rounded-3xl border border-white/20 bg-white/10 p-5 shadow-2xl backdrop-blur-xl transition duration-500 hover:border-white/30 hover:bg-white/[0.14]">
      {/* Top row: tags and favorite button */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#16c4df] px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-[#17364b] shadow-sm">
            <Sparkles className="h-3 w-3" /> Spotlight Pick
          </span>
          {item.grade && (
            <span className="rounded-full border border-white/30 bg-white/20 px-2.5 py-0.5 text-[10.5px] font-bold text-white backdrop-blur">
              Grade {item.grade} · {item.grade === "A" ? "Like New" : item.grade === "B" ? "Good" : "Inspected"}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleFav}
          aria-label={fav ? "Remove from favorites" : "Add to favorites"}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur transition hover:bg-white hover:text-[#17364b]"
        >
          <Heart className={`h-4 w-4 ${fav ? "fill-[#16c4df] text-[#16c4df]" : "text-white"}`} />
        </button>
      </div>

      {/* Image container */}
      <Link href={`/shop/${item.id}`} className="block relative mt-4 h-56 w-full rounded-2xl bg-white/10 p-4 transition group-hover:bg-white/15">
        <ProductHoverThumb
          photos={item.photos}
          alt={item.name}
          className="h-full w-full object-contain drop-shadow-md"
        />
        {discountPct && discountPct > 0 && (
          <div className="absolute bottom-3 left-3 rounded-md bg-[#ff4a68] px-2 py-0.5 text-[11px] font-black uppercase tracking-wider text-white shadow">
            Save {discountPct}% vs New
          </div>
        )}
      </Link>

      {/* Item info */}
      <div className="mt-4">
        <div className="text-[11px] font-bold uppercase tracking-widest text-[#a9e4f1]">
          {item.brand ?? "Designer Workspace"}
        </div>
        <Link href={`/shop/${item.id}`} className="mt-0.5 block font-display text-xl font-bold text-white hover:text-[#16c4df] transition">
          {item.name}
        </Link>
        <div className="mt-1 flex items-center gap-2 text-xs text-white/70">
          {item.color && <span>{item.color}</span>}
          {item.color && item.material && <span>·</span>}
          {item.material && <span className="truncate max-w-[200px]">{item.material}</span>}
        </div>

        {/* Pricing + Action */}
        <div className="mt-4 flex items-center justify-between border-t border-white/15 pt-3.5">
          <div>
            <div className="text-xl font-black text-white">
              {item.listedPrice ? fmtMoney(item.listedPrice) : "—"}
            </div>
            {item.benchmarkPrice && (
              <div className="text-[11px] text-white/60 line-through">
                Retail {fmtMoney(item.benchmarkPrice)}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/shop/${item.id}`}
              className="inline-flex h-9 items-center justify-center rounded-xl bg-white/20 px-3 text-xs font-bold text-white transition hover:bg-white/30"
            >
              Details
            </Link>
            <button
              type="button"
              onClick={handleAdd}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-[#16c4df] px-3.5 text-xs font-bold text-[#17364b] shadow transition hover:bg-[#70e2ef] active:scale-95"
            >
              {added ? (
                <>
                  <Check className="h-3.5 w-3.5" /> Added
                </>
              ) : (
                <>
                  <ShoppingBag className="h-3.5 w-3.5" /> Add
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function FeaturedProductsGrid({
  items,
  categories,
}: {
  items: DbItem[];
  categories: { id: number; slug: string; name: string; parentId: number | null }[];
}) {
  const { addToCart } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [addedMap, setAddedMap] = useState<Record<number, boolean>>({});

  const rootCategories = categories.filter((c) => c.parentId == null);

  // Filter items based on active root category
  const filtered = items.filter((item) => {
    if (activeCategory === "all") return true;
    const cat = categories.find((c) => c.id === item.categoryId);
    if (!cat) return false;
    if (cat.slug === activeCategory) return true;
    if (cat.parentId != null) {
      const parent = categories.find((c) => c.id === cat.parentId);
      return parent?.slug === activeCategory;
    }
    return false;
  });

  const handleAdd = (item: DbItem, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!item.listedPrice) return;
    addToCart({
      id: item.id,
      name: item.name,
      price: item.listedPrice,
      photo: item.photos?.[0]?.url,
      brand: item.brand,
      model: item.model,
      grade: item.grade,
      color: item.color,
      sku: item.sku,
    });
    setAddedMap((prev) => ({ ...prev, [item.id]: true }));
    setTimeout(() => {
      setAddedMap((prev) => ({ ...prev, [item.id]: false }));
    }, 1800);
  };

  const handleToggleFav = (item: DbItem, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!item.listedPrice) return;
    toggleFavorite({
      id: item.id,
      name: item.name,
      price: item.listedPrice,
      photo: item.photos?.[0]?.url,
      brand: item.brand,
      model: item.model,
      grade: item.grade,
      color: item.color,
      sku: item.sku,
    });
  };

  return (
    <div>
      {/* Category Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveCategory("all")}
            className={`rounded-full px-4 py-2 text-xs font-bold transition ${
              activeCategory === "all"
                ? "bg-[#1D5D8B] text-white shadow-sm"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
          >
            All Featured ({items.length})
          </button>
          {rootCategories.map((c) => (
            <button
              key={c.slug}
              type="button"
              onClick={() => setActiveCategory(c.slug)}
              className={`rounded-full px-4 py-2 text-xs font-bold transition ${
                activeCategory === c.slug
                  ? "bg-[#1D5D8B] text-white shadow-sm"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        <Link
          href="/shop/catalog"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1D5D8B] hover:underline"
        >
          View Full Catalog ({items.length}+ in stock) <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Grid of Items */}
      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.slice(0, 8).map((item) => {
          const fav = isFavorite(item.id);
          const isAdded = !!addedMap[item.id];
          const photoUrl = item.photos?.[0]?.url;
          const discountPct = item.benchmarkPrice && item.listedPrice
            ? Math.round(((item.benchmarkPrice - item.listedPrice) / item.benchmarkPrice) * 100)
            : null;

          return (
            <article
              key={item.id}
              className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-stone-200/90 bg-white p-4 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#16c4df] hover:shadow-xl"
            >
              {/* Top Bar: Grade Badge + Favorite Button */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  {item.grade ? (
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-black tracking-wide ${
                        item.grade === "A"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : item.grade === "B"
                          ? "bg-sky-50 text-sky-700 border border-sky-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}
                    >
                      Grade {item.grade} · {item.grade === "A" ? "Like New" : item.grade === "B" ? "Good" : "Fair"}
                    </span>
                  ) : (
                    <span className="rounded bg-stone-100 px-2 py-0.5 text-[10px] font-semibold text-stone-600">
                      Inspected
                    </span>
                  )}
                  {discountPct && discountPct > 0 && (
                    <span className="rounded bg-[#ff4a68] px-1.5 py-0.5 text-[9.5px] font-bold uppercase text-white shadow-sm">
                      -{discountPct}%
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={(e) => handleToggleFav(item, e)}
                  aria-label={fav ? "Remove from favorites" : "Add to favorites"}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-stone-100 text-stone-400 transition hover:bg-white hover:text-[#ff4a68] hover:shadow-sm"
                >
                  <Heart className={`h-4 w-4 ${fav ? "fill-[#ff4a68] text-[#ff4a68]" : ""}`} />
                </button>
              </div>

              {/* Product Image Link with Hover to Setup View */}
              <Link href={`/shop/${item.id}`} className="mt-3 block group/img">
                <div className="relative flex h-48 w-full items-center justify-center rounded-xl bg-[#f7f9fa] p-3 transition group-hover/img:bg-[#edf4f7]">
                  <ProductHoverThumb
                    photos={item.photos}
                    alt={item.name}
                    className="h-40 w-full"
                  />
                </div>
              </Link>

              {/* Content info */}
              <div className="mt-3 flex-1 flex flex-col justify-between">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                    {item.brand ?? "Designer Workstation"}
                  </div>
                  <Link
                    href={`/shop/${item.id}`}
                    className="mt-0.5 line-clamp-1 font-display text-[15px] font-bold text-stone-900 transition group-hover:text-[#1D5D8B]"
                  >
                    {item.name}
                  </Link>
                  {item.material && (
                    <p className="mt-0.5 line-clamp-1 text-[11px] text-stone-500">
                      {item.material}
                    </p>
                  )}
                </div>

                {/* Pricing & Add Button */}
                <div className="mt-4 flex items-center justify-between border-t border-stone-100 pt-3">
                  <div>
                    <div className="font-bold text-stone-900 text-base">
                      {item.listedPrice ? fmtMoney(item.listedPrice) : "—"}
                    </div>
                    {item.benchmarkPrice && (
                      <div className="text-[10.5px] text-stone-400 line-through">
                        Orig. {fmtMoney(item.benchmarkPrice)}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={(e) => handleAdd(item, e)}
                    className="flex h-8 items-center gap-1.5 rounded-lg bg-[#1D5D8B] px-3 text-xs font-semibold text-white shadow-sm transition hover:bg-[#16486B] active:scale-95"
                  >
                    {isAdded ? (
                      <>
                        <Check className="h-3.5 w-3.5" /> Added
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="h-3.5 w-3.5" /> Add
                      </>
                    )}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
