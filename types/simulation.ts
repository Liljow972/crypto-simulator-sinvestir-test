/**
 * Types partagés du simulateur crypto S'investir.
 * Source unique de vérité — importés par les hooks, les composants et le client API.
 */

/* ------------------------------------------------------------------ */
/* CoinGecko                                                          */
/* ------------------------------------------------------------------ */

/** Résultat de l'autocomplete CoinGecko (`/search`). */
export type CoinSearchResult = {
  id: string;
  name: string;
  symbol: string;
  thumb: string;
};

/** Point de prix normalisé (timestamp converti en Date). */
export type PricePoint = {
  date: Date;
  price: number;
};

/** Réponse brute de `/coins/{id}/market_chart/range`. */
export type MarketChartResponse = {
  prices: [number, number][];
};

/* ------------------------------------------------------------------ */
/* Paramètres de simulation                                          */
/* ------------------------------------------------------------------ */

/** Mode d'investissement. */
export type SimulationMode = "one-shot" | "dca";

/** Fréquence des versements en mode DCA. */
export type DcaFrequency = "daily" | "weekly" | "monthly";

/** Paramètres saisis par l'utilisateur. */
export type SimulationParams = {
  coin: CoinSearchResult;
  /**
   * One-shot : montant total investi en une fois.
   * DCA : montant investi à chaque versement (par occurrence).
   */
  amount: number;
  mode: SimulationMode;
  frequency: DcaFrequency;
  startDate: Date;
  endDate: Date;
};

/* ------------------------------------------------------------------ */
/* Résultats                                                          */
/* ------------------------------------------------------------------ */

/** Point de données pour le graphique Recharts. */
export type ChartDataPoint = {
  /** Date formatée FR « JJ/MM/AAAA ». */
  date: string;
  /** Valeur du portefeuille à cette date (parts détenues × prix). */
  portfolioValue: number;
  /** Capital cumulé investi à cette date. */
  investedValue: number;
  /** `true` si un versement DCA a eu lieu à cette date (marqueur graphique). */
  isInvestmentDate?: boolean;
};

/** Résultat complet d'une simulation. */
export type SimulationResult = {
  totalInvested: number;
  finalValue: number;
  gainLoss: number;
  gainLossPercent: number;
  chartData: ChartDataPoint[];
  /** Dates effectives des versements DCA (utile pour le graphique). */
  investmentDates?: Date[];
};
