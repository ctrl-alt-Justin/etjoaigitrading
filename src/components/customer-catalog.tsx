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
  Plus, 
  Minus, 
  Check, 
  ChevronDown,
  SlidersHorizontal,
  X,
  RotateCcw,
  PanelLeftClose,
  PanelLeft,
  CheckCircle,
  Loader2
} from "lucide-react";
import type { DbCategory, DbItem, Grade } from "@/db/schema";
import { fmtMoney } from "@/lib/format";
import { Thumb, ProductHoverThumb } from "@/components/ui";
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

function getControlledAttributesSummary(item: DbItem): string {
  if (item.attributes && typeof item.attributes === "object") {
    const entries = Object.entries(item.attributes).filter(
      ([k, v]) => v && !["stock", "quantity"].includes(k.toLowerCase())
    );
    if (entries.length > 0) {
      return entries.map(([k, v]) => `${k}: ${v}`).join(", ");
    }
  }
  return `Grade ${item.grade || "A"}`;
}

function getItemStock(item: DbItem): number {
  if (item.attributes?.stock && !isNaN(Number(item.attributes.stock))) {
    return Number(item.attributes.stock);
  }
  if (item.attributes?.quantity && !isNaN(Number(item.attributes.quantity))) {
    return Number(item.attributes.quantity);
  }
  return 1 + ((item.id * 3) % 8);
}

