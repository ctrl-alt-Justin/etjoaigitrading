"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fmtInt, fmtMoney } from "@/lib/format";

const AXIS = { fontSize: 11, fill: "#8a8272" };
const GRID = "#E9E4D8";
const shortAxis = (v: number) =>
  Math.abs(v) >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : Math.abs(v) >= 1000 ? `${Math.round(v / 1000)}k` : String(v);

function Box({
  active,
  payload,
  label,
  moneyKeys,
}: {
  active?: boolean;
  payload?: { name?: string; value?: number | string; dataKey?: string | number; color?: string; payload?: Record<string, unknown> }[];
  label?: string;
  moneyKeys?: string[];
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="min-w-[150px] rounded-xl border border-stone-200 bg-white/95 px-3 py-2 text-xs shadow-xl backdrop-blur">
      {label != null && <div className="mb-1.5 font-semibold text-stone-900">{label}</div>}
      {payload.map((p, ix) => (
        <div key={ix} className="flex items-center gap-2 py-0.5">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span className="text-stone-500">{p.name}</span>
          <span className="ml-auto pl-4 font-semibold tabular-nums text-stone-900">
            {moneyKeys?.includes(String(p.dataKey)) ? fmtMoney(Number(p.value)) : fmtInt(Number(p.value))}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ---------------- KPI sparkline ---------------- */
export function Spark({ data, color = "#D97706" }: { data: { label: string; value: number }[]; color?: string }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={`spark-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={1.8}
          fill={`url(#spark-${color.replace("#", "")})`}
          isAnimationActive={false}
        />
        <Tooltip content={<Box moneyKeys={["value"]} />} cursor={{ stroke: GRID }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/* ---------------- Weekly intake vs sales ---------------- */
export function VolumeChart({
  data,
}: {
  data: { label: string; intake: number; sold: number; revenue: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: -18 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="label" tick={AXIS} axisLine={false} tickLine={false} interval={1} />
        <YAxis yAxisId="left" tick={AXIS} axisLine={false} tickLine={false} allowDecimals={false} />
        <YAxis
          yAxisId="right"
          orientation="right"
          tick={AXIS}
          axisLine={false}
          tickLine={false}
          tickFormatter={shortAxis}
        />
        <Tooltip content={<Box moneyKeys={["revenue"]} />} cursor={{ fill: "rgba(120,113,99,0.06)" }} />
        <Bar yAxisId="left" dataKey="intake" name="Intake" fill="#D97706" radius={[3, 3, 0, 0]} maxBarSize={14} />
        <Bar yAxisId="left" dataKey="sold" name="Sold" fill="#0e9f6e" radius={[3, 3, 0, 0]} maxBarSize={14} />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="revenue"
          name="Revenue"
          stroke="#292524"
          strokeWidth={2}
          dot={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

/* ---------------- Inventory value by category ---------------- */
const CAT_COLORS = ["#B45309", "#D97706", "#E9A23B", "#41403c", "#78716c", "#a8a29e"];

export function CategoryValueChart({
  data,
}: {
  data: { name: string; value: number; count: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 12, bottom: 0, left: 8 }}>
        <CartesianGrid stroke={GRID} horizontal={false} />
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="name"
          width={128}
          tick={{ ...AXIS, fontSize: 12, fill: "#57534e" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          content={<Box moneyKeys={["value"]} />}
          cursor={{ fill: "rgba(120,113,99,0.06)" }}
        />
        <Bar dataKey="value" name="Listed value" radius={[0, 5, 5, 0]} maxBarSize={18}>
          {data.map((_, ix) => (
            <Cell key={ix} fill={CAT_COLORS[ix % CAT_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ---------------- Inventory aging ---------------- */
export function AgingChart({
  data,
}: {
  data: { label: string; count: number; value: number; tone: string }[];
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 12, bottom: 0, left: 8 }}>
        <CartesianGrid stroke={GRID} horizontal={false} />
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="label"
          width={86}
          tick={{ ...AXIS, fontSize: 12, fill: "#57534e" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const p = payload[0].payload as { label: string; count: number; value: number };
            return (
              <div className="rounded-xl border border-stone-200 bg-white/95 px-3 py-2 text-xs shadow-xl">
                <div className="font-semibold text-stone-900">{p.label}</div>
                <div className="mt-1 text-stone-500">
                  {p.count} items · <span className="font-semibold text-stone-900">{fmtMoney(p.value)}</span> at ask
                </div>
              </div>
            );
          }}
          cursor={{ fill: "rgba(120,113,99,0.06)" }}
        />
        <Bar dataKey="count" name="Items" radius={[0, 5, 5, 0]} maxBarSize={18}>
          {data.map((d, ix) => (
            <Cell key={ix} fill={d.tone} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ---------------- Cost vs listed vs sold ---------------- */
export function TriadChart({
  data,
}: {
  data: { label: string; cost: number; listed: number; sold: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: -14 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="label" tick={AXIS} axisLine={false} tickLine={false} />
        <YAxis
          tick={AXIS}
          axisLine={false}
          tickLine={false}
          tickFormatter={shortAxis}
        />
        <Tooltip content={<Box moneyKeys={["cost", "listed", "sold"]} />} cursor={{ fill: "rgba(120,113,99,0.06)" }} />
        <Bar dataKey="cost" name="Acquisition cost" fill="#CFC9BC" radius={[3, 3, 0, 0]} maxBarSize={16} />
        <Bar dataKey="listed" name="Last listed" fill="#E9A23B" radius={[3, 3, 0, 0]} maxBarSize={16} />
        <Bar dataKey="sold" name="Sold price" fill="#0e9f6e" radius={[3, 3, 0, 0]} maxBarSize={16} />
      </BarChart>
    </ResponsiveContainer>
  );
}
