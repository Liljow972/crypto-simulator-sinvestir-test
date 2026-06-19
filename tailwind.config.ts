import type { Config } from "tailwindcss";

/**
 * Design system S'investir — tokens repris des outils simulateurs.sinvestir.fr.
 * Préfixe `si-` pour éviter toute collision avec les utilitaires Tailwind natifs
 * et garder une intention explicite à la lecture du markup.
 */
const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        si: {
          bg: "#0A0F1E", // fond principal — bleu nuit très sombre
          card: "#0D1530", // cartes, sidebar
          input: "#111827", // champs de saisie
          blue: "#2563EB", // boutons CTA, éléments actifs
          gold: "#C9A84C", // logo S'investir, highlights premium
          border: "#1E293B", // bordures subtiles
          muted: "#94A3B8", // labels, descriptions (text secondary)
        },
        success: "#10B981", // plus-value positive
        danger: "#EF4444", // moins-value négative
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "12px",
        input: "8px",
      },
      boxShadow: {
        card: "0 8px 30px rgba(0, 0, 0, 0.35)",
      },
    },
  },
  plugins: [],
};

export default config;