function CustomerCatalogInner({ items, categories, initialCategory = "all" }: Props) {
  const searchParams = useSearchParams();
  const urlQuery = searchParams?.get("q") ?? "";

  const { isFavorite, toggleFavorite } = useFavorites();

  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(() => {
    if (initialCategory && initialCategory !== "all") {
      return new Set([initialCategory]);
    }
    return new Set();
  });
  const [selectedConditions, setSelectedConditions] = useState<Set<string>>(new Set());
  const [selectedColors, setSelectedColors] = useState<Set<string>>(new Set());
  const [minPrice, setMinPrice] = useState<number | "">("");
  const [maxPrice, setMaxPrice] = useState<number | "">("");
  const [maxStock, setMaxStock] = useState<number | "">("");
  const [sort, setSort] = useState<string>("relevance");
  const [searchQuery, setSearchQuery] = useState(urlQuery);

  // Sidebar accordion states
  const [typeOpen, setTypeOpen] = useState(true);
  const [gradeOpen, setGradeOpen] = useState(true);
  const [stockRangeOpen, setStockRangeOpen] = useState(false);
  const [colorOpen, setColorOpen] = useState(true);
  const [priceOpen, setPriceOpen] = useState(true);

  // Mobile sidebar open
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);

  // Desktop filter panel collapse
  const [filtersCollapsed, setFiltersCollapsed] = useState(false);

  const urlCategory = searchParams?.get("category") ?? "";

  useEffect(() => {
    setSearchQuery(urlQuery);
  }, [urlQuery]);

  useEffect(() => {
    if (urlCategory) {
      const match = categories.find((c) => c.slug === urlCategory || String(c.id) === urlCategory);
      if (match) {
        setSelectedCategories(new Set([String(match.id)]));
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

  // Expand selected categories to subcategories
  const activeCategoryIds = useMemo(() => {
    if (selectedCategories.size === 0) return null;
    const ids = new Set<number>();
    for (const catStr of selectedCategories) {
      const num = Number(catStr);
      if (Number.isInteger(num)) {
        ids.add(num);
      }
    }
    if (ids.size === 0) return null;

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
  }, [categories, selectedCategories]);

  // Counts for A, B, C, D condition
  const conditionCounts = useMemo(() => {
    const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
    for (const item of items) {
      if (item.grade && counts[item.grade] !== undefined) {
        counts[item.grade]++;
      }
    }
    return counts;
  }, [items]);

  const toggleCategory = (catIdStr: string) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(catIdStr)) {
        next.delete(catIdStr);
      } else {
        next.add(catIdStr);
      }
      return next;
    });
  };

  const handleAllCategoriesToggle = () => {
    setSelectedCategories(new Set());
  };

  const toggleCondition = (condId: string) => {
    setSelectedConditions((prev) => {
      const next = new Set(prev);
      if (next.has(condId)) next.delete(condId);
      else next.add(condId);
      return next;
    });
  };

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
        // Max quantity available filter (no range)
        const stock = getItemStock(item);
        if (maxStock !== "" && stock > Number(maxStock)) {
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
  }, [items, activeCategoryIds, selectedConditions, selectedColors, minPrice, maxPrice, maxStock, searchQuery, sort, categoryNames]);

  // Current category name for breadcrumb title
  const currentCategoryTitle = useMemo(() => {
    if (selectedCategories.size === 0) return "All Products";
    if (selectedCategories.size === 1) {
      const singleId = Array.from(selectedCategories)[0];
      const cat = categories.find((c) => String(c.id) === singleId);
      return cat ? cat.name : "All Products";
    }
    return `Selected (${selectedCategories.size} Categories)`;
  }, [categories, selectedCategories]);

  const handlePricePreset = (min: number | "", max: number | "") => {
    setMinPrice(min);
    setMaxPrice(max);
  };

  const handleStockPreset = (max: number | "") => {
    setMaxStock(max);
  };

  const resetAllFilters = () => {
    setSelectedCategories(new Set());
    setSelectedConditions(new Set());
    setSelectedColors(new Set());
    setMinPrice("");
    setMaxPrice("");
    setMaxStock("");
    setSearchQuery("");
  };

  const hasActiveFilters = 
    selectedCategories.size > 0 ||
    selectedConditions.size > 0 ||
    selectedColors.size > 0 ||
    minPrice !== "" ||
    maxPrice !== "" ||
    maxStock !== "" ||
    searchQuery !== "";

  return (
    <div className="w-full">
      {/* Sticky Top Toolbar (Category Title + Counter + View Switcher + Sort) */}
      <div className="sticky top-[61px] z-30 -mx-6 px-6 sm:-mx-12 sm:px-12 bg-[#FCFDF8]/95 backdrop-blur-md border-b border-stone-200/80 py-3.5 shadow-sm transition-all">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Left: Breadcrumb / Category Title + Filter Toggle */}
          <div className="flex items-center gap-3 text-2xl font-black text-[#16c4df]">
            <button
              type="button"
              onClick={() => setFiltersCollapsed(!filtersCollapsed)}
              aria-label={filtersCollapsed ? "Show filters" : "Hide filters"}
              className="hidden md:flex h-8 w-8 items-center justify-center border border-stone-200 bg-white text-stone-500 hover:text-[#1D5D8B] hover:border-[#1D5D8B] transition"
            >
              {filtersCollapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            </button>
            <ChevronRight className="h-6 w-6 stroke-[3] text-[#17364b]" />
            <h2 className="font-display tracking-tight text-[#16c4df]">
              {currentCategoryTitle}
            </h2>
          </div>

          {/* Right: Controls Toolbar */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            {/* Showing Count (font-normal and black) */}
            <span className="text-xs font-normal text-black">
              Showing {visible.length} Results
            </span>

            {/* View Switcher Icons */}
            <div className="flex items-center gap-1.5 bg-stone-100 p-1 border border-stone-200/60">
              {/* List View Toggle Button */}
              <button
                type="button"
                onClick={() => setViewMode("list")}
                aria-label="List view"
                className={`p-1.5 transition ${
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
                className={`p-1.5 transition ${
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
              className="flex items-center gap-1.5 border border-stone-200 px-3 py-1.5 text-xs font-bold text-[#1D5D8B] md:hidden"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" /> Filters
            </button>

            {/* Sort Dropdown (font-normal, label text-black) */}
            <div className="relative inline-flex items-center">
              <span className="mr-2 text-xs font-normal text-black">Sort by</span>
              <div className="relative">
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  aria-label="Sort catalog items"
                  className="cursor-pointer appearance-none bg-[#16c4df] py-1.5 pl-3 pr-7 text-xs font-normal text-white shadow-sm outline-none transition hover:bg-[#13b0c9]"
                >
                  <option value="relevance" className="bg-white text-[#17364b] font-normal">Relevance</option>
                  <option value="price-low" className="bg-white text-[#17364b] font-normal">Price: low to high</option>
                  <option value="price-high" className="bg-white text-[#17364b] font-normal">Price: high to low</option>
                  <option value="newest" className="bg-white text-[#17364b] font-normal">New Drops</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Filter Backdrop */}
      {sidebarMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs transition-opacity md:hidden"
          onClick={() => setSidebarMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Main Content Area (Sidebar + Product Grid/List) */}
      <div className={`mt-6 grid grid-cols-1 items-start gap-8 transition-all ${filtersCollapsed ? '' : 'md:grid-cols-[220px_1fr] lg:grid-cols-[250px_1fr]'}`}>
        {/* Left Sidebar Filter (Sticky on desktop, collapsible drawer on mobile) */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-72 bg-white p-6 shadow-2xl transition-transform md:static md:z-20 md:w-auto md:bg-transparent md:p-0 md:shadow-none md:sticky md:top-[128px] md:self-start md:max-h-[calc(100vh-142px)] md:overflow-y-auto pr-2 scrollbar-thin ${
            sidebarMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          } ${filtersCollapsed ? 'md:hidden' : ''}`}
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

            {/* TYPE (Category) Accordion - Multi-selection Checkbox */}
            <div className="border-b border-stone-200/80 pb-4">
              <button
                type="button"
                onClick={() => setTypeOpen(!typeOpen)}
                className="flex w-full items-center justify-between font-black uppercase tracking-wider text-[#17364b]"
              >
                <span>Type {selectedCategories.size > 0 && `(${selectedCategories.size})`}</span>
                <span className="text-sm font-bold text-stone-500">
                  {typeOpen ? <Minus className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                </span>
              </button>

              {typeOpen && (
                <div className="mt-3 space-y-2">
                  <label className="flex cursor-pointer items-center justify-between text-stone-600 hover:text-[#17364b]">
                    <span className={`text-xs ${selectedCategories.size === 0 ? "font-bold text-[#1D5D8B]" : "font-semibold"}`}>
                      All Categories
                    </span>
                    <input
                      type="checkbox"
                      checked={selectedCategories.size === 0}
                      onChange={handleAllCategoriesToggle}
                      className="accent-[#1D5D8B]"
                    />
                  </label>

                  {mainCategories.map((cat) => {
                    const count = categoryCounts.get(cat.id) ?? 0;
                    const isChecked = selectedCategories.has(String(cat.id));
                    return (
                      <label
                        key={cat.id}
                        className="flex cursor-pointer items-center justify-between text-stone-600 hover:text-[#17364b]"
                      >
                        <span className={`text-xs ${isChecked ? "font-bold text-[#1D5D8B]" : "font-medium"}`}>
                          {cat.name}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-stone-400">{count}</span>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleCategory(String(cat.id))}
                            className="accent-[#1D5D8B]"
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
                      className="bg-stone-100 px-2 py-1 font-semibold text-stone-700 hover:bg-stone-200"
                    >
                      Under ₱5k
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePricePreset(5000, 15000)}
                      className="bg-stone-100 px-2 py-1 font-semibold text-stone-700 hover:bg-stone-200"
                    >
                      ₱5k–₱15k
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePricePreset(15000, 30000)}
                      className="bg-stone-100 px-2 py-1 font-semibold text-stone-700 hover:bg-stone-200"
                    >
                      ₱15k–₱30k
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePricePreset(30000, "")}
                      className="bg-stone-100 px-2 py-1 font-semibold text-stone-700 hover:bg-stone-200"
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

            {/* STOCK RANGE Accordion with Min & Max Filter */}
            <div className="pb-4">
              <button
                type="button"
                onClick={() => setStockRangeOpen(!stockRangeOpen)}
                className="flex w-full items-center justify-between font-black uppercase tracking-wider text-[#17364b]"
              >
                <span>Stock Available {maxStock !== "" && `(≤ ${maxStock} units)`}</span>
                <span className="text-sm font-bold text-stone-500">
                  {stockRangeOpen ? <Minus className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                </span>
              </button>
              {stockRangeOpen && (
                <div className="mt-3 space-y-3">
                  <div>
                    <label className="text-[10px] font-semibold text-stone-500">Max Quantity Available</label>
                    <input
                      type="number"
                      placeholder="e.g. 5 units max"
                      min={1}
                      value={maxStock}
                      onChange={(e) => setMaxStock(e.target.value === "" ? "" : Number(e.target.value))}
                      className="input mt-0.5 w-full !py-1 text-xs"
                    />
                  </div>

                  {/* Preset quick buttons for Max Quantity */}
                  <div className="flex flex-wrap gap-1.5 text-[10px]">
                    <button
                      type="button"
                      onClick={() => handleStockPreset(1)}
                      className={`px-2 py-1 font-semibold transition ${maxStock === 1 ? 'bg-[#1D5D8B] text-white' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'}`}
                    >
                      Max 1 unit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStockPreset(3)}
                      className={`px-2 py-1 font-semibold transition ${maxStock === 3 ? 'bg-[#1D5D8B] text-white' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'}`}
                    >
                      Max 3 units
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStockPreset(5)}
                      className={`px-2 py-1 font-semibold transition ${maxStock === 5 ? 'bg-[#1D5D8B] text-white' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'}`}
                    >
                      Max 5 units
                    </button>
                  </div>

                  {maxStock !== "" && (
                    <button
                      type="button"
                      onClick={() => setMaxStock("")}
                      className="text-[11px] font-semibold text-[#1D5D8B] hover:underline"
                    >
                      Clear quantity filter
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Right Area: Items in Grid or List Mode */}
        <div className="min-w-0">
          {visible.length === 0 ? (
            <div className="border border-dashed border-[#d8e2e7] bg-white p-12 text-center shadow-sm">
              <h3 className="font-display text-lg font-bold text-[#17364b]">
                No pieces match your filters
              </h3>
              <p className="mt-1 text-xs text-[#557287]">
                Try widening your price range, clearing color filters, or selecting &ldquo;All Categories&rdquo;.
              </p>
              <button
                type="button"
                onClick={resetAllFilters}
                className="mt-4 bg-[#16c4df] px-5 py-2 text-xs font-bold text-[#17364b] hover:bg-[#70e2ef]"
              >
                Clear all filters
              </button>
            </div>
          ) : viewMode === "grid" ? (
            /* ========================================================= */
            /* BLOCK / GRID VIEW (Matches Mockup 1 & 2)                  */
            /* ========================================================= */
            <div className={`grid grid-cols-1 gap-0 sm:grid-cols-2 border-t-[2pt] border-l border-[#A4A4A2] ${filtersCollapsed ? 'lg:grid-cols-4 xl:grid-cols-4' : 'lg:grid-cols-3 xl:grid-cols-3'}`}>
              {visible.map((item, index) => {
                const badge = getItemBadge(item, index);
                const isFav = isFavorite(item.id);
                const colorDots = getColorDots(item);

                return (
                  <article
                    key={item.id}
                    className="group relative flex flex-col justify-between overflow-hidden border-r border-stone-200/80 border-b-[2pt] border-[#A4A4A2] bg-white text-black p-5 sm:p-6 transition-colors duration-200 hover:bg-[#1D5D8B] hover:text-white"
                  >
                    {/* Entire card links to product details */}
                    <Link
                      href={`/shop/${item.id}`}
                      className="absolute inset-0 z-0"
                      aria-label={`View ${item.name}`}
                    />

                    {/* Top-left Badge (NEW or Discount) */}
                    {badge && (
                      <span className="absolute left-4 top-4 z-20 pointer-events-none px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-sm bg-[#c62f57]">
                        {badge.label}
                      </span>
                    )}

                    {/* Product Image with Hover to Alternate Setup View - Transparent background & no shape outline */}
                    <div className="relative z-10 aspect-[4/3] w-full overflow-hidden bg-transparent border-0 border-none outline-none ring-0 shadow-none pointer-events-none flex items-center justify-center p-2">
                      <ProductHoverThumb
                        photos={item.photos}
                        alt={item.name}
                        fit="contain"
                        className="h-full w-full object-contain"
                        containerClassName="bg-transparent border-none shadow-none"
                      />
                    </div>

                    {/* Product Details Section */}
                    <div className="relative z-10 mt-4 flex flex-col pointer-events-none">
                      {/* Available Color Swatches & Grade Tag */}
                      <div className="flex items-center justify-between gap-2">
                        {/* Color Swatch Dots (increased to h-4.5 w-4.5 with 2.5pt white border) */}
                        <div className="flex items-center gap-1.5">
                          {colorDots.map((dot, idx) => (
                            <span
                              key={idx}
                              className="h-4.5 w-4.5 rounded-full border-[2.5pt] border-white shadow-sm"
                              style={{ backgroundColor: dot }}
                            />
                          ))}
                        </div>

                        {/* Quantity Tag */}
                        <span className="inline-flex items-center gap-1 rounded bg-stone-100 px-2 py-0.5 text-[11px] font-bold text-stone-700 group-hover:bg-white/20 group-hover:text-white transition-colors">
                          Qty: {getItemStock(item)}
                        </span>
                      </div>

                      {/* Product Name (increased font size, bold, black -> hover white) */}
                      <h3 className="mt-2.5 font-display text-base sm:text-[17px] font-bold text-black group-hover:text-white truncate transition-colors">
                        {item.name}
                      </h3>

                      {/* Price & Heart (increased font size, font-normal, black -> hover white, heart increased to h-5.5 w-5.5) */}
                      <div className="mt-1.5 flex items-center justify-between">
                        <span className="font-display text-base sm:text-[17px] font-normal text-black group-hover:text-white transition-colors">
                          {fmtMoney(item.listedPrice)}
                        </span>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleToggleFavorite(item, e);
                          }}
                          aria-label={isFav ? `Remove ${item.name} from favorites` : `Add ${item.name} to favorites`}
                          className="pointer-events-auto p-1 text-[#16c4df] transition hover:scale-125 active:scale-90"
                        >
                          <Heart
                            className={`h-5.5 w-5.5 transition-colors ${
                              isFav
                                ? "fill-[#16c4df] text-[#16c4df]"
                                : "text-[#16c4df] hover:fill-[#16c4df]/20"
                            }`}
                            strokeWidth={1.8}
                          />
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            /* ========================================================= */
            /* LIST VIEW (Matches Mockup 3 with alternating cards)       */
            /* ========================================================= */
            <div className="divide-y divide-[#d8e2e7] border border-[#d8e2e7] bg-white overflow-hidden shadow-sm">
              {visible.map((item, index) => {
                const badge = getItemBadge(item, index);
                const colorDots = getColorDots(item);
                const rating = getItemRating(item);
                const isFav = isFavorite(item.id);

                return (
                  <article
                    key={item.id}
                    className="group/row grid overflow-hidden transition-colors duration-200 md:grid-cols-[38%_62%] lg:grid-cols-[34%_66%] md:h-[280px] bg-white text-[#17364b] hover:bg-[#1D5D8B] hover:text-white"
                  >
                    {/* Left: Product Image on Clean Background */}
                    <Link
                      href={`/shop/${item.id}`}
                      className="group/img relative flex h-64 md:h-full w-full items-center justify-center bg-stone-50 border-b border-stone-200 md:border-b-0 md:border-r md:border-stone-200 overflow-hidden self-stretch p-3"
                    >
                      <ProductHoverThumb
                        photos={item.photos}
                        alt={item.name}
                        fit="contain"
                        className="h-full w-full object-contain"
                        containerClassName="h-full w-full"
                      />
                    </Link>

                    {/* Right: Specifications, Details & Quick Cart */}
                    <div className="flex flex-col justify-between p-6 sm:p-7 h-full overflow-hidden">
                      <div>
                        {/* Badges (left) + Circular Color Swatches (right) */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {badge && (
                              <span className="px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-white bg-[#c62f57]">
                                {badge.label}
                              </span>
                            )}
                            <span className="inline-flex items-center gap-1 rounded bg-stone-100 px-2.5 py-1 text-xs font-bold text-stone-700 group-hover/row:bg-white/20 group-hover/row:text-white transition-colors">
                              Qty: {getItemStock(item)} in stock
                            </span>
                          </div>

                          {/* Color Swatch Circles with 2.5pt white border */}
                          <div className="flex items-center gap-1.5">
                            {colorDots.map((dot, idx) => (
                              <span
                                key={idx}
                                className="h-4.5 w-4.5 rounded-full border-[2.5pt] border-white shadow-sm"
                                style={{ backgroundColor: dot }}
                              />
                            ))}
                          </div>
                        </div>

                        {/* Title Row: Product Name (left) & Star Rating + Heart (right) */}
                        <div className="mt-3 flex items-center justify-between gap-4">
                          <Link href={`/shop/${item.id}`} className="min-w-0 flex-1">
                            <h3
                              className="font-display text-2xl sm:text-[26px] font-black uppercase tracking-tight transition text-black group-hover/row:text-white hover:text-[#16c4df] group-hover/row:hover:text-[#16c4df] truncate"
                              title={item.name}
                            >
                              {item.name}
                            </h3>
                          </Link>

                          <div className="flex items-center gap-4 shrink-0">
                            <div className="flex items-center gap-1.5 text-sm font-normal text-[#f0b500]">
                              <Star className="h-5 w-5 fill-current" />
                              <span>{rating}</span>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => handleToggleFavorite(item, e)}
                              aria-label={`Favorite ${item.name}`}
                              className="text-[#16c4df] transition hover:scale-110 active:scale-95"
                            >
                              <Heart
                                className={`h-6 w-6 transition-colors ${
                                  isFav ? "fill-[#16c4df] text-[#16c4df]" : "text-[#16c4df] hover:fill-[#16c4df]/20"
                                }`}
                                strokeWidth={1.8}
                              />
                            </button>
                          </div>
                        </div>

                        {/* Two-column Specifications List matching reference photo */}
                        <div className="mt-4 grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                          {/* Column 1: Brand, Material, Dimension */}
                          <div className="space-y-2">
                            <div className="flex gap-2">
                              <span className="w-20 sm:w-24 shrink-0 font-normal text-[#BCBDBA]">Brand</span>
                              <span className="font-normal text-black group-hover/row:text-white truncate">
                                {item.brand || "Humanscale"}
                              </span>
                            </div>
                            <div className="flex gap-2">
                              <span className="w-20 sm:w-24 shrink-0 font-normal text-[#BCBDBA]">Material</span>
                              <span className="font-normal text-black group-hover/row:text-white truncate">
                                {item.material || "Leather"}
                              </span>
                            </div>
                            <div className="flex gap-2">
                              <span className="w-20 sm:w-24 shrink-0 font-normal text-[#BCBDBA]">Dimension</span>
                              <span className="font-normal text-black group-hover/row:text-white truncate">
                                {item.dimensions || "Standard"}
                              </span>
                            </div>
                          </div>

                          {/* Column 2: Color, Features (Controlled Attributes) */}
                          <div className="space-y-2">
                            <div className="flex gap-2">
                              <span className="w-20 sm:w-24 shrink-0 font-normal text-[#BCBDBA]">Color</span>
                              <span className="font-normal text-black group-hover/row:text-white truncate">
                                {item.color || "Walnut"}
                              </span>
                            </div>
                            <div className="flex gap-2">
                              <span className="w-20 sm:w-24 shrink-0 font-normal text-[#BCBDBA]">Features</span>
                              <span className="font-normal text-black group-hover/row:text-white truncate">
                                {getControlledAttributesSummary(item)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Bottom: Price + View Details Link (NO LINE ABOVE PRICE) */}
                      <div className="mt-4 flex items-center justify-between transition-colors shrink-0">
                        <div
                          className="font-display text-2xl sm:text-[26px] font-black uppercase tracking-tight text-black group-hover/row:text-white transition-colors"
                        >
                          {fmtMoney(item.listedPrice)}
                        </div>

                        <div className="flex items-center gap-2">
                          <Link
                            href={`/shop/${item.id}`}
                            className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-[#1D5D8B] bg-stone-100 transition hover:bg-[#16c4df] hover:text-[#17364b]"
                          >
                            View Details →
                          </Link>
                        </div>
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
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 border border-stone-200 bg-white px-4 py-3 shadow-2xl animate-in slide-in-from-bottom-5">
          <div
            className={`flex h-8 w-8 items-center justify-center ${
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
            className="ml-2 bg-[#1D5D8B] px-2.5 py-1 text-[11px] font-bold text-white hover:bg-[#164e75] transition"
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
