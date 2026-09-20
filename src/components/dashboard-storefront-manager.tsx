"use client";

import { useState, useEffect } from "react";
import { 
  SlidersHorizontal, 
  Sparkles, 
  Image as ImageIcon, 
  Check, 
  X, 
  Loader2, 
  Search, 
  Eye, 
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  ExternalLink
} from "lucide-react";
import { type DbItem } from "@/db/schema";
import { fmtMoney } from "@/lib/format";
import { Thumb } from "@/components/ui";
import { type StorefrontSettings, DEFAULT_STOREFRONT_SETTINGS, type CatalogBannerSettings } from "@/lib/storefront-settings-types";

interface Props {
  items: DbItem[];
}

export function DashboardStorefrontManager({ items }: Props) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"spotlight" | "banner">("spotlight");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [settings, setSettings] = useState<StorefrontSettings>(DEFAULT_STOREFRONT_SETTINGS);
  const [spotlightIds, setSpotlightIds] = useState<number[]>([]);
  const [bannerForm, setBannerForm] = useState<CatalogBannerSettings>(DEFAULT_STOREFRONT_SETTINGS.catalogBanner);

  // Load existing settings when modal opens
  useEffect(() => {
    if (!open) return;

    setLoading(true);
    fetch("/api/storefront-settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.settings) {
          setSettings(data.settings);
          // If no spotlight IDs saved yet, initialize with current database isFeatured items
          if (data.settings.spotlightItemIds && data.settings.spotlightItemIds.length > 0) {
            setSpotlightIds(data.settings.spotlightItemIds);
          } else {
            const currentFeatured = items.filter((i) => i.isFeatured).map((i) => i.id);
            setSpotlightIds(currentFeatured.length > 0 ? currentFeatured : items.slice(0, 4).map((i) => i.id));
          }
          if (data.settings.catalogBanner) {
            setBannerForm(data.settings.catalogBanner);
          }
        }
      })
      .catch((err) => console.error("Failed to load storefront settings:", err))
      .finally(() => setLoading(false));
  }, [open, items]);

  const toggleSpotlightItem = (id: number) => {
    setSpotlightIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((x) => x !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setSavedSuccess(false);

    try {
      const payload: StorefrontSettings = {
        spotlightItemIds: spotlightIds,
        catalogBanner: bannerForm,
      };

      const res = await fetch("/api/storefront-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => {
          setSavedSuccess(false);
          setOpen(false);
          // Reload page to reflect updated server props
          window.location.reload();
        }, 900);
      }
    } catch (err) {
      console.error("Failed to save settings:", err);
    } finally {
      setSaving(false);
    }
  };

  // Filter items for spotlight selection
  const listedItems = items.filter((i) => i.status === "listed" || i.status === "in_stock");
  const filteredItems = listedItems.filter((i) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      i.name.toLowerCase().includes(q) ||
      (i.brand && i.brand.toLowerCase().includes(q)) ||
      (i.model && i.model.toLowerCase().includes(q)) ||
      (i.sku && i.sku.toLowerCase().includes(q))
    );
  });

  return (
    <>
      {/* Trigger Button in Dashboard Action Bar */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-xl border border-stone-200/80 bg-white px-3.5 py-2 text-[13px] font-bold text-stone-700 shadow-sm transition hover:border-[#16c4df] hover:bg-stone-50 hover:text-stone-900"
        title="Configure Spotlight Carousel & Catalog Promotional Banner"
      >
        <SlidersHorizontal className="h-4 w-4 text-[#16c4df]" />
        <span>Storefront CMS</span>
      </button>

      {/* Modal Dialog */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in-50">
          <div className="relative flex max-h-[90vh] w-full max-w-4xl flex-col rounded-3xl border border-stone-200 bg-white shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-stone-200 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#16c4df]/20 text-[#1D5D8B]">
                  <SlidersHorizontal className="h-5 w-5 text-[#16c4df]" />
                </div>
                <div>
                  <h2 className="font-display text-lg font-bold text-stone-900">
                    Storefront Display Manager
                  </h2>
                  <p className="text-xs text-stone-500">
                    Customize homepage Featured Spotlight items and Catalog Promotional Banner
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl p-2 text-stone-400 transition hover:bg-stone-100 hover:text-stone-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-stone-200 px-6 pt-2 bg-stone-50/70">
              <button
                type="button"
                onClick={() => setTab("spotlight")}
                className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold transition ${
                  tab === "spotlight"
                    ? "border-[#16c4df] text-[#1D5D8B] bg-white rounded-t-xl"
                    : "border-transparent text-stone-500 hover:text-stone-800"
                }`}
              >
                <Sparkles className="h-4 w-4 text-[#16c4df]" />
                <span>Featured Spotlight Items</span>
                <span className="rounded-full bg-[#16c4df]/20 px-2 py-0.5 text-[10.5px] font-extrabold text-[#1D5D8B]">
                  {spotlightIds.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setTab("banner")}
                className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold transition ${
                  tab === "banner"
                    ? "border-[#16c4df] text-[#1D5D8B] bg-white rounded-t-xl"
                    : "border-transparent text-stone-500 hover:text-stone-800"
                }`}
              >
                <ImageIcon className="h-4 w-4 text-[#16c4df]" />
                <span>Catalog Promotional Banner</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6">
              {loading ? (
                <div className="flex h-64 flex-col items-center justify-center gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-[#16c4df]" />
                  <span className="text-xs text-stone-500">Loading storefront settings...</span>
                </div>
              ) : tab === "spotlight" ? (
                /* TAB 1: SPOTLIGHT ITEMS */
                <div className="space-y-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="font-display text-sm font-bold text-stone-900">
                        Select Spotlight Carousel Pieces
                      </h3>
                      <p className="text-xs text-stone-500">
                        Selected items rotate in the 3D ghost carousel on the shop homepage.
                      </p>
                    </div>

                    <div className="relative w-full sm:w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search items..."
                        className="w-full rounded-xl border border-stone-200 bg-stone-50 pl-9 pr-3 py-1.5 text-xs text-stone-900 placeholder-stone-400 outline-none focus:border-[#16c4df] focus:bg-white"
                      />
                    </div>
                  </div>

                  {/* Items Grid */}
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredItems.map((item) => {
                      const isSelected = spotlightIds.includes(item.id);
                      const photo = item.photos?.[0]?.url;

                      return (
                        <div
                          key={item.id}
                          onClick={() => toggleSpotlightItem(item.id)}
                          className={`group relative flex cursor-pointer items-center gap-3 rounded-2xl border p-3 transition duration-200 ${
                            isSelected
                              ? "border-[#16c4df] bg-[#16c4df]/5 shadow-sm ring-1 ring-[#16c4df]"
                              : "border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50"
                          }`}
                        >
                          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-stone-200 bg-stone-100 p-1">
                            <Thumb url={photo} alt={item.name} className="h-full w-full object-contain" />
                            {isSelected && (
                              <div className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#16c4df] text-[#071c2e] shadow-sm">
                                <Check className="h-2.5 w-2.5 stroke-[3]" />
                              </div>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-black uppercase tracking-wider text-amber-700">
                                {item.brand ?? "Surplus"}
                              </span>
                              {item.grade && (
                                <span className="rounded bg-stone-100 px-1 py-0.2 text-[9.5px] font-bold text-stone-600">
                                  Grade {item.grade}
                                </span>
                              )}
                            </div>
                            <div className="truncate text-xs font-bold text-stone-900">
                              {item.name}
                            </div>
                            <div className="mt-0.5 text-xs font-bold text-stone-800">
                              {item.listedPrice ? fmtMoney(item.listedPrice) : "Unpriced"}
                            </div>
                          </div>

                          <div>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-bold transition ${
                                isSelected
                                  ? "bg-[#16c4df] text-[#071c2e]"
                                  : "bg-stone-100 text-stone-500 group-hover:bg-stone-200"
                              }`}
                            >
                              {isSelected ? "Featured" : "Add"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* TAB 2: CATALOG BANNER */
                <div className="space-y-6">
                  <div>
                    <h3 className="font-display text-sm font-bold text-stone-900">
                      Catalog Hero Promotional Banner
                    </h3>
                    <p className="text-xs text-stone-500">
                      Edit the headline, discount slogan, and featured piece note displayed atop <code className="rounded bg-stone-100 px-1 text-stone-700">/shop/catalog</code>.
                    </p>
                  </div>

                  {/* Form fields */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {/* Top Note Group */}
                    <div className="space-y-3 rounded-2xl border border-stone-200 bg-stone-50/60 p-4">
                      <div className="text-xs font-bold uppercase tracking-wider text-stone-700">
                        Top Product Note
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                          Product Name
                        </label>
                        <input
                          type="text"
                          value={bannerForm.productName}
                          onChange={(e) =>
                            setBannerForm((p) => ({ ...p, productName: e.target.value }))
                          }
                          placeholder="e.g. LANDSKRONA"
                          className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-medium text-stone-900 outline-none focus:border-[#16c4df]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                          Description / Subtitle
                        </label>
                        <input
                          type="text"
                          value={bannerForm.productDesc}
                          onChange={(e) =>
                            setBannerForm((p) => ({ ...p, productDesc: e.target.value }))
                          }
                          placeholder="e.g. 2-seat sofa, dark blue velvet."
                          className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-medium text-stone-900 outline-none focus:border-[#16c4df]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                          Price / Tag
                        </label>
                        <input
                          type="text"
                          value={bannerForm.productPrice}
                          onChange={(e) =>
                            setBannerForm((p) => ({ ...p, productPrice: e.target.value }))
                          }
                          placeholder="e.g. 4799 or ₱4,799"
                          className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-medium text-stone-900 outline-none focus:border-[#16c4df]"
                        />
                      </div>
                    </div>

                    {/* Promo Catchphrase Group */}
                    <div className="space-y-3 rounded-2xl border border-stone-200 bg-stone-50/60 p-4">
                      <div className="text-xs font-bold uppercase tracking-wider text-stone-700">
                        Promotional Catchphrase
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                          Promo Title
                        </label>
                        <input
                          type="text"
                          value={bannerForm.promoTitle}
                          onChange={(e) =>
                            setBannerForm((p) => ({ ...p, promoTitle: e.target.value }))
                          }
                          placeholder="e.g. SUPER SUMMER SALE"
                          className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-bold text-stone-900 outline-none focus:border-[#16c4df]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                          Promo Subtitle / Discount Slogan
                        </label>
                        <input
                          type="text"
                          value={bannerForm.promoSubtitle}
                          onChange={(e) =>
                            setBannerForm((p) => ({ ...p, promoSubtitle: e.target.value }))
                          }
                          placeholder="e.g. UP TO 50% OFF ON SELECTED PRE-OWNED ITEMS"
                          className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-medium text-stone-900 outline-none focus:border-[#16c4df]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                          Custom Background Image URL (optional)
                        </label>
                        <input
                          type="text"
                          value={bannerForm.bgPhotoUrl || ""}
                          onChange={(e) =>
                            setBannerForm((p) => ({ ...p, bgPhotoUrl: e.target.value }))
                          }
                          placeholder="Leave blank to use default inventory photo"
                          className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-medium text-stone-900 outline-none focus:border-[#16c4df]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Realtime Live Preview */}
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                        Live Preview (as seen on Customer Catalog)
                      </span>
                    </div>

                    <div className="relative h-[200px] overflow-hidden rounded-2xl bg-gradient-to-r from-[#0b2b47] via-[#103d63] to-[#0c6b8c] p-6 shadow-md">
                      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(22,196,223,0.35),transparent_70%)]" />
                      <div className="relative flex h-full flex-col justify-between">
                        {/* Top Note */}
                        <div>
                          <div className="font-hegarty text-xs font-black uppercase tracking-wider text-white">
                            {bannerForm.productName || "PRODUCT NAME"}
                          </div>
                          <div className="text-[11px] font-medium text-stone-200">
                            {bannerForm.productDesc || "Product description here"}
                          </div>
                          <div className="mt-0.5 text-xs font-bold text-white">
                            {bannerForm.productPrice || "₱0"}
                          </div>
                        </div>

                        {/* Bottom Promo */}
                        <div>
                          <h1 className="font-hegarty text-2xl font-black uppercase tracking-tight text-white sm:text-3xl">
                            {bannerForm.promoTitle || "PROMOTION HEADLINE"}
                          </h1>
                          <p className="mt-0.5 text-xs font-bold uppercase tracking-wider text-[#16c4df]">
                            {bannerForm.promoSubtitle || "DISCOUNT SLOGAN"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-stone-200 px-6 py-4 bg-stone-50 rounded-b-3xl">
              <div>
                {savedSuccess && (
                  <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 animate-in fade-in">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Storefront settings successfully saved!
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-xl border border-stone-200 bg-white px-4 py-2 text-xs font-bold text-stone-600 hover:bg-stone-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#16c4df] to-[#12a4bb] px-5 py-2 text-xs font-bold text-[#071c2e] shadow-md shadow-[#16c4df]/20 hover:brightness-110 active:scale-95 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-[#071c2e]" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                      Save Storefront Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
