# Simulateur Crypto S'investir

Simulateur d'investissement en cryptomonnaies (one-shot & DCA) sur données de marché réelles, dans le design system de la suite **simulateurs.sinvestir.fr**, avec un assistant IA contextuel intégré.

- **Démo live :** [https://crypto-simulator-sinvestir-test.vercel.app](https://crypto-simulator-sinvestir-test.vercel.app)
- **Repo :** [https://github.com/Liljow972/crypto-simulator-sinvestir-test](https://github.com/Liljow972/crypto-simulator-sinvestir-test)

---

## Stack technique

| Brique          | Choix                              | Justification                                                                 |
| --------------- | ---------------------------------- | ----------------------------------------------------------------------------- |
| Framework       | **Next.js 14** (App Router)        | SSR + Routes API natives, déploiement Vercel zéro-config, écosystème S'investir. |
| Langage         | **TypeScript strict** (`no any`)   | Sécurité de typage de bout en bout, contrat clair pour l'intégration.          |
| Styling         | **Tailwind CSS**                   | Intégrable sans surcouche UI ; tokens S'investir centralisés dans la config.   |
| Graphiques      | **Recharts**                       | Léger, déclaratif, composable — idéal pour un graphe aire + ligne responsive.  |
| Données marché  | **CoinGecko API** (publique)       | Gratuite, sans clé, historique multi-cryptos en euros.                         |
| Assistant IA    | **Anthropic SDK** (`claude-haiku-4-5`) | Réponses rapides et économiques en streaming, prompt isolé et reconfigurable. |
| Déploiement     | **Vercel**                         | Pipeline natif Next.js, variables d'environnement gérées.                      |

---

## Lancer le projet

```bash
git clone <repo>
cd sinvestir-crypto-simulator
npm install
cp .env.example .env.local
# Ajouter votre ANTHROPIC_API_KEY dans .env.local
npm run dev
```

Le simulateur fonctionne **sans clé API** : seul l'assistant IA est désactivé (avec un message de repli) tant que `ANTHROPIC_API_KEY` n'est pas renseignée.

```bash
npm run build   # build de production + vérification TypeScript / lint
npm run start    # sert le build de production
```

---

## Partis pris techniques

- **Next.js 14 App Router plutôt que Vite/React seul** — on a besoin d'une route serveur (`/api/chat`) pour ne **jamais** exposer la clé Anthropic au client, et le streaming SSE se branche directement sur les Route Handlers. Vite seul aurait imposé un backend séparé.
- **CoinGecko API gratuite (sans clé)** — couvre la recherche autocomplete (`/search`) et l'historique de prix (`/coins/{id}/market_chart/range`) en euros, sans inscription. Les rate limits (429) sont gérés avec un retry automatique après 1 s.
  - ⚠️ **Limite réelle de l'API publique** : depuis 2024, les utilisateurs sans clé sont restreints aux **365 derniers jours** d'historique (erreur 10012 au-delà). Le formulaire borne donc automatiquement la période à cette fenêtre, et le client renvoie un message explicite si la limite est dépassée. Pour débloquer l'historique complet (ex. simuler 2020→2023), il suffirait de passer une clé **CoinGecko Demo** (gratuite) via un proxy serveur — la constante `MAX_HISTORY_DAYS` dans [`lib/coingecko.ts`](lib/coingecko.ts) centralise ce point.
- **Recharts plutôt que Chart.js** — bibliothèque React-native, plus légère, déclarative et composable. Le graphe combine une aire (valeur du portefeuille) et une ligne pointillée (capital investi) dans un seul `ComposedChart`.
- **Composant `headless-friendly`** — `<SimulateurCrypto />` n'a aucune dépendance globale cachée. Les props `showHeader` et `onSimulationComplete` permettent de l'embarquer dans une page existante et de récupérer le résultat côté parent.
- **Architecture de l'assistant IA** — le system prompt est **isolé** dans [`components/ChatAssistant/systemPrompt.ts`](components/ChatAssistant/systemPrompt.ts) pour être modifié sans toucher au code. Modèle **Haiku** pour la rapidité et le coût, **streaming** pour un rendu progressif, et surtout **découplage total** : si l'API Anthropic échoue (ou la clé est absente), le widget affiche un message de repli et le simulateur continue de fonctionner.

> **Note sur le modèle.** La spec initiale mentionnait `claude-haiku-3-5`, qui n'est pas un identifiant de modèle valide (et Claude Haiku 3.5 est retiré de l'API). Le code utilise donc `claude-haiku-4-5`, le Haiku courant — l'intention « rapide + économique » est préservée. Le modèle est centralisé dans [`app/api/chat/route.ts`](app/api/chat/route.ts).

### Logique de calcul

- **One-shot** : tout le capital est placé à la date de début → `parts = montant / prix_début`, puis `valeur = parts × prix` à chaque point.
- **DCA** (quotidien / hebdo / mensuel) : génération des dates de versement, achat de parts au prix le plus proche (recherche dichotomique sur l'historique trié), cumul des parts et du capital investi point par point pour le graphique et les KPIs.

---

## Architecture des fichiers

```
.
├── app/
│   ├── layout.tsx                # fonts Google (Plus Jakarta Sans + Inter)
│   ├── page.tsx                  # démo : sidebar + simulateur + assistant
│   ├── globals.css               # variables CSS du design system
│   └── api/chat/route.ts         # route streaming Anthropic
├── components/
│   ├── SimulateurCrypto/         # composant principal exportable
│   │   ├── index.tsx
│   │   ├── CryptoSearch.tsx
│   │   ├── SimulationForm.tsx
│   │   ├── SimulationChart.tsx
│   │   └── ResultsPanel.tsx
│   └── ChatAssistant/
│       ├── index.tsx             # widget chat (bouton + drawer)
│       └── systemPrompt.ts       # system prompt isolé
├── hooks/
│   ├── useCryptoSearch.ts        # recherche CoinGecko, debounce 300ms
│   └── useSimulation.ts          # logique DCA + one-shot
├── lib/
│   ├── coingecko.ts              # client API typé
│   └── format.ts                 # helpers de formatage FR
└── types/simulation.ts           # types partagés
```

---

## Intégration dans simulateurs.sinvestir.fr

```tsx
import { SimulateurCrypto } from "@/components/SimulateurCrypto";

// Usage minimal
<SimulateurCrypto />

// Sans header (pour embedding dans une page existante)
<SimulateurCrypto showHeader={false} />

// Avec callback sur résultat
<SimulateurCrypto onSimulationComplete={(result) => console.log(result)} />

// Avec classe parente
<SimulateurCrypto className="max-w-4xl mx-auto" />
```

Le composant n'embarque que ses propres dépendances (hooks, client CoinGecko, types). Les tokens design sont définis dans [`tailwind.config.ts`](tailwind.config.ts) — il suffit de reprendre cette config (ou ses tokens `si-*`) dans le projet hôte.

---

## Embedding depuis sinvestir.fr (bonus)

Deux pistes pour exposer le simulateur sur le site vitrine sans dupliquer le code :

1. **iframe** — héberger la démo sur Vercel et l'intégrer via `<iframe src="https://…/?embed=1" />`. On masquerait la sidebar et le header via une route dédiée (`showHeader={false}`), pour un rendu « widget » épuré qui s'adapte à la largeur du conteneur.
2. **Script embed** — publier le composant comme bundle autonome (ex. via un Web Component wrapper) injectable par un simple `<script>` + `<div id="sinvestir-crypto">`. Le code étant déjà sans dépendance globale, l'encapsulation est directe.

L'iframe reste la voie la plus rapide et la plus sûre (isolation CSS/JS totale), le script embed la plus intégrée visuellement.

---

## Suggestions partenaire — Mon regard sur simulateurs.sinvestir.fr

Après avoir exploré la suite, voici ce que je proposerais en priorité :

**1. Persistance des simulations sans compte**
Actuellement, sauvegarder une simulation nécessite un compte. Une option "partager via lien"
(URL avec paramètres encodés) permettrait une viralité organique sans friction d'inscription.
Stack : URL params + encoding base64, zéro backend supplémentaire.

**2. Comparateur de scénarios côte à côte**
Pouvoir comparer "Bitcoin DCA mensuel 2020-2023" vs "Ethereum one-shot 2021" sur le même graphique.
Valeur pédagogique forte, correspond à la mission éducative de S'investir.

**3. Assistant IA sur toute la suite, pas juste le simulateur crypto**
L'assistant que j'ai intégré ici est conçu pour être configuré par simulateur (systemPrompt.ts isolé).
Déployé sur l'ensemble de la suite, il pourrait guider les utilisateurs sur les intérêts composés,
l'inflation, le crédit immobilier — avec un contexte spécifique à chaque outil.
Effort : faible (même composant, system prompt différent par route).

**4. Export PDF des simulations**
Les utilisateurs qui font des simulations ont souvent une intention d'action (parler à un CGP,
décider d'un investissement). Un export PDF brandé S'investir de leurs résultats serait un
outil de rétention fort et un vecteur de notoriété.

---

## Auteur

**Jordan Litampha** — Webdesigner & Ingénieur IA
🌐 [lj-design.fr](https://lj-design.fr)

© 2026 Jordan Litampha — LJ Design. Tous droits réservés.
Projet réalisé dans le cadre d'un test technique, publié à des fins de démonstration
et d'évaluation. Voir [LICENSE](LICENSE).
