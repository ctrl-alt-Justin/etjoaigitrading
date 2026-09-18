import Link from "next/link";
import { Building2, MapPin } from "lucide-react";

export function ShopFooter() {
  return (
    <footer className="border-t border-[#8ab7d2]/30 bg-white">
      <div className="mx-auto grid max-w-[1760px] 2xl:max-w-[1840px] gap-8 px-6 py-14 text-sm text-[#294e65] sm:grid-cols-[1.5fr_1fr_1fr_1fr] sm:px-10 lg:px-14 xl:px-16">
        <div>
          <div className="font-hegarty text-3xl font-black tracking-tight text-[#1D5D8B]">
            ETJOAIGI
          </div>
          <div className="mt-1 text-xs font-bold text-[#16c4df]">
            Affordable Finds, Furniture You Can Trust
          </div>
          <p className="mt-2 max-w-xs text-xs leading-relaxed text-[#4e6d82]">
            Bring your dream space to life with stylish furniture, trusted service, and designs made for your lifestyle.
          </p>
          <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-[#1D5D8B]">
            <MapPin className="h-3.5 w-3.5" /> Muntinlupa City, Metro Manila
          </div>
          <div className="mt-4 text-[10px] text-stone-400">
            © {new Date().getFullYear()} ETJOAIGI Trading. All Rights Reserved.
          </div>
        </div>

        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#17364b]">
            CUSTOMER SERVICE
          </div>
          <div className="mt-3 space-y-2 text-xs">
            <p><Link href="/shop/catalog" className="hover:text-[#1D5D8B] hover:underline">Online Catalog</Link></p>
            <p><Link href="/shop/offers" className="hover:text-[#1D5D8B] hover:underline">Special Offers & Deals</Link></p>
            <p><Link href="/shop/cart" className="hover:text-[#1D5D8B] hover:underline">Shopping Cart</Link></p>
            <p><Link href="/shop/favorites" className="hover:text-[#1D5D8B] hover:underline">Saved Favorites</Link></p>
          </div>
        </div>

        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#17364b]">
            COMPANY
          </div>
          <div className="mt-3 space-y-2 text-xs">
            <p><Link href="/shop#showroom" className="hover:text-[#1D5D8B] hover:underline">Showroom Viewing</Link></p>
            <p><Link href="/shop#grading" className="hover:text-[#1D5D8B] hover:underline">Grading Standard</Link></p>
            <p><Link href="/shop#reviews" className="hover:text-[#1D5D8B] hover:underline">Verified Reviews</Link></p>
            <p><span className="text-stone-400 cursor-default">Terms & Conditions</span></p>
          </div>
        </div>

        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#17364b]">
            FOLLOW US
          </div>
          <div className="mt-3 flex items-center gap-2">
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-7 w-7 items-center justify-center rounded border border-stone-800 text-xs font-bold text-stone-900 transition hover:bg-[#16c4df] hover:text-[#17364b] hover:border-[#16c4df]"
              aria-label="Facebook"
            >
              f
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-7 w-7 items-center justify-center rounded border border-stone-800 text-xs font-bold text-stone-900 transition hover:bg-[#16c4df] hover:text-[#17364b] hover:border-[#16c4df]"
              aria-label="Instagram"
            >
              in
            </a>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-stone-500">
            <Building2 className="h-3.5 w-3.5 text-[#1D5D8B]" /> Certified pre-owned inspection
          </div>
        </div>
      </div>
    </footer>
  );
}
