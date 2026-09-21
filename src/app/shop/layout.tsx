import type { ReactNode } from "react";
import { ShopMobileNav } from "@/components/shop-mobile-nav";

export default function ShopLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen pb-16 md:pb-0">
      {children}
      <ShopMobileNav />
    </div>
  );
}
