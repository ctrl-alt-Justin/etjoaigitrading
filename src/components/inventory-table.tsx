"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Fuse from "fuse.js";
import { ArrowUpRight, PackageSearch, Search } from "lucide-react";
import type { EnrichedItem } from "@/lib/queries";
import { AgingChip, EmptyState, GradeChip, MarginPill, StatusChip, Thumb } from "./ui";
import { cn, fmtInt, fmtMoney, relTime } from "@/lib/format";

const STATUS_TABS: { key: string; label: string; match: (i: EnrichedItem) => boolean }[] = [
  { key: "active", label: "Active", match: (i) => ["draft", "intake", "for_cleaning", "for_refurb", "for_refurbishing", "in_stock", "listed", "reserved"].includes(i.status) },
  { key: "draft", label: "Drafts", match: (i) => i.status === "draft" },
  { key: "intake", label: "Intake", match: (i) => i.status === "intake" },
  { key: "for_cleaning", label: "For cleaning", match: (i) => i.status === "for_cleaning" },
  { key: "for_refurb", label: "For cleaning & refurbishing", match: (i) => i.status === "for_refurb" || i.status === "for_refurbishing" },
  { key: "in_stock", label: "In stock", match: (i) => i.status === "in_stock" },
  { key: "listed", label: "Listed", match: (i) => i.status === "listed" },
  { key: "reserved", label: "Reserved", match: (i) => i.status === "reserved" },
  { key: "sold", label: "Sold", match: (i) => i.status === "sold" },
  { key: "archived", label: "Archived", match: (i) => i.status === "archived" },
  { key: "all", label: "All", match: () => true },
];

const SORTS: { key: string; label: string; fn: (a: EnrichedItem, b: EnrichedItem) => number }[] = [
  { key: "newest", label: "Newest intake", fn: (a, b) => +new Date(b.intakeAt) - +new Date(a.intakeAt) },
  { key: "oldest", label: "Oldest intake", fn: (a, b) => +new Date(a.intakeAt) - +new Date(b.intakeAt) },
  { key: "askDesc", label: "Ask · high → low", fn: (a, b) => (b.listedPrice ?? 0) - (a.listedPrice ?? 0) },
  { key: "askAsc", label: "Ask · low → high", fn: (a, b) => (a.listedPrice ?? Infinity) - (b.listedPrice ?? Infinity) },
  { key: "margin", label: "Margin · high → low", fn: (a, b) => (b.listedMargin ?? -1) - (a.listedMargin ?? -1) },
  { key: "aged", label: "Longest listed", fn: (a, b) => (b.daysListed ?? -1) - (a.daysListed ?? -1) },
];

const GRADES = ["All", "A", "B", "C", "D"] as const;

