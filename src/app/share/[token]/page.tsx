import type { Metadata } from "next";
import { BadgeCheck, Building2, CircleSlash, MapPin, Quote } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { camelizeRow } from "@/db/records";
import type { DbItem } from "@/db/schema";
import {
  buildCategoryIndexes,
  getAllData,
  getShareByToken,
  pathOf,
} from "@/lib/queries";
import { GRADE_META, type Grade } from "@/lib/valuation";
import { fmtDateFull, fmtMoney } from "@/lib/format";
import { Logo } from "@/components/shell";
import { GradeChip, Thumb } from "@/components/ui";
import { ShareGallery } from "@/components/share-gallery";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ token: string }> };

function Unavailable({ reason }: { reason: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-5">
      <div className="card mx-auto max-w-md p-10 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-100 text-stone-400">
          <CircleSlash className="h-6 w-6" strokeWidth={1.8} />
        </div>
        <h1 className="mt-4 font-display text-xl font-semibold tracking-tight text-stone-900">
          Listing unavailable
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-stone-500">{reason}</p>
        <div className="mt-6 text-[11px] font-bold uppercase tracking-[0.2em] text-stone-400">
          Etjoaigi Trading · Muntinlupa
        </div>
      </div>
    </div>
  );
}

async function loadShare(token: string) {
  const share = await getShareByToken(token);
  if (!share) return { kind: "missing" as const };
  if (!share.active) return { kind: "disabled" as const };
  const { data: itemRow, error } = await supabase.from("items").select("*").eq("id", share.itemId).maybeSingle();
  if (error) throw error;
  const item = itemRow ? camelizeRow<DbItem>(itemRow) : null;
  if (!item) return { kind: "missing" as const };
  return { kind: "ok" as const, share, item };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { token } = await params;
  const data = await loadShare(token);
  if (data.kind !== "ok") return { title: "Etjoaigi Trading" };
  return {
    title: `${data.item.name} — Etjoaigi Trading`,
    description: `Pre-owned ${data.item.name}, inspected and graded by Etjoaigi Trading.`,
  };
}

export default async function SharePage({ params }: PageProps) {
  const { token } = await params;
  const data = await loadShare(token);

  if (data.kind === "missing")
    return <Unavailable reason="This link doesn't point to a live listing. It may have been removed — ask the shop to send a fresh one." />;
  if (data.kind === "disabled")
    return <Unavailable reason="This listing link was turned off by the shop. Reach out to Etjoaigi Trading for the latest availability." />;

  const { share, item } = data;
  const { categories } = await getAllData();
  const { byId } = buildCategoryIndexes(categories);
  const categoryPath = pathOf(item.categoryId, byId);
  const grade = item.grade as Grade | null;

  const sold = item.status === "sold";
  const price = share.offerPrice ?? item.listedPrice ?? null;

  const specs: [string, string | null | undefined][] = [
    ["Brand", item.brand],
    ["Model", item.model],
    ["Color", item.color],
    ["Material", item.material],
    ["Dimensions", item.dimensions],
    ...Object.entries(item.attributes ?? {}).map(
      ([k, v]) => [k, v] as [string, string | null]
    ),
  ];

  return (
    <div className="min-h-screen">
      {/* top bar */}
      <header className="border-b border-stone-200/70">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <Logo />
          <div className="hidden text-right sm:block">
            <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-stone-400">
              Curated pre-owned office furniture
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 pb-20 pt-8 sm:pt-12">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-12">
          {/* gallery */}
          <div className={sold ? "relative opacity-90" : ""}>
            <ShareGallery photos={item.photos ?? []} name={item.name} />
            {sold && (
              <span className="absolute left-4 top-4 rotate-[-4deg] rounded-lg bg-stone-900 px-4 py-1.5 text-sm font-bold uppercase tracking-[0.2em] text-white shadow-lg">
                Sold
              </span>
            )}
          </div>

          {/* content */}
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-700">
              {categoryPath}
            </div>
            <h1 className="mt-2 font-display text-[34px] font-semibold leading-[1.08] tracking-tight text-stone-900">
              {item.name}
            </h1>

            <div className="mt-3.5 flex flex-wrap items-center gap-2">
              <GradeChip grade={grade} />
              {grade && (
                <span className="text-[12.5px] text-stone-500">
                  {GRADE_META[grade].tagline} — {GRADE_META[grade].description}
                </span>
              )}
            </div>

            {/* price */}
            <div className="mt-6 rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm">
              <div className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-stone-400">
                {sold ? "Was asking" : share.offerPrice != null ? "Special offer" : "Asking price"}
              </div>
              <div className="mt-1.5 font-display text-[40px] font-semibold leading-none tracking-tight text-stone-900 tabular-nums">
                {fmtMoney(price)}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] text-stone-500">
                <span className="flex items-center gap-1.5">
                  <BadgeCheck className="h-3.5 w-3.5 text-emerald-600" /> Inspected & graded in-house
                </span>
                <span>Ref <span className="font-semibold text-stone-700">{item.sku ?? "—"}</span></span>
                <span>Listed {fmtDateFull(item.listedAt ?? item.intakeAt)}</span>
              </div>
            </div>

            {/* remarks */}
            {share.remarks && (
              <figure className="mt-5 rounded-2xl border border-amber-200/70 bg-amber-50/60 p-5">
                <Quote className="h-4 w-4 text-amber-500" />
                <blockquote className="mt-2 text-[14.5px] leading-relaxed text-stone-700">
                  {share.remarks}
                </blockquote>
                <figcaption className="mt-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-amber-700">
                  From the Etjoaigi team
                </figcaption>
              </figure>
            )}

            {/* specs */}
            <div className="mt-6">
              <div className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-stone-400">
                Specifications
              </div>
              <dl className="mt-2.5 grid grid-cols-2 gap-x-6 overflow-hidden rounded-2xl border border-[var(--line)] bg-white sm:grid-cols-3">
                {specs.map(([k, v], i) => (
                  <div key={k} className={`px-4 py-3.5 ${i > 1 ? "border-t border-stone-100" : ""}`}>
                    <dt className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-stone-400">{k}</dt>
                    <dd className="mt-0.5 truncate text-[13px] font-medium text-stone-800">{v || "—"}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {!sold && (
              <div className="mt-6 flex items-start gap-3 rounded-2xl bg-stone-900 p-4.5 text-sm text-stone-200">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                <p className="text-[13px] leading-relaxed">
                  Reply to whoever sent you this link to arrange viewing or purchase —
                  quote <span className="font-bold text-white">{item.sku ?? "the item"}</span>.
                </p>
              </div>
            )}
          </div>
        </div>

        <footer className="mt-16 flex items-center justify-center gap-2 border-t border-stone-200/70 pt-6 text-[11.5px] text-stone-400">
          <Building2 className="h-3.5 w-3.5" />
          Etjoaigi Trading · Muntinlupa — pre-owned office furniture, graded and fairly priced.
        </footer>
      </main>
    </div>
  );
}
