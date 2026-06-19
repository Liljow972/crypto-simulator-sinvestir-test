"use client";

import { SimulationForm } from "./SimulationForm";
import { SimulationChart } from "./SimulationChart";
import { ResultsPanel } from "./ResultsPanel";
import { useSimulation } from "@/hooks/useSimulation";
import type { SimulationParams, SimulationResult } from "@/types/simulation";

export interface SimulateurCryptoProps {
  /** Classe CSS additionnelle pour surcharger le conteneur parent. */
  className?: string;
  /** Affiche l'en-tête S'investir (titre + accroche). `false` pour un embed. */
  showHeader?: boolean;
  /** Callback optionnel déclenché à chaque simulation réussie. */
  onSimulationComplete?: (result: SimulationResult) => void;
}

/**
 * Simulateur crypto S'investir — composant autonome et exportable.
 * Aucune dépendance globale cachée : il suffit d'un `<SimulateurCrypto />`.
 */
export function SimulateurCrypto({
  className = "",
  showHeader = true,
  onSimulationComplete,
}: SimulateurCryptoProps) {
  const { result, isLoading, error, runSimulation } = useSimulation();

  async function handleSubmit(params: SimulationParams) {
    const computed = await runSimulation(params);
    if (computed) onSimulationComplete?.(computed);
  }

  return (
    <section className={`w-full ${className}`}>
      {showHeader && (
        <header className="mb-8 text-center">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-si-muted">
            <span className="text-si-gold">—</span> Simulateur Crypto{" "}
            <span className="text-si-gold">—</span>
          </p>
          <h1 className="font-display text-3xl font-extrabold text-white sm:text-4xl">
            Combien aurait rapporté votre investissement&nbsp;?
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-si-gold">
            Testez une stratégie one-shot ou DCA sur données de marché réelles.
          </p>
        </header>
      )}

      {/* mobile: colonne unique · desktop: formulaire à gauche, résultats à droite */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(320px,380px)_1fr]">
        <SimulationForm onSubmit={handleSubmit} isLoading={isLoading} />

        <div className="flex flex-col gap-6">
          {error && (
            <div className="rounded-card border border-danger/40 bg-danger/10 px-5 py-4 text-sm text-danger">
              {error}
            </div>
          )}

          {result ? (
            <>
              <SimulationChart data={result.chartData} />
              <ResultsPanel result={result} />
            </>
          ) : (
            !error && <EmptyState isLoading={isLoading} />
          )}
        </div>
      </div>
    </section>
  );
}

function EmptyState({ isLoading }: { isLoading: boolean }) {
  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center rounded-card border border-dashed border-si-border bg-si-card/50 p-8 text-center">
      <ChartGlyph />
      <p className="mt-4 max-w-xs text-si-muted">
        {isLoading
          ? "Récupération des données de marché…"
          : "Choisissez une crypto, un montant et une période, puis lancez la simulation pour voir le résultat."}
      </p>
    </div>
  );
}

function ChartGlyph() {
  return (
    <svg
      width="44"
      height="44"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-si-border"
      aria-hidden="true"
    >
      <path d="M3 3v16a2 2 0 0 0 2 2h16" />
      <path d="m7 14 3-3 3 3 5-5" />
    </svg>
  );
}
