"use client";

import { useMemo, useState } from "react";
import { Info } from "lucide-react";
import { CryptoSearch } from "./CryptoSearch";
import { MAX_HISTORY_DAYS } from "@/lib/coingecko";
import { formatNumberFR } from "@/lib/format";
import type {
  CoinSearchResult,
  DcaFrequency,
  SimulationMode,
  SimulationParams,
} from "@/types/simulation";

type SimulationFormProps = {
  onSubmit: (params: SimulationParams) => void;
  isLoading: boolean;
};

const FREQUENCIES: { value: DcaFrequency; label: string }[] = [
  { value: "daily", label: "Quotidien" },
  { value: "weekly", label: "Hebdomadaire" },
  { value: "monthly", label: "Mensuel" },
];

/**
 * Date → chaîne « AAAA-MM-JJ » en heure LOCALE.
 * Le champ <input type="date"> raisonne en local ; passer par toISOString()
 * (UTC) décalerait l'affichage et la contrainte `max` d'un jour selon le fuseau.
 */
function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function addMonths(date: Date, months: number): Date {
  const copy = new Date(date);
  copy.setMonth(copy.getMonth() + months);
  return copy;
}

// Date de fin maximale = HIER : dernière journée de marché complète, et cela
// neutralise tout décalage de fuseau sur « aujourd'hui ». Centralisé ici et
// réutilisé partout (valeur par défaut + contrainte `max` des deux champs).
const yesterday = addDays(new Date(), -1);
const maxDate = toISODate(yesterday);

// Borne basse sélectionnable : ~2 jours sous la limite des 365 jours
// (l'API mesure la fenêtre depuis l'instant présent, donc 365 jours pile = 401).
const earliestDate = toISODate(addDays(yesterday, -(MAX_HISTORY_DAYS - 2)));

// Début par défaut : 11 mois avant la date de fin, même quantième → lecture
// claire (ex. 19/07 → 19/06) avec une marge confortable sous la limite.
const defaultStartDate = toISODate(addMonths(yesterday, -11));

