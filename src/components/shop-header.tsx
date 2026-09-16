"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ShoppingBag, Heart, Search, Menu, X, Trash2, ArrowRight } from "lucide-react";
import { Logo } from "@/components/shell";
import { useCart } from "@/components/cart-provider";
import { useFavorites } from "@/components/favorites-provider";
import { fmtMoney } from "@/lib/format";
import { Thumb } from "@/components/ui";
import { useState, useEffect, useRef, Suspense } from "react";

function ShopHeaderInner() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { totalCount, addToCart } = useCart();
  const { favorites, favoritesCount, removeFavorite } = useFavorites();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [favoritesOpen, setFavoritesOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParams?.get("q") ?? "");

  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSearchQuery(searchParams?.get("q") ?? "");
  }, [searchParams]);

  // Click outside to close favorites popup
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setFavoritesOpen(false);
      }
    }
    if (favoritesOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [favoritesOpen]);

  const isCatalog = pathname.startsWith("/shop/catalog");
  const isOffers = pathname.startsWith("/shop/offers");
  const isCart = pathname.startsWith("/shop/cart");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) {
      router.push(`/shop/catalog?q=${encodeURIComponent(q)}`);
    } else {
      router.push(`/shop/catalog`);
    }
  };

  const handleQuickAdd = (fav: (typeof favorites)[0]) => {
    addToCart({
      id: fav.id,
      name: fav.name,
      price: fav.price,
      photo: fav.photo,
      brand: fav.brand,
      model: fav.model,
      grade: fav.grade,
      color: fav.color,
      sku: fav.sku,
    });
  };

  return (
    <header className="sticky top-0 z-50 border-b border-[#8ab7d2]/30 bg-[#1D5D8B]/95 backdrop-blur-md text-[#FCFDF8]">
      <div className="mx-auto flex max-w-[1480px] items-center justify-between gap-4 px-5 py-3 sm:px-8">
        {/* Left: Brand & Nav Links */}
        <div className="flex items-center gap-8">
          <Link href="/shop" prefetch={true} className="transition duration-200 hover:opacity-90">
            <Logo light subtitle="Furnitures" />
          </Link>

          <nav className="hidden items-center gap-6 text-[13px] font-bold tracking-wide md:flex">
            <Link
              href="/shop/catalog"
              prefetch={true}
              className={`transition-colors hover:text-[#16c4df] ${
                isCatalog ? "text-[#16c4df]" : ""
              }`}
            >
              Catalogs
            </Link>
            <Link
              href="/shop/offers"
              prefetch={true}
              className={`transition-colors hover:text-[#16c4df] ${
                isOffers ? "text-[#16c4df]" : ""
              }`}
            >
              Offers
            </Link>
          </nav>
        </div>

        {/* Center: Search input */}
        <form
          onSubmit={handleSearch}
          className="relative hidden max-w-md flex-1 sm:block lg:max-w-lg"
        >
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/70" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="What are you looking for?"
            className="h-9 w-full rounded-full border border-white/20 bg-white/15 pl-10 pr-4 text-xs font-medium text-white placeholder-white/70 outline-none transition focus:border-[#16c4df] focus:bg-white/25 focus:ring-1 focus:ring-[#16c4df]"
          />
        </form>

        {/* Right: Actions */}
        <div className="relative flex items-center gap-2 sm:gap-3" ref={popupRef}>
          {/* Favorites Heart Button */}
          <button
            type="button"
            onClick={() => setFavoritesOpen(!favoritesOpen)}
            aria-label="Favorites"
            className="relative p-2 text-[#FCFDF8] transition hover:scale-105 hover:text-[#16c4df]"
          >
            <Heart
              className={`h-5 w-5 ${
                favoritesCount > 0 ? "fill-[#16c4df] text-[#16c4df]" : ""
              }`}
              strokeWidth={2}
            />
            {favoritesCount > 0 && (
              <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#16c4df] px-1 text-[9px] font-black text-[#17364b] shadow-sm animate-in zoom-in-50">
                {favoritesCount}
              </span>
            )}
          </button>

          {/* Favorites Popup Dialog */}
          {favoritesOpen && (
            <div className="absolute right-0 top-12 z-50 w-80 sm:w-96 bg-white p-4 text-[#17364b] shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4 fill-[#16c4df] text-[#16c4df]" />
                  <h4 className="font-display text-xs font-black uppercase tracking-wider text-[#1D5D8B]">
                    Favorited Items ({favoritesCount})
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setFavoritesOpen(false)}
                  className="p-1 text-stone-400 hover:text-stone-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {favorites.length === 0 ? (
                <div className="py-6 text-center text-xs text-stone-500">
                  <p className="font-semibold text-stone-700">No favorites yet</p>
                  <p className="mt-1 text-[11px] text-stone-400">
                    Click the heart icon on any piece to save it here.
                  </p>
                </div>
              ) : (
                <div className="mt-3 divide-y divide-stone-100 max-h-72 overflow-y-auto">
                  {favorites.slice(0, 4).map((fav) => (
                    <div key={fav.id} className="flex items-center gap-3 py-2.5">
                      <Link
                        href={`/shop/${fav.id}`}
                        onClick={() => setFavoritesOpen(false)}
                        className="h-12 w-14 shrink-0 overflow-hidden border border-stone-200 bg-stone-50 p-1"
                      >
                        <Thumb
                          url={fav.photo}
                          alt={fav.name}
                          className="h-full w-full object-contain"
                        />
                      </Link>

                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/shop/${fav.id}`}
                          onClick={() => setFavoritesOpen(false)}
                          className="block truncate text-xs font-bold text-[#17364b] hover:text-[#1D5D8B]"
                        >
                          {fav.name}
                        </Link>
                        <div className="text-[11px] font-black text-[#1D5D8B]">
                          {fmtMoney(fav.price)}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleQuickAdd(fav)}
                          title="Add to cart"
                          className="flex h-7 w-7 items-center justify-center bg-[#e4f4f4] text-[#1D5D8B] hover:bg-[#16c4df] hover:text-[#17364b] transition"
                        >
                          <ShoppingBag className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeFavorite(fav.id)}
                          title="Remove favorite"
                          className="flex h-7 w-7 items-center justify-center text-stone-400 hover:bg-rose-50 hover:text-rose-600 transition"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {favorites.length > 0 && (
                <div className="mt-3 border-t border-stone-100 pt-2.5 text-center">
                  <Link
                    href="/shop/favorites"
                    prefetch={true}
                    onClick={() => setFavoritesOpen(false)}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1D5D8B] hover:text-[#16c4df] transition"
                  >
                    See more favorited items <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Cart Icon */}
          <Link
            href="/shop/cart"
            prefetch={true}
            aria-label="Shopping Cart"
            className={`relative p-2 text-[#FCFDF8] transition hover:scale-105 hover:text-[#16c4df] ${
              isCart ? "text-[#16c4df]" : ""
            }`}
          >
            <ShoppingBag className="h-5 w-5" strokeWidth={2} />
            {totalCount > 0 && (
              <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#16c4df] px-1 text-[9px] font-black text-[#17364b] shadow-sm animate-in zoom-in-50">
                {totalCount}
              </span>
            )}
          </Link>

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
            className="p-2 text-[#FCFDF8] transition hover:text-[#16c4df] md:hidden"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile search bar & menu */}
      <div className="border-t border-white/10 px-5 py-2 sm:hidden">
        <form onSubmit={handleSearch} className="relative w-full">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/70" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="What are you looking for?"
            className="h-8 w-full rounded-full border border-white/20 bg-white/15 pl-9 pr-3 text-xs text-white placeholder-white/70 outline-none focus:border-[#16c4df]"
          />
        </form>
      </div>

      {mobileMenuOpen && (
        <div className="border-t border-[#8ab7d2]/20 bg-[#16486B] px-6 py-4 md:hidden">
          <nav className="flex flex-col gap-3 text-sm font-bold">
            <Link
              href="/shop"
              onClick={() => setMobileMenuOpen(false)}
              className={`py-1.5 transition-colors hover:text-[#16c4df] ${
                pathname === "/shop" ? "text-[#16c4df]" : ""
              }`}
            >
              Home
            </Link>
            <Link
              href="/shop/catalog"
              onClick={() => setMobileMenuOpen(false)}
              className={`py-1.5 transition-colors hover:text-[#16c4df] ${
                isCatalog ? "text-[#16c4df]" : ""
              }`}
            >
              Catalogs
            </Link>
            <Link
              href="/shop/offers"
              onClick={() => setMobileMenuOpen(false)}
              className={`py-1.5 transition-colors hover:text-[#16c4df] ${
                isOffers ? "text-[#16c4df]" : ""
              }`}
            >
              Offers
            </Link>
            <Link
              href="/shop/favorites"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between py-1.5 transition-colors hover:text-[#16c4df]"
            >
              <span>Favorites</span>
              {favoritesCount > 0 && (
                <span className="rounded-full bg-[#16c4df] px-2 py-0.5 text-[10px] font-bold text-[#17364b]">
                  {favoritesCount} saved
                </span>
              )}
            </Link>
            <Link
              href="/shop/cart"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center justify-between py-1.5 transition-colors hover:text-[#16c4df] ${
                isCart ? "text-[#16c4df]" : ""
              }`}
            >
              <span>Shopping Cart</span>
              {totalCount > 0 && (
                <span className="rounded-full bg-[#16c4df] px-2 py-0.5 text-[10px] font-bold text-[#17364b]">
                  {totalCount} items
                </span>
              )}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}

export function ShopHeader() {
  return (
    <Suspense
      fallback={
        <header className="sticky top-0 z-40 h-[68px] w-full border-b border-[#164e75] bg-[#1D5D8B]">
          <div className="mx-auto flex h-full max-w-[1480px] items-center justify-between px-4 sm:px-8">
            <Link href="/shop" className="flex items-center gap-3">
              <span className="font-hegarty text-2xl font-black tracking-tight text-[#FCFDF8]">
                ETJOAIGI
              </span>
            </Link>
          </div>
        </header>
      }
    >
      <ShopHeaderInner />
    </Suspense>
  );
}
