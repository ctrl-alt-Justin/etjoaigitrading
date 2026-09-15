"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Database, Loader2, Sparkles } from "lucide-react";

export function SeedGate() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const run = async () => {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/seed", { method: "POST" });
      if (!res.ok) throw new Error("Seed failed");
      router.refresh();
    } catch {
      setErr("Could not seed the workspace. Check the database connection.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card mx-auto mt-10 flex max-w-xl flex-col items-center px-8 py-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
        <Database className="h-6 w-6" strokeWidth={1.8} />
      </div>
      <h2 className="mt-5 font-display text-2xl font-semibold tracking-tight text-stone-900">
        Your trading floor is empty
      </h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-stone-500">
        Load the sample workspace — taxonomy, suppliers and a trading book of graded
        inventory — to explore every workflow. Replace it with live intake whenever
        you&apos;re ready.
      </p>
      <button onClick={run} disabled={busy} className="btn-accent mt-6">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        {busy ? "Loading workspace…" : "Load the sample workspace"}
      </button>
      {err && <p className="mt-3 text-xs font-medium text-rose-600">{err}</p>}
    </div>
  );
}
