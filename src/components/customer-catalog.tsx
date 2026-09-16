"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { 
  ChevronRight, 
  Menu, 
  LayoutGrid, 
  Heart, 
  Star, 
  ShoppingBag, 
  Plus, 
  Minus, 
  Check, 
  ChevronDown,
  SlidersHorizontal,
  X,
  RotateCcw
} from "lucide-react";
import type { DbCategory, DbItem, Grade } from "@/db/schema";
import { fmtMoney } from "@/lib/format";
import { Thumb, ProductHoverThumb } from "@/components/ui";
import { useCart } from "@/components/cart-provider";
import { useFavorites } from "@/components/favorites-provider";

interface Props {
  items: DbItem[];
  categories: DbCategory[];
  initialCategory?: string;
}

type ViewMode = "grid" | "list";

// Color definitions for swatches and filter
const COLOR_FILTER_OPTIONS = [
  { id: "black", label: "Black", bg: "#1e1e1e", keywords: ["black", "dark"] },
  { id: "brown", label: "Brown", bg: "#6d4327", keywords: ["brown", "wood", "walnut", "mahogany", "oak"] },
  { id: "beige", label: "Beige", bg: "#d6c6b2", keywords: ["beige", "cream", "tan"] },
  { id: "blue", label: "Blue", bg: "#1D5D8B", keywords: ["blue", "navy"] },
  { id: "green", label: "Green", bg: "#8da84b", keywords: ["green", "olive"] },
  { id: "grey", label: "Grey", bg: "#78716c", keywords: ["grey", "gray", "silver", "mesh"] },
  { id: "white", label: "White", bg: "#f3f4f6", keywords: ["white"] },
];

// Helper for color swatches based on item color text
function getColorDots(item: DbItem): string[] {
  const colorStr = (item.color ?? "").toLowerCase();
  const dots: string[] = [];
  if (colorStr.includes("black")) dots.push("#1e1e1e");
  if (colorStr.includes("brown") || colorStr.includes("wood") || colorStr.includes("mahogany") || colorStr.includes("walnut") || colorStr.includes("oak")) dots.push("#6d4327");
  if (colorStr.includes("beige") || colorStr.includes("cream") || colorStr.includes("tan")) dots.push("#d6c6b2");
  if (colorStr.includes("blue") || colorStr.includes("navy")) dots.push("#1D5D8B");
  if (colorStr.includes("green") || colorStr.includes("olive")) dots.push("#8da84b");
  if (colorStr.includes("grey") || colorStr.includes("gray") || colorStr.includes("mesh")) dots.push("#78716c");
  if (colorStr.includes("white")) dots.push("#f3f4f6");
  if (colorStr.includes("red") || colorStr.includes("burgundy")) dots.push("#991b1b");
  
  if (dots.length === 0) {
    const hash = item.id % 4;
    if (hash === 0) return ["#6d4327", "#8da84b"];
    if (hash === 1) return ["#1e1e1e", "#d6c6b2"];
    if (hash === 2) return ["#b08882"];
    return ["#1D5D8B", "#6d4327"];
  }
  return dots.slice(0, 2);
}

// Grade badge colors matching mockup
function getGradeBadge(grade: Grade | null | undefined) {
  switch (grade) {
    case "A":
      return { letter: "A", bg: "bg-[#f0d900] text-[#17364b]" };
    case "B":
      return { letter: "B", bg: "bg-[#16a34a] text-white" };
    case "C":
      return { letter: "C", bg: "bg-[#2563eb] text-white" };
    case "D":
      return { letter: "D", bg: "bg-[#dc2626] text-white" };
    default:
      return { letter: "A", bg: "bg-[#f0d900] text-[#17364b]" };
  }
}

// Pseudo-rating for realistic product display
function getItemRating(item: DbItem): string {
  const score = 2.5 + ((item.id * 17) % 25) / 10;
  return score.toFixed(1);
}

// Discount badge or NEW badge
function getItemBadge(item: DbItem, index: number): { label: string; isDiscount: boolean } | null {
  if (item.benchmarkPrice && item.listedPrice && item.benchmarkPrice > item.listedPrice) {
    const pct = Math.round(((item.benchmarkPrice - item.listedPrice) / item.benchmarkPrice) * 100);
    if (pct > 0) return { label: `${pct}% off`, isDiscount: true };
  }
  if (index % 3 === 0 || index === 0) {
    return { label: "NEW", isDiscount: false };
  }
  return null;
}

