/**
 * Helpers de formatage — locale française.
 * Centralisés ici pour rester cohérents entre formulaire, graphique et KPIs.
 */

const eurFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const eurFormatterCents = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat("fr-FR");

/** Montant en euros, sans décimales (ex. « 1 250 € »). */
export function formatEUR(value: number): string {
  return eurFormatter.format(value);
}

/** Montant en euros avec centimes (ex. « 1 250,30 € »). */
export function formatEURCents(value: number): string {
  return eurFormatterCents.format(value);
}

/** Entier avec séparateur de milliers FR (ex. « 1 250 »). */
export function formatNumberFR(value: number): string {
  return numberFormatter.format(value);
}

/** Pourcentage signé (ex. « +12,4 % » / « -3,1 % »). */
export function formatPercent(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toLocaleString("fr-FR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })} %`;
}

/** Euros abrégés pour l'axe Y du graphique (ex. « 1 k € », « 10 k € »). */
export function formatCompactEUR(value: number): string {
  if (Math.abs(value) >= 1_000_000) {
    return `${(value / 1_000_000).toLocaleString("fr-FR", {
      maximumFractionDigits: 1,
    })} M €`;
  }
  if (Math.abs(value) >= 1_000) {
    return `${(value / 1_000).toLocaleString("fr-FR", {
      maximumFractionDigits: 1,
    })} k €`;
  }
  return `${Math.round(value)} €`;
}
