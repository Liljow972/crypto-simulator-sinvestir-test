"use client";

import { useCallback, useState } from "react";
import { CoinGeckoError, getMarketChartRange } from "@/lib/coingecko";
import type {
  ChartDataPoint,
  DcaFrequency,
  PricePoint,
  SimulationParams,
  SimulationResult,
} from "@/types/simulation";

/** Erreur métier (période sans données, etc.) distincte des erreurs réseau. */
export class SimulationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SimulationError";
  }
}

type UseSimulation = {
  result: SimulationResult | null;
  isLoading: boolean;
  error: string | null;
  runSimulation: (params: SimulationParams) => Promise<SimulationResult | null>;
  reset: () => void;
};

/* ------------------------------------------------------------------ */
/* Helpers de calcul (purs, testables isolément)                      */
/* ------------------------------------------------------------------ */

/** Formate une date au format français JJ/MM/AAAA. */
function formatDateFR(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}/${date.getFullYear()}`;
}

/**
 * Génère les dates de versement DCA entre `start` et `end` selon la fréquence.
 * Le premier versement a lieu à la date de début.
 */
function buildInvestmentDates(
  start: Date,
  end: Date,
  frequency: DcaFrequency,
): Date[] {
  const dates: Date[] = [];
  const cursor = new Date(start);

  while (cursor <= end) {
    dates.push(new Date(cursor));
    if (frequency === "daily") cursor.setDate(cursor.getDate() + 1);
    else if (frequency === "weekly") cursor.setDate(cursor.getDate() + 7);
    else cursor.setMonth(cursor.getMonth() + 1);
  }

  return dates;
}

/**
 * Renvoie le point de prix le plus proche d'une date cible.
 * Recherche dichotomique : `prices` doit être trié par date croissante.
 */
function findClosestPrice(prices: PricePoint[], target: Date): PricePoint {
  const targetTime = target.getTime();
  let lo = 0;
  let hi = prices.length - 1;

  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (prices[mid].date.getTime() < targetTime) lo = mid + 1;
    else hi = mid;
  }

  // Compare le voisin de gauche pour retenir le plus proche.
  if (lo > 0) {
    const prev = prices[lo - 1];
    const curr = prices[lo];
    if (
      Math.abs(prev.date.getTime() - targetTime) <=
      Math.abs(curr.date.getTime() - targetTime)
    ) {
      return prev;
    }
  }
  return prices[lo];
}

/** Investissement unique : tout le capital placé à la date de début. */
function computeOneShot(
  prices: PricePoint[],
  amount: number,
): SimulationResult {
  const startPrice = prices[0].price;
  const shares = amount / startPrice;

  const chartData: ChartDataPoint[] = prices.map((point) => ({
    date: formatDateFR(point.date),
    portfolioValue: shares * point.price,
    investedValue: amount,
  }));

  const finalValue = shares * prices[prices.length - 1].price;
  const gainLoss = finalValue - amount;

  return {
    totalInvested: amount,
    finalValue,
    gainLoss,
    gainLossPercent: (gainLoss / amount) * 100,
    chartData,
  };
}

/** DCA : versements réguliers du même montant sur la période. */
function computeDca(
  prices: PricePoint[],
  params: SimulationParams,
): SimulationResult {
  const { amount, frequency, startDate, endDate } = params;

  const investments = buildInvestmentDates(startDate, endDate, frequency)
    .map((date) => {
      const { price } = findClosestPrice(prices, date);
      return { date, shares: amount / price };
    })
    .filter((inv) => Number.isFinite(inv.shares) && inv.shares > 0);

  if (investments.length === 0) {
    throw new SimulationError(
      "Aucun versement n'a pu être calculé sur la période choisie.",
    );
  }

  // Parcours simultané prix / versements (les deux triés par date croissante).
  let investmentIndex = 0;
  let cumulativeShares = 0;
  let cumulativeInvested = 0;

  const chartData: ChartDataPoint[] = prices.map((point) => {
    let invested = false;
    while (
      investmentIndex < investments.length &&
      investments[investmentIndex].date.getTime() <= point.date.getTime()
    ) {
      cumulativeShares += investments[investmentIndex].shares;
      cumulativeInvested += amount;
      investmentIndex += 1;
      invested = true;
    }

    return {
      date: formatDateFR(point.date),
      portfolioValue: cumulativeShares * point.price,
      investedValue: cumulativeInvested,
      isInvestmentDate: invested,
    };
  });

  // Versements tombant après le dernier point de prix : on les rattache au
  // dernier point pour garder graphique et KPIs cohérents.
  if (investmentIndex < investments.length) {
    while (investmentIndex < investments.length) {
      cumulativeShares += investments[investmentIndex].shares;
      cumulativeInvested += amount;
      investmentIndex += 1;
    }
    const last = chartData[chartData.length - 1];
    last.portfolioValue = cumulativeShares * prices[prices.length - 1].price;
    last.investedValue = cumulativeInvested;
  }

  const totalInvested = cumulativeInvested;
  const finalValue = cumulativeShares * prices[prices.length - 1].price;
  const gainLoss = finalValue - totalInvested;

  return {
    totalInvested,
    finalValue,
    gainLoss,
    gainLossPercent: totalInvested > 0 ? (gainLoss / totalInvested) * 100 : 0,
    chartData,
    investmentDates: investments.map((inv) => inv.date),
  };
}

/* ------------------------------------------------------------------ */
/* Hook                                                               */
/* ------------------------------------------------------------------ */

export function useSimulation(): UseSimulation {
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runSimulation = useCallback(
    async (params: SimulationParams): Promise<SimulationResult | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const prices = await getMarketChartRange(
          params.coin.id,
          params.startDate,
          params.endDate,
        );

        if (prices.length < 2) {
          throw new SimulationError(
            "Pas assez de données historiques pour cette crypto sur la période choisie.",
          );
        }

        const computed =
          params.mode === "one-shot"
            ? computeOneShot(prices, params.amount)
            : computeDca(prices, params);

        setResult(computed);
        return computed;
      } catch (err) {
        const message =
          err instanceof CoinGeckoError || err instanceof SimulationError
            ? err.message
            : "Une erreur est survenue pendant la simulation. Réessayez.";
        setError(message);
        setResult(null);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { result, isLoading, error, runSimulation, reset };
}
