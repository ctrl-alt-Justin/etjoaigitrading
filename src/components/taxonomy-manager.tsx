"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  ChevronDown,
  FolderTree,
  Loader2,
  Plus,
  Tag,
  Trash2,
} from "lucide-react";
import type { DbCategory, DbCategoryAttribute } from "@/db/schema";
import { cn, fmtMoney } from "@/lib/format";

export function TaxonomyManager({
  categories,
  attributes,
  counts,
}: {
  categories: DbCategory[];
  attributes: DbCategoryAttribute[];
  counts: Record<number, number>;
}) {
  const router = useRouter();
  const roots = useMemo(
    () => categories.filter((c) => c.parentId == null).sort((a, b) => a.sortOrder - b.sortOrder),
    [categories]
  );
  const childrenOf = useMemo(() => {
    const m = new Map<number, DbCategory[]>();
    for (const c of categories.filter((x) => x.parentId != null)) {
      const arr = m.get(c.parentId!) ?? [];
      arr.push(c);
      m.set(c.parentId!, arr);
    }
    for (const arr of m.values()) arr.sort((a, b) => a.sortOrder - b.sortOrder);
    return m;
  }, [categories]);

  const firstLeaf = roots.flatMap((r) => childrenOf.get(r.id) ?? [])[0] ?? roots[0];
  const [selectedId, setSelectedId] = useState<number | null>(firstLeaf?.id ?? null);
  const [expanded, setExpanded] = useState<Set<number>>(new Set(roots.map((r) => r.id)));
  const selected = categories.find((c) => c.id === selectedId) ?? null;
  const selectedAttrs = attributes.filter((a) => a.categoryId === selectedId);

  const [busy, setBusy] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [nameDraft, setNameDraft] = useState("");
  const [baseDraft, setBaseDraft] = useState("");

  const [newCat, setNewCat] = useState({ name: "", parentId: roots[0]?.id ?? 0, baseValue: "" });
  const [newAttr, setNewAttr] = useState({ name: "", inputType: "select" as "select" | "text", options: "", required: false });

  const flash = (key: string) => {
    setSaved(key);
    setTimeout(() => setSaved((s) => (s === key ? null : s)), 1600);
  };

  const selectCat = (c: DbCategory) => {
    setSelectedId(c.id);
    setNameDraft(c.name);
    setBaseDraft(c.baseValue ? String(c.baseValue) : "");
  };

  const toggle = (id: number) =>
    setExpanded((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const saveName = async () => {
    if (!selected || !nameDraft.trim()) return;
    setBusy("name");
    await fetch("/api/categories", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: selected.id, name: nameDraft }) });
    setBusy(null);
    flash("name");
    router.refresh();
  };

  const saveBase = async () => {
    if (!selected) return;
    setBusy("base");
    await fetch("/api/categories", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: selected.id, baseValue: baseDraft ? Number(baseDraft) : null }) });
    setBusy(null);
    flash("base");
    router.refresh();
  };

  const addCategory = async () => {
    if (!newCat.name.trim()) return;
    setBusy("addcat");
    const res = await fetch("/api/categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newCat.name, parentId: newCat.parentId || null, baseValue: newCat.baseValue ? Number(newCat.baseValue) : null }) });
    setBusy(null);
    if (res.ok) {
      const row = await res.json();
      setNewCat({ name: "", parentId: newCat.parentId, baseValue: "" });
      router.refresh();
      setSelectedId(row.id);
    }
  };

  const addAttr = async () => {
    if (!selected || !newAttr.name.trim()) return;
    setBusy("addattr");
    await fetch("/api/attributes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        categoryId: selected.id,
        name: newAttr.name,
        inputType: newAttr.inputType,
        options: newAttr.options.split(",").map((s) => s.trim()).filter(Boolean),
        required: newAttr.required,
      }),
    });
    setBusy(null);
    setNewAttr({ name: "", inputType: "select", options: "", required: false });
    router.refresh();
  };

  const removeAttr = async (id: number) => {
    setBusy(`attr-${id}`);
    await fetch("/api/attributes", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setBusy(null);
    router.refresh();
  };

  const pathOf = (c: DbCategory | null) => {
    if (!c) return "";
    const parts = [c.name];
    let cur = c.parentId ? categories.find((x) => x.id === c.parentId) : undefined;
    while (cur) {
      parts.unshift(cur.name);
      cur = cur.parentId ? categories.find((x) => x.id === cur!.parentId) : undefined;
    }
    return parts.join(" › ");
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[380px_1fr]">
      {/* tree */}
      <div className="space-y-4">
        <div className="card p-3">
          <div className="mb-2 flex items-center justify-between px-1.5 pt-1">
            <span className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-stone-400">
              Category tree
            </span>
            <span className="text-[11px] text-stone-400 tabular-nums">{categories.length} nodes</span>
          </div>
          <div className="space-y-0.5">
            {roots.map((r) => {
              const kids = childrenOf.get(r.id) ?? [];
              const open = expanded.has(r.id);
              const rootCount = kids.reduce((a, k) => a + (counts[k.id] ?? 0), 0);
              return (
                <div key={r.id}>
                  <div
                    className={cn(
                      "flex w-full items-center gap-1.5 rounded-xl px-2 py-2 text-sm font-semibold transition",
                      selectedId === r.id ? "bg-amber-50 text-amber-900" : "text-stone-800 hover:bg-stone-50"
                    )}
                  >
                    <button onClick={() => toggle(r.id)} className="rounded-md p-0.5 text-stone-400 hover:bg-stone-100">
                      <ChevronDown className={cn("h-4 w-4 transition-transform", !open && "-rotate-90")} />
                    </button>
                    <button onClick={() => selectCat(r)} className="flex flex-1 items-center justify-between text-left">
                      <span>{r.name}</span>
                      <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-bold tabular-nums text-stone-500">
                        {rootCount}
                      </span>
                    </button>
                  </div>
                  {open && (
                    <div className="ml-[26px] space-y-0.5 border-l border-stone-200 pl-2">
                      {kids.map((k) => (
                        <button
                          key={k.id}
                          onClick={() => selectCat(k)}
                          className={cn(
                            "flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-[13px] transition",
                            selectedId === k.id
                              ? "bg-amber-50 font-semibold text-amber-900 ring-1 ring-amber-200"
                              : "text-stone-600 hover:bg-stone-50"
                          )}
                        >
                          <span className="truncate">{k.name}</span>
                          <span className="flex shrink-0 items-center gap-1.5">
                            {k.baseValue ? (
                              <span className="text-[10.5px] tabular-nums text-stone-400">{fmtMoney(k.baseValue)}</span>
                            ) : null}
                            <span className="rounded-full bg-stone-100 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-stone-500">
                              {counts[k.id] ?? 0}
                            </span>
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* add category */}
        <div className="card p-4">
          <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-stone-500">
            <Plus className="h-3.5 w-3.5" /> Extend the tree
          </div>
          <div className="space-y-2.5">
            <input className="input" placeholder="New category name" value={newCat.name} onChange={(e) => setNewCat((s) => ({ ...s, name: e.target.value }))} />
            <div className="grid grid-cols-2 gap-2.5">
              <select className="input" value={newCat.parentId} onChange={(e) => setNewCat((s) => ({ ...s, parentId: Number(e.target.value) }))}>
                <option value={0}>— Root level —</option>
                {roots.map((r) => (
                  <option key={r.id} value={r.id}>Under {r.name}</option>
                ))}
              </select>
              <input className="input" type="number" min={0} placeholder="Base value (₱)" value={newCat.baseValue} onChange={(e) => setNewCat((s) => ({ ...s, baseValue: e.target.value }))} />
            </div>
            <button onClick={addCategory} disabled={busy === "addcat" || !newCat.name.trim()} className="btn-primary w-full">
              {busy === "addcat" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Add category
            </button>
          </div>
        </div>
      </div>

      {/* detail */}
      {selected ? (
        <div className="space-y-4">
          <div className="card p-5">
            <div className="flex items-center gap-2 text-[11px] font-semibold text-stone-400">
              <FolderTree className="h-3.5 w-3.5" />
              {pathOf(selected)}
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Category name</label>
                <div className="flex gap-2">
                  <input className="input" value={nameDraft} onChange={(e) => setNameDraft(e.target.value)} />
                  <button onClick={saveName} disabled={busy === "name" || nameDraft.trim() === selected.name} className="btn-ghost shrink-0">
                    {saved === "name" ? <Check className="h-4 w-4 text-emerald-600" /> : busy === "name" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                  </button>
                </div>
              </div>
              <div>
                <label className="label">Reference value (new) — ₱</label>
                <div className="flex gap-2">
                  <input className="input" type="number" min={0} value={baseDraft} onChange={(e) => setBaseDraft(e.target.value)} placeholder="Inherited if empty" />
                  <button onClick={saveBase} disabled={busy === "base"} className="btn-ghost shrink-0">
                    {saved === "base" ? <Check className="h-4 w-4 text-emerald-600" /> : busy === "base" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                  </button>
                </div>
              </div>
            </div>
            <p className="mt-3 text-[12px] leading-relaxed text-stone-500">
              The valuation engine prices items as <span className="font-semibold text-stone-700">reference value × brand tier × grade band</span>.
              When a category has no value, the engine walks up to the nearest ancestor that does. Slug:{" "}
              <code className="rounded bg-stone-100 px-1.5 py-0.5 text-[11px] text-stone-600">{selected.slug}</code>
            </p>
          </div>

          <div className="card p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-stone-500">
                <Tag className="h-3.5 w-3.5" /> Controlled attributes
              </div>
              <span className="text-[11px] text-stone-400 tabular-nums">{selectedAttrs.length} fields</span>
            </div>
            {selectedAttrs.length === 0 ? (
              <p className="rounded-xl border border-dashed border-stone-200 bg-stone-50/60 px-4 py-5 text-[12.5px] text-stone-500">
                No controlled attributes here yet. Add fields like <em>Mechanism</em> or <em>Drawers</em> with fixed
                vocabularies — intake forms will then collect consistent, comparable data per category.
              </p>
            ) : (
              <div className="divide-y divide-stone-100">
                {selectedAttrs.map((a) => (
                  <div key={a.id} className="flex flex-wrap items-center gap-2.5 py-2.5">
                    <span className="text-[13.5px] font-semibold text-stone-800">{a.name}</span>
                    {a.required && <span className="chip border-rose-200 bg-rose-50 text-rose-600">required</span>}
                    <span className="chip border-stone-200 bg-stone-50 text-stone-500">{a.inputType}</span>
                    <span className="flex-1 truncate text-[12px] text-stone-400">
                      {a.options?.join(" · ") ?? "free text"}
                    </span>
                    <button
                      onClick={() => removeAttr(a.id)}
                      disabled={busy === `attr-${a.id}`}
                      className="rounded-lg p-1.5 text-stone-300 transition hover:bg-rose-50 hover:text-rose-500"
                      title="Remove field"
                    >
                      {busy === `attr-${a.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4 rounded-xl bg-stone-50/80 p-3.5">
              <div className="grid gap-2.5 sm:grid-cols-[1fr_130px]">
                <input className="input" placeholder="Attribute name — e.g. Upholstery" value={newAttr.name} onChange={(e) => setNewAttr((s) => ({ ...s, name: e.target.value }))} />
                <select className="input" value={newAttr.inputType} onChange={(e) => setNewAttr((s) => ({ ...s, inputType: e.target.value as "select" | "text" }))}>
                  <option value="select">Fixed options</option>
                  <option value="text">Free text</option>
                </select>
              </div>
              {newAttr.inputType === "select" && (
                <input className="input mt-2.5" placeholder="Options, comma separated — e.g. Leather, Mesh, Fabric" value={newAttr.options} onChange={(e) => setNewAttr((s) => ({ ...s, options: e.target.value }))} />
              )}
              <div className="mt-2.5 flex items-center justify-between">
                <label className="flex cursor-pointer items-center gap-2 text-[12.5px] font-medium text-stone-600">
                  <input type="checkbox" className="h-4 w-4 rounded accent-amber-600" checked={newAttr.required} onChange={(e) => setNewAttr((s) => ({ ...s, required: e.target.checked }))} />
                  Required at intake
                </label>
                <button onClick={addAttr} disabled={busy === "addattr" || !newAttr.name.trim()} className="btn-soft">
                  {busy === "addattr" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Add field
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="card flex items-center justify-center p-10 text-sm text-stone-400">Select a category to manage it.</div>
      )}
    </div>
  );
}
