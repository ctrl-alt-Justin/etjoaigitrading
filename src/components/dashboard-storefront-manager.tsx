"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
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
  ExternalLink,
  Upload,
  Trash2,
  HelpCircle,
  Info,
  Layers
} from "lucide-react";
import { type DbItem } from "@/db/schema";
import { fmtMoney } from "@/lib/format";
import { Thumb } from "@/components/ui";
import { 
  type StorefrontSettings, 
  DEFAULT_STOREFRONT_SETTINGS, 
  type CatalogBannerSettings 
} from "@/lib/storefront-settings-types";
import { compressImageFile } from "@/lib/image-compress";

interface Props {
  items: DbItem[];
}

export function DashboardStorefrontManager({ items }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"spotlight" | "banner">("spotlight");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [settings, setSettings] = useState<StorefrontSettings>(DEFAULT_STOREFRONT_SETTINGS);
  const [spotlightIds, setSpotlightIds] = useState<number[]>([]);
  const [bannerForm, setBannerForm] = useState<CatalogBannerSettings>(
    DEFAULT_STOREFRONT_SETTINGS.catalogBanner
  );

  // Load existing settings when modal opens
  useEffect(() => {
    if (!open) return;

    setLoading(true);
    fetch("/api/storefront-settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.settings) {
          setSettings(data.settings);
          if (Array.isArray(data.settings.spotlightItemIds)) {
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

  const handleBannerPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    try {
      // Compress to panoramic resolution with high clarity
      const dataUrl = await compressImageFile(file, 1920, 0.85);
      setBannerForm((prev) => ({ ...prev, bgPhotoUrl: dataUrl }));
    } catch (err) {
      console.error("Failed to upload/compress banner image:", err);
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
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
        // Refresh router data without reloading browser window
        router.refresh();
        setTimeout(() => {
          setSavedSuccess(false);
          setOpen(false);
        }, 1100);
      }
    } catch (err) {
      console.error("Failed to save storefront settings:", err);
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

  // Selected items mapped in order
  const selectedItemsList = spotlightIds
    .map((id) => items.find((i) => i.id === id))
    .filter((i): i is DbItem => i != null);

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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-sm animate-in fade-in-50">
          <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col rounded-3xl border border-stone-200 bg-white shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-stone-200 px-5 sm:px-6 py-4 bg-white">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#16c4df]/20 text-[#1D5D8B]">
                  <SlidersHorizontal className="h-5 w-5 text-[#16c4df]" />
                </div>
                <div>
                  <h2 className="font-display text-lg font-bold text-stone-900 leading-tight">
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
            <div className="flex border-b border-stone-200 px-4 sm:px-6 pt-2 bg-stone-50/80">
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
                <span>Featured Gallery</span>
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
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {loading ? (
                <div className="flex h-64 flex-col items-center justify-center gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-[#16c4df]" />
                  <span className="text-xs text-stone-500">Loading storefront configuration...</span>
                </div>
              ) : tab === "spotlight" ? (
                /* TAB 1: SPOTLIGHT ITEMS */
                <div className="space-y-4">
                  {/* Selected for Featured Gallery Tray */}
                  <div className="rounded-2xl border border-[#16c4df]/40 bg-gradient-to-br from-[#16c4df]/10 via-[#1D5D8B]/5 to-transparent p-4">
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-[#16c4df]" />
                        <span className="text-xs font-bold uppercase tracking-wider text-[#17364b]">
                          Active Carousel Showcase ({selectedItemsList.length} items)
                        </span>
                      </div>
                      {spotlightIds.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setSpotlightIds([])}
                          className="text-[11px] font-bold text-rose-600 hover:text-rose-700 transition"
                        >
                          Clear all
                        </button>
                      )}
                    </div>
                    <p className="text-[11.5px] text-stone-600 mb-3">
                      These pieces rotate one-by-one in the homepage Hero Showcase. Click any piece below to add or remove it.
                    </p>

                    {selectedItemsList.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-stone-300 bg-white/70 py-4 px-3 text-center text-xs text-stone-500">
                        No custom items selected. Default inventory items will appear on the homepage. Select items from the list below to create your custom featured rotation.
                      </div>
                    ) : (
                      <div className="flex gap-2.5 overflow-x-auto pb-1.5 scrollbar-thin">
                        {selectedItemsList.map((item, idx) => (
                          <div
                            key={item.id}
                            className="group relative flex shrink-0 items-center gap-2.5 rounded-xl border border-stone-200 bg-white p-2 shadow-xs pr-7 transition hover:border-[#16c4df]"
                          >
                            <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-stone-100 bg-stone-50 p-0.5">
                              <Thumb url={item.photos?.[0]?.url} alt={item.name} className="h-full w-full object-contain" />
                              <span className="absolute bottom-0 left-0 rounded-tr bg-[#071c2e] px-1 py-0.2 text-[8.5px] font-black text-[#16c4df]">
                                #{idx + 1}
                              </span>
                            </div>
                            <div className="min-w-0 max-w-[130px]">
                              <p className="truncate text-xs font-bold text-stone-900">{item.name}</p>
                              <p className="text-[11px] font-bold text-[#1D5D8B]">
                                {item.listedPrice ? fmtMoney(item.listedPrice) : "Unpriced"}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleSpotlightItem(item.id);
                              }}
                              title="Remove from featured rotation"
                              className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full p-1 text-stone-400 hover:bg-rose-50 hover:text-rose-600 transition"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Search and Filters */}
                  <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="font-display text-sm font-bold text-stone-900">
                        Available Inventory
                      </h3>
                      <p className="text-xs text-stone-500">
                        Click on any piece to toggle it in or out of the homepage carousel.
                      </p>
                    </div>

                    <div className="relative w-full sm:w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search items by name, brand, SKU..."
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
                          className={`group relative flex cursor-pointer items-center gap-3 rounded-2xl border p-3 transition duration-150 ${
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
                              className={`rounded-full px-2.5 py-1 text-[10px] font-bold transition ${
                                isSelected
                                  ? "bg-[#16c4df] text-[#071c2e] font-extrabold"
                                  : "bg-stone-100 text-stone-500 group-hover:bg-stone-200"
                              }`}
                            >
                              {isSelected ? "Featured" : "+ Add"}
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
                      Configure the headline, promotional slogan, and hero background photo displayed atop <code className="rounded bg-stone-100 px-1 text-stone-700">/shop/catalog</code>.
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

                    {/* Promo Catchphrase & Custom Photo Upload */}
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

                      {/* Custom Photo Upload & Guidelines */}
                      <div className="border-t border-stone-200/80 pt-3">
                        <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                          Custom Banner Background Photo
                        </label>

                        {/* Preferred Resolution Notice */}
                        <div className="mb-2.5 rounded-xl border border-sky-200 bg-sky-50/80 p-2.5 text-[11px] text-sky-900 flex items-start gap-2">
                          <Info className="h-4 w-4 shrink-0 text-sky-600 mt-0.5" />
                          <div>
                            <span className="font-bold">Recommended resolution: </span>
                            <span>1920 × 400px (16:3 or 16:4 aspect ratio, min. 1200 × 300px) for crisp display across mobile and desktop.</span>
                          </div>
                        </div>

                        {/* Upload Button and Actions */}
                        <div className="flex flex-wrap items-center gap-2">
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleBannerPhotoUpload}
                            className="hidden"
                          />

                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadingPhoto}
                            className="flex items-center gap-1.5 rounded-xl border border-[#16c4df] bg-[#16c4df]/10 px-3 py-1.5 text-xs font-bold text-[#1D5D8B] transition hover:bg-[#16c4df] hover:text-[#071c2e] disabled:opacity-50"
                          >
                            {uploadingPhoto ? (
                              <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                <span>Compressing...</span>
                              </>
                            ) : (
                              <>
                                <Upload className="h-3.5 w-3.5" />
                                <span>{bannerForm.bgPhotoUrl ? "Replace Photo" : "Upload Photo"}</span>
                              </>
                            )}
                          </button>

                          {bannerForm.bgPhotoUrl && (
                            <button
                              type="button"
                              onClick={() => setBannerForm((p) => ({ ...p, bgPhotoUrl: "" }))}
                              className="flex items-center gap-1 rounded-xl border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-bold text-stone-600 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition"
                              title="Remove custom photo and use default"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span>Remove</span>
                            </button>
                          )}
                        </div>

                        {/* Direct URL input fallback */}
                        <div className="mt-2">
                          <input
                            type="text"
                            value={bannerForm.bgPhotoUrl || ""}
                            onChange={(e) =>
                              setBannerForm((p) => ({ ...p, bgPhotoUrl: e.target.value }))
                            }
                            placeholder="Or paste external image URL..."
                            className="w-full rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-[11px] font-medium text-stone-900 outline-none focus:border-[#16c4df]"
                          />
                        </div>
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

                    <div className="relative h-[220px] overflow-hidden rounded-2xl bg-gradient-to-r from-[#0b2b47] via-[#103d63] to-[#0c6b8c] p-6 shadow-md">
                      {bannerForm.bgPhotoUrl && (
                        <div
                          className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-overlay scale-105 transition-all duration-300"
                          style={{ backgroundImage: `url(${bannerForm.bgPhotoUrl})` }}
                        />
                      )}
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
            <div className="flex items-center justify-between border-t border-stone-200 px-5 sm:px-6 py-4 bg-stone-50">
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
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#16c4df] to-[#12a4bb] px-5 py-2 text-xs font-bold text-[#071c2e] shadow-md shadow-[#16c4df]/20 hover:brightness-110 active:scale-95 disabled:opacity-50 transition"
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
