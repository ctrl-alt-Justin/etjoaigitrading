"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Bell, 
  Check, 
  X, 
  Phone, 
  Mail, 
  ExternalLink, 
  Clock, 
  User, 
  ShoppingBag,
  Sparkles,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import { fmtMoney, relTime } from "@/lib/format";
import Link from "next/link";

export interface ReservationItem {
  id: string;
  itemId: number;
  itemName: string;
  itemPrice?: number;
  itemPhoto?: string;
  itemSku?: string | null;
  customerName: string;
  customerContact: string;
  notes?: string;
  status: "pending" | "confirmed" | "released";
  createdAt: string;
}

export function DashboardReservations() {
  const [reservations, setReservations] = useState<ReservationItem[]>([]);
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending" | "confirmed">("all");
  const [activeToast, setActiveToast] = useState<ReservationItem | null>(null);
  const prevCountRef = useRef<number>(0);
  const hasInitialized = useRef<boolean>(false);

  const fetchReservations = async () => {
    try {
      const res = await fetch("/api/reservations");
      if (res.ok) {
        const data = await res.json();
        const list: ReservationItem[] = data.reservations || [];
        setReservations(list);

        const pendingList = list.filter((r) => r.status === "pending");

        // Trigger pop-up notification if new pending reservation arrived
        if (hasInitialized.current && pendingList.length > prevCountRef.current && pendingList[0]) {
          setActiveToast(pendingList[0]);
        }

        prevCountRef.current = pendingList.length;
        hasInitialized.current = true;
      }
    } catch {
      // offline or network hiccup
    }
  };

  useEffect(() => {
    fetchReservations();

    // Polling interval
    const interval = setInterval(fetchReservations, 4000);

    // Cross-tab broadcast channel for instantaneous response
    let channel: BroadcastChannel | null = null;
    try {
      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        channel = new BroadcastChannel("etjoaigi_reservations");
        channel.onmessage = () => {
          fetchReservations();
        };
      }
    } catch {
      // ignore
    }

    return () => {
      clearInterval(interval);
      if (channel) channel.close();
    };
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: "confirmed" | "released") => {
    try {
      const res = await fetch("/api/reservations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (res.ok) {
        setReservations((prev) =>
          prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
        );
      }
    } catch {
      // handle error
    }
  };

  const pendingCount = reservations.filter((r) => r.status === "pending").length;

  const filtered = reservations.filter((r) => {
    if (filter === "all") return true;
    return r.status === filter;
  });

  return (
    <>
      {/* Bell Button */}
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            setOpen(!open);
            setActiveToast(null);
          }}
          className={`relative flex h-9 w-9 items-center justify-center rounded-xl border transition shadow-sm ${
            open
              ? "border-[#1D5D8B] bg-[#1D5D8B] text-white"
              : pendingCount > 0
                ? "border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100"
                : "border-stone-200 bg-white text-stone-700 hover:bg-stone-50 hover:text-stone-900"
          }`}
          aria-label="View customer reservation requests"
          title={pendingCount > 0 ? `${pendingCount} pending reservation requests` : "Customer Reservations"}
        >
          <Bell className={`h-4 w-4 ${pendingCount > 0 ? "text-amber-600" : ""}`} />
          {pendingCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-black text-white shadow-sm ring-2 ring-white">
              {pendingCount}
            </span>
          )}
        </button>

        {/* Dropdown Menu / Flyout */}
        {open && (
          <div className="absolute right-0 top-full mt-2 z-50 w-[380px] sm:w-[460px] rounded-2xl border border-stone-200 bg-white p-4 shadow-2xl animate-in fade-in-50 zoom-in-95">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
                  <Bell className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-display text-sm font-bold text-stone-900">
                    Customer Reservation Requests
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    Incoming holds from Customer Catalog & Cart
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="mt-3 flex items-center gap-1.5 border-b border-stone-100 pb-2.5 text-xs">
              <button
                type="button"
                onClick={() => setFilter("all")}
                className={`rounded-lg px-2.5 py-1 font-semibold transition ${
                  filter === "all" ? "bg-stone-900 text-white" : "text-stone-500 hover:bg-stone-100"
                }`}
              >
                All ({reservations.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter("pending")}
                className={`rounded-lg px-2.5 py-1 font-semibold transition ${
                  filter === "pending" ? "bg-amber-600 text-white" : "text-stone-500 hover:bg-stone-100"
                }`}
              >
                Pending Review ({pendingCount})
              </button>
              <button
                type="button"
                onClick={() => setFilter("confirmed")}
                className={`rounded-lg px-2.5 py-1 font-semibold transition ${
                  filter === "confirmed" ? "bg-emerald-600 text-white" : "text-stone-500 hover:bg-stone-100"
                }`}
              >
                Confirmed ({reservations.filter((r) => r.status === "confirmed").length})
              </button>
            </div>

            {/* List */}
            <div className="mt-3 max-h-[380px] overflow-y-auto space-y-3 pr-1">
              {filtered.length === 0 ? (
                <div className="py-8 text-center text-xs text-stone-400">
                  No reservation requests in this view
                </div>
              ) : (
                filtered.map((item) => (
                  <div
                    key={item.id}
                    className={`rounded-xl border p-3 text-xs transition ${
                      item.status === "pending"
                        ? "border-amber-200 bg-amber-50/40"
                        : item.status === "confirmed"
                          ? "border-emerald-200 bg-emerald-50/30"
                          : "border-stone-100 bg-stone-50/60 opacity-60"
                    }`}
                  >
                    {/* Top Row: Item name & Status */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-display font-bold text-stone-900 truncate">
                          {item.itemName}
                        </div>
                        {item.itemPrice && (
                          <div className="font-bold text-[#1D5D8B] text-[11.5px]">
                            {fmtMoney(item.itemPrice)}
                          </div>
                        )}
                      </div>

                      <span
                        className={`inline-flex shrink-0 items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          item.status === "pending"
                            ? "bg-amber-100 text-amber-800"
                            : item.status === "confirmed"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-stone-200 text-stone-600"
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>

                    {/* Customer info */}
                    <div className="mt-2.5 rounded-lg bg-white/80 border border-stone-100 p-2 space-y-1">
                      <div className="flex items-center gap-1.5 font-semibold text-stone-800">
                        <User className="h-3 w-3 text-stone-400" />
                        <span>{item.customerName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-stone-600">
                        <span className="font-mono text-[11px]">{item.customerContact}</span>
                        {item.customerContact.includes("@") ? (
                          <a
                            href={`mailto:${item.customerContact}`}
                            className="text-[#1D5D8B] hover:underline"
                            title="Email Customer"
                          >
                            <Mail className="h-3 w-3" />
                          </a>
                        ) : (
                          <a
                            href={`tel:${item.customerContact}`}
                            className="text-[#1D5D8B] hover:underline"
                            title="Call Customer"
                          >
                            <Phone className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                      {item.notes && (
                        <div className="text-[10.5px] italic text-stone-500 pt-0.5">
                          &ldquo;{item.notes}&rdquo;
                        </div>
                      )}
                    </div>

                    {/* Footer: Date & Actions */}
                    <div className="mt-3 flex items-center justify-between pt-1">
                      <span className="text-[10px] text-stone-400">
                        {relTime(item.createdAt)}
                      </span>

                      <div className="flex items-center gap-1.5">
                        {item.status === "pending" && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(item.id, "confirmed")}
                              className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm hover:bg-emerald-700 transition"
                            >
                              <Check className="h-3 w-3" /> Confirm & Hold
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(item.id, "released")}
                              className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-2 py-1 text-[11px] font-semibold text-stone-600 hover:bg-stone-50 transition"
                            >
                              <X className="h-3 w-3" /> Release
                            </button>
                          </>
                        )}

                        {item.status === "confirmed" && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(item.id, "released")}
                            className="text-[10.5px] font-semibold text-stone-500 hover:text-rose-600 underline"
                          >
                            Release Hold
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Realtime Toast Pop-up Notification */}
      {activeToast && (
        <div className="fixed bottom-6 right-6 z-50 w-full max-w-sm rounded-2xl border-2 border-amber-300 bg-white p-4 shadow-2xl shadow-amber-900/10 animate-in slide-in-from-bottom-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-md">
              <Bell className="h-5 w-5 animate-pulse" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-700">
                  New Reservation Request
                </span>
                <button
                  type="button"
                  onClick={() => setActiveToast(null)}
                  className="text-stone-400 hover:text-stone-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="mt-1 font-display font-bold text-stone-900 text-sm truncate">
                {activeToast.customerName}
              </div>

              <p className="text-xs text-stone-600 mt-0.5 truncate">
                Reserved: <strong>{activeToast.itemName}</strong>
              </p>

              {activeToast.itemPrice && (
                <div className="mt-1 text-xs font-bold text-[#1D5D8B]">
                  {fmtMoney(activeToast.itemPrice)}
                </div>
              )}

              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setOpen(true);
                    setActiveToast(null);
                  }}
                  className="rounded-lg bg-amber-600 px-3 py-1 text-xs font-bold text-white shadow-sm hover:bg-amber-700 transition"
                >
                  Review Request
                </button>
                <button
                  type="button"
                  onClick={() => setActiveToast(null)}
                  className="rounded-lg border border-stone-200 px-2.5 py-1 text-xs font-semibold text-stone-600 hover:bg-stone-50"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
