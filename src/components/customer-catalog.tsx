"use client";

import { Heart, Search, ShoppingBag, SlidersHorizontal, Star } from "lucide-react";
import { useMemo, useState } from "react";
import Link from "next/link";
import type { DbCategory, DbItem, Grade } from "@/db/schema";
import { fmtMoney } from "@/lib/format";
import { GradeChip, Thumb } from "@/components/ui";

export function CustomerCatalog({ items, categories, initialCategory = "all" }: { items: DbItem[]; categories: DbCategory[]; initialCategory?: string }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(initialCategory);
  const [sort, setSort] = useState("newest");
  const categoryNames = useMemo(() => new Map(categories.map((item) => [item.id, item.name])), [categories]);
  const categoryIds = useMemo(() => {
    if (category === "all") return null;
    const selected = Number(category);
    if (!Number.isInteger(selected)) return null;
    const ids = new Set<number>([selected]);
    let changed = true;
    while (changed) {
      changed = false;
      for (const item of categories) {
        if (item.parentId != null && ids.has(item.parentId) && !ids.has(item.id)) {
          ids.add(item.id);
          changed = true;
        }
      }
    }
    return ids;
  }, [categories, category]);
  const visible = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return items
      .filter((item) => categoryIds == null || (item.categoryId != null && categoryIds.has(item.categoryId)))
      .filter((item) => !normalized || [item.name, item.brand, item.model, item.categoryId != null ? categoryNames.get(item.categoryId) : null].filter(Boolean).join(" ").toLowerCase().includes(normalized))
      .sort((a, b) => sort === "price-low" ? (a.listedPrice ?? 0) - (b.listedPrice ?? 0) : sort === "price-high" ? (b.listedPrice ?? 0) - (a.listedPrice ?? 0) : new Date(b.listedAt ?? b.createdAt).getTime() - new Date(a.listedAt ?? a.createdAt).getTime());
  }, [category, categoryIds, categoryNames, items, query, sort]);

  return (
    <>
      <div className="mt-6 grid gap-3 border-b border-[#d8e2e7] pb-5 md:grid-cols-[minmax(0,1fr)_220px_170px]">
        <label className="relative block"><Search className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-[#557287]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search furniture, brands, or models" className="input pl-10" style={{ paddingLeft: "2.5rem" }} aria-label="Search furniture" /></label>
        <label className="relative block"><SlidersHorizontal className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-[#557287]" /><select value={category} onChange={(event) => setCategory(event.target.value)} className="input pl-10" style={{ paddingLeft: "2.5rem" }} aria-label="Filter by category"><option value="all">All categories</option>{categories.filter((item) => item.parentId != null).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <select value={sort} onChange={(event) => setSort(event.target.value)} className="input" aria-label="Sort items"><option value="newest">Relevance</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option></select>
      </div>

      <div className="mt-5 flex items-center justify-between text-xs font-semibold text-[#3f6175]"><span>Showing {visible.length} results</span>{(query || category !== "all") && <button onClick={() => { setQuery(""); setCategory("all"); }} className="text-[#1D5D8B] hover:text-[#16486B]">Clear filters</button>}</div>

      {visible.length === 0 ? <div className="mt-8 rounded-2xl border border-dashed border-[var(--line)] bg-white px-6 py-16 text-center"><h2 className="font-display text-xl font-semibold text-stone-900">No pieces match that search</h2><p className="mt-2 text-sm text-[#3f6175]">Try another brand, model, or category.</p></div> : <div className="mt-3 divide-y divide-[#d8e2e7] border-y border-[#d8e2e7]">
        {visible.map((item, index) => {
          const categoryLabel = item.categoryId != null ? categoryNames.get(item.categoryId) ?? "Furniture" : "Information required";
          return <article key={item.id} className={`group grid overflow-hidden md:grid-cols-[38%_62%] ${index % 2 === 1 ? "bg-[#1D5D8B] text-white" : "bg-[#FCFDF8] text-[#17364b]"}`}>
            <Link href={`/shop/${item.id}`} className="relative min-h-[220px] overflow-hidden border-b border-[#d8e2e7] bg-[#f3f5f1] md:min-h-[270px] md:border-b-0 md:border-r md:border-[#d8e2e7]">
              <Thumb url={item.photos?.[0]?.url} alt={item.name} className="catalog-product-image h-full min-h-[220px] w-full object-contain transition duration-700 group-hover:scale-[1.04] md:min-h-[270px]" iconClassName="h-16 w-16" />
              {index === 0 && <span className="absolute left-4 top-4 bg-[#c62f57] px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white">New</span>}
            </Link>
            <div className="flex min-h-[220px] flex-col justify-center px-6 py-7 sm:px-10 md:min-h-[270px]">
              <div className="flex items-start justify-between gap-5"><div className="flex flex-wrap items-center gap-2"><span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${index % 2 === 1 ? "bg-[#c62f57] text-white" : "bg-[#f0d900] text-[#17364b]"}`}>{index === 1 ? "8% off" : categoryLabel}</span><GradeChip grade={item.grade as Grade | null} /></div><div className="flex items-center gap-3"><span className={index % 2 === 1 ? "text-[#f0d900]" : "text-[#d49c00]"}><Star className="h-4 w-4 fill-current" /></span><button type="button" aria-label={`Save ${item.name}`} className="text-[#16c4df] transition hover:scale-110"><Heart className="h-5 w-5" /></button></div></div>
              <Link href={`/shop/${item.id}`}><h2 className={`mt-4 font-display text-2xl font-black uppercase tracking-tight sm:text-3xl ${index % 2 === 1 ? "text-white" : "text-[#17364b]"}`}>{item.name}</h2></Link>
              <dl className={`mt-3 grid max-w-lg grid-cols-2 gap-x-7 gap-y-1.5 text-xs sm:grid-cols-3 ${index % 2 === 1 ? "text-[#b9d5e4]" : "text-[#557287]"}`}><div><dt>Brand</dt><dd className="font-semibold">{item.brand ?? "—"}</dd></div><div><dt>Color</dt><dd className="font-semibold">{item.color ?? "—"}</dd></div><div><dt>Material</dt><dd className="font-semibold">{item.material ?? "—"}</dd></div><div><dt>Condition</dt><dd className="font-semibold">{item.grade ? `Grade ${item.grade}` : "Inspected"}</dd></div><div><dt>Dimensions</dt><dd className="truncate font-semibold">{item.dimensions ?? "—"}</dd></div></dl>
              <div className="mt-5 flex items-center justify-between gap-4"><div className={`font-display text-2xl font-black sm:text-3xl ${index % 2 === 1 ? "text-white" : "text-[#17364b]"}`}>{fmtMoney(item.listedPrice)}</div><Link href={`/shop/${item.id}`} className="flex h-10 w-10 items-center justify-center rounded-full bg-[#16c4df] text-[#17364b] shadow-sm transition hover:scale-110 hover:bg-[#70e2ef]" aria-label={`View ${item.name}`}><ShoppingBag className="h-4 w-4" /></Link></div>
            </div>
          </article>;
        })}
      </div>}
    </>
  );
}
