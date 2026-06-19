import type {
  CoinSearchResult,
  MarketChartResponse,
  PricePoint,
} from "@/types/simulation";

/**
 * Client CoinGecko typé — API publique gratuite, sans clé.
 * Toutes les valeurs sont libellées en euros (`vs_currency=eur`).
 */

const BASE_URL = "https://api.coingecko.com/api/v3";

/**
 * Profondeur d'historique autorisée par l'API publique gratuite CoinGecko.
 * Depuis 2024, les utilisateurs sans clé sont limités aux 365 derniers jours
 * (erreur 10012 / HTTP 401 au-delà). On borne donc les périodes côté formulaire.
 */
export const MAX_HISTORY_DAYS = 365;

/** Catégories d'erreur exploitables côté UI pour un message adapté. */
export type CoinGeckoErrorKind =
  | "rate_limit"
  | "http"
  | "network"
  | "out_of_range";

export class CoinGeckoError extends Error {
  readonly kind: CoinGeckoErrorKind;
  readonly status?: number;

  constructor(kind: CoinGeckoErrorKind, message: string, status?: number) {
    super(message);
    this.name = "CoinGeckoError";
    this.kind = kind;
    this.status = status;
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Fetch JSON typé avec retry automatique sur les rate limits (429).
 * Par défaut : 1 réessai après 1s, conformément à l'UX attendue.
 */
async function cgFetch<T>(
  url: string,
  { retries = 1, signal }: { retries?: number; signal?: AbortSignal } = {},
): Promise<T> {
  let lastError: CoinGeckoError | null = null;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    let response: Response;
    try {
      response = await fetch(url, {
        headers: { accept: "application/json" },
        signal,
      });
    } catch (error) {
      // AbortError : la requête a été annulée volontairement, on la propage.
      if (error instanceof DOMException && error.name === "AbortError") {
        throw error;
      }
      lastError = new CoinGeckoError(
        "network",
        "Impossible de joindre CoinGecko. Vérifiez votre connexion.",
      );
      throw lastError;
    }

    if (response.status === 429) {
      lastError = new CoinGeckoError(
        "rate_limit",
        "Trop de requêtes vers CoinGecko. Nouvelle tentative…",
        429,
      );
      if (attempt < retries) {
        await sleep(1000);
        continue;
      }
      throw lastError;
    }

    if (!response.ok) {
      // Tente de lire le message d'erreur CoinGecko pour un retour explicite.
      let errorMessage = "";
      try {
        const body = (await response.json()) as {
          error?: { status?: { error_message?: string } } | string;
        };
        errorMessage =
          typeof body.error === "string"
            ? body.error
            : (body.error?.status?.error_message ?? "");
      } catch {
        // Corps non-JSON : on retombe sur un message générique.
      }

      // Dépassement de la fenêtre de 365 jours (plan gratuit).
      if (errorMessage.toLowerCase().includes("time range")) {
        throw new CoinGeckoError(
          "out_of_range",
          "L'historique gratuit CoinGecko est limité aux 365 derniers jours. Choisissez une période plus récente.",
          response.status,
        );
      }

      throw new CoinGeckoError(
        "http",
        `Erreur CoinGecko (${response.status}).`,
        response.status,
      );
    }

    return (await response.json()) as T;
  }

  // Inatteignable en pratique — garde-fou de typage.
  throw lastError ?? new CoinGeckoError("http", "Erreur CoinGecko inconnue.");
}

type RawSearchResponse = {
  coins: Array<{
    id: string;
    name: string;
    symbol: string;
    thumb: string;
  }>;
};

/**
 * Recherche autocomplete de cryptomonnaies.
 * Renvoie au plus 15 résultats, déjà normalisés.
 */
export async function searchCoins(
  query: string,
  signal?: AbortSignal,
): Promise<CoinSearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const url = `${BASE_URL}/search?query=${encodeURIComponent(trimmed)}`;
  const data = await cgFetch<RawSearchResponse>(url, { signal });

  return data.coins.slice(0, 15).map((coin) => ({
    id: coin.id,
    name: coin.name,
    symbol: coin.symbol.toUpperCase(),
    thumb: coin.thumb,
  }));
}

/**
 * Historique de prix sur une période, en euros.
 * `from` / `to` sont des dates JS ; converties en timestamps Unix (secondes).
 * La granularité (horaire / journalière) est choisie automatiquement par CoinGecko
 * en fonction de l'amplitude de la période.
 */
export async function getMarketChartRange(
  coinId: string,
  from: Date,
  to: Date,
  signal?: AbortSignal,
): Promise<PricePoint[]> {
  const fromTs = Math.floor(from.getTime() / 1000);
  const toTs = Math.floor(to.getTime() / 1000);

  const url =
    `${BASE_URL}/coins/${encodeURIComponent(coinId)}/market_chart/range` +
    `?vs_currency=eur&from=${fromTs}&to=${toTs}`;

  const data = await cgFetch<MarketChartResponse>(url, { signal });

  if (!Array.isArray(data.prices)) {
    throw new CoinGeckoError("http", "Réponse CoinGecko inattendue.");
  }

  return data.prices.map(([timestamp, price]) => ({
    date: new Date(timestamp),
    price,
  }));
}
