"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Armchair, 
  LayoutGrid, 
  Sparkles, 
  Heart, 
  ShoppingBag 
} from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { useFavorites } from "@/components/favorites-provider";

export function ShopMobileNav() {
  const pathname = usePathname();
  const { totalCount } = useCart();
  const { favoritesCount } = useFavorites();

  const isHome = pathname === "/shop" || pathname === "/shop/";
  const isCatalog = pathname.startsWith("/shop/catalog");
  const isOffers = pathname.startsWith("/shop/offers");
  const isFavorites = pathname.startsWith("/shop/favorites");
  const isCart = pathname.startsWith("/shop/cart");

  const navItems = [
    {
      href: "/shop",
      label: "Home",
      icon: Armchair,
      active: isHome,
      badge: null,
    },
    {
      href: "/shop/catalog",
      label: "Catalog",
      icon: LayoutGrid,
      active: isCatalog,
      badge: null,
    },
    {
      href: "/shop/offers",
      label: "Offers",
      icon: Sparkles,
      active: isOffers,
      badge: null,
    },
    {
      href: "/shop/favorites",
      label: "Favorites",
      icon: Heart,
      active: isFavorites,
      badge: favoritesCount > 0 ? favoritesCount : null,
    },
    {
      href: "/shop/cart",
      label: "Cart",
      icon: ShoppingBag,
      active: isCart,
      badge: totalCount > 0 ? totalCount : null,
    },
  ];

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 md:hidden pointer-events-none">
      <nav 
        aria-label="Mobile Navigation Bar"
        className="pointer-events-auto mx-auto w-full border-t border-white/10 bg-[#071c2e]/95 backdrop-blur-xl px-2 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom,0.5rem))] shadow-[0_-8px_24px_rgba(0,0,0,0.35)]"
      >
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                className={`relative flex flex-1 flex-col items-center justify-center py-1 text-center transition-all duration-150 active:scale-90 ${
                  item.active
                    ? "text-[#16c4df]"
                    : "text-stone-400 hover:text-stone-200"
                }`}
              >
                <div className="relative">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-xl transition ${
                      item.active
                        ? "bg-[#16c4df]/15 shadow-[0_0_12px_rgba(22,196,223,0.3)]"
                        : "bg-transparent"
                    }`}
                  >
                    <Icon
                      className={`h-4.5 w-4.5 ${
                        item.active
                          ? "stroke-[2.5]"
                          : "stroke-[1.8]"
                      } ${item.label === "Favorites" && item.active ? "fill-[#16c4df]" : ""}`}
                    />
                  </div>

                  {/* Realtime Dynamic Count Badge */}
                  {item.badge != null && item.badge > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#16c4df] px-1 text-[9px] font-black text-[#071c2e] ring-2 ring-[#071c2e] shadow-sm animate-in zoom-in-50">
                      {item.badge}
                    </span>
                  )}
                </div>

                <span
                  className={`mt-0.5 text-[10px] tracking-tight ${
                    item.active
                      ? "font-extrabold text-[#16c4df]"
                      : "font-semibold text-stone-400"
                  }`}
                >
                  {item.label}
                </span>

                {/* Micro indicator dot */}
                {item.active && (
                  <span className="absolute -bottom-0.5 h-1 w-1 rounded-full bg-[#16c4df] shadow-[0_0_6px_#16c4df]" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
