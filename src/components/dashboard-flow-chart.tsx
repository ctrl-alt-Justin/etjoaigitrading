"use client";

import { useState } from "react";
import { VolumeChart } from "@/components/charts";
import { SectionHead } from "@/components/ui";
import { type WeeklyBucket } from "@/lib/queries";
import { fmtMoney, fmtInt } from "@/lib/format";

interface Props {
  flowData: {
    threeWeeks: WeeklyBucket[];
    weekly: WeeklyBucket[];
    monthly: WeeklyBucket[];
    quarterly: WeeklyBucket[];
  };
}

type FlowRange = "threeWeeks" | "weekly" | "monthly" | "quarterly";

export function DashboardFlowChart({ flowData }: Props) {
  const [range, setRange] = useState<FlowRange>("monthly");

  const currentData = flowData[range] || flowData.monthly || flowData.weekly;

  const totalIntake = currentData.reduce((acc, curr) => acc + curr.intake, 0);
  const totalSold = currentData.reduce((acc, curr) => acc + curr.sold, 0);
  const totalRevenue = currentData.reduce((acc, curr) => acc + curr.revenue, 0);

  const rangeLabels: Record<FlowRange, string> = {
    monthly: "Monthly",
    weekly: "Weekly",
    threeWeeks: "3-Week Comparison",
    quarterly: "Quarterly",
  };

  return (
    <div className="card p-5 lg:col-span-7">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-stone-400">Flow</div>
          <h2 className="font-display text-[19px] font-semibold tracking-tight text-stone-900">
            Intake vs sales
          </h2>
        </div>

        {/* Toggles */}
        <div className="flex flex-wrap items-center gap-1 rounded-xl bg-stone-100 p-1">
          {(["monthly", "weekly", "threeWeeks", "quarterly"] as FlowRange[]).map((r) => {
            const active = range === r;
            return (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                  active
                    ? "bg-white text-stone-900 shadow-sm"
                    : "text-stone-500 hover:text-stone-800"
                }`}
              >
                {rangeLabels[r]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Stats bar & legend */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-stone-100 pt-3 text-[11px]">
        <div className="flex items-center gap-3 text-stone-600">
          <span>
            Intake: <strong className="text-stone-900 font-bold">{fmtInt(totalIntake)}</strong>
          </span>
          <span className="text-stone-300">·</span>
          <span>
            Sold: <strong className="text-stone-900 font-bold">{fmtInt(totalSold)}</strong>
          </span>
          <span className="text-stone-300">·</span>
          <span>
            Rev: <strong className="text-stone-900 font-bold">{fmtMoney(totalRevenue)}</strong>
          </span>
        </div>

        <div className="flex gap-3 text-[10.5px] font-semibold text-stone-400">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-sm bg-[#D97706]" /> intake
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-sm bg-[#0e9f6e]" /> sold
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-[#292524]" /> revenue
          </span>
        </div>
      </div>

      <div className="mt-4 h-[260px]">
        <VolumeChart data={currentData} />
      </div>
    </div>
  );
}
