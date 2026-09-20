"use client";

import Link from "next/link";
import { 
  Heart, 
  ShoppingBag, 
  Trash2, 
  ArrowLeft, 
  ArrowRight, 
  Building2, 
  Check 
} from "lucide-react";
import { useFavorites } from "@/components/favorites-provider";
import { useCart } from "@/components/cart-provider";
import { ShopHeader } from "@/components/shop-header";
import { ShopFooter } from "@/components/shop-footer";
import { ScrollToTop } from "@/components/scroll-to-top";
import { Thumb } from "@/components/ui";
import { fmtMoney, relTime } from "@/lib/format";
import type { Grade } from "@/db/schema";
import { useState } from "react";

export default function ShopFavoritesPage() {
  const { favorites, removeFavorite, clearFavorites } = useFavorites();
  const { addToCart } = useCart();
  const [addedIds, setAddedIds] = useState<Set<number>>(new Set());

  const handleAddToCart = (item: (typeof favorites)[0]) => {
    addToCart({
      id: item.id,
      name: item.name,
      price: item.price,
      photo: item.photo,
      brand: item.brand,
      model: item.model,
      grade: item.grade,
      color: item.color,
      sku: item.sku,
    });
    setAddedIds((prev) => new Set(prev).add(item.id));
    setTimeout(() => {
      setAddedIds((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-[#FCFDF8] text-[#17364b] antialiased">
      <ShopHeader />

      <main className="mx-auto max-w-[1480px] px-5 pb-24 pt-6 sm:px-8">
        {/* Top breadcrumb bar */}
        <div className="flex items-center justify-between border-b border-[#8edce8]/30 pb-4">
          <div className="flex items-center gap-3">
            <h1 className="font-display text-3xl font-black uppercase tracking-tight text-[#1D5D8B] sm:text-4xl">
              Favorited Pieces
            </h1>
            <span className="rounded-full bg-[#e4f4f4] px-3 py-0.5 text-xs font-bold text-[#1D5D8B]">
              {favorites.length} {favorites.length === 1 ? "piece" : "pieces"}
            </span>
          </div>

          <div className="flex items-center gap-4">
            {favorites.length > 0 && (
              <button
                type="button"
                onClick={clearFavorites}
                className="text-xs font-semibold text-rose-600 hover:text-rose-800 transition"
              >
                Clear All
              </button>
            )}
            <Link
              href="/shop/catalog"
              className="group flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#1D5D8B] transition hover:text-[#16c4df]"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              Continue Browsing
            </Link>
          </div>
        </div>

        {favorites.length === 0 ? (
          /* Empty State */
          <div className="mx-auto mt-16 max-w-md border border-dashed border-[#8edce8] bg-white p-12 text-center shadow-sm">
            <div className="mx-auto flex h-20 w-20 items-center justify-center bg-[#e4f4f4] text-[#16c4df]">
              <Heart className="h-10 w-10 text-[#16c4df]" strokeWidth={1.5} />
            </div>
            <h2 className="mt-5 font-display text-2xl font-black text-[#17364b]">
              No favorited pieces yet
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-[#557287]">
              Click the heart icon on any product card in our catalog or offers page to save pieces to your wishlist.
            </p>
            <div className="mt-6">
              <Link
                href="/shop/catalog"
                className="inline-flex items-center gap-2 bg-[#16c4df] px-6 py-3 text-xs font-bold uppercase tracking-wider text-[#17364b] shadow-md transition duration-200 hover:-translate-y-0.5 hover:bg-[#70e2ef]"
              >
                Explore Catalog <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        ) : (
          /* Grid of Favorites */
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {favorites.map((item) => {
              const isAdded = addedIds.has(item.id);
              return (
                <article
                  key={item.id}
                  className="group relative flex flex-col justify-between overflow-hidden border border-stone-200 bg-white p-4 shadow-sm transition hover:border-[#16c4df] hover:shadow-lg"
                >
                  <div>
                    {/* Image Area */}
                    <Link
                      href={`/shop/${item.id}`}
                      className="relative flex h-52 w-full items-center justify-center bg-[#f5f2eb]/70 p-4 transition group-hover:bg-[#efebe2]"
                    >
                      <Thumb
                        url={item.photo}
                        alt={item.name}
                        className="h-44 w-full object-contain transition duration-500 group-hover:scale-105"
                      />
                    </Link>

                    {/* Meta & Title */}
                    <div className="mt-4 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {item.brand && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#557287]">
                            {item.brand}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-stone-400">
                        {relTime(item.addedAt)}
                      </span>
                    </div>

                    <Link href={`/shop/${item.id}`}>
                      <h3 className="mt-1 font-display text-base font-bold text-[#17364b] group-hover:text-[#1D5D8B] transition line-clamp-1">
                        {item.name}
                      </h3>
                    </Link>

                    <div className="mt-2 font-display text-lg font-black text-[#17364b]">
                      {fmtMoney(item.price)}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 flex items-center gap-2 border-t border-stone-100 pt-3">
                    <button
                      type="button"
                      onClick={() => handleAddToCart(item)}
                      className={`flex flex-1 h-9 items-center justify-center gap-1.5 text-xs font-bold transition shadow-sm ${
                        isAdded
                          ? "bg-emerald-600 text-white"
                          : "bg-[#16c4df] text-[#17364b] hover:bg-[#70e2ef]"
                      }`}
                    >
                      {isAdded ? (
                        <>
                          <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                          Added to Cart
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="h-3.5 w-3.5" />
                          Add to Cart
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => removeFavorite(item.id)}
                      aria-label={`Remove ${item.name} from favorites`}
                      className="flex h-9 w-9 items-center justify-center text-stone-400 hover:bg-rose-50 hover:text-rose-600 transition"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      <ShopFooter />

      <ScrollToTop />
    </div>
  );
}