function CustomerCatalogInner({ items, categories, initialCategory = "all" }: Props) {
  const searchParams = useSearchParams();
  const urlQuery = searchParams?.get("q") ?? "";

  const { addToCart } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();

  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [selectedGrades, setSelectedGrades] = useState<Set<string>>(new Set());
  const [selectedColors, setSelectedColors] = useState<Set<string>>(new Set());
  const [minPrice, setMinPrice] = useState<number | "">("");
  const [maxPrice, setMaxPrice] = useState<number | "">("");
  const [sort, setSort] = useState<string>("relevance");
  const [searchQuery, setSearchQuery] = useState(urlQuery);
  const [addedIds, setAddedIds] = useState<Set<number>>(new Set());

  // Sidebar accordion states
  const [typeOpen, setTypeOpen] = useState(true);
  const [gradeOpen, setGradeOpen] = useState(true);
  const [stockRangeOpen, setStockRangeOpen] = useState(false);
  const [colorOpen, setColorOpen] = useState(true);
  const [priceOpen, setPriceOpen] = useState(true);

  // Mobile sidebar open
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);

  const urlCategory = searchParams?.get("category") ?? "";

  useEffect(() => {
    setSearchQuery(urlQuery);
  }, [urlQuery]);

  useEffect(() => {
    if (urlCategory) {
      const match = categories.find((c) => c.slug === urlCategory || String(c.id) === urlCategory);
      if (match) {
        setSelectedCategory(String(match.id));
      }
    }
  }, [urlCategory, categories]);

  const [favToast, setFavToast] = useState<{
    show: boolean;
    name: string;
    action: "added" | "removed";
  } | null>(null);

  useEffect(() => {
    if (!favToast) return;
    const timer = setTimeout(() => {
      setFavToast(null);
    }, 2800);
    return () => clearTimeout(timer);
  }, [favToast]);

  const handleToggleFavorite = (item: DbItem, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const currentlyFav = isFavorite(item.id);
    toggleFavorite({
      id: item.id,
      name: item.name,
      price: item.listedPrice ?? 0,
      photo: item.photos?.[0]?.url,
      brand: item.brand,
      model: item.model,
      grade: item.grade,
      color: item.color,
      sku: item.sku,
    });
    setFavToast({
      show: true,
      name: item.name,
      action: currentlyFav ? "removed" : "added",
    });
  };

  const handleAddToCart = (item: DbItem, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!item.listedPrice) return;
    addToCart({
      id: item.id,
      name: item.name,
      price: item.listedPrice,
      photo: item.photos?.[0]?.url,
      color: item.color,
      sku: item.sku,
      brand: item.brand,
      model: item.model,
      grade: item.grade,
    });
    setAddedIds((prev) => new Set(prev).add(item.id));
    setTimeout(() => {
      setAddedIds((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }, 2000);
  };

  // Map category IDs to names & children
  const categoryNames = useMemo(
    () => new Map(categories.map((c) => [c.id, c.name])),
    [categories]
  );

  const mainCategories = useMemo(
    () => categories.filter((c) => c.parentId == null),
    [categories]
  );

  // Count items per category
  const categoryCounts = useMemo(() => {
    const counts = new Map<number, number>();
    for (const item of items) {
      if (item.categoryId != null) {
        counts.set(item.categoryId, (counts.get(item.categoryId) ?? 0) + 1);
        const cat = categories.find((c) => c.id === item.categoryId);
        if (cat?.parentId != null) {
          counts.set(cat.parentId, (counts.get(cat.parentId) ?? 0) + 1);
        }
      }
    }
    return counts;
  }, [items, categories]);

  // Expand selected category to subcategories
  const activeCategoryIds = useMemo(() => {
    if (selectedCategory === "all") return null;
    const catId = Number(selectedCategory);
    if (!Number.isInteger(catId)) return null;

    const ids = new Set<number>([catId]);
    let changed = true;
    while (changed) {
      changed = false;
      for (const c of categories) {
        if (c.parentId != null && ids.has(c.parentId) && !ids.has(c.id)) {
          ids.add(c.id);
          changed = true;
        }
      }
    }
    return ids;
  }, [categories, selectedCategory]);

  const toggleColor = (colorId: string) => {
    setSelectedColors((prev) => {
      const next = new Set(prev);
      if (next.has(colorId)) next.delete(colorId);
      else next.add(colorId);
      return next;
    });
  };

  // Filtered and sorted items
  const visible = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return items
      .filter((item) => {
        // Category filter
        if (activeCategoryIds != null) {
          if (item.categoryId == null || !activeCategoryIds.has(item.categoryId)) {
            return false;
          }
        }
        // Grade filter
        if (selectedGrades.size > 0) {
          if (!item.grade || !selectedGrades.has(item.grade)) {
            return false;
          }
        }
        // Color filter (functional)
        if (selectedColors.size > 0) {
          const itemColor = (item.color ?? "").toLowerCase();
          const matchesColor = COLOR_FILTER_OPTIONS.some((opt) =>
            selectedColors.has(opt.id) && opt.keywords.some((kw) => itemColor.includes(kw))
          );
          if (!matchesColor) return false;
        }
        // Price Range filter (functional)
        if (minPrice !== "" && item.listedPrice != null && item.listedPrice < Number(minPrice)) {
          return false;
        }
        if (maxPrice !== "" && item.listedPrice != null && item.listedPrice > Number(maxPrice)) {
          return false;
        }
        // Search query
        if (q) {
          const matchTarget = [
            item.name,
            item.brand,
            item.model,
            item.color,
            item.material,
            item.categoryId != null ? categoryNames.get(item.categoryId) : "",
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          if (!matchTarget.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sort === "price-low") {
          return (a.listedPrice ?? 0) - (b.listedPrice ?? 0);
        }
        if (sort === "price-high") {
          return (b.listedPrice ?? 0) - (a.listedPrice ?? 0);
        }
        if (sort === "newest") {
          return (
            new Date(b.listedAt ?? b.createdAt).getTime() -
            new Date(a.listedAt ?? a.createdAt).getTime()
          );
        }
        return 0; // relevance
      });
  }, [items, activeCategoryIds, selectedGrades, selectedColors, minPrice, maxPrice, searchQuery, sort, categoryNames]);

  // Current category name for breadcrumb title
  const currentCategoryTitle = useMemo(() => {
    if (selectedCategory === "all") return "All Products";
    const cat = categories.find((c) => String(c.id) === selectedCategory);
    return cat ? cat.name : "All Products";
  }, [categories, selectedCategory]);

  const toggleGrade = (grade: string) => {
    setSelectedGrades((prev) => {
      const next = new Set(prev);
      if (next.has(grade)) next.delete(grade);
      else next.add(grade);
      return next;
    });
  };

  const handlePricePreset = (min: number | "", max: number | "") => {
    setMinPrice(min);
    setMaxPrice(max);
  };

  const resetAllFilters = () => {
    setSelectedCategory("all");
    setSelectedGrades(new Set());
    setSelectedColors(new Set());
    setMinPrice("");
    setMaxPrice("");
    setSearchQuery("");
  };

  const hasActiveFilters = 
    selectedCategory !== "all" ||
    selectedGrades.size > 0 ||
    selectedColors.size > 0 ||
    minPrice !== "" ||
    maxPrice !== "" ||
    searchQuery !== "";

  return (
    <div className="w-full">
      {/* Sticky Top Toolbar (Category Title + Counter + View Switcher + Sort) */}
      <div className="sticky top-[61px] z-30 -mx-6 px-6 sm:-mx-12 sm:px-12 bg-[#FCFDF8]/95 backdrop-blur-md border-b border-stone-200/80 py-3.5 shadow-sm transition-all">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Left: Breadcrumb / Category Title */}
          <div className="flex items-center gap-2 text-2xl font-black text-[#16c4df]">
            <ChevronRight className="h-6 w-6 stroke-[3] text-[#17364b]" />
            <h2 className="font-display tracking-tight text-[#16c4df]">
              {currentCategoryTitle}
            </h2>
          </div>

          {/* Right: Controls Toolbar */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            {/* Showing Count */}
            <span className="text-xs font-semibold text-[#557287]">
              Showing {visible.length} Results
            </span>

            {/* View Switcher Icons */}
            <div className="flex items-center gap-1.5 rounded-lg bg-stone-100 p-1 border border-stone-200/60">
              {/* List View Toggle Button */}
              <button
                type="button"
                onClick={() => setViewMode("list")}
                aria-label="List view"
                className={`rounded-md p-1.5 transition ${
                  viewMode === "list"
                    ? "bg-white text-[#16c4df] shadow-sm"
                    : "text-stone-400 hover:text-stone-600"
                }`}
              >
                <Menu className="h-4.5 w-4.5" strokeWidth={viewMode === "list" ? 2.5 : 1.8} />
              </button>

              {/* Block / Grid View Toggle Button */}
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                aria-label="Block grid view"
                className={`rounded-md p-1.5 transition ${
                  viewMode === "grid"
                    ? "bg-white text-[#16c4df] shadow-sm"
                    : "text-stone-400 hover:text-stone-600"
                }`}
              >
                <LayoutGrid className="h-4.5 w-4.5" strokeWidth={viewMode === "grid" ? 2.5 : 1.8} />
              </button>
            </div>

            {/* Mobile Filter Toggle */}
            <button
              type="button"
              onClick={() => setSidebarMobileOpen(true)}
              className="flex items-center gap-1.5 rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-bold text-[#1D5D8B] md:hidden"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" /> Filters
            </button>

            {/* Sort Dropdown styled in cyan like in the mockup */}
            <div className="relative inline-flex items-center">
              <span className="mr-2 text-xs font-semibold text-[#557287]">Sort by</span>
              <div className="relative">
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  aria-label="Sort catalog items"
                  className="cursor-pointer appearance-none rounded-md bg-[#16c4df] py-1.5 pl-3 pr-7 text-xs font-bold text-white shadow-sm outline-none transition hover:bg-[#13b0c9]"
                >
                  <option value="relevance" className="bg-white text-[#17364b]">Relevance</option>
                  <option value="price-low" className="bg-white text-[#17364b]">Price: low to high</option>
                  <option value="price-high" className="bg-white text-[#17364b]">Price: high to low</option>
                  <option value="newest" className="bg-white text-[#17364b]">New Drops</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area (Sidebar + Product Grid/List) */}
      <div className="mt-6 grid grid-cols-1 items-start gap-8 md:grid-cols-[220px_1fr] lg:grid-cols-[250px_1fr]">
        {/* Left Sidebar Filter (Sticky on desktop, collapsible drawer on mobile) */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-72 bg-white p-6 shadow-2xl transition-transform md:static md:z-20 md:w-auto md:bg-transparent md:p-0 md:shadow-none md:sticky md:top-[128px] md:self-start md:max-h-[calc(100vh-142px)] md:overflow-y-auto pr-2 scrollbar-thin ${
            sidebarMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          }`}
        >
          {/* Mobile close header */}
          <div className="mb-4 flex items-center justify-between border-b pb-3 md:hidden">
            <h3 className="font-display font-bold text-[#1D5D8B]">Filters</h3>
            <button
              type="button"
              onClick={() => setSidebarMobileOpen(false)}
              className="p-1 text-stone-500"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-5 text-xs">
            {/* Clear All Filters Button if any active */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetAllFilters}
                className="flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-800 transition pb-2 border-b border-rose-100 w-full"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Reset all filters
              </button>
            )}

            {/* TYPE (Category) Accordion */}
            <div className="border-b border-stone-200/80 pb-4">
              <button
                type="button"
                onClick={() => setTypeOpen(!typeOpen)}
                className="flex w-full items-center justify-between font-black uppercase tracking-wider text-[#17364b]"
              >
                <span>Type</span>
                <span className="text-sm font-bold text-stone-500">
                  {typeOpen ? <Minus className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                </span>
              </button>

              {typeOpen && (
                <div className="mt-3 space-y-2">
                  <label className="flex cursor-pointer items-center justify-between text-stone-600 hover:text-[#17364b]">
                    <span className="font-semibold">All Categories</span>
                    <input
                      type="radio"
                      name="catalogCategory"
                      checked={selectedCategory === "all"}
                      onChange={() => setSelectedCategory("all")}
                      className="accent-[#1D5D8B]"
                    />
                  </label>

                  {mainCategories.map((cat) => {
                    const count = categoryCounts.get(cat.id) ?? 0;
                    const isChecked = String(cat.id) === selectedCategory;
                    return (
                      <label
                        key={cat.id}
                        className="flex cursor-pointer items-center justify-between text-stone-600 hover:text-[#17364b]"
                      >
                        <span className={`font-medium ${isChecked ? "font-bold text-[#1D5D8B]" : ""}`}>
                          {cat.name}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-stone-400">{count}</span>
                          <input
                            type="radio"
                            name="catalogCategory"
                            checked={isChecked}
                            onChange={() => setSelectedCategory(String(cat.id))}
                            className="accent-[#1D5D8B]"
                          />
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* CONDITION GRADE Accordion */}
            <div className="border-b border-stone-200/80 pb-4">
              <button
                type="button"
                onClick={() => setGradeOpen(!gradeOpen)}
                className="flex w-full items-center justify-between font-black uppercase tracking-wider text-[#17364b]"
              >
                <span>Condition Grade</span>
                <span className="text-sm font-bold text-stone-500">
                  {gradeOpen ? <Minus className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                </span>
              </button>

              {gradeOpen && (
                <div className="mt-3 space-y-2">
                  {(["A", "B", "C", "D"] as Grade[]).map((g) => {
                    const isChecked = selectedGrades.has(g);
                    const gradeMeta = getGradeBadge(g);
                    const count = items.filter((i) => i.grade === g).length;
                    return (
                      <label
                        key={g}
                        className="flex cursor-pointer items-center justify-between text-stone-600 hover:text-[#17364b]"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`flex h-4 w-4 items-center justify-center rounded text-[9px] font-black ${gradeMeta.bg}`}
                          >
                            {g}
                          </span>
                          <span className="font-semibold">Grade {g}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-stone-400">{count}</span>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleGrade(g)}
                            className="accent-[#1D5D8B] rounded"
                          />
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* FUNCTIONAL COLOR FILTER Accordion */}
            <div className="border-b border-stone-200/80 pb-4">
              <button
                type="button"
                onClick={() => setColorOpen(!colorOpen)}
                className="flex w-full items-center justify-between font-black uppercase tracking-wider text-[#17364b]"
              >
                <span>Color {selectedColors.size > 0 && `(${selectedColors.size})`}</span>
                <span className="text-sm font-bold text-stone-500">
                  {colorOpen ? <Minus className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                </span>
              </button>

              {colorOpen && (
                <div className="mt-3 space-y-2">
                  <div className="flex flex-wrap gap-2.5">
                    {COLOR_FILTER_OPTIONS.map((c) => {
                      const isSelected = selectedColors.has(c.id);
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => toggleColor(c.id)}
                          title={c.label}
                          className={`group relative flex h-7 w-7 items-center justify-center rounded-full border shadow-sm transition hover:scale-110 ${
                            isSelected
                              ? "ring-2 ring-[#16c4df] ring-offset-2 border-stone-400"
                              : "border-stone-300"
                          }`}
                          style={{ backgroundColor: c.bg }}
                        >
                          {isSelected && (
                            <Check
                              className={`h-3.5 w-3.5 ${
                                c.id === "white" || c.id === "beige" ? "text-stone-900" : "text-white"
                              }`}
                              strokeWidth={3}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {selectedColors.size > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedColors(new Set())}
                      className="mt-1 text-[11px] font-semibold text-[#1D5D8B] hover:underline"
                    >
                      Clear color filter
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* FUNCTIONAL PRICE RANGE SELECTOR Accordion */}
            <div className="border-b border-stone-200/80 pb-4">
              <button
                type="button"
                onClick={() => setPriceOpen(!priceOpen)}
                className="flex w-full items-center justify-between font-black uppercase tracking-wider text-[#17364b]"
              >
                <span>Price Range</span>
                <span className="text-sm font-bold text-stone-500">
                  {priceOpen ? <Minus className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                </span>
              </button>

              {priceOpen && (
                <div className="mt-3 space-y-3">
                  {/* Min / Max Inputs */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-semibold text-stone-500">Min (₱)</label>
                      <input
                        type="number"
                        placeholder="0"
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value === "" ? "" : Number(e.target.value))}
                        className="input mt-0.5 w-full !py-1 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-stone-500">Max (₱)</label>
                      <input
                        type="number"
                        placeholder="Max"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value === "" ? "" : Number(e.target.value))}
                        className="input mt-0.5 w-full !py-1 text-xs"
                      />
                    </div>
                  </div>

                  {/* Preset quick buttons */}
                  <div className="flex flex-wrap gap-1.5 text-[10px]">
                    <button
                      type="button"
                      onClick={() => handlePricePreset("", 5000)}
                      className="rounded bg-stone-100 px-2 py-1 font-semibold text-stone-700 hover:bg-stone-200"
                    >
                      Under ₱5k
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePricePreset(5000, 15000)}
                      className="rounded bg-stone-100 px-2 py-1 font-semibold text-stone-700 hover:bg-stone-200"
                    >
                      ₱5k–₱15k
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePricePreset(15000, 30000)}
                      className="rounded bg-stone-100 px-2 py-1 font-semibold text-stone-700 hover:bg-stone-200"
                    >
                      ₱15k–₱30k
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePricePreset(30000, "")}
                      className="rounded bg-stone-100 px-2 py-1 font-semibold text-stone-700 hover:bg-stone-200"
                    >
                      ₱30k+
                    </button>
                  </div>

                  {(minPrice !== "" || maxPrice !== "") && (
                    <button
                      type="button"
                      onClick={() => {
                        setMinPrice("");
                        setMaxPrice("");
                      }}
                      className="text-[11px] font-semibold text-[#1D5D8B] hover:underline"
                    >
                      Reset price
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* STOCK RANGE Accordion */}
            <div className="pb-4">
              <button
                type="button"
                onClick={() => setStockRangeOpen(!stockRangeOpen)}
                className="flex w-full items-center justify-between font-black uppercase tracking-wider text-[#17364b]"
              >
                <span>Stock Range</span>
                <span className="text-sm font-bold text-stone-500">
                  {stockRangeOpen ? <Minus className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                </span>
              </button>
              {stockRangeOpen && (
                <div className="mt-2 text-stone-500 text-[11px]">
                  All pieces are in-stock and ready for showroom viewing in Muntinlupa.
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Right Area: Items in Grid or List Mode */}
        <div className="min-w-0">
          {visible.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-[#d8e2e7] bg-white p-12 text-center shadow-sm">
              <h3 className="font-display text-lg font-bold text-[#17364b]">
                No pieces match your filters
              </h3>
              <p className="mt-1 text-xs text-[#557287]">
                Try widening your price range, clearing color filters, or selecting &ldquo;All Categories&rdquo;.
              </p>
              <button
                type="button"
                onClick={resetAllFilters}
                className="mt-4 rounded-xl bg-[#16c4df] px-5 py-2 text-xs font-bold text-[#17364b] hover:bg-[#70e2ef]"
              >
                Clear all filters
              </button>
            </div>
          ) : viewMode === "grid" ? (
            /* ========================================================= */
            /* BLOCK / GRID VIEW (Matches Mockup 1 & 2)                  */
            /* ========================================================= */
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
              {visible.map((item, index) => {
                const badge = getItemBadge(item, index);
                const gradeBadge = getGradeBadge(item.grade as Grade | null);
                const isFav = isFavorite(item.id);
                const colorDots = getColorDots(item);
                const rating = getItemRating(item);
                const isAdded = addedIds.has(item.id);

                return (
                  <article
                    key={item.id}
                    className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-stone-200/80 bg-white p-4 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#16c4df] hover:shadow-lg"
                  >
                    {/* Top-right Favorite Heart Button (Mockup 2) - Positioned above image, OUTSIDE of Link */}
                    <button
                      type="button"
                      onClick={(e) => handleToggleFavorite(item, e)}
                      aria-label={isFav ? `Remove ${item.name} from favorites` : `Add ${item.name} to favorites`}
                      className="absolute right-6 top-6 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 shadow-sm border border-stone-200/60 backdrop-blur transition hover:bg-white hover:scale-110 active:scale-90"
                    >
                      <Heart
                        className={`h-4 w-4 transition-colors ${
                          isFav
                            ? "fill-[#16c4df] text-[#16c4df]"
                            : "text-[#16c4df] hover:fill-[#16c4df]/20"
                        }`}
                        strokeWidth={2.2}
                      />
                    </button>

                    <div>
                      {/* Product Image Link */}
                      <Link href={`/shop/${item.id}`} className="block group/img">
                        <div className="relative flex h-52 w-full items-center justify-center rounded-xl bg-[#f5f2eb]/70 p-4 transition group-hover/img:bg-[#efebe2]">
                          {/* Top-left Badge (NEW or Discount) */}
                          {badge && (
                            <span className="absolute left-3 top-3 rounded px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white shadow-sm bg-[#c62f57]">
                              {badge.label}
                            </span>
                          )}

                          {/* Product Image with Hover to Alternate Setup View */}
                          <ProductHoverThumb
                            photos={item.photos}
                            alt={item.name}
                            className="h-44 w-full"
                          />
                        </div>
                      </Link>

                      {/* Color Swatch Dots */}
                      <div className="mt-3 flex items-center gap-1.5">
                        {colorDots.map((dot, idx) => (
                          <span
                            key={idx}
                            className="h-3 w-3 rounded-full border border-black/10 shadow-inner"
                            style={{ backgroundColor: dot }}
                          />
                        ))}
                      </div>

                      {/* Grade Chip + Title */}
                      <div className="mt-2.5 flex items-center gap-2">
                        <span
                          className={`flex h-4 min-w-4 items-center justify-center rounded px-1 text-[9px] font-black ${gradeBadge.bg}`}
                        >
                          {gradeBadge.letter}
                        </span>
                        <Link
                          href={`/shop/${item.id}`}
                          className="font-display text-sm font-bold text-[#17364b] truncate hover:text-[#1D5D8B] transition"
                        >
                          {item.name}
                        </Link>
                      </div>

                      {/* Price & Rating */}
                      <div className="mt-2.5 flex items-center justify-between">
                        <Link
                          href={`/shop/${item.id}`}
                          className="font-display text-sm font-black text-[#17364b] hover:text-[#1D5D8B]"
                        >
                          {fmtMoney(item.listedPrice)}
                        </Link>

                        <div className="flex items-center gap-1 text-[11px] font-bold text-[#d49c00]">
                          <Star className="h-3.5 w-3.5 fill-current" />
                          <span>{rating}</span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="mt-3 border-t border-stone-100 pt-2.5 flex items-center justify-between">
                      <Link
                        href={`/shop/${item.id}`}
                        className="text-[11px] font-bold text-[#1D5D8B] hover:text-[#16c4df]"
                      >
                        View Piece →
                      </Link>
                      <button
                        type="button"
                        onClick={(e) => handleAddToCart(item, e)}
                        aria-label={`Add ${item.name} to cart`}
                        className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition shadow-sm ${
                          isAdded
                            ? "bg-emerald-600 text-white"
                            : "bg-[#16c4df] text-[#17364b] hover:scale-110 hover:bg-[#70e2ef]"
                        }`}
                      >
                        {isAdded ? <Check className="h-3.5 w-3.5" /> : <ShoppingBag className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            /* ========================================================= */
            /* LIST VIEW (Matches Mockup 3 with alternating cards)       */
            /* ========================================================= */
            <div className="divide-y divide-[#d8e2e7] rounded-3xl border border-[#d8e2e7] bg-white overflow-hidden shadow-sm">
              {visible.map((item, index) => {
                const isBlueTheme = index % 2 === 1;
                const badge = getItemBadge(item, index);
                const gradeBadge = getGradeBadge(item.grade as Grade | null);
                const colorDots = getColorDots(item);
                const rating = getItemRating(item);
                const isFav = isFavorite(item.id);
                const isAdded = addedIds.has(item.id);

                return (
                  <article
                    key={item.id}
                    className={`grid overflow-hidden transition md:grid-cols-[40%_60%] lg:grid-cols-[36%_64%] ${
                      isBlueTheme
                        ? "bg-[#1D5D8B] text-white"
                        : "bg-white text-[#17364b]"
                    }`}
                  >
                    {/* Left: Product Image on Pure White Background */}
                    <Link
                      href={`/shop/${item.id}`}
                      className="group/img relative flex min-h-[260px] items-center justify-center p-6 bg-white border-b border-stone-200 md:border-b-0 md:border-r md:border-stone-200"
                    >
                      <ProductHoverThumb
                        photos={item.photos}
                        alt={item.name}
                        className="h-56 w-full"
                      />
                    </Link>

                    {/* Right: Specifications, Details & Quick Cart */}
                    <div className="flex flex-col justify-between p-7 sm:p-8">
                      <div>
                        {/* Badges + Color Swatch */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {badge && (
                              <span className="rounded px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white bg-[#c62f57]">
                                {badge.label}
                              </span>
                            )}
                            <span
                              className={`flex h-5 min-w-5 items-center justify-center rounded px-1.5 text-[10px] font-black ${gradeBadge.bg}`}
                            >
                              {gradeBadge.letter}
                            </span>
                          </div>

                          {/* Color Swatch Dots */}
                          <div className="flex items-center gap-1.5">
                            {colorDots.map((dot, idx) => (
                              <span
                                key={idx}
                                className="h-3.5 w-3.5 rounded-full border border-black/15 shadow-sm"
                                style={{ backgroundColor: dot }}
                              />
                            ))}
                          </div>
                        </div>

                        {/* Title & Star Rating + Heart */}
                        <div className="mt-3 flex items-start justify-between gap-4">
                          <Link href={`/shop/${item.id}`}>
                            <h3
                              className={`font-display text-2xl font-black uppercase tracking-tight sm:text-3xl transition ${
                                isBlueTheme ? "text-white hover:text-[#16c4df]" : "text-[#17364b] hover:text-[#1D5D8B]"
                              }`}
                            >
                              {item.name}
                            </h3>
                          </Link>

                          <div className="flex items-center gap-3 shrink-0">
                            <div className="flex items-center gap-1 text-xs font-bold text-[#f0b500]">
                              <Star className="h-4 w-4 fill-current" />
                              <span>{rating}</span>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => handleToggleFavorite(item, e)}
                              aria-label={`Favorite ${item.name}`}
                              className="text-[#16c4df] transition hover:scale-110"
                            >
                              <Heart
                                className={`h-5 w-5 ${
                                  isFav ? "fill-current" : ""
                                }`}
                              />
                            </button>
                          </div>
                        </div>

                        {/* Two-column Specifications List */}
                        <dl
                          className={`mt-4 grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs ${
                            isBlueTheme ? "text-[#b9d5e4]" : "text-[#557287]"
                          }`}
                        >
                          <div className="flex gap-2">
                            <dt className="w-16 shrink-0 font-medium">Brand</dt>
                            <dd className="font-bold truncate">{item.brand || "Large (W18 - L24)"}</dd>
                          </div>
                          <div className="flex gap-2">
                            <dt className="w-16 shrink-0 font-medium">Color</dt>
                            <dd className="font-bold truncate">{item.color || "Baby Blue, Cream"}</dd>
                          </div>
                          <div className="flex gap-2">
                            <dt className="w-16 shrink-0 font-medium">Material</dt>
                            <dd className="font-bold truncate">{item.material || "Cotton"}</dd>
                          </div>
                          <div className="flex gap-2">
                            <dt className="w-16 shrink-0 font-medium">Features</dt>
                            <dd className="font-bold truncate">Grade {item.grade || "A"}</dd>
                          </div>
                          <div className="flex gap-2 col-span-2">
                            <dt className="w-16 shrink-0 font-medium">Dimension</dt>
                            <dd className="font-bold truncate">{item.dimensions || "Excellent, No Issue"}</dd>
                          </div>
                        </dl>
                      </div>

                      {/* Bottom: Price + Circular Cyan Cart Button */}
                      <div className="mt-6 flex items-center justify-between border-t border-white/15 pt-4">
                        <div
                          className={`font-display text-2xl font-black sm:text-3xl ${
                            isBlueTheme ? "text-white" : "text-[#17364b]"
                          }`}
                        >
                          {fmtMoney(item.listedPrice)}
                        </div>

                        {/* Circular Cyan Cart Button */}
                        <button
                          type="button"
                          onClick={(e) => handleAddToCart(item, e)}
                          aria-label={`Add ${item.name} to cart`}
                          className={`flex h-11 w-11 items-center justify-center rounded-full shadow-md transition duration-200 hover:scale-110 ${
                            isAdded
                              ? "bg-emerald-500 text-white"
                              : "bg-[#16c4df] text-[#17364b] hover:bg-[#70e2ef]"
                          }`}
                        >
                          {isAdded ? (
                            <Check className="h-5 w-5" strokeWidth={2.5} />
                          ) : (
                            <ShoppingBag className="h-5 w-5" strokeWidth={2} />
                          )}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Toast Notification when favoriting */}
      {favToast?.show && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border border-stone-200 bg-white px-4 py-3 shadow-2xl animate-in slide-in-from-bottom-5">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full ${
              favToast.action === "added"
                ? "bg-[#16c4df]/15 text-[#16c4df]"
                : "bg-stone-100 text-stone-500"
            }`}
          >
            <Heart
              className={`h-4 w-4 ${
                favToast.action === "added" ? "fill-current" : ""
              }`}
            />
          </div>
          <div className="text-xs">
            <p className="font-bold text-[#17364b] line-clamp-1 max-w-[200px]">
              {favToast.name}
            </p>
            <p className="text-[11px] text-stone-500">
              {favToast.action === "added"
                ? "Added to your favorites"
                : "Removed from favorites"}
            </p>
          </div>
          <Link
            href="/shop/favorites"
            className="ml-2 rounded-lg bg-[#1D5D8B] px-2.5 py-1 text-[11px] font-bold text-white hover:bg-[#164e75] transition"
          >
            View
          </Link>
          <button
            type="button"
            onClick={() => setFavToast(null)}
            className="p-1 text-stone-400 hover:text-stone-600"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

export function CustomerCatalog(props: Props) {
  return (
    <Suspense fallback={<div className="py-12 text-center text-sm text-stone-400">Loading catalog...</div>}>
      <CustomerCatalogInner {...props} />
    </Suspense>
  );
}
