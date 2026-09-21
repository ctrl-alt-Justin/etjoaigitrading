"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Boxes,
  FolderTree,
  LayoutDashboard,
  LogOut,
  PackagePlus,
  Scale,
  ShoppingBag,
  ArrowUpRight,
  CalendarClock,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/format";

export type ShellCounts = {
  active: number;
  intake: number;
  inStock: number;
  listed: number;
  soldMtd: number;
  alerts: number;
};

export function Logo({ light = false, subtitle = "Trading" }: { light?: boolean; subtitle?: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition shadow-sm",
          light
            ? "bg-gradient-to-br from-[#16c4df] to-[#1D5D8B] text-white ring-1 ring-white/20 shadow-[0_0_12px_rgba(22,196,223,0.3)]"
            : "bg-[#1D5D8B] text-white"
        )}
      >
        <svg viewBox="0 0 32 32" className="h-5 w-5 shrink-0" aria-hidden>
          <path d="M11.5 8h6a5 5 0 0 1 5 5v2.5h-11z" fill={light ? "#0B1E2E" : "#FCFDF8"} />
          <rect x="9" y="17" width="15" height="3" rx="1.5" fill={light ? "#0B1E2E" : "#FCFDF8"} />
          <path
            d="M12.2 20.5 10.8 26M21.8 20.5 23.2 26"
            stroke={light ? "#0B1E2E" : "#FCFDF8"}
            strokeWidth="2.3"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <div className="leading-none">
        <div
          className={cn(
            "font-display text-[19px] font-bold tracking-tight",
            light ? "text-white" : "text-stone-900"
          )}
        >
          ETJOAIGI
        </div>
        <div
          className={cn(
            "mt-1 text-[9px] font-extrabold uppercase tracking-[0.24em]",
            light ? "text-[#16c4df]" : "text-[#1D5D8B]"
          )}
        >
          {subtitle}
        </div>
      </div>
    </div>
  );
}

const NAV: {
  group: string;
  items: {
    href: string;
    label: string;
    icon: typeof LayoutDashboard;
    key?: keyof ShellCounts;
    accent?: boolean;
  }[];
}[] = [
  {
    group: "Operate",
    items: [
      { href: "/", label: "Dashboard", icon: LayoutDashboard },
      { href: "/reservations", label: "Reservations", icon: CalendarClock },
      { href: "/inventory/new", label: "Intake desk", icon: PackagePlus, accent: true },
      { href: "/inventory", label: "Inventory", icon: Boxes, key: "active" },
    ],
  },
  {
    group: "Configuration",
    items: [
      { href: "/pricing", label: "Pricing desk", icon: Scale, key: "alerts" },
      { href: "/taxonomy", label: "Taxonomy", icon: FolderTree },
    ],
  },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href === "/inventory/new") return pathname === "/inventory/new";
  if (href === "/inventory") return pathname.startsWith("/inventory") && pathname !== "/inventory/new";
  return pathname.startsWith(href);
}

