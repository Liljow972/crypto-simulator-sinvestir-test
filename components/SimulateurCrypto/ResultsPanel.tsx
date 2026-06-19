"use client";

import { formatEUR, formatEURCents, formatPercent } from "@/lib/format";
import type { SimulationResult } from "@/types/simulation";

type ResultsPanelProps = {
  result: SimulationResult;
};

export function ResultsPanel({ result }: ResultsPanelProps) {
  const isPositive = result.gainLoss >= 0;
  const perfColor = isPositive ? "text-success" : "text-danger";

  return (
    <div className="rounded-card border border-si-border bg-si-card p-5 shadow-card sm:p-6">
      <div className="grid grid-cols-2 gap-4">
        <Kpi label="Capital investi" value={formatEUR(result.totalInvested)} />

        <Kpi
          label="Valeur finale"
          value={formatEUR(result.finalValue)}
          emphasis
        />

        <Kpi
          label="Plus / moins-value"
          value={`${isPositive ? "+" : ""}${formatEURCents(result.gainLoss)}`}
          valueClassName={perfColor}
        />

        <Kpi
          label="Performance"
          value={
            <span className={`flex items-center gap-1 ${perfColor}`}>
              {isPositive ? <ArrowUp /> : <ArrowDown />}
              {formatPercent(result.gainLossPercent)}
            </span>
          }
        />
      </div>

      <p className="mt-5 rounded-lg border border-si-border bg-si-input/60 px-4 py-3 text-[11px] leading-relaxed text-si-muted">
        ⚠️ Les performances passées ne préjugent pas des performances futures.
        Cette simulation est fournie à titre informatif et pédagogique et ne
        constitue pas un conseil en investissement. Investir comporte un risque
        de perte en capital.
      </p>
    </div>
  );
}

function Kpi({
  label,
  value,
  emphasis = false,
  valueClassName = "text-white",
}: {
  label: string;
  value: React.ReactNode;
  emphasis?: boolean;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-input border border-si-border bg-si-input/40 p-4">
      <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-si-muted">
        {label}
      </p>
      <p
        className={`font-display font-bold tabular-nums ${
          emphasis ? "text-3xl sm:text-4xl" : "text-2xl"
        } ${valueClassName}`}
      >
        {value}
      </p>
    </div>
  );
}

function ArrowUp() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m5 12 7-7 7 7" />
      <path d="M12 19V5" />
    </svg>
  );
}

function ArrowDown() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 5v14" />
      <path d="m19 12-7 7-7-7" />
    </svg>
  );
}