export function InventoryTable({
  items,
  roots,
}: {
  items: EnrichedItem[];
  roots: { slug: string; name: string }[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("active");
  const [grade, setGrade] = useState<(typeof GRADES)[number]>("All");
  const [root, setRoot] = useState("all");
  const [sort, setSort] = useState("newest");

  const fuse = useMemo(
    () =>
      new Fuse(items, {
        keys: [
          { name: "name", weight: 0.45 },
          { name: "brand", weight: 0.2 },
          { name: "model", weight: 0.2 },
          { name: "sku", weight: 0.2 },
          { name: "categoryPath", weight: 0.15 },
        ],
        threshold: 0.34,
        ignoreLocation: true,
      }),
    [items]
  );

  const filtered = useMemo(() => {
    let rows = query.trim() ? fuse.search(query.trim()).map((r) => r.item) : items;
    const tabDef = STATUS_TABS.find((t) => t.key === tab) ?? STATUS_TABS[0];
    rows = rows.filter(tabDef.match);
    if (grade !== "All") rows = rows.filter((i) => i.grade === grade);
    if (root !== "all") rows = rows.filter((i) => i.rootSlug === root);
    const sortDef = SORTS.find((s) => s.key === sort) ?? SORTS[0];
    return [...rows].sort(sortDef.fn);
  }, [items, fuse, query, tab, grade, root, sort]);

  const listedSum = filtered.reduce((a, b) => a + (b.listedPrice ?? 0), 0);
  const costSum = filtered.reduce((a, b) => a + b.effectiveCost, 0);

  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const t of STATUS_TABS) m.set(t.key, items.filter(t.match).length);
    return m;
  }, [items]);

  return (
    <div className="space-y-4">
      {/* filter bar */}
      <div className="card p-3.5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5 items-center">
          <div className="relative w-full">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Fuzzy search — try “aern b grde” or a SKU…"
              className="input w-full pl-10"
            />
          </div>
          <select value={grade} onChange={(e) => setGrade(e.target.value as typeof grade)} className="input h-10 w-full">
            {GRADES.map((g) => (
              <option key={g} value={g}>{g === "All" ? "All grades" : `Grade ${g}`}</option>
            ))}
          </select>
          <select value={root} onChange={(e) => setRoot(e.target.value)} className="input h-10 w-full">
            <option value="all">All families</option>
            {roots.map((r) => (
              <option key={r.slug} value={r.slug}>{r.name}</option>
            ))}
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value)} className="input h-10 w-full">
            {SORTS.map((s) => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>
        </div>
        <div className="mt-3 flex gap-1.5 overflow-x-auto pb-0.5">
          {STATUS_TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition",
                tab === t.key
                  ? "bg-stone-900 text-white"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              )}
            >
              {t.label}
              <span className={cn("tabular-nums", tab === t.key ? "text-stone-300" : "text-stone-400")}>
                {counts.get(t.key) ?? 0}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-stone-500">
        <span>
          <span className="font-semibold text-stone-900 tabular-nums">{fmtInt(filtered.length)}</span> items
          {query && <> matching “<span className="font-medium text-stone-700">{query}</span>”</>}
        </span>
        <span className="tabular-nums">
          Ask value <span className="font-semibold text-stone-900">{fmtMoney(listedSum)}</span>
          <span className="mx-1.5 text-stone-300">·</span>
          Cost basis <span className="font-semibold text-stone-900">{fmtMoney(costSum)}</span>
        </span>
      </div>

      {/* table */}
      <div className="card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={PackageSearch}
              title="Nothing matches"
              body="Loosen the filters or try a different search — fuzzy matching covers typos in names, brands, models and SKUs."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[840px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-[var(--line)] bg-stone-50/70 text-left text-[10.5px] font-bold uppercase tracking-[0.08em] text-stone-400">
                  <th className="py-2.5 pl-3.5 pr-2">Item</th>
                  <th className="px-2">Category</th>
                  <th className="px-2">Grade</th>
                  <th className="px-2">Acquired</th>
                  <th className="px-2 text-right">Cost</th>
                  <th className="px-2 text-right">Ask</th>
                  <th className="px-2 text-center">Margin</th>
                  <th className="px-2">Status</th>
                  <th className="px-2 text-center">Listed</th>
                  <th className="w-8 pr-3 text-right" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((i) => (
                  <tr
                    key={i.id}
                    onClick={() => router.push(`/inventory/${i.id}`)}
                    className="cursor-pointer border-b border-stone-100 transition-colors last:border-0 hover:bg-amber-50/50"
                  >
                    <td className="py-2 pl-3.5 pr-2">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <Thumb
                          url={i.photos?.[0]?.url}
                          alt={i.model?.trim() || i.name}
                          className="h-10 w-12 shrink-0 rounded-lg border border-stone-100"
                        />
                        <div className="min-w-0">
                          <div className="truncate text-[13px] font-semibold text-stone-900">{i.model?.trim() || i.name}</div>
                          <div className="mt-0.5 truncate text-[11px] text-stone-400">
                            {i.sku ?? "—"} · {i.brand ?? "Unknown brand"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="max-w-[130px] truncate px-2 text-[12px] text-stone-500">{i.categoryPath}</td>
                    <td className="px-2 whitespace-nowrap"><GradeChip grade={i.grade} /></td>
                    <td className="px-2 whitespace-nowrap text-[12px] text-stone-500">
                      {i.daysInStock <= 0 ? (
                        <span className="font-medium text-stone-700">Today</span>
                      ) : (
                        <>
                          {relTime(i.intakeAt)}
                          <span className="ml-1 text-stone-300">·</span>
                          <span className="text-stone-400 tabular-nums">{i.daysInStock}d</span>
                        </>
                      )}
                    </td>
                    <td className="px-2 text-right tabular-nums whitespace-nowrap text-[12px] text-stone-600">{fmtMoney(i.effectiveCost)}</td>
                    <td className="px-2 text-right font-semibold tabular-nums whitespace-nowrap text-[13px] text-stone-900">
                      {i.status === "sold" ? fmtMoney(i.soldPrice) : fmtMoney(i.listedPrice)}
                    </td>
                    <td className="px-2 text-center whitespace-nowrap">
                      {i.status === "sold" ? <MarginPill margin={i.realizedMargin} /> : <MarginPill margin={i.listedMargin} />}
                    </td>
                    <td className="px-2 whitespace-nowrap"><StatusChip status={i.status} /></td>
                    <td className="px-2 text-center whitespace-nowrap">
                      {i.status === "listed" || i.status === "reserved" ? (
                        <AgingChip days={i.daysListed} listedAt={i.listedAt || i.updatedAt} />
                      ) : (
                        <span className="text-stone-300">—</span>
                      )}
                    </td>
                    <td className="w-8 pr-3 text-right text-stone-300">
                      <ArrowUpRight className="ml-auto h-4 w-4" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
