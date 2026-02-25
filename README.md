# WARLEVEL — Solo Leveling IRL

Système de progression quotidien. Offline-first. Installable PWA.

---

## Prérequis

- **Node.js** 18 ou supérieur — [nodejs.org](https://nodejs.org)
- **npm** (inclus avec Node.js)
- Un terminal (Terminal sur Mac, cmd/PowerShell sur Windows)

---

## Installation

```bash
cd warlevel
npm install
```

---

## Générer les icônes PWA

À faire une seule fois après `npm install` :

```bash
npm run icons
```

Cela crée `public/icons/icon-192.png` et `public/icons/icon-512.png`.

---

## Lancer en développement

```bash
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000) dans un navigateur.

> Note : En mode développement, le service worker PWA est désactivé pour éviter les problèmes de cache. Pour tester l'offline, utiliser le build de production.

---

## Build de production

```bash
npm run build
npm start
```

Ouvrir [http://localhost:3000](http://localhost:3000).

---

## Déployer sur Vercel (recommandé)

1. Créer un compte sur [vercel.com](https://vercel.com)
2. Installer Vercel CLI : `npm i -g vercel`
3. Dans le dossier du projet : `vercel`
4. Suivre les instructions. Vercel détecte automatiquement Next.js.

Ou via GitHub :
1. Pousser le repo sur GitHub
2. Importer sur [vercel.com/new](https://vercel.com/new)
3. Déploiement automatique à chaque push.

---

## Installer comme PWA sur iOS

1. Ouvrir l'URL de l'app dans **Safari** (pas Chrome)
2. Taper l'icône **Partager** (rectangle avec flèche)
3. Sélectionner **"Sur l'écran d'accueil"**
4. Confirmer → L'app apparaît sur l'écran d'accueil

L'app fonctionne en mode standalone (plein écran, sans barre Safari).

---

## Installer comme PWA sur Android

1. Ouvrir l'URL dans **Chrome**
2. Le bandeau d'installation apparaît automatiquement
   — ou — taper le menu ⋮ → **"Installer l'application"**
3. Confirmer → L'app apparaît sur l'écran d'accueil

---

## Test offline

1. Lancer le build de production : `npm run build && npm start`
2. Ouvrir [http://localhost:3000](http://localhost:3000)
3. Attendre que la page charge complètement
4. Dans les DevTools → Application → Service Workers → vérifier que le SW est actif
5. Cocher "Offline" dans DevTools → Network
6. Naviguer entre les pages : tout fonctionne
7. Créer un scan, une quête, un incident → tout est sauvegardé localement (IndexedDB)

---

## Export / Import des données

### Exporter

1. Aller dans `/settings` (icône engrenage en bas)
2. Bouton **"EXPORTER JSON"**
3. Fichier téléchargé : `warlevel-export-YYYY-MM-DD.json`

### Importer

1. Aller dans `/settings`
2. Bouton **"IMPORTER JSON"** → sélectionner le fichier exporté
3. Les données sont restaurées immédiatement

Le fichier d'export contient toutes les tables : profil, progression, stats, logs, quêtes, incidents, suggestions d'évolution.

Un exemple de fichier d'export est disponible dans `sample-export.json`.

---

## Architecture

```
warlevel/
├── app/                        # Next.js App Router pages
│   ├── home/page.tsx           # Dashboard principal
│   ├── scan/page.tsx           # Daily Scan (15 secondes)
│   ├── autopilot/page.tsx      # Vue simplifiée + Salvage
│   ├── quests/page.tsx         # Toutes les quêtes du jour
│   ├── incident/page.tsx       # Capture d'incident
│   ├── evolution/page.tsx      # Suggestions de l'observateur
│   └── settings/page.tsx       # Paramètres + export/import
│
├── components/                 # Composants React
│   ├── AutoModeBadge.tsx       # Badge NORMAL/SALVAGE/RECOVERY/BRUTAL
│   ├── CorruptionBar.tsx       # Barre de corruption 0-100
│   ├── LevelDisplay.tsx        # Niveau JP + FR + XP
│   ├── Navigation.tsx          # Navigation bas de page (mobile)
│   ├── QuestCard.tsx           # Carte quête avec actions DONE/FAIL/SKIP
│   ├── QuickPingModal.tsx      # Modal Quick Ping (4 boutons)
│   └── StatBar.tsx             # Barre de stat individuelle
│
├── lib/
│   ├── db/
│   │   ├── schema.ts           # Dexie DB (18 tables)
│   │   ├── seed.ts             # Données initiales (niveaux, quêtes, artefacts...)
│   │   └── index.ts            # Initialisation DB + seeding
│   │
│   ├── engine/
│   │   ├── autoMode.ts         # Machine à états NORMAL/SALVAGE/RECOVERY/BRUTAL
│   │   ├── corruptionEngine.ts # Deltas de corruption (locked)
│   │   ├── evolutionObserver.ts # Observateur passif (jamais auto-modifie)
│   │   ├── graceTokens.ts      # 2 tokens/mois, reset mensuel
│   │   ├── levelEngine.ts      # Conditions de level up
│   │   ├── questGeneration.ts  # Génération déterministe des quêtes
│   │   ├── salvagePlanner.ts   # Plan Salvage (3 quêtes précises)
│   │   └── xpEngine.ts         # Formules XP (locked)
│   │
│   ├── export/
│   │   ├── exportJSON.ts       # Export full DB
│   │   └── importJSON.ts       # Import + validation Zod
│   │
│   ├── hooks/
│   │   └── useDB.ts            # React hooks pour DB
│   │
│   ├── utils/
│   │   ├── dates.ts            # Utilitaires date (pas de librairie externe)
│   │   └── deterministic.ts    # RNG déterministe + generateId
│   │
│   └── types.ts                # Tous les types TypeScript
│
├── public/
│   ├── manifest.json           # PWA manifest
│   └── icons/                  # Icônes générées par npm run icons
│
├── scripts/
│   └── create-icons.mjs        # Générateur d'icônes (pur Node.js)
│
├── ACCEPTANCE_TESTS.md         # Checklist des tests d'acceptance
├── sample-export.json          # Exemple de fichier d'export
└── README.md                   # Ce fichier
```

---

## Stack technique

| Technologie | Rôle |
|-------------|------|
| Next.js 14 (App Router) | Framework React |
| TypeScript | Typage statique |
| TailwindCSS | Styles mobile-first dark |
| Dexie (IndexedDB) | Persistance offline |
| Zod | Validation import JSON |
| @ducanh2912/next-pwa | Service worker + PWA |

---

## Système de jeu

### Niveaux (10 niveaux verrouillés)

| L | JP | FR | XP seuil |
|---|----|----|----------|
| 1 | 目覚め | Éveil | 0 |
| 2 | 影歩き | Marcheur de l'ombre | 120 |
| 3 | 規律者 | Discipliné | 300 |
| 4 | 執行者 | Exécuteur | 520 |
| 5 | 支配者 | Dominant | 800 |
| 6 | 戦略家 | Stratège | 1150 |
| 7 | 覚醒王 | Roi éveillé | 1550 |
| 8 | 異端者 | Anomalie | 1950 |
| 9 | 深淵王 | Roi de l'abîme | 2400 |
| 10 | 戦神 | Dieu de guerre | 2900 |

### Auto Modes

| Mode | Déclencheur |
|------|-------------|
| NORMAL | État par défaut |
| SALVAGE | Après 10:30 sans entraînement |
| RECOVERY | Énergie ≤ 2, incident sévère ≥ 4, corruption ≥ 70 |
| BRUTAL | 2 jours consécutifs sans training + 3+ quêtes sautées |

### Corruption

| Action | Delta |
|--------|-------|
| Entraînement raté | +8 |
| Shutdown raté | +5 |
| Quête échouée | +4 |
| Quête sautée | +3 |
| Boss raté | +15 |
| Entraînement fait | -10 |
| Shutdown fait | -6 |
| Récupération faite | -12 |

---

## Phase 2 (stubs — non implémenté en V1)

- Export CSV (bouton désactivé dans `/settings`)
- Notion integration
- Meta Graph API
- Instagram analysis (aucun scraping)
- Boss fight UX polish
- Content engine
- Idea engine

---

## Signature

*Je sais donc je suis.*
