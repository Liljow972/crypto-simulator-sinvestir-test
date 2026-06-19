"use client";

import { useEffect, useRef, useState } from "react";
import { useCryptoSearch } from "@/hooks/useCryptoSearch";
import type { CoinSearchResult } from "@/types/simulation";

/** Cryptos proposées par défaut quand le champ est vide. */
const POPULAR_COINS: CoinSearchResult[] = [
  {
    id: "bitcoin",
    name: "Bitcoin",
    symbol: "BTC",
    thumb: "https://assets.coingecko.com/coins/images/1/thumb/bitcoin.png",
  },
  {
    id: "ethereum",
    name: "Ethereum",
    symbol: "ETH",
    thumb: "https://assets.coingecko.com/coins/images/279/thumb/ethereum.png",
  },
  {
    id: "solana",
    name: "Solana",
    symbol: "SOL",
    thumb: "https://assets.coingecko.com/coins/images/4128/thumb/solana.png",
  },
];

type CryptoSearchProps = {
  selected: CoinSearchResult | null;
  onSelect: (coin: CoinSearchResult) => void;
};

export function CryptoSearch({ selected, onSelect }: CryptoSearchProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { results, isLoading, error } = useCryptoSearch(query);

  // Ferme le dropdown au clic extérieur.
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const suggestions = query.trim() ? results : POPULAR_COINS;

  function handleSelect(coin: CoinSearchResult) {
    onSelect(coin);
    setQuery("");
    setIsOpen(false);
  }

  return (
    <div className="relative" ref={containerRef}>
      <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-si-muted">
        Cryptomonnaie
      </label>

      <div className="relative">
        {/* Icône loupe / logo de la crypto sélectionnée */}
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
          {selected && !isOpen ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={selected.thumb}
              alt=""
              className="h-5 w-5 rounded-full"
              width={20}
              height={20}
            />
          ) : (
            <SearchIcon />
          )}
        </span>

        <input
          type="text"
          value={isOpen ? query : selected ? `${selected.name}` : query}
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Rechercher (Bitcoin, ETH, Solana…)"
          className="w-full rounded-input border border-si-border bg-si-input py-3 pl-10 pr-4 text-white placeholder:text-si-muted/70 focus:border-si-blue focus:outline-none focus:ring-1 focus:ring-si-blue"
          aria-label="Rechercher une cryptomonnaie"
          autoComplete="off"
        />

        {selected && !isOpen && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-si-muted">
            {selected.symbol}
          </span>
        )}
      </div>

      {isOpen && (
        <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-card border border-si-border bg-si-card shadow-card">
          {!query.trim() && (
            <p className="px-4 pt-3 text-[11px] font-medium uppercase tracking-wide text-si-muted">
              Populaires
            </p>
          )}

          {isLoading && (
            <p className="px-4 py-3 text-sm text-si-muted">Recherche…</p>
          )}

          {error && !isLoading && (
            <p className="px-4 py-3 text-sm text-danger">{error}</p>
          )}

          {!isLoading && !error && suggestions.length === 0 && (
            <p className="px-4 py-3 text-sm text-si-muted">
              Aucun résultat pour « {query} ».
            </p>
          )}

          <ul className="max-h-64 overflow-y-auto py-1">
            {suggestions.map((coin) => (
              <li key={coin.id}>
                <button
                  type="button"
                  onClick={() => handleSelect(coin)}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-si-input"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={coin.thumb}
                    alt=""
                    className="h-6 w-6 rounded-full"
                    width={24}
                    height={24}
                  />
                  <span className="font-medium text-white">{coin.name}</span>
                  <span className="ml-auto text-xs font-semibold uppercase text-si-muted">
                    {coin.symbol}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function SearchIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-si-muted"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}
