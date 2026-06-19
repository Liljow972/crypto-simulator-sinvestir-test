import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import "./globals.css";

// Plus Jakarta Sans → titres (display) ; Inter → corps / labels.
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["500", "600", "700", "800"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Simulateur Crypto — S'investir",
  description:
    "Simulez un investissement crypto (one-shot ou DCA) avec des données de marché réelles. Un outil S'investir.",
};

// viewport-fit=cover : évite que le bouton flottant soit masqué par la barre
// d'accueil iOS (safe-area) sur mobile.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${jakarta.variable} ${inter.variable}`}>
      <body className="bg-si-bg text-white antialiased">{children}</body>
    </html>
  );
}
