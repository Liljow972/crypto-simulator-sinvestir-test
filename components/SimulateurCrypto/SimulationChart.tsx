"use client";

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCompactEUR, formatEUR } from "@/lib/format";
import type { ChartDataPoint } from "@/types/simulation";

type SimulationChartProps = {
  data: ChartDataPoint[];
};

type TooltipItem = {
  dataKey?: string | number;
  value?: number;
  color?: string;
};

/** Tooltip custom au format S'investir (fond sombre, valeurs en €). */
function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipItem[];
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;

  const portfolio = payload.find((p) => p.dataKey === "portfolioValue");
  const invested = payload.find((p) => p.dataKey === "investedValue");

  return (
    <div className="rounded-lg border border-si-border bg-si-bg/95 px-3 py-2 shadow-card backdrop-blur">
      <p className="mb-1 text-xs text-si-muted">{label}</p>
      {portfolio?.value !== undefined && (
        <p className="text-sm font-semibold text-white">
          Portefeuille : {formatEUR(portfolio.value)}
        </p>
      )}
      {invested?.value !== undefined && (
        <p className="text-sm text-si-muted">
          Investi : {formatEUR(invested.value)}
        </p>
      )}
    </div>
  );
}

/** Affiche les années plutôt que la date complète sur l'axe X. */
function formatXAxis(value: string): string {
  // value au format JJ/MM/AAAA → JJ/MM/AA
  const [day, month, year] = value.split("/");
  if (!year) return value;
  return `${day}/${month}/${year.slice(2)}`;
}

export function SimulationChart({ data }: SimulationChartProps) {
  // Marqueurs des versements DCA : valeur uniquement aux dates d'investissement.
  const chartData = data.map((point) => ({
    ...point,
    marker: point.isInvestmentDate ? point.investedValue : null,
  }));

  return (
    <div className="rounded-card border border-si-border bg-si-card p-4 shadow-card sm:p-5">
      {/* Légende custom */}
      <div className="mb-4 flex flex-wrap items-center gap-4 text-xs">
        <span className="flex items-center gap-2 text-white">
          <span className="h-2.5 w-2.5 rounded-full bg-si-blue" />
          Valeur du portefeuille
        </span>
        <span className="flex items-center gap-2 text-si-muted">
          <span className="h-0.5 w-3 rounded bg-si-muted" />
          Capital investi
        </span>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart
          data={chartData}
          margin={{ top: 4, right: 8, bottom: 0, left: 8 }}
        >
          <defs>
            <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563EB" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#2563EB" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid stroke="#1E293B" vertical={false} />

          <XAxis
            dataKey="date"
            tickFormatter={formatXAxis}
            tick={{ fill: "#94A3B8", fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: "#1E293B" }}
            minTickGap={48}
          />
          <YAxis
            tickFormatter={formatCompactEUR}
            tick={{ fill: "#94A3B8", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={64}
          />

          <Tooltip
            content={<ChartTooltip />}
            cursor={{ stroke: "#2563EB", strokeOpacity: 0.4 }}
          />

          <Area
            type="monotone"
            dataKey="portfolioValue"
            stroke="#2563EB"
            strokeWidth={2}
            fill="url(#portfolioGradient)"
            dot={false}
            activeDot={{ r: 4, fill: "#2563EB", stroke: "#0A0F1E" }}
            isAnimationActive={false}
            name="Portefeuille"
          />
          <Line
            type="monotone"
            dataKey="investedValue"
            stroke="#94A3B8"
            strokeWidth={1.5}
            strokeDasharray="4 4"
            dot={false}
            isAnimationActive={false}
            name="Investi"
          />
          {/* Points des versements DCA */}
          <Line
            type="monotone"
            dataKey="marker"
            stroke="none"
            dot={{ r: 3, fill: "#94A3B8", stroke: "#0D1530", strokeWidth: 1 }}
            isAnimationActive={false}
            legendType="none"
            connectNulls={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
