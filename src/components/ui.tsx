import type { ReactNode } from "react";
import { Armchair, type LucideIcon } from "lucide-react";
import { GRADE_META, type Grade } from "@/lib/valuation";
import { cn, fmtPct } from "@/lib/format";
import { normalizeRefPhoto } from "@/lib/taxonomy-data";

export function GradeChip({ grade, className }: { grade?: Grade | null; className?: string }) {
  if (!grade) return <span className="text-stone-400">—</span>;
  const meta = GRADE_META[grade];
  return (
    <span className={cn("chip", meta.chip, className)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
      {grade} · {meta.tagline}
    </span>
  );
}

const STATUS_META: Record<string, { label: string; chip: string; dot: string }> = {
  draft: { label: "Information required", chip: "bg-[#fff1f2] text-[#be123c] border-[#e11d48]/30", dot: "bg-[#e11d48]" },
  intake: { label: "Intake", chip: "bg-[#fefce8] text-[#854d0e] border-[#f0d900]/60", dot: "bg-[#f0d900]" },
  for_cleaning: { label: "For cleaning", chip: "bg-[#ecfdf5] text-[#047857] border-[#10b981]/30", dot: "bg-[#10b981]" },
  cleaning: { label: "For cleaning", chip: "bg-[#ecfdf5] text-[#047857] border-[#10b981]/30", dot: "bg-[#10b981]" },
  for_refurb: { label: "For cleaning & refurbishing", chip: "bg-[#eff6ff] text-[#1d4ed8] border-[#2563eb]/30", dot: "bg-[#2563eb]" },
  for_refurbishing: { label: "For cleaning & refurbishing", chip: "bg-[#eff6ff] text-[#1d4ed8] border-[#2563eb]/30", dot: "bg-[#2563eb]" },
  refurbishing: { label: "For cleaning & refurbishing", chip: "bg-[#eff6ff] text-[#1d4ed8] border-[#2563eb]/30", dot: "bg-[#2563eb]" },
  in_stock: { label: "In stock", chip: "bg-[#f0f9ff] text-[#0369a1] border-[#0284c7]/30", dot: "bg-[#0284c7]" },
  listed: { label: "Listed", chip: "bg-[#f0fdf4] text-[#15803d] border-[#16a34a]/30", dot: "bg-[#16a34a]" },
  reserved: { label: "Reserved", chip: "bg-[#faf5ff] text-[#7e22ce] border-[#a855f7]/30", dot: "bg-[#a855f7]" },
  sold: { label: "Sold", chip: "bg-stone-100 text-stone-700 border-stone-200", dot: "bg-stone-500" },
  archived: { label: "Archived", chip: "bg-stone-100 text-stone-500 border-stone-200", dot: "bg-stone-400" },
};

export function StatusChip({ status, className }: { status?: string | null; className?: string }) {
  const meta = (status && STATUS_META[status]) || STATUS_META.archived;
  return (
    <span className={cn("chip", meta.chip, className)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
      {meta.label}
    </span>
  );
}

export function MarginPill({ margin, className }: { margin: number | null | undefined; className?: string }) {
  if (margin == null) return <span className="text-stone-400">—</span>;
  const tone =
    margin >= 0.45
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : margin >= 0.22
        ? "bg-amber-50 text-amber-700 border-amber-200"
        : "bg-rose-50 text-rose-700 border-rose-200";
  return <span className={cn("chip tabular-nums", tone, className)}>{fmtPct(margin)}</span>;
}

export function AgingChip({
  days,
  listedAt,
  className,
}: {
  days?: number | null;
  listedAt?: string | Date | null;
  className?: string;
}) {
  if (days == null && !listedAt) return <span className="text-stone-400">—</span>;

  let text = "";
  if (listedAt) {
    const d = new Date(listedAt);
    if (!isNaN(d.getTime())) {
      const diffMs = Math.max(0, Date.now() - d.getTime());
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHr = Math.floor(diffMin / 60);
      const diffDays = Math.floor(diffHr / 24);

      if (diffMin < 1) {
        text = "Just now";
      } else if (diffMin < 60) {
        text = `${diffMin}m ago`;
      } else if (diffHr < 24) {
        text = `${diffHr}h ago`;
      } else if (diffDays === 1) {
        text = "1d ago";
      } else {
        text = `${diffDays}d ago`;
      }
    }
  }

  if (!text) {
    if (days == null) return <span className="text-stone-400">—</span>;
    if (days <= 0) {
      text = "Just now";
    } else {
      text = `${days}d listed`;
    }
  }

  const effectiveDays = days ?? (listedAt ? Math.floor((Date.now() - new Date(listedAt).getTime()) / 86400000) : 0);
  const tone =
    effectiveDays >= 90
      ? "bg-rose-50 text-rose-700 border-rose-200"
      : effectiveDays >= 60
        ? "bg-orange-50 text-orange-700 border-orange-200"
        : effectiveDays >= 30
          ? "bg-amber-50 text-amber-700 border-amber-200"
          : text === "Just now"
            ? "bg-[#ecfdf5] text-[#047857] border-[#10b981]/30 font-semibold"
            : "bg-stone-100 text-stone-600 border-stone-200";

  return (
    <span className={cn("chip tabular-nums", tone, className)}>
      {text}
    </span>
  );
}

export function Thumb({
  url,
  alt = "",
  className,
  iconClassName,
}: {
  url?: string | null;
  alt?: string;
  className?: string;
  iconClassName?: string;
}) {
  if (url) {
    const resolvedUrl = normalizeRefPhoto(url);
    if (resolvedUrl.startsWith("data:video/") || /\.(mp4|webm|mov)(\?|$)/i.test(resolvedUrl)) {
      return <video src={resolvedUrl} className={cn("object-cover", className)} muted playsInline />;
    }
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={resolvedUrl} alt={alt} className={cn("object-cover", className)} loading="lazy" />;
  }
  return (
    <div className={cn("flex items-center justify-center bg-stone-100 text-stone-300", className)}>
      <Armchair className={cn("h-1/3 w-1/3", iconClassName)} strokeWidth={1.5} />
    </div>
  );
}

export function ProductHoverThumb({
  photos,
  alt = "",
  className,
  containerClassName,
}: {
  photos?: { url: string; slot?: string; label?: string }[] | null;
  alt?: string;
  className?: string;
  containerClassName?: string;
}) {
  const primaryItem = photos?.find((p) => p.slot === "front" && p.url) ?? photos?.[0];
  const primaryUrl = primaryItem?.url ? normalizeRefPhoto(primaryItem.url) : null;
  
  // Secondary hover photo is strictly from the optional "setup" (Setup/Preview) slot
  const setupItem = photos?.find((p) => (p.slot === "setup" || p.slot === "preview") && p.url);
  const secondaryUrl = setupItem?.url ? normalizeRefPhoto(setupItem.url) : null;
  const hasSecondary = Boolean(secondaryUrl && secondaryUrl !== primaryUrl);

  if (!primaryUrl) {
    return (
      <div className={cn("flex items-center justify-center bg-transparent text-stone-300", containerClassName || className)}>
        <Armchair className="h-1/3 w-1/3" strokeWidth={1.5} />
      </div>
    );
  }

  return (
    <div className={cn("relative h-full w-full flex items-center justify-center overflow-hidden bg-transparent", containerClassName)}>
      {/* Primary Image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={primaryUrl}
        alt={alt}
        className={cn(
          "h-full w-full object-cover object-center transition-all duration-500",
          hasSecondary
            ? "group-hover:opacity-0 group-hover/img:opacity-0 group-hover/row:opacity-0 group-hover:scale-95 group-hover/img:scale-95 group-hover/row:scale-95"
            : "group-hover:scale-105 group-hover/img:scale-105 group-hover/row:scale-105",
          className
        )}
        loading="lazy"
      />

      {/* Secondary Image (Fades in on hover ONLY if setup slot uploaded) */}
      {hasSecondary && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={secondaryUrl!}
          alt={`${alt} - setup preview`}
          className={cn(
            "absolute inset-0 h-full w-full object-cover object-center opacity-0 scale-105 transition-all duration-500 group-hover:opacity-100 group-hover/img:opacity-100 group-hover/row:opacity-100 group-hover:scale-100 group-hover/img:scale-100 group-hover/row:scale-100",
            className
          )}
          loading="lazy"
        />
      )}
    </div>
  );
}

export function SectionHead({
  kicker,
  title,
  sub,
  right,
  className,
}: {
  kicker?: string;
  title: string;
  sub?: string;
  right?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-3", className)}>
      <div>
        {kicker && (
          <div className="mb-1.5 flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.2em] text-amber-700">
            <span className="h-px w-5 bg-amber-600/60" />
            {kicker}
          </div>
        )}
        <h2 className="font-display text-[22px] font-semibold leading-tight tracking-tight text-stone-900">
          {title}
        </h2>
        {sub && <p className="mt-1 text-[13px] text-stone-500">{sub}</p>}
      </div>
      {right}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
}: {
  icon: LucideIcon;
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-stone-250 bg-stone-50/60 px-6 py-10 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-stone-100 text-stone-400">
        <Icon className="h-5 w-5" strokeWidth={1.8} />
      </div>
      <div className="mt-1 text-sm font-semibold text-stone-700">{title}</div>
      {body && <p className="max-w-sm text-[12.5px] leading-relaxed text-stone-500">{body}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-stone-400">{label}</div>
      <div className="mt-0.5 truncate text-[13.5px] font-medium text-stone-800">{children}</div>
    </div>
  );
}

export function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  tone = "stone",
  spark,
  alert,
  className,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: LucideIcon;
  tone?: "stone" | "amber" | "emerald" | "rose";
  spark?: ReactNode;
  alert?: boolean;
  className?: string;
}) {
  const tones = {
    stone: "bg-stone-100 text-stone-600",
    amber: "bg-amber-100/80 text-amber-700",
    emerald: "bg-emerald-100/80 text-emerald-700",
    rose: "bg-rose-100/80 text-rose-700",
  };
  return (
    <div className={cn("card relative overflow-hidden p-4 h-full flex flex-col justify-between", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-stone-400">
            {label}
          </div>
          <div className="mt-1.5 font-display text-[26px] font-semibold leading-none tracking-tight text-stone-900 tabular-nums">
            {value}
          </div>
          {sub && <div className="mt-1.5 text-[11.5px] leading-snug text-stone-500">{sub}</div>}
        </div>
        <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", tones[tone])}>
          <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
        </div>
      </div>
      {spark && <div className="mt-2 h-10">{spark}</div>}
      {alert && <span className="absolute right-2.5 top-2.5 h-2 w-2 animate-pulse rounded-full bg-rose-500" />}
    </div>
  );
}