export function Sidebar({ counts }: { counts: ShellCounts }) {
  const pathname = usePathname();
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[248px] flex-col bg-gradient-to-b from-[#091b29] via-[#0e273b] to-[#071520] border-r border-white/10 shadow-[4px_0_24px_rgba(0,0,0,0.3)] lg:flex overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="pointer-events-none absolute -top-16 -left-16 h-44 w-44 rounded-full bg-[#16c4df]/15 blur-3xl" />
        <div className="pointer-events-none absolute top-1/2 -right-20 h-44 w-44 rounded-full bg-[#1D5D8B]/25 blur-3xl" />

        {/* Brand & Storefront Header */}
        <div className="relative px-5 pb-4 pt-5 border-b border-white/[0.08]">
          <Link href="/" className="inline-block transition hover:opacity-95">
            <Logo light />
          </Link>
          <Link
            href="/shop"
            target="_blank"
            className="mt-3.5 group flex items-center justify-between rounded-xl border border-[#16c4df]/35 bg-gradient-to-r from-[#16c4df]/15 to-[#16c4df]/5 px-3 py-2 text-xs font-semibold text-[#16c4df] shadow-[0_0_12px_rgba(22,196,223,0.08)] transition duration-200 hover:border-[#16c4df]/70 hover:from-[#16c4df]/25 hover:to-[#16c4df]/15 hover:shadow-[0_0_16px_rgba(22,196,223,0.2)]"
          >
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-3.5 w-3.5 transition group-hover:scale-110" />
              <span className="font-medium">Visit Storefront</span>
            </div>
            <ArrowUpRight className="h-3.5 w-3.5 text-[#16c4df]/70 transition group-hover:text-[#16c4df] group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>

        {/* Navigation links */}
        <nav className="relative flex-1 space-y-5 overflow-y-auto px-3 py-4">
          {NAV.map((section) => (
            <div key={section.group}>
              <div className="flex items-center gap-2 px-2.5 pb-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[#7ea1b7]">
                <span>{section.group}</span>
                <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
              </div>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const active = isActive(pathname, item.href);
                  const badge = item.key != null ? counts[item.key] : undefined;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "group relative flex items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-[13px] font-medium transition-all duration-150",
                        active
                          ? "bg-gradient-to-r from-white/[0.14] to-white/[0.04] text-white font-semibold shadow-[0_2px_8px_rgba(0,0,0,0.25)] border border-white/10"
                          : "text-[#9ab7c9] hover:bg-white/[0.06] hover:text-white"
                      )}
                    >
                      {active && (
                        <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-[#16c4df] shadow-[0_0_10px_#16c4df]" />
                      )}
                      <item.icon
                        className={cn(
                          "h-[17px] w-[17px] shrink-0 transition-colors",
                          active
                            ? "text-[#16c4df] drop-shadow-[0_0_6px_rgba(22,196,223,0.5)]"
                            : "text-[#6b8d9f] group-hover:text-[#a8c6d7]"
                        )}
                        strokeWidth={2}
                      />
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.accent && !active && (
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.6)]" />
                      )}
                      {badge != null && badge > 0 && (
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums transition",
                            active
                              ? "bg-[#16c4df]/20 text-[#16c4df] ring-1 ring-[#16c4df]/40 shadow-[0_0_8px_rgba(22,196,223,0.15)]"
                              : item.key === "alerts"
                              ? "bg-rose-500/20 text-rose-300 ring-1 ring-rose-500/35 animate-pulse"
                              : "bg-white/10 text-[#c8dce7] group-hover:bg-white/15 group-hover:text-white"
                          )}
                        >
                          {badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom Panel */}
        <div className="relative px-3 pb-3 pt-1 border-t border-white/[0.06]">
          {/* Stock snapshot HUD widget */}
          <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.02] p-3 backdrop-blur-md shadow-[0_4px_16px_rgba(0,0,0,0.2)]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#7ea1b7]">
                Vault pulse
              </span>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-emerald-400">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                Live
              </span>
            </div>
            <div className="mt-2.5 space-y-1.5 text-[12px]">
              {[
                { label: "In intake", value: counts.intake, dot: "bg-violet-400 shadow-[0_0_6px_rgba(167,139,250,0.6)]" },
                { label: "In stock", value: counts.inStock, dot: "bg-sky-400 shadow-[0_0_6px_rgba(56,189,248,0.6)]" },
                { label: "Listed live", value: counts.listed, dot: "bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.6)]" },
                { label: "Sold this month", value: counts.soldMtd, dot: "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]" },
              ].map((r) => (
                <div key={r.label} className="flex items-center gap-2 text-[#9bb7c9]">
                  <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", r.dot)} />
                  <span className="flex-1 text-[11.5px]">{r.label}</span>
                  <span className="font-semibold tabular-nums text-white text-[12px]">{r.value}</span>
                </div>
              ))}
            </div>
            {counts.alerts > 0 && (
              <Link
                href="/pricing"
                className="mt-2.5 flex items-center justify-between rounded-xl border border-rose-500/30 bg-rose-500/15 px-2.5 py-1.5 text-[11px] font-semibold text-rose-300 shadow-sm transition hover:bg-rose-500/25"
              >
                <span>{counts.alerts} price-aging alert{counts.alerts === 1 ? "" : "s"}</span>
                <span aria-hidden>→</span>
              </Link>
            )}
          </div>

          {/* User profile & quick sign out */}
          <div className="mt-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] p-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#16c4df]/30 to-[#1D5D8B]/60 text-white font-bold text-[11px] ring-1 ring-white/20">
                  ET
                  <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-[#071520]" />
                </div>
                <div className="min-w-0 leading-tight">
                  <div className="truncate text-[11.5px] font-semibold text-white">Administrator</div>
                  <div className="truncate text-[9.5px] text-[#7ea1b7]">Floor Desk · Online</div>
                </div>
              </div>
              <button
                type="button"
                onClick={async () => {
                  await fetch("/api/auth", { method: "DELETE" });
                  window.location.href = "/";
                }}
                className="rounded-lg p-1.5 text-[#7ea1b7] transition hover:bg-white/10 hover:text-rose-300"
                title="Sign Out"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="mt-2 px-1 text-[9.5px] tracking-wide text-[#5b7d92] flex items-center justify-between">
            <span>Etjoaigi Console</span>
            <span>v2.4 Prod</span>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="fixed inset-x-0 top-0 z-40 border-b border-white/10 bg-[#091b29]/95 backdrop-blur-md lg:hidden">
        <div className="flex items-center justify-between px-4 py-2.5">
          <Link href="/">
            <Logo light />
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/shop"
              target="_blank"
              className="flex items-center gap-1.5 rounded-full border border-[#16c4df]/50 bg-[#16c4df]/15 px-3 py-1 text-xs font-bold text-[#16c4df] transition hover:bg-[#16c4df]/25"
            >
              <ShoppingBag className="h-3.5 w-3.5 text-[#16c4df]" />
              <span>Storefront</span>
              <ArrowUpRight className="h-3 w-3 text-[#16c4df]" />
            </Link>
            <button
              type="button"
              onClick={async () => {
                await fetch("/api/auth", { method: "DELETE" });
                window.location.href = "/";
              }}
              className="rounded-full border border-white/10 p-1.5 text-[#7ea1b7] transition hover:bg-white/10 hover:text-rose-300"
              title="Sign Out"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        <nav className="flex gap-1.5 overflow-x-auto px-3 pb-2.5 scrollbar-none">
          {NAV.flatMap((s) => s.items).map((item) => {
            const active = isActive(pathname, item.href);
            const badge = item.key != null ? counts[item.key] : undefined;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition active:scale-95",
                  active
                    ? "bg-[#16c4df]/20 text-[#16c4df] ring-1 ring-[#16c4df]/40 shadow-sm"
                    : "bg-white/[0.06] text-[#9bb7c9] border border-white/10 hover:bg-white/10 hover:text-white"
                )}
              >
                <item.icon className="h-3.5 w-3.5" />
                <span>{item.label}</span>
                {badge != null && badge > 0 && (
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.2 text-[9.5px] font-bold tabular-nums",
                      active
                        ? "bg-[#16c4df] text-[#091b29]"
                        : item.key === "alerts"
                        ? "bg-rose-500/30 text-rose-300 animate-pulse"
                        : "bg-white/15 text-white"
                    )}
                  >
                    {badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
