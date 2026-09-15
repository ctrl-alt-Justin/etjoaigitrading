"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Boxes,
  FolderTree,
  LayoutDashboard,
  PackagePlus,
  Scale,
} from "lucide-react";
import { cn } from "@/lib/format";

export type ShellCounts = {
  active: number;
  intake: number;
  inStock: number;
  listed: number;
  soldMtd: number;
  alerts: number;
};

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <svg viewBox="0 0 32 32" className="h-8 w-8 shrink-0" aria-hidden>
        <rect x="1" y="1" width="30" height="30" rx="9" fill="#D97706" />
        <path d="M11.5 8h6a5 5 0 0 1 5 5v2.5h-11z" fill="#FEF3C7" />
        <rect x="9" y="17" width="15" height="3" rx="1.5" fill="#FEF3C7" />
        <path
          d="M12.2 20.5 10.8 26M21.8 20.5 23.2 26"
          stroke="#FEF3C7"
          strokeWidth="2.3"
          strokeLinecap="round"
        />
      </svg>
      <div className="leading-none">
        <div
          className={cn(
            "font-display text-[19px] font-semibold tracking-tight",
            light ? "text-amber-50" : "text-stone-900"
          )}
        >
          Etjoaigi
        </div>
        <div
          className={cn(
            "mt-1 text-[9.5px] font-bold uppercase tracking-[0.22em]",
            light ? "text-stone-500" : "text-stone-400"
          )}
        >
          Trading
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
      { href: "/inventory/new", label: "Intake desk", icon: PackagePlus, accent: true },
      { href: "/inventory", label: "Inventory", icon: Boxes, key: "active" },
    ],
  },
  {
    group: "Govern",
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
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[248px] flex-col bg-[#171310] lg:flex">
        <div className="px-5 pb-6 pt-6">
          <Link href="/">
            <Logo light />
          </Link>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-3">
          {NAV.map((section) => (
            <div key={section.group}>
              <div className="px-2.5 pb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-stone-600">
                {section.group}
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
                        "group flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13.5px] font-medium transition-colors",
                        active
                          ? "bg-stone-100/10 text-amber-50"
                          : "text-stone-400 hover:bg-stone-100/5 hover:text-stone-200"
                      )}
                    >
                      <item.icon
                        className={cn(
                          "h-[17px] w-[17px]",
                          active ? "text-amber-400" : "text-stone-500 group-hover:text-stone-300"
                        )}
                        strokeWidth={2}
                      />
                      <span className="flex-1">{item.label}</span>
                      {item.accent && !active && (
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                      )}
                      {badge != null && badge > 0 && (
                        <span
                          className={cn(
                            "rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums",
                            item.key === "alerts"
                              ? "bg-rose-500/15 text-rose-300"
                              : "bg-stone-100/10 text-stone-300"
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

        <div className="px-4 pb-5">
          <div className="rounded-2xl border border-stone-100/10 bg-stone-100/5 p-3.5">
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-600">
              Stock snapshot
            </div>
            <div className="mt-2.5 space-y-1.5 text-[12.5px]">
              {[
                { label: "In intake", value: counts.intake, dot: "bg-violet-400" },
                { label: "In stock", value: counts.inStock, dot: "bg-sky-400" },
                { label: "Listed live", value: counts.listed, dot: "bg-amber-400" },
                { label: "Sold this month", value: counts.soldMtd, dot: "bg-emerald-400" },
              ].map((r) => (
                <div key={r.label} className="flex items-center gap-2 text-stone-400">
                  <span className={cn("h-1.5 w-1.5 rounded-full", r.dot)} />
                  <span className="flex-1">{r.label}</span>
                  <span className="font-semibold tabular-nums text-stone-200">{r.value}</span>
                </div>
              ))}
            </div>
            {counts.alerts > 0 && (
              <Link
                href="/pricing"
                className="mt-3 flex items-center justify-between rounded-lg bg-rose-500/10 px-2.5 py-1.5 text-[11.5px] font-semibold text-rose-300 transition hover:bg-rose-500/20"
              >
                {counts.alerts} price-aging alert{counts.alerts === 1 ? "" : "s"}
                <span aria-hidden>→</span>
              </Link>
            )}
          </div>
          <div className="mt-4 px-1 text-[10.5px] leading-relaxed text-stone-600">
            Etjoaigi Trading · Makati
            <br />
            Ops build 2.4 · production
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="fixed inset-x-0 top-0 z-40 border-b border-stone-200 bg-[#F6F3EC]/95 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between px-4 py-2.5">
          <Link href="/">
            <Logo />
          </Link>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-2">
          {NAV.flatMap((s) => s.items).map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold",
                  active ? "bg-stone-900 text-white" : "bg-white text-stone-600 border border-stone-200"
                )}
              >
                <item.icon className="h-3.5 w-3.5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
