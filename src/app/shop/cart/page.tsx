"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingBag, 
  ArrowLeft, 
  CheckSquare, 
  Square, 
  BadgeCheck, 
  MapPin, 
  ArrowRight,
  ShieldCheck,
  Building2,
  Mail,
  CheckCircle
} from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { ShopHeader } from "@/components/shop-header";
import { ShopFooter } from "@/components/shop-footer";
import { fmtMoney } from "@/lib/format";
import { Thumb } from "@/components/ui";
import { ScrollToTop } from "@/components/scroll-to-top";

export default function ShopCartPage() {
  const { items, updateQuantity, removeFromCart, clearCart } = useCart();

  // Selected item IDs (default: all selected)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(() => new Set(items.map((i) => i.id)));
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerContact, setCustomerContact] = useState("");
  const [inquirySent, setInquirySent] = useState(false);

  // Sync selectedIds if new items arrive
  const allSelected = items.length > 0 && items.every((i) => selectedIds.has(i.id));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((i) => i.id)));
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Selected items calculation
  const selectedItems = useMemo(
    () => items.filter((item) => selectedIds.has(item.id)),
    [items, selectedIds]
  );

  const selectedCount = useMemo(
    () => selectedItems.reduce((sum, item) => sum + item.quantity, 0),
    [selectedItems]
  );

  const selectedSubtotal = useMemo(
    () => selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [selectedItems]
  );

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: selectedItems.map((i) => ({
            id: i.id,
            name: i.name,
            price: i.price,
            photo: i.photo,
            sku: i.sku,
          })),
          customerName,
          customerContact,
          notes: `Cart reservation for ${selectedCount} pieces. Total: ${fmtMoney(selectedSubtotal)}`,
        }),
      });

      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        const bc = new BroadcastChannel("etjoaigi_reservations");
        bc.postMessage({ type: "new_reservation" });
        bc.close();
      }
    } catch (err) {
      console.error("Failed to post reservation:", err);
    }
    setInquirySent(true);
  };

  return (
    <div className="min-h-screen bg-[#FCFDF8] text-[#17364b] antialiased">
      <ShopHeader />

      <main className="mx-auto max-w-[1480px] px-5 pb-24 pt-6 sm:px-8">
        {/* Top breadcrumb */}
        <div className="flex items-center justify-between border-b border-[#8edce8]/30 pb-4">
          <div className="flex items-center gap-3">
            <h1 className="font-display text-3xl font-black uppercase tracking-tight text-[#1D5D8B] sm:text-4xl">
              Shopping Cart
            </h1>
            <span className="rounded-full bg-[#e4f4f4] px-3 py-0.5 text-xs font-bold text-[#1D5D8B]">
              {items.length} {items.length === 1 ? "item" : "items"}
            </span>
          </div>

          <Link
            href="/shop/catalog"
            className="group flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#1D5D8B] transition hover:text-[#16c4df]"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Continue Shopping
          </Link>
        </div>

        {items.length === 0 ? (
          /* Empty Cart State */
          <div className="mx-auto mt-16 max-w-md rounded-3xl border border-dashed border-[#8edce8] bg-white p-12 text-center shadow-sm">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-[#e4f4f4] text-[#1D5D8B]">
              <ShoppingBag className="h-10 w-10 text-[#16c4df]" strokeWidth={1.5} />
            </div>
            <h2 className="mt-5 font-display text-2xl font-black text-[#17364b]">
              Your cart is empty
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-[#557287]">
              Explore our curated pre-loved office and home furniture drops inspected with transparent grading.
            </p>
            <div className="mt-6">
              <Link
                href="/shop/catalog"
                className="inline-flex items-center gap-2 rounded-xl bg-[#16c4df] px-6 py-3 text-xs font-bold uppercase tracking-wider text-[#17364b] shadow-md transition duration-200 hover:-translate-y-0.5 hover:bg-[#70e2ef]"
              >
                Browse Catalog <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        ) : (
          /* Cart Content Layout */
          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px] lg:gap-12">
            {/* Left: Cart Items List */}
            <div>
              {/* Table Controls */}
              <div className="mb-4 flex items-center justify-between bg-white px-5 py-3 border border-[#d8e2e7] shadow-sm">
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="flex items-center gap-2 text-xs font-bold text-[#1D5D8B] hover:text-[#16486B]"
                >
                  {allSelected ? (
                    <CheckSquare className="h-4 w-4 text-[#16c4df]" />
                  ) : (
                    <Square className="h-4 w-4 text-stone-400" />
                  )}
                  Select All ({items.length})
                </button>

                {items.length > 0 && (
                  <button
                    type="button"
                    onClick={clearCart}
                    className="text-xs font-semibold text-rose-600 hover:text-rose-800"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {/* Items List */}
              <div className="divide-y divide-[#d8e2e7] border border-[#d8e2e7] bg-white shadow-sm overflow-hidden">
                {items.map((item) => {
                  const isChecked = selectedIds.has(item.id);
                  return (
                    <article
                      key={item.id}
                      className={`grid gap-4 p-5 transition sm:grid-cols-[auto_120px_1fr_auto] sm:items-center ${
                        isChecked ? "bg-white" : "bg-stone-50/70 opacity-80"
                      }`}
                    >
                      {/* Checkbox */}
                      <button
                        type="button"
                        onClick={() => toggleSelect(item.id)}
                        aria-label={`Select ${item.name}`}
                        className="flex h-5 w-5 items-center justify-center text-[#1D5D8B]"
                      >
                        {isChecked ? (
                          <CheckSquare className="h-5 w-5 text-[#16c4df]" />
                        ) : (
                          <Square className="h-5 w-5 text-stone-400" />
                        )}
                      </button>

                      {/* Photo Thumbnail */}
                      <Link
                        href={`/shop/${item.id}`}
                        className="relative block h-24 w-28 overflow-hidden border border-stone-200 bg-[#f3f5f1] transition hover:opacity-90"
                      >
                        <Thumb
                          url={item.photo}
                          alt={item.name}
                          className="h-full w-full object-contain p-1"
                        />
                      </Link>

                      {/* Info & Details */}
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          {item.brand && (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#557287]">
                              {item.brand}
                            </span>
                          )}
                        </div>
                        <Link href={`/shop/${item.id}`}>
                          <h3 className="mt-1 font-display text-base font-bold text-[#17364b] hover:text-[#1D5D8B] transition">
                            {item.name}
                          </h3>
                        </Link>
                        <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-[#557287]">
                          {item.color && <span>Color: {item.color}</span>}
                          {item.sku && <span>SKU: {item.sku}</span>}
                        </div>
                        <div className="mt-2 text-sm font-bold text-[#1D5D8B]">
                          {fmtMoney(item.price)}
                        </div>
                      </div>

                      {/* Quantity & Actions */}
                      <div className="flex flex-row items-center justify-between gap-4 sm:flex-col sm:items-end">
                        <div className="flex items-center gap-2">
                          <div className="flex h-9 items-center border border-[#d8e2e7] bg-[#FCFDF8] px-2 shadow-inner">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              aria-label="Decrease quantity"
                              className="flex h-6 w-6 items-center justify-center text-stone-600 hover:bg-stone-200"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="px-2 font-display text-xs font-bold text-[#17364b]">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              aria-label="Increase quantity"
                              className="flex h-6 w-6 items-center justify-center text-stone-600 hover:bg-stone-200"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeFromCart(item.id)}
                            aria-label={`Remove ${item.name} from cart`}
                            className="flex h-9 w-9 items-center justify-center text-stone-400 transition hover:bg-rose-50 hover:text-rose-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="text-right font-display text-base font-black text-[#17364b]">
                          {fmtMoney(item.price * item.quantity)}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>

            {/* Right: Order Summary */}
            <div>
              <div className="sticky top-24 border border-[#8edce8]/50 bg-white p-6 shadow-sm">
                <h2 className="font-display text-xl font-black uppercase tracking-tight text-[#1D5D8B]">
                  Order Summary
                </h2>

                <div className="mt-5 space-y-3 text-xs text-[#3f6175]">
                  <div className="flex justify-between">
                    <span>Selected Items ({selectedCount})</span>
                    <span className="font-bold text-[#17364b]">
                      {fmtMoney(selectedSubtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Showroom Handling & QC</span>
                    <span className="font-bold text-emerald-700">INCLUDED</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Metro Manila Freight</span>
                    <span className="text-stone-500">Calculated upon booking</span>
                  </div>
                </div>

                <div className="mt-5 border-t border-[#8edce8]/40 pt-4 flex justify-between items-baseline">
                  <span className="text-xs font-bold text-[#17364b]">Est. Total</span>
                  <span className="font-display text-2xl font-black text-[#1D5D8B]">
                    {fmtMoney(selectedSubtotal)}
                  </span>
                </div>

                <button
                  type="button"
                  disabled={selectedCount === 0}
                  onClick={() => setCheckoutModalOpen(true)}
                  className="mt-6 flex w-full h-12 items-center justify-center gap-2 bg-[#16c4df] text-xs font-extrabold uppercase tracking-wider text-[#17364b] shadow-md transition duration-200 hover:-translate-y-0.5 hover:bg-[#70e2ef] hover:shadow-lg disabled:opacity-40 disabled:pointer-events-none"
                >
                  <Mail className="h-4 w-4" /> Reserve Selected ({selectedCount})
                </button>

                <div className="mt-6 bg-[#FCFDF8] p-4 border border-[#e4f4f4] space-y-2 text-[11px] text-[#3f6175]">
                  <div className="flex items-center gap-2 font-bold text-[#1D5D8B]">
                    <ShieldCheck className="h-4 w-4 text-[#16c4df]" /> Verified Quality
                  </div>
                  <p>
                    Every piece is thoroughly inspected and verified in good working condition. Pay upon personal inspection or bank transfer before delivery.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Inquiry / Reservation Modal */}
      {checkoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in-50">
          <div className="w-full max-w-lg bg-white p-6 shadow-2xl border border-stone-200 sm:p-8">
            {inquirySent ? (
              <div className="text-center py-6">
                <div className="mx-auto flex h-16 w-16 items-center justify-center bg-emerald-50 text-emerald-600">
                  <CheckCircle className="h-10 w-10" />
                </div>
                <h3 className="mt-4 font-display text-2xl font-black text-[#17364b]">
                  Inquiry Received!
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-[#557287]">
                  Thank you, <strong>{customerName}</strong>. Our team will contact you via <strong>{customerContact}</strong> to confirm piece availability, showroom viewing in Muntinlupa, and delivery scheduling.
                </p>
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setCheckoutModalOpen(false);
                      setInquirySent(false);
                      clearCart();
                    }}
                    className="bg-[#1D5D8B] px-6 py-2.5 text-xs font-bold text-white hover:bg-[#16486B]"
                  >
                    Done & Return to Shop
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                  <h3 className="font-display text-xl font-black text-[#1D5D8B]">
                    Reserve Selected Pieces
                  </h3>
                  <button
                    type="button"
                    onClick={() => setCheckoutModalOpen(false)}
                    className="text-stone-400 hover:text-stone-600 font-bold"
                  >
                    ✕
                  </button>
                </div>

                <div className="mt-4 bg-[#FCFDF8] p-3 border border-stone-100 text-xs">
                  <div className="font-bold text-[#17364b] mb-1">
                    {selectedCount} pieces selected ({fmtMoney(selectedSubtotal)})
                  </div>
                  <ul className="max-h-24 overflow-y-auto space-y-1 text-[#557287]">
                    {selectedItems.map((i) => (
                      <li key={i.id} className="truncate">
                        • {i.quantity}x {i.name} ({fmtMoney(i.price * i.quantity)})
                      </li>
                    ))}
                  </ul>
                </div>

                <form onSubmit={handleInquirySubmit} className="mt-4 space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#557287]">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g. Juan Dela Cruz"
                      className="input mt-1 w-full text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#557287]">
                      Contact Number / Email
                    </label>
                    <input
                      type="text"
                      required
                      value={customerContact}
                      onChange={(e) => setCustomerContact(e.target.value)}
                      placeholder="e.g. 0917-xxx-xxxx or name@example.com"
                      className="input mt-1 w-full text-xs"
                    />
                  </div>

                  <div className="mt-6 flex justify-end gap-2 border-t border-stone-100 pt-4">
                    <button
                      type="button"
                      onClick={() => setCheckoutModalOpen(false)}
                      className="px-4 py-2 text-xs font-semibold text-[#557287] hover:bg-stone-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1.5 bg-[#16c4df] px-5 py-2.5 text-xs font-bold text-[#17364b] shadow-sm hover:bg-[#70e2ef]"
                    >
                      <Mail className="h-3.5 w-3.5" /> Submit Reservation
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      <ShopFooter />

      <ScrollToTop />
    </div>
  );
}
