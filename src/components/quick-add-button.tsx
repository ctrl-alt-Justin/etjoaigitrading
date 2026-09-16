"use client";

import { useState } from "react";
import { ShoppingBag, Check } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import type { DbItem } from "@/db/schema";

export function QuickAddButton({ item, className = "" }: { item: DbItem; className?: string }) {
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);

  if (!item.listedPrice) return null;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart({
      id: item.id,
      name: item.name,
      price: item.listedPrice!,
      photo: item.photos?.[0]?.url,
      color: item.color,
      sku: item.sku,
      brand: item.brand,
      model: item.model,
      grade: item.grade,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={`Add ${item.name} to cart`}
      className={`flex items-center justify-center rounded-xl font-bold transition duration-200 shadow-sm ${
        added
          ? "bg-emerald-600 text-white shadow-emerald-200"
          : "bg-[#16c4df] text-[#17364b] hover:scale-105 hover:bg-[#70e2ef]"
      } ${className}`}
    >
      {added ? (
        <Check className="h-4 w-4" strokeWidth={2.5} />
      ) : (
        <ShoppingBag className="h-4 w-4" />
      )}
    </button>
  );
}
