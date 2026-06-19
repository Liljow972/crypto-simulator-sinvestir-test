import { SimulateurCrypto } from "@/components/SimulateurCrypto";
import { ChatAssistant } from "@/components/ChatAssistant";

/** Liste statique des simulateurs de la suite — démo de l'intégration sidebar. */
const SIMULATORS: { label: string; active?: boolean }[] = [
  { label: "Crypto", active: true },
  { label: "Intérêts composés" },
  { label: "Immobilier" },
  { label: "Inflation" },
  { label: "Épargne & Livrets" },
  { label: "Crédit" },
];

export default function Home() {
  return (
    <div className="flex min-h-screen bg-si-bg">
      {/* Sidebar — masquée sur mobile, visible dès lg */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-si-border bg-si-card lg:flex">
        <div className="flex h-16 items-center px-6">
          <Logo />
        </div>
        <nav className="flex flex-col gap-1 px-3 py-4">
          <p className="px-3 pb-2 text-[11px] font-medium uppercase tracking-wide text-si-muted">
            Simulateurs
          </p>
          {SIMULATORS.map((sim) => (
            <button
              key={sim.label}
              type="button"
              className={`flex items-center gap-3 rounded-input px-3 py-2.5 text-sm transition-colors ${
                sim.active
                  ? "bg-si-blue/15 font-semibold text-white"
                  : "text-si-muted hover:bg-si-input hover:text-white"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  sim.active ? "bg-si-blue" : "bg-si-border"
                }`}
              />
              {sim.label}
            </button>
          ))}
        </nav>
        <div className="mt-auto px-6 py-4 text-[11px] text-si-muted">
          simulateurs.sinvestir.fr
        </div>
      </aside>

      {/* Zone principale */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar mobile avec logo */}
        <header className="flex h-16 items-center border-b border-si-border px-5 lg:hidden">
          <Logo />
        </header>

        <main className="flex-1 px-5 py-8 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-6xl">
            <SimulateurCrypto />
          </div>
        </main>
      </div>

      {/* Assistant IA — positionné en fixed, n'interfère pas avec le simulateur */}
      <ChatAssistant />
    </div>
  );
}

function Logo() {
  return (
    <span className="flex items-center gap-2.5">
      <span className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-si-gold font-display text-lg font-extrabold text-si-bg">
        S
      </span>
      <span className="font-display text-lg font-extrabold text-white">
        S<span className="text-si-gold">&apos;</span>investir
      </span>
    </span>
  );
}
