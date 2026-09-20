export function cn(...xs: (string | false | null | undefined)[]) {
  return xs.filter(Boolean).join(" ");
}

const php = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0,
});

export const fmtMoney = (n: number | null | undefined) =>
  n == null ? "—" : php.format(Math.round(n));

/** Peso amount shortened above one million — for dense KPI cards. */
export const fmtMoneyCompact = (n: number | null | undefined) => {
  if (n == null) return "—";
  if (Math.abs(n) >= 1_000_000) {
    const m = (n / 1_000_000).toFixed(2).replace(/\.?0+$/, "");
    return `₱${m}M`;
  }
  return php.format(Math.round(n));
};

export const fmtInt = (n: number | null | undefined) =>
  n == null ? "—" : new Intl.NumberFormat("en-US").format(n);

export const fmtPct = (n: number | null | undefined, digits = 0) =>
  n == null ? "—" : `${(n * 100).toFixed(digits)}%`;

export function toDate(d: Date | string | null | undefined): Date | null {
  if (!d) return null;
  const dt = d instanceof Date ? d : new Date(d);
  return isNaN(dt.getTime()) ? null : dt;
}

export function daysBetween(a: Date, b: Date) {
  return Math.floor((b.getTime() - a.getTime()) / 86_400_000);
}

export function daysSince(d: Date | string | null | undefined, now = new Date()) {
  const dt = toDate(d);
  return dt ? daysBetween(dt, now) : null;
}

export function relTime(d: Date | string | null | undefined, now = new Date()) {
  const days = daysSince(d, now);
  if (days == null) return "—";
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 31) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function fmtDate(d: Date | string | null | undefined) {
  const dt = toDate(d);
  return dt ? `${MONTHS[dt.getMonth()]} ${dt.getDate()}` : "—";
}

export function fmtDateFull(d: Date | string | null | undefined) {
  const dt = toDate(d);
  return dt ? `${MONTHS[dt.getMonth()]} ${dt.getDate()}, ${dt.getFullYear()}` : "—";
}

export function startOfWeekMonday(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const day = (x.getDay() + 6) % 7; // monday = 0
  x.setDate(x.getDate() - day);
  return x;
}

export function startOfWeekSunday(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const day = x.getDay(); // sunday = 0
  x.setDate(x.getDate() - day);
  return x;
}

export function monthStart(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export type DimensionUnit = "mm" | "cm" | "in" | "m";

/** Converts a plain three-number entry into a consistent length x width x height label. */
export function normalizeDimensions(value: string, unit: DimensionUnit) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/[a-zA-Z]/.test(trimmed)) return trimmed;
  const numbers = trimmed.match(/\d+(?:\.\d+)?/g);
  if (!numbers || numbers.length !== 3) return trimmed;
  return `L ${numbers[0]} × W ${numbers[1]} × H ${numbers[2]} ${unit}`;
}
