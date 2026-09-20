"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  CalendarClock,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Phone,
  Mail,
  ArrowUpRight,
  RefreshCw,
  Trash2,
  Filter,
  Check,
  Building2,
  Package,
  Layers,
  AlertCircle,
  Copy
} from "lucide-react";
import { fmtMoney, fmtDateFull, relTime } from "@/lib/format";
import { Thumb } from "@/components/ui";

export interface ReservationItem {
  id: string;
  itemId?: number;
  itemName: string;
  itemPrice?: number | null;
  itemPhoto?: string | null;
  itemSku?: string | null;
  customerName: string;
  customerContact: string;
  notes?: string;
  status: "pending" | "confirmed" | "dismissed";
  createdAt: string;
}

type FilterTab = "all" | "pending" | "confirmed" | "dismissed";

export function ReservationsManager({ initialData = [] }: { initialData?: ReservationItem[] }) {
  const [reservations, setReservations] = useState<ReservationItem[]>(initialData);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const fetchReservations = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const res = await fetch("/api/reservations");
      if (res.ok) {
        const data = await res.json();
        setReservations(data.reservations || []);
      }
    } catch (err) {
      console.error("Failed to load reservations:", err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchReservations();
    const interval = setInterval(fetchReservations, 5000);

    let channel: BroadcastChannel | null = null;
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      channel = new BroadcastChannel("etjoaigi_reservations");
      channel.onmessage = () => {
        fetchReservations();
        showToast("New customer reservation received!");
      };
    }

    return () => {
      clearInterval(interval);
      if (channel) channel.close();
    };
  }, [fetchReservations]);

  const updateStatus = async (id: string, newStatus: "pending" | "confirmed" | "dismissed") => {
    try {
      setBusyId(id);
      const res = await fetch("/api/reservations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });

      if (res.ok) {
        setReservations((prev) =>
          prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
        );

        // Broadcast to other tabs & header bell
        if (typeof window !== "undefined" && "BroadcastChannel" in window) {
          const bc = new BroadcastChannel("etjoaigi_reservations");
          bc.postMessage({ type: "status_change", id, status: newStatus });
          bc.close();
        }

        const label = newStatus === "confirmed" ? "Confirmed" : newStatus === "dismissed" ? "Released" : "Pending";
        showToast(`Reservation marked as ${label}`);
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      setBusyId(null);
    }
  };

  const deleteReservation = async (id: string) => {
    if (!confirm("Are you sure you want to delete this reservation log permanently?")) return;
    try {
      setBusyId(id);
      const res = await fetch(`/api/reservations?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setReservations((prev) => prev.filter((r) => r.id !== id));
        if (typeof window !== "undefined" && "BroadcastChannel" in window) {
          const bc = new BroadcastChannel("etjoaigi_reservations");
          bc.postMessage({ type: "deleted", id });
          bc.close();
        }
        showToast("Reservation record deleted");
      }
    } catch (err) {
      console.error("Failed to delete reservation:", err);
    } finally {
      setBusyId(null);
    }
  };

  const copyContact = (contact: string, id: string) => {
    navigator.clipboard.writeText(contact);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    showToast(`Copied ${contact} to clipboard`);
  };

  // Metrics
  const pendingCount = reservations.filter((r) => r.status === "pending").length;
  const confirmedCount = reservations.filter((r) => r.status === "confirmed").length;
  const dismissedCount = reservations.filter((r) => r.status === "dismissed").length;
  const totalValueOnHold = reservations
    .filter((r) => r.status !== "dismissed")
    .reduce((sum, r) => sum + (r.itemPrice || 0), 0);

  // Filter & Search
  const filtered = useMemo(() => {
    return reservations.filter((r) => {
      if (activeTab === "pending" && r.status !== "pending") return false;
      if (activeTab === "confirmed" && r.status !== "confirmed") return false;
      if (activeTab === "dismissed" && r.status !== "dismissed") return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = r.customerName?.toLowerCase().includes(q);
        const matchContact = r.customerContact?.toLowerCase().includes(q);
        const matchItem = r.itemName?.toLowerCase().includes(q);
        const matchSku = r.itemSku?.toLowerCase().includes(q);
        const matchNotes = r.notes?.toLowerCase().includes(q);
        return matchName || matchContact || matchItem || matchSku || matchNotes;
      }
      return true;
    });
  }, [reservations, activeTab, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-stone-900 px-4 py-2.5 text-xs font-semibold text-white shadow-2xl animate-in slide-in-from-bottom-3">
          <CheckCircle2 className="h-4 w-4 text-[#16c4df]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {/* 1. Pending Inquiries */}
        <div className="card p-4 border border-amber-200/90 bg-amber-50/50 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
              Pending Holds
            </span>
            <Clock className="h-4 w-4 text-amber-600" />
          </div>
          <div className="mt-2 font-display text-3xl font-bold text-amber-950 tabular-nums">
            {pendingCount}
          </div>
          <p className="mt-1 text-[11px] text-amber-800/80">
            Awaiting sales rep confirmation & viewing
          </p>
        </div>

        {/* 2. Confirmed Holds */}
        <div className="card p-4 border border-emerald-200/90 bg-emerald-50/50 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
              Confirmed Holds
            </span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2 font-display text-3xl font-bold text-emerald-950 tabular-nums">
            {confirmedCount}
          </div>
          <p className="mt-1 text-[11px] text-emerald-800/80">
            Showroom inspection or pending dispatch
          </p>
        </div>

        {/* 3. Total Value on Hold */}
        <div className="card p-4 border border-blue-200/90 bg-blue-50/50 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#1D5D8B]">
              Total Value on Hold
            </span>
            <Building2 className="h-4 w-4 text-[#16c4df]" />
          </div>
          <div className="mt-2 font-display text-3xl font-bold text-[#17364b] tabular-nums">
            {fmtMoney(totalValueOnHold)}
          </div>
          <p className="mt-1 text-[11px] text-[#3e6074]">
            Active customer reservation value
          </p>
        </div>

        {/* 4. Total Inquiries */}
        <div className="card p-4 border border-stone-200/90 bg-white shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-600">
              Total Inquiries
            </span>
            <Layers className="h-4 w-4 text-stone-400" />
          </div>
          <div className="mt-2 font-display text-3xl font-bold text-stone-900 tabular-nums">
            {reservations.length}
          </div>
          <p className="mt-1 text-[11px] text-stone-500">
            All reservation requests logged to date
          </p>
        </div>
      </div>

      {/* Control Bar: Search, Tabs & Refresh */}
      <div className="card p-3.5 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                activeTab === "all"
                  ? "bg-stone-900 text-white"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              All Requests ({reservations.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("pending")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                activeTab === "pending"
                  ? "bg-amber-600 text-white"
                  : "bg-amber-50 text-amber-800 hover:bg-amber-100"
              }`}
            >
              Pending ({pendingCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("confirmed")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                activeTab === "confirmed"
                  ? "bg-emerald-700 text-white"
                  : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
              }`}
            >
              Confirmed ({confirmedCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("dismissed")}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                activeTab === "dismissed"
                  ? "bg-stone-700 text-white"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              Released ({dismissedCount})
            </button>
          </div>

          {/* Search & Refresh */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search customer, piece, SKU..."
                className="input h-9 w-full pl-9 text-xs"
              />
            </div>
            <button
              type="button"
              onClick={fetchReservations}
              disabled={isRefreshing}
              title="Refresh reservations"
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-stone-200 px-3 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-[#1D5D8B]" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Reservations Table / Cards */}
      <div className="card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-14 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-100 text-stone-400">
              <CalendarClock className="h-6 w-6" />
            </div>
            <h3 className="mt-3 font-display text-base font-bold text-stone-900">
              No reservations found
            </h3>
            <p className="mt-1 text-xs text-stone-500 max-w-sm mx-auto">
              {searchQuery
                ? `No requests match “${searchQuery}”. Try clearing your search query.`
                : "When buyers reserve pieces via the shop cart, they will appear here in real time."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50/70 text-[10.5px] font-bold uppercase tracking-wider text-stone-500">
                  <th className="py-3 pl-4 pr-3">Reserved Piece</th>
                  <th className="px-3 py-3">Customer & Contact</th>
                  <th className="px-3 py-3 text-right">Price</th>
                  <th className="px-3 py-3 text-center">Status</th>
                  <th className="px-3 py-3">Time</th>
                  <th className="px-3 py-3">Inquiry Notes</th>
                  <th className="py-3 pl-3 pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filtered.map((r) => {
                  const isPending = r.status === "pending";
                  const isConfirmed = r.status === "confirmed";
                  const isBusy = busyId === r.id;

                  return (
                    <tr
                      key={r.id}
                      className={`transition-colors hover:bg-stone-50/80 ${
                        isPending ? "bg-amber-50/20" : ""
                      }`}
                    >
                      {/* Piece info */}
                      <td className="py-3.5 pl-4 pr-3">
                        <div className="flex items-center gap-3">
                          <Thumb
                            url={r.itemPhoto}
                            alt={r.itemName}
                            className="h-11 w-11 shrink-0 rounded-lg border border-stone-200 object-contain p-0.5 bg-white"
                          />
                          <div className="min-w-0">
                            <div className="font-bold text-stone-900 truncate max-w-[220px]">
                              {r.itemName}
                            </div>
                            <div className="mt-0.5 flex items-center gap-2 text-[11px] text-stone-400">
                              {r.itemSku && <span>SKU: {r.itemSku}</span>}
                              {r.itemId && (
                                <Link
                                  href={`/inventory/${r.itemId}`}
                                  className="inline-flex items-center gap-0.5 text-[#1D5D8B] hover:underline font-semibold"
                                >
                                  Unit #{r.itemId} <ArrowUpRight className="h-3 w-3" />
                                </Link>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Customer info */}
                      <td className="px-3 py-3.5">
                        <div className="font-bold text-stone-900">{r.customerName}</div>
                        <div className="mt-1 flex items-center gap-1.5 text-stone-500 font-mono text-[11px]">
                          <span>{r.customerContact}</span>
                          <button
                            type="button"
                            onClick={() => copyContact(r.customerContact, r.id)}
                            title="Copy contact"
                            className="text-stone-400 hover:text-stone-700"
                          >
                            {copiedId === r.id ? (
                              <Check className="h-3 w-3 text-emerald-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-[10.5px]">
                          {r.customerContact.includes("@") ? (
                            <a
                              href={`mailto:${r.customerContact}?subject=ETJOAIGI%20Reservation%3A%20${encodeURIComponent(r.itemName)}`}
                              className="text-[#1D5D8B] hover:underline inline-flex items-center gap-0.5"
                            >
                              <Mail className="h-3 w-3" /> Email Customer
                            </a>
                          ) : (
                            <a
                              href={`tel:${r.customerContact}`}
                              className="text-[#1D5D8B] hover:underline inline-flex items-center gap-0.5"
                            >
                              <Phone className="h-3 w-3" /> Call Customer
                            </a>
                          )}
                        </div>
                      </td>

                      {/* Price */}
                      <td className="px-3 py-3.5 text-right font-display font-black text-stone-900 tabular-nums">
                        {r.itemPrice ? fmtMoney(r.itemPrice) : "—"}
                      </td>

                      {/* Status */}
                      <td className="px-3 py-3.5 text-center">
                        {r.status === "pending" && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-800">
                            <Clock className="h-3 w-3 text-amber-600" /> Pending Hold
                          </span>
                        )}
                        {r.status === "confirmed" && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                            <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Confirmed
                          </span>
                        )}
                        {r.status === "dismissed" && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-stone-200 bg-stone-100 px-2.5 py-0.5 text-[11px] font-bold text-stone-600">
                            Released
                          </span>
                        )}
                      </td>

                      {/* Date & RelTime */}
                      <td className="px-3 py-3.5 text-stone-600 whitespace-nowrap">
                        <div className="font-medium text-stone-800">{fmtDateFull(r.createdAt)}</div>
                        <div className="text-[10.5px] text-stone-400">{relTime(r.createdAt)}</div>
                      </td>

                      {/* Notes */}
                      <td className="px-3 py-3.5 max-w-[200px]">
                        <p className="line-clamp-2 text-stone-600 italic">
                          {r.notes ? `“${r.notes}”` : "—"}
                        </p>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 pl-3 pr-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {isPending && (
                            <button
                              type="button"
                              onClick={() => updateStatus(r.id, "confirmed")}
                              disabled={isBusy}
                              className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-700 shadow-sm disabled:opacity-50"
                            >
                              <Check className="h-3.5 w-3.5" /> Confirm
                            </button>
                          )}
                          {!isPending && (
                            <button
                              type="button"
                              onClick={() => updateStatus(r.id, "pending")}
                              disabled={isBusy}
                              className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-stone-50 px-2 py-1.5 text-xs font-semibold text-stone-700 transition hover:bg-stone-100 disabled:opacity-50"
                            >
                              Set Pending
                            </button>
                          )}
                          {r.status !== "dismissed" && (
                            <button
                              type="button"
                              onClick={() => updateStatus(r.id, "dismissed")}
                              disabled={isBusy}
                              className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-2 py-1.5 text-xs font-semibold text-stone-600 transition hover:bg-stone-100 hover:text-stone-900 disabled:opacity-50"
                            >
                              Release
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => deleteReservation(r.id)}
                            disabled={isBusy}
                            title="Delete reservation permanently"
                            className="rounded-lg p-1.5 text-stone-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