export function SimulationForm({ onSubmit, isLoading }: SimulationFormProps) {
  const [coin, setCoin] = useState<CoinSearchResult | null>(null);
  const [amount, setAmount] = useState<number>(1000);
  const [mode, setMode] = useState<SimulationMode>("one-shot");
  const [frequency, setFrequency] = useState<DcaFrequency>("monthly");
  const [startDate, setStartDate] = useState<string>(defaultStartDate);
  const [endDate, setEndDate] = useState<string>(maxDate);

  // Validation inline (pas d'alert JS).
  const validationError = useMemo<string | null>(() => {
    if (!startDate || !endDate) return "Renseignez les deux dates.";
    if (new Date(endDate) <= new Date(startDate))
      return "La date de fin doit être postérieure à la date de début.";
    if (new Date(endDate) > new Date(maxDate))
      return "La date de fin ne peut pas dépasser hier (dernière journée complète).";
    if (new Date(startDate) < new Date(earliestDate))
      return "L'historique gratuit est limité aux 365 derniers jours.";
    return null;
  }, [startDate, endDate]);

  const canSubmit =
    coin !== null && amount > 0 && validationError === null && !isLoading;

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!coin || !canSubmit) return;
    onSubmit({
      coin,
      amount,
      mode,
      frequency,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    });
  }

  const amountLabel =
    mode === "dca" ? "Montant par versement (€)" : "Montant investi (€)";

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-5 rounded-card border border-si-border bg-si-card p-5 shadow-card sm:p-6"
    >
      <CryptoSearch selected={coin} onSelect={setCoin} />

      {/* Montant */}
      <div>
        <label
          htmlFor="amount"
          className="mb-2 block text-xs font-medium uppercase tracking-wide text-si-muted"
        >
          {amountLabel}
        </label>
        <div className="relative">
          <input
            id="amount"
            inputMode="numeric"
            value={amount > 0 ? formatNumberFR(amount) : ""}
            onChange={(event) => {
              const digits = event.target.value.replace(/[^\d]/g, "");
              setAmount(digits ? Number.parseInt(digits, 10) : 0);
            }}
            placeholder="1 000"
            className="w-full rounded-input border border-si-border bg-si-input py-3 pl-4 pr-10 text-lg font-semibold text-white placeholder:text-si-muted/70 focus:border-si-blue focus:outline-none focus:ring-1 focus:ring-si-blue"
          />
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-si-muted">
            €
          </span>
        </div>
      </div>

      {/* Mode */}
      <div>
        <span className="mb-2 block text-xs font-medium uppercase tracking-wide text-si-muted">
          Mode d&apos;investissement
        </span>
        <div className="grid grid-cols-2 gap-2 rounded-input border border-si-border bg-si-input p-1">
          <ModeButton
            active={mode === "one-shot"}
            label="Investissement unique"
            onClick={() => setMode("one-shot")}
          />
          <ModeButton
            active={mode === "dca"}
            label="DCA"
            onClick={() => setMode("dca")}
          />
        </div>
      </div>

      {/* Fréquence DCA (apparition animée) */}
      <div
        className={`grid overflow-hidden transition-all duration-300 ${
          mode === "dca"
            ? "grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="min-h-0">
          <span className="mb-2 block text-xs font-medium uppercase tracking-wide text-si-muted">
            Fréquence des versements
          </span>
          <div className="flex flex-wrap gap-2">
            {FREQUENCIES.map((freq) => (
              <button
                key={freq.value}
                type="button"
                onClick={() => setFrequency(freq.value)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  frequency === freq.value
                    ? "bg-si-blue text-white"
                    : "border border-si-border bg-si-input text-si-muted hover:text-white"
                }`}
              >
                {freq.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="startDate"
            className="mb-2 block text-xs font-medium uppercase tracking-wide text-si-muted"
          >
            Date de début
          </label>
          <input
            id="startDate"
            type="date"
            value={startDate}
            min={earliestDate}
            max={maxDate}
            onChange={(event) => setStartDate(event.target.value)}
            className="w-full rounded-input border border-si-border bg-si-input px-4 py-3 text-white [color-scheme:dark] focus:border-si-blue focus:outline-none focus:ring-1 focus:ring-si-blue"
          />
        </div>
        <div>
          <label
            htmlFor="endDate"
            className="mb-2 block text-xs font-medium uppercase tracking-wide text-si-muted"
          >
            Date de fin
          </label>
          <input
            id="endDate"
            type="date"
            value={endDate}
            min={startDate}
            max={maxDate}
            onChange={(event) => setEndDate(event.target.value)}
            className="w-full rounded-input border border-si-border bg-si-input px-4 py-3 text-white [color-scheme:dark] focus:border-si-blue focus:outline-none focus:ring-1 focus:ring-si-blue"
          />
        </div>
      </div>

      <div className="-mt-1 flex items-center gap-1.5 text-si-muted">
        <Info size={12} className="shrink-0" />
        <span className="text-xs">
          Données disponibles sur les 12 derniers mois
        </span>
      </div>

      {validationError && (
        <p className="text-sm text-danger">{validationError}</p>
      )}

      {/* mobile: bouton ancré en bas de la carte pour rester accessible · desktop: flux normal */}
      <div className="sticky bottom-0 z-10 -mx-5 -mb-5 mt-1 border-t border-si-border/60 bg-si-card px-5 pb-5 pt-4 sm:static sm:m-0 sm:border-0 sm:bg-transparent sm:p-0">
        <button
          type="submit"
          disabled={!canSubmit}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-si-blue px-6 py-3.5 font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isLoading ? (
            <>
              <Spinner />
              Simulation en cours…
            </>
          ) : (
            "Simuler"
          )}
        </button>
      </div>
    </form>
  );
}

function ModeButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[6px] px-3 py-2.5 text-sm font-semibold transition-colors ${
        active ? "bg-si-blue text-white" : "text-si-muted hover:text-white"
      }`}
    >
      {label}
    </button>
  );
}

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}
