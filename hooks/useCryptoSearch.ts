"use client";

import { useEffect, useState } from "react";
import { CoinGeckoError, searchCoins } from "@/lib/coingecko";
import type { CoinSearchResult } from "@/types/simulation";

/**
 * Cache mémoire partagé entre tous les usages du hook (niveau module).
 * Évite de re-fetcher une recherche déjà effectuée pendant la session.
 */
const searchCache = new Map<string, CoinSearchResult[]>();

const DEBOUNCE_MS = 300;

type UseCryptoSearch = {
  results: CoinSearchResult[];
  isLoading: boolean;
  error: string | null;
};

/**
 * Recherche de cryptos avec debounce (300ms), cache mémoire et annulation
 * des requêtes obsolètes via AbortController.
 */
export function useCryptoSearch(query: string): UseCryptoSearch {
  const [results, setResults] = useState<CoinSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const trimmed = query.trim();

    if (!trimmed) {
      setResults([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    // Hit cache : réponse immédiate, aucun appel réseau.
    const cached = searchCache.get(trimmed);
    if (cached) {
      setResults(cached);
      setIsLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();
    setIsLoading(true);
    setError(null);

    const timer = setTimeout(async () => {
      try {
        const data = await searchCoins(trimmed, controller.signal);
        searchCache.set(trimmed, data);
        if (!cancelled) setResults(data);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        if (!cancelled) {
          setResults([]);
          setError(
            err instanceof CoinGeckoError
              ? err.message
              : "Recherche temporairement indisponible.",
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  return { results, isLoading, error };
}
