import type { ReactNode } from "react";
import { Sidebar, type ShellCounts } from "@/components/shell";
import { getAllData, enrichItems, agingAlerts, isActive } from "@/lib/queries";
import { monthStart } from "@/lib/format";
import { AuthGate } from "@/components/auth-gate";

export const dynamic = "force-dynamic";

async function shellCounts(): Promise<ShellCounts> {
  try {
    const { items, categories, suppliers } = await getAllData();
    const enriched = enrichItems(items, categories, suppliers);
    const firstOfMonth = monthStart(new Date());
    return {
      active: enriched.filter((i) => isActive(i.status)).length,
      intake: enriched.filter((i) => i.status === "intake").length,
      inStock: enriched.filter((i) => i.status === "in_stock").length,
      listed: enriched.filter((i) => i.status === "listed" || i.status === "reserved").length,
      soldMtd: enriched.filter((i) => i.status === "sold" && i.soldAt && new Date(i.soldAt) >= firstOfMonth).length,
      alerts: agingAlerts(enriched).length,
    };
  } catch {
    return { active: 0, intake: 0, inStock: 0, listed: 0, soldMtd: 0, alerts: 0 };
  }
}

export default async function AppLayout({ children }: { children: ReactNode }) {
  const counts = await shellCounts();
  return (
    <AuthGate>
      <Sidebar counts={counts} />
      <div className="min-h-screen pt-[104px] lg:pl-[248px] lg:pt-0">
        <main className="w-full px-4 pb-16 pt-6 sm:px-6 lg:px-8 xl:px-10 lg:pt-8">
          {children}
        </main>
      </div>
    </AuthGate>
  );
}

