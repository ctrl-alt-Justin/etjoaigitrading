import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BadgeCheck, Building2, Mail, MapPin } from "lucide-react";
import { notFound } from "next/navigation";
import { getAllData, buildCategoryIndexes, pathOf } from "@/lib/queries";
import { fmtMoney, fmtDateFull } from "@/lib/format";
import { GRADE_META, type Grade } from "@/lib/valuation";
import { Logo } from "@/components/shell";
import { GradeChip } from "@/components/ui";
import { ShareGallery } from "@/components/share-gallery";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id: idStr } = await params;
  const { items } = await getAllData();
  const item = items.find((entry) => entry.id === Number(idStr));
  return { title: item ? `${item.name} — ETJOAIGI Collection` : "ETJOAIGI Collection" };
}

export default async function ShopItemPage({ params }: PageProps) {
  const { id: idStr } = await params;
  const id = Number(idStr);
  if (!Number.isInteger(id)) notFound();

  const { items, categories } = await getAllData();
  const item = items.find((entry) => entry.id === id && entry.status === "listed" && entry.listedPrice != null);
  if (!item) notFound();

  const { byId } = buildCategoryIndexes(categories);
  const categoryPath = pathOf(item.categoryId, byId);
  const grade = item.grade as Grade | null;
  const specs: [string, string | null | undefined][] = [
    ["Brand", item.brand],
    ["Model", item.model],
    ["Color", item.color],
    ["Material", item.material],
    ["Dimensions", item.dimensions],
    ...Object.entries(item.attributes ?? {}).map(([key, value]) => [key, value] as [string, string | null]),
  ];

  return (
    <div className="min-h-screen bg-[var(--paper)]">
      <header className="border-b border-[var(--line)] bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <Link href="/shop"><Logo /></Link>
          <Link href="/shop" className="flex items-center gap-1.5 text-sm font-semibold text-[#1D5D8B] hover:text-[#16486B]"><ArrowLeft className="h-4 w-4" /> Back to collection</Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 pb-20 pt-8 sm:px-8 sm:pt-12">
        <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
          <ShareGallery photos={item.photos ?? []} name={item.name} />

          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#1D5D8B]">{categoryPath}</div>
            <h1 className="mt-3 font-display text-4xl font-semibold leading-[1.05] tracking-tight text-[#17364b] sm:text-5xl">{item.name}</h1>
            <div className="mt-4 flex flex-wrap items-center gap-2.5">
              <GradeChip grade={grade} />
              {grade && <span className="text-sm text-[#3f6175]">{GRADE_META[grade].tagline}</span>}
            </div>

            <div className="mt-7 border-y border-[var(--line)] py-5">
              <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#557287]">Asking price</div>
              <div className="mt-1 font-display text-4xl font-semibold text-[#17364b]">{fmtMoney(item.listedPrice)}</div>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-[#3f6175]">
                <span className="flex items-center gap-1.5"><BadgeCheck className="h-4 w-4 text-[#1D5D8B]" /> Inspected and graded</span>
                <span>Ref {item.sku ?? "—"}</span>
                <span>Listed {fmtDateFull(item.listedAt ?? item.intakeAt)}</span>
              </div>
            </div>

            <div className="mt-6">
              <h2 className="font-display text-xl font-semibold text-[#17364b]">Specifications</h2>
              <dl className="mt-3 grid grid-cols-2 gap-x-5 gap-y-4 rounded-2xl border border-[var(--line)] bg-white p-4 sm:grid-cols-3">
                {specs.map(([key, value]) => <div key={key}><dt className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#557287]">{key}</dt><dd className="mt-1 truncate text-sm font-semibold text-[#294e65]">{value || "—"}</dd></div>)}
              </dl>
            </div>

            <div className="mt-7 rounded-2xl bg-[#123D5B] p-5 text-white">
              <div className="flex items-start gap-3"><MapPin className="mt-0.5 h-5 w-5 shrink-0 text-[#b9def1]" /><div><h2 className="font-semibold">See it in person</h2><p className="mt-1.5 text-sm leading-relaxed text-[#d5e8f2]">This piece is available to view in Muntinlupa. Contact ETJOAIGI to arrange a viewing or ask about delivery.</p></div></div>
              <a href="mailto:hello@etjoaigi.com?subject=Furniture%20inquiry" className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-[#FCFDF8] px-4 text-sm font-bold text-[#1D5D8B] transition hover:bg-white"><Mail className="h-4 w-4" /> Contact ETJOAIGI</a>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-[var(--line)] bg-white"><div className="mx-auto flex max-w-6xl items-center gap-2 px-5 py-7 text-sm text-[#557287] sm:px-8"><Building2 className="h-4 w-4" /> ETJOAIGI Trading · Muntinlupa</div></footer>
    </div>
  );
}
