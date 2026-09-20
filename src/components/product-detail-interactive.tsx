"use client";

import { useState, useMemo, useRef } from "react";
import { 
  BadgeCheck, 
  CheckCircle2, 
  AlertCircle, 
  Star, 
  Minus, 
  Plus, 
  ShoppingBag, 
  Check, 
  MapPin, 
  Mail, 
  Sparkles,
  MessageSquare,
  ShieldCheck,
  Send,
  Camera,
  ImagePlus,
  Trash2,
  X,
  Maximize2
} from "lucide-react";
import type { DbItem, DbReview, Grade } from "@/db/schema";
import { fmtMoney, fmtDateFull, relTime } from "@/lib/format";
import { GRADE_META } from "@/lib/valuation";
import { useCart } from "@/components/cart-provider";
import { compressImageFile } from "@/lib/image-compress";

interface Props {
  item: DbItem;
  initialReviews: DbReview[];
  categoryPath: string;
  specs: [string, string | null | undefined][];
}

type TabKey = "specs" | "before_state" | "reviews";

export function ProductDetailInteractive({ item, initialReviews, categoryPath, specs }: Props) {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<TabKey>("specs");
  const [added, setAdded] = useState(false);

  // Reviews state
  const [reviews, setReviews] = useState<DbReview[]>(initialReviews);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewFormOpen, setReviewFormOpen] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newAuthor, setNewAuthor] = useState("");
  const [newContent, setNewContent] = useState("");
  const [reviewPhotos, setReviewPhotos] = useState<string[]>([]);
  const [isProcessingPhotos, setIsProcessingPhotos] = useState(false);
  const [previewLightbox, setPreviewLightbox] = useState<string | null>(null);
  const reviewFileInputRef = useRef<HTMLInputElement>(null);
  const [reviewMessage, setReviewMessage] = useState<string | null>(null);

  const grade = item.grade as Grade | null;

  // Calculate dynamic rating
  const { avgRating, ratingCount } = useMemo(() => {
    if (!reviews.length) return { avgRating: 5.0, ratingCount: 0 };
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return {
      avgRating: Number((sum / reviews.length).toFixed(1)),
      ratingCount: reviews.length,
    };
  }, [reviews]);

  const handleReviewPhotoSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsProcessingPhotos(true);
    try {
      const addedUrls: string[] = [];
      for (const f of Array.from(files)) {
        if (reviewPhotos.length + addedUrls.length >= 5) break;
        const dataUrl = await compressImageFile(f);
        addedUrls.push(dataUrl);
      }
      setReviewPhotos((prev) => [...prev, ...addedUrls].slice(0, 5));
    } catch (err) {
      console.error("Failed to compress review photo:", err);
    } finally {
      setIsProcessingPhotos(false);
    }
  };

  const handleAddToCart = () => {
    if (!item.listedPrice) return;
    addToCart(
      {
        id: item.id,
        name: item.name,
        price: item.listedPrice,
        photo: item.photos?.[0]?.url,
        color: item.color,
        sku: item.sku,
        brand: item.brand,
        model: item.model,
        grade: item.grade,
      },
      quantity
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 2200);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAuthor.trim() || !newContent.trim()) return;

    setIsSubmittingReview(true);
    setReviewMessage(null);

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: item.id,
          rating: newRating,
          authorName: newAuthor,
          content: newContent,
          photos: reviewPhotos,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to post review");
      }

      const created: DbReview = await res.json();
      setReviews((prev) => [created, ...prev]);
      setNewAuthor("");
      setNewContent("");
      setReviewPhotos([]);
      setNewRating(5);
      setReviewFormOpen(false);
      setReviewMessage("Thank you! Your review and photos have been added.");
    } catch {
      setReviewMessage("Could not post review at this time. Please try again.");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <div className="flex flex-col">
      {/* Category breadcrumb */}
      <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#1D5D8B]">
        {categoryPath}
      </div>

      {/* Title & Rating */}
      <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-baseline sm:justify-between">
        <h1 className="font-display text-3xl font-black leading-[1.08] tracking-tight text-[#17364b] sm:text-4xl">
          {item.name}
        </h1>
      </div>

      {/* Dynamic Rating UI */}
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-[#fef8e7] px-3 py-1 border border-[#f0d900]/40 text-xs font-bold text-[#8a6800]">
          <Star className="h-3.5 w-3.5 fill-[#f0b500] text-[#f0b500]" />
          <span>{avgRating.toFixed(1)}</span>
          <span className="text-[#b39540]">|</span>
          <span className="font-medium text-[#7a6015]">
            {ratingCount === 0 ? "No reviews yet" : `${ratingCount} ${ratingCount === 1 ? "review" : "reviews"}`}
          </span>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 border border-emerald-200 text-xs font-bold text-emerald-800">
          Verified Good Condition
        </span>
      </div>

      {/* Asking price section */}
      <div className="mt-6 border border-[#d8e2e7] bg-white p-5 shadow-sm">
        <div className="flex items-baseline justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#557287]">
              Listing Price
            </div>
            <div className="mt-1 font-display text-4xl font-black text-[#17364b]">
              {fmtMoney(item.listedPrice)}
            </div>
          </div>
          {item.benchmarkPrice && item.listedPrice && item.listedPrice < item.benchmarkPrice && (
            <div className="bg-emerald-50 px-3 py-1.5 text-right border border-emerald-200">
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                Below Retail
              </div>
              <div className="text-xs font-bold text-emerald-700">
                Save {fmtMoney(item.benchmarkPrice - item.listedPrice)}
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-t border-stone-100 pt-3 text-xs text-[#3f6175]">
          <span className="flex items-center gap-1.5">
            <BadgeCheck className="h-4 w-4 text-[#1D5D8B]" /> Inspected & Verified
          </span>
          <span>Ref {item.sku ?? "—"}</span>
          <span>Listed {fmtDateFull(item.listedAt ?? item.intakeAt)}</span>
        </div>

        {/* Quantity and Add to Cart */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Quantity Selector */}
          <div className="flex h-12 w-32 items-center justify-between border border-[#d8e2e7] bg-[#FCFDF8] px-2 shadow-inner">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              aria-label="Decrease quantity"
              className="flex h-8 w-8 items-center justify-center text-stone-600 transition hover:bg-stone-200 disabled:opacity-40"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="font-display text-sm font-bold text-[#17364b]">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity((q) => q + 1)}
              aria-label="Increase quantity"
              className="flex h-8 w-8 items-center justify-center text-stone-600 transition hover:bg-stone-200"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Add to Cart Button */}
          <button
            type="button"
            onClick={handleAddToCart}
            className={`flex flex-1 h-12 items-center justify-center gap-2.5 px-6 font-bold text-sm shadow-md transition duration-200 ${
              added
                ? "bg-emerald-600 text-white shadow-emerald-200"
                : "bg-[#16c4df] text-[#17364b] hover:bg-[#70e2ef] hover:shadow-lg hover:-translate-y-0.5"
            }`}
          >
            {added ? (
              <>
                <Check className="h-4 w-4" strokeWidth={2.5} />
                Added to Cart ({quantity})
              </>
            ) : (
              <>
                <ShoppingBag className="h-4 w-4" />
                Add To Cart
              </>
            )}
          </button>
        </div>
      </div>

      {/* Interactive Tabs */}
      <div className="mt-8">
        {/* Tab Headers */}
        <div className="flex border-b border-[#d8e2e7]">
          <button
            type="button"
            onClick={() => setActiveTab("specs")}
            className={`flex items-center gap-2 border-b-2 px-5 py-3 text-xs font-bold uppercase tracking-wider transition ${
              activeTab === "specs"
                ? "border-[#1D5D8B] text-[#1D5D8B]"
                : "border-transparent text-[#557287] hover:text-[#17364b]"
            }`}
          >
            Specifications
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("before_state")}
            className={`flex items-center gap-2 border-b-2 px-5 py-3 text-xs font-bold uppercase tracking-wider transition ${
              activeTab === "before_state"
                ? "border-[#1D5D8B] text-[#1D5D8B]"
                : "border-transparent text-[#557287] hover:text-[#17364b]"
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            Before State
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("reviews")}
            className={`flex items-center gap-2 border-b-2 px-5 py-3 text-xs font-bold uppercase tracking-wider transition ${
              activeTab === "reviews"
                ? "border-[#1D5D8B] text-[#1D5D8B]"
                : "border-transparent text-[#557287] hover:text-[#17364b]"
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Reviews ({reviews.length})
          </button>
        </div>

        {/* Tab 1: Specifications */}
        {activeTab === "specs" && (
          <div className="mt-4 animate-in fade-in-50 duration-200">
            <dl className="grid grid-cols-2 gap-x-5 gap-y-4 border border-[#d8e2e7] bg-white p-5 sm:grid-cols-3">
              {specs.map(([key, value]) => (
                <div key={key}>
                  <dt className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#557287]">
                    {key}
                  </dt>
                  <dd className="mt-1 truncate text-sm font-semibold text-[#294e65]">
                    {value || "—"}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        {/* Tab 2: Before State (replacing Condition Notes) */}
        {activeTab === "before_state" && (
          <div className="mt-4 space-y-4 animate-in fade-in-50 duration-200">
            {/* Condition Notes summary */}
            <div className="border border-[#d8e2e7] bg-white p-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#1D5D8B]">
                Intake Condition & Assessment
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[#294e65]">
                {item.conditionNotes || "No notable physical defects reported during intake inspection."}
              </p>
            </div>

            {/* Checklist items */}
            {item.checklist && item.checklist.length > 0 && (
              <div className="border border-[#d8e2e7] bg-white p-5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#1D5D8B]">
                  Pre-Listing Inspection Checklist
                </h3>
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {item.checklist.map((check, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between bg-[#FCFDF8] px-3.5 py-2 text-xs border border-stone-100"
                    >
                      <span className="font-semibold text-[#294e65]">{check.label}</span>
                      {check.status === "pass" ? (
                        <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Pass
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-bold text-amber-700">
                          <AlertCircle className="h-3.5 w-3.5 text-amber-600" /> Flagged
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Reviews */}
        {activeTab === "reviews" && (
          <div className="mt-4 space-y-5 animate-in fade-in-50 duration-200">
            {/* Rating summary bar */}
            <div className="flex flex-col gap-4 border border-[#d8e2e7] bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="font-display text-4xl font-black text-[#17364b]">
                  {avgRating.toFixed(1)}
                </div>
                <div>
                  <div className="flex text-[#f0b500]">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < Math.round(avgRating)
                            ? "fill-current"
                            : "fill-none text-stone-300"
                        }`}
                      />
                    ))}
                  </div>
                  <div className="mt-0.5 text-xs text-[#557287]">
                    Based on {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setReviewFormOpen(!reviewFormOpen)}
                className="inline-flex items-center gap-1.5 self-start bg-[#1D5D8B] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#16486B]"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                {reviewFormOpen ? "Cancel" : "Write a Review"}
              </button>
            </div>

            {reviewMessage && (
              <div className="bg-emerald-50 p-3.5 text-xs font-semibold text-emerald-800 border border-emerald-200">
                {reviewMessage}
              </div>
            )}

            {/* Write a review form */}
            {reviewFormOpen && (
              <form
                onSubmit={handleSubmitReview}
                className="border border-[#16c4df]/50 bg-[#eefaff] p-5 animate-in fade-in-50"
              >
                <h4 className="text-sm font-bold text-[#17364b]">Share Your Feedback</h4>
                
                {/* Rating select */}
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-xs font-semibold text-[#557287]">Rating:</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setNewRating(star)}
                        className="p-1 text-[#f0b500] hover:scale-110 transition"
                      >
                        <Star
                          className={`h-5 w-5 ${
                            star <= newRating ? "fill-current" : "fill-none text-stone-300"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-3">
                  <label className="block text-xs font-semibold text-[#557287]">
                    Your Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newAuthor}
                    onChange={(e) => setNewAuthor(e.target.value)}
                    placeholder="e.g. Maria S."
                    className="input mt-1 w-full text-xs"
                  />
                </div>

                <div className="mt-3">
                  <label className="block text-xs font-semibold text-[#557287]">
                    Review
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    placeholder="Describe condition, ergonomics, viewing experience, etc."
                    className="input mt-1 w-full text-xs"
                  />
                </div>

                {/* Picture Uploads on Review */}
                <div className="mt-3.5 border-t border-[#d8e2e7]/70 pt-3">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-[#17364b]">
                      <Camera className="h-3.5 w-3.5 text-[#1D5D8B]" />
                      <span>Attach Photos</span>
                      <span className="font-normal text-stone-400">(optional, up to 5)</span>
                    </label>
                    <span className="text-[11px] font-medium text-[#557287]">
                      {reviewPhotos.length}/5 photos
                    </span>
                  </div>

                  <div className="mt-2.5 flex flex-wrap items-center gap-2">
                    {reviewPhotos.map((url, idx) => (
                      <div
                        key={idx}
                        className="group relative h-16 w-16 overflow-hidden rounded-lg border border-[#d8e2e7] bg-white shadow-2xs"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={url}
                          alt={`Uploaded review photo ${idx + 1}`}
                          className="h-full w-full object-contain p-1"
                        />
                        <button
                          type="button"
                          onClick={() => setReviewPhotos((p) => p.filter((_, i) => i !== idx))}
                          className="absolute inset-0 flex items-center justify-center bg-stone-900/60 text-white opacity-0 backdrop-blur-2xs transition group-hover:opacity-100"
                          title="Remove photo"
                        >
                          <Trash2 className="h-4 w-4 text-rose-300" />
                        </button>
                      </div>
                    ))}

                    {reviewPhotos.length < 5 && (
                      <button
                        type="button"
                        disabled={isProcessingPhotos}
                        onClick={() => reviewFileInputRef.current?.click()}
                        className="flex h-16 w-16 flex-col items-center justify-center rounded-lg border-2 border-dashed border-[#16c4df]/70 bg-white text-[#1D5D8B] transition hover:border-[#16c4df] hover:bg-[#16c4df]/5 disabled:opacity-50"
                      >
                        <ImagePlus className="h-4 w-4 text-[#16c4df]" />
                        <span className="mt-1 text-[10px] font-bold text-[#17364b]">
                          {isProcessingPhotos ? "Processing..." : "+ Add"}
                        </span>
                      </button>
                    )}
                  </div>

                  <input
                    ref={reviewFileInputRef}
                    type="file"
                    accept="image/*,image/png,image/jpeg,image/webp"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      handleReviewPhotoSelect(e.target.files);
                      e.target.value = "";
                    }}
                  />
                  <p className="mt-1.5 text-[10.5px] text-stone-400">
                    Supports PNG with transparent backgrounds, JPG, and WebP (up to 5 images).
                  </p>
                </div>

                <div className="mt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setReviewFormOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-[#557287] hover:bg-stone-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingReview || isProcessingPhotos}
                    className="inline-flex items-center gap-1.5 bg-[#16c4df] px-4 py-2 text-xs font-bold text-[#17364b] transition hover:bg-[#70e2ef] disabled:opacity-50"
                  >
                    <Send className="h-3 w-3" />
                    {isSubmittingReview ? "Submitting..." : "Submit Review"}
                  </button>
                </div>
              </form>
            )}

            {/* Review List */}
            {reviews.length === 0 ? (
              <div className="border border-dashed border-[#d8e2e7] bg-white p-8 text-center">
                <Sparkles className="mx-auto h-8 w-8 text-[#16c4df]" />
                <h4 className="mt-2 text-sm font-bold text-[#17364b]">No reviews yet</h4>
                <p className="mt-1 text-xs text-[#557287]">
                  Be the first to share your experience with this piece.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {reviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="border border-[#d8e2e7] bg-white p-4 transition hover:border-[#16c4df]/50"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex text-[#f0b500]">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3.5 w-3.5 ${
                                i < rev.rating
                                  ? "fill-current"
                                  : "fill-none text-stone-300"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs font-bold text-[#17364b]">
                          {rev.authorName}
                        </span>
                      </div>
                      <span className="text-[11px] text-[#557287]">
                        {relTime(rev.createdAt)}
                      </span>
                    </div>
                    {rev.content && (
                      <p className="mt-2 text-xs leading-relaxed text-[#3f6175]">
                        {rev.content}
                      </p>
                    )}

                    {/* Review Attached Photos */}
                    {rev.photos && rev.photos.length > 0 && (
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {rev.photos.map((pUrl, pIdx) => (
                          <button
                            key={pIdx}
                            type="button"
                            onClick={() => setPreviewLightbox(pUrl)}
                            className="group relative h-16 w-16 overflow-hidden rounded-lg border border-[#d8e2e7] bg-stone-50 transition hover:border-[#16c4df] hover:ring-2 hover:ring-[#16c4df]/20"
                            title="Click to view full photo"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={pUrl}
                              alt={`Customer photo ${pIdx + 1}`}
                              className="h-full w-full object-contain p-0.5"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-stone-950/40 opacity-0 transition group-hover:opacity-100">
                              <Maximize2 className="h-3.5 w-3.5 text-white drop-shadow" />
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Lightbox Modal for Review Full-Size Photos */}
      {previewLightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/80 p-4 backdrop-blur-xs animate-in fade-in-50"
          onClick={() => setPreviewLightbox(null)}
        >
          <div
            className="relative max-h-[90vh] max-w-[90vw] overflow-hidden rounded-2xl bg-stone-900 border border-white/20 p-2 shadow-2xl flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreviewLightbox(null)}
              className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-white hover:bg-rose-600 transition shadow"
              aria-label="Close photo preview"
            >
              <X className="h-4 w-4" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewLightbox}
              alt="Enlarged review photo"
              className="max-h-[82vh] max-w-[85vw] object-contain rounded-xl"
            />
          </div>
        </div>
      )}

      {/* Muntinlupa viewing card */}
      <div className="mt-8 bg-[#123D5B] p-5 text-white shadow-sm">
        <div className="flex items-start gap-3">
          <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-[#16c4df]" />
          <div>
            <h2 className="font-semibold text-sm">See it in person</h2>
            <p className="mt-1 text-xs leading-relaxed text-[#d5e8f2]">
              This piece is available for personal inspection at our Muntinlupa warehouse. Contact ETJOAIGI to schedule a viewing or discuss delivery options across Metro Manila.
            </p>
          </div>
        </div>
        <a
          href="https://www.facebook.com/etjoaigitrading"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex h-9 items-center gap-2 bg-[#FCFDF8] px-4 text-xs font-bold text-[#1D5D8B] transition hover:bg-white shadow-sm"
        >
          <Mail className="h-3.5 w-3.5" /> Contact ETJOAIGI
        </a>
      </div>
    </div>
  );
}
