"use client";

import { format } from "date-fns";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from "recharts";
import { formatNumber } from "@/lib/utils";
import type { TimeseriesPoint } from "@/server/services/analytics";

function formatTick(iso: string, interval: "hour" | "day") {
  return format(new Date(iso), interval === "hour" ? "HH:mm" : "MMM d");
}

function ChartTooltip({
  active,
  payload,
  label,
  interval,
}: TooltipContentProps<number, string> & { interval: "hour" | "day" }) {
  if (!active || !payload?.length) return null;
  const point = payload[0]!.payload as TimeseriesPoint;
  return (
    <div className="min-w-40 rounded-lg border bg-card px-3 py-2.5 text-xs shadow-lg">
      <p className="mb-2 font-medium">
        {format(new Date(String(label)), interval === "hour" ? "MMM d, HH:mm" : "EEE, MMM d, yyyy")}
      </p>
      <div className="space-y-1.5">
        <Row color="var(--series-1)" label="Clicks" value={point.clicks} />
        <Row color="var(--series-2)" label="Unique visitors" value={point.visitors} />
      </div>
    </div>
  );
}

function Row({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="flex items-center gap-2 text-muted-foreground">
        <span className="h-0.5 w-3 rounded-full" style={{ background: color }} />
        {label}
      </span>
      <span className="font-medium tabular">{formatNumber(value)}</span>
    </div>
  );
}

export function ChartLegend() {
  return (
    <div className="flex items-center gap-4 text-xs text-muted-foreground">
      <span className="flex items-center gap-1.5">
        <span className="h-0.5 w-3.5 rounded-full bg-series-1" /> Clicks
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-0.5 w-3.5 rounded-full bg-series-2" /> Unique visitors
      </span>
    </div>
  );
}

export function ClicksChart({ data, interval }: { data: TimeseriesPoint[]; interval: "hour" | "day" }) {
  const tickCount = interval === "hour" ? 6 : Math.min(7, data.length);
  return (
    <div className="h-72 w-full" role="img" aria-label="Clicks and unique visitors over time">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
          <defs>
            <linearGradient id="clicksFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--series-1)" stopOpacity={0.14} />
              <stop offset="100%" stopColor="var(--series-1)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--chart-grid)" strokeWidth={1} />
          <XAxis
            dataKey="t"
            tickFormatter={(v: string) => formatTick(v, interval)}
            tickLine={false}
            axisLine={false}
            minTickGap={24}
            tickCount={tickCount}
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            tickMargin={8}
          />
          <YAxis
            allowDecimals={false}
            tickLine={false}
            axisLine={false}
            width={48}
            tickFormatter={(v: number) => formatNumber(v, { compact: true })}
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
          />
          <Tooltip
            cursor={{ stroke: "var(--muted-foreground)", strokeWidth: 1, strokeOpacity: 0.4 }}
            content={(props) => (
              <ChartTooltip {...(props as TooltipContentProps<number, string>)} interval={interval} />
            )}
          />
          <Area
            type="monotone"
            dataKey="clicks"
            name="Clicks"
            stroke="var(--series-1)"
            strokeWidth={2}
            fill="url(#clicksFill)"
            activeDot={{ r: 4, fill: "var(--series-1)", stroke: "var(--chart-surface)", strokeWidth: 2 }}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="visitors"
            name="Unique visitors"
            stroke="var(--series-2)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: "var(--series-2)", stroke: "var(--chart-surface)", strokeWidth: 2 }}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
