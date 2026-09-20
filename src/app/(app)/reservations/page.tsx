import { ReservationsManager } from "@/components/reservations-manager";
import { Reveal } from "@/components/reveal";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reservations | ETJOAIGI Trading",
  description: "Manage customer reservations, holds, and viewing schedules.",
};

export const dynamic = "force-dynamic";

export default function ReservationsPage() {
  return (
    <div className="space-y-6">
      <Reveal>
        <div>
          <div className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-amber-700">
            Sales & Operations
          </div>
          <h1 className="font-display text-[30px] font-semibold leading-none tracking-tight text-stone-900">
            Customer Reservations
          </h1>
          <p className="mt-2 max-w-2xl text-[13.5px] text-stone-500">
            Review incoming customer reservation holds from the shop cart, coordinate showroom viewings, and confirm piece allocations.
          </p>
        </div>
      </Reveal>

      <Reveal delay={0.05}>
        <ReservationsManager />
      </Reveal>
    </div>
  );
}
