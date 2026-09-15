"use client";

import { useEffect, useState } from "react";
import {
  Check,
  Copy,
  Link2,
  Loader2,
  Mail,
  MessageCircle,
  Send,
  ShieldAlert,
  X,
} from "lucide-react";
import { cn, fmtMoney } from "@/lib/format";

export type ShareInfo = {
  token: string;
  remarks: string | null;
  offerPrice: number | null;
  active: boolean;
};

export function ShareModal({
  open,
  onClose,
  itemId,
  sku,
  itemName,
  listedPrice,
  conditionNotes,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  itemId: number;
  sku: string | null;
  itemName: string;
  listedPrice: number | null;
  conditionNotes: string | null;
  initial: ShareInfo | null;
}) {
  const [share, setShare] = useState<ShareInfo | null>(initial);
  const [remarks, setRemarks] = useState(initial?.remarks ?? conditionNotes ?? "");
  const [offer, setOffer] = useState(initial?.offerPrice ? String(initial.offerPrice) : "");
  const [busy, setBusy] = useState<"save" | "disable" | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // re-sync when opened for another item or after refresh
  useEffect(() => {
    if (open) {
      setShare(initial);
      setRemarks(initial?.remarks ?? conditionNotes ?? "");
      setOffer(initial?.offerPrice ? String(initial.offerPrice) : "");
      setError(null);
      setCopied(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial]);

  if (!open) return null;

  const url = share ? `${typeof window !== "undefined" ? window.location.origin : ""}/share/${share.token}` : null;

  const save = async () => {
    setBusy("save");
    setError(null);
    try {
      const res = await fetch(`/api/items/${itemId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ remarks, offerPrice: offer ? Number(offer) : null }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.message ?? data.error ?? "Could not create the link");
      } else {
        setShare(data.share);
      }
    } catch {
      setError("Network error — please try again.");
    } finally {
      setBusy(null);
    }
  };

  const disable = async () => {
    setBusy("disable");
    const res = await fetch(`/api/items/${itemId}/share`, { method: "DELETE" });
    if (res.ok) {
      const data = await res.json();
      setShare(data.share);
    }
    setBusy(null);
  };

  const copy = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked */
    }
  };

  const text = encodeURIComponent(`${itemName} — pre-owned, inspected by Etjoaigi Trading ${url ?? ""}`);
  const mailto = `mailto:?subject=${encodeURIComponent(`${itemName} — Etjoaigi Trading`)}&body=${text}`;

  const actionBtn =
    "inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-[12.5px] font-semibold transition";

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-stone-950/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="card w-full max-w-lg p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.16em] text-amber-700">
              <Link2 className="h-3.5 w-3.5" /> Customer share link
            </div>
            <h3 className="mt-1.5 font-display text-[22px] font-semibold tracking-tight text-stone-900">
              Share with a customer
            </h3>
            <p className="mt-1 text-[12.5px] leading-relaxed text-stone-500">
              A clean, public page for <span className="font-semibold text-stone-700">{itemName}</span> — photos,
              specs, your remarks and the price. No internal costs or margins are ever exposed.
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4">
          <label className="label">Remarks for the customer</label>
          <textarea
            className="input"
            rows={3}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="e.g. Barely used, from a BPO office in BGC. Mechanism tested — invite your client to try it."
          />
        </div>
        <div className="mt-3">
          <label className="label">Custom offer price (₱) — optional</label>
          <input
            className="input tabular-nums"
            type="number"
            min={0}
            value={offer}
            onChange={(e) => setOffer(e.target.value)}
            placeholder={listedPrice ? `${listedPrice} (current ask)` : "Shown price defaults to the current ask"}
          />
          <p className="mt-1 text-[11px] text-stone-400">Leave blank to display the live asking price.</p>
        </div>

        {error && (
          <div className="mt-3 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] text-rose-700">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" /> {error}
          </div>
        )}

        <button onClick={save} disabled={busy != null} className="btn-accent mt-4 w-full">
          {busy === "save" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {share ? "Update link" : "Generate link"}
        </button>

        {share && (
          <div className="mt-4 rounded-2xl border border-[var(--line)] bg-stone-50/70 p-3.5">
            <div className="flex items-center justify-between gap-2">
              <span className={cn("chip", share.active ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-stone-200 bg-stone-100 text-stone-500")}>
                {share.active ? "Link is live" : "Link disabled"}
              </span>
              {share.offerPrice != null && (
                <span className="text-[11.5px] text-stone-500">
                  shows offer <span className="font-bold text-stone-800 tabular-nums">{fmtMoney(share.offerPrice)}</span>
                </span>
              )}
            </div>
            {url && (
              <div className="mt-2.5 flex gap-2">
                <input readOnly className="input h-9 flex-1 bg-white font-mono text-[11.5px] text-stone-600" value={url} onFocus={(e) => e.target.select()} />
              </div>
            )}
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              <button onClick={copy} disabled={!share.active} className={cn(actionBtn, copied ? "bg-emerald-100 text-emerald-700" : "bg-stone-900 text-white hover:bg-stone-700")}>
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied" : "Copy link"}
              </button>
              <a href={`https://wa.me/?text=${text}`} target="_blank" rel="noreferrer" className={cn(actionBtn, "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-100")}>
                <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
              </a>
              <a href={`viber://forward?text=${text}`} className={cn(actionBtn, "bg-violet-50 text-violet-700 ring-1 ring-violet-200 hover:bg-violet-100")}>
                <Send className="h-3.5 w-3.5" /> Viber
              </a>
              <a href={mailto} className={cn(actionBtn, "bg-white text-stone-600 ring-1 ring-stone-200 hover:bg-stone-100")}>
                <Mail className="h-3.5 w-3.5" /> Email
              </a>
              {share.active && (
                <button onClick={disable} disabled={busy != null} className={cn(actionBtn, "ml-auto text-rose-500 hover:bg-rose-50")}>
                  {busy === "disable" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
                  Disable
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
