# Plan d'implémentation — PodStudio (Vite.js)

> Réécriture de PodStudio Static (voir `fonctionnement.md`) sous Vite.js, en respectant les règles du projet.

## 1. Règles imposées

| # | Règle | Contrôle |
|---|---|---|
| R1 | Stack : **Vite.js** (JS ES modules, Vitest pour les tests) | `package.json` |
| R2 | **200 lignes maximum par fichier** : code, CSS, tests, pages wiki, ce plan | `scripts/check-lines.mjs` |
| R3 | Fonction de 40 lignes maximum | ESLint `max-lines-per-function` |
| R4 | **Doc wiki pour chaque fichier produit** (une page par module) | `scripts/check-wiki.mjs` |
| R5 | Modularisation : une responsabilité par fichier, dépendances à sens unique | revue + tests |

Définition de « terminé » pour tout fichier : code < 200 lignes, test associé, page wiki créée, lint vert.

## 2. Objectifs fonctionnels (hérités de l'existant)

- Enregistrer la voix au micro (MediaRecorder + visualiseur canvas).
- Importer des fichiers `.mp3` / `.wav` dans une bibliothèque.
- Monter plusieurs pistes sur une timeline (offset, volume, fondus).
- Exporter un MP3 128 kbps (OfflineAudioContext + Web Worker LAME).
- Gérer les épisodes et générer un flux RSS 2.0 / iTunes.
- Fonctionner hors ligne (PWA) ; données 100 % locales (IndexedDB).
- Évolution prévue : timeline extensible type CapCut, pistes musique + voix, synchronisation audio.

## 3. Structure du dépôt

```
podstudio/
├─ index.html
├─ vite.config.js            # base: '/<repo>/', plugin PWA, test Vitest
├─ package.json              # scripts: dev, build, test, lint, check
├─ scripts/
│  ├─ check-lines.mjs        # échoue si un fichier > 200 lignes
│  └─ check-wiki.mjs         # échoue si un module n'a pas sa page wiki
├─ src/
│  ├─ main.js                # point d'entrée (orchestration)
│  ├─ core/                  # logique pure, sans DOM
│  │  ├─ db.js               # IndexedDB bas niveau
│  │  ├─ storage.js          # façade recordings / episodes
│  │  ├─ settings.js         # métadonnées (localStorage)
│  │  ├─ rss.js              # génération RSS
│  │  └─ timeline-math.js    # px <-> secondes, graduations
│  ├─ audio/
│  │  ├─ recorder.js         # capture micro
│  │  ├─ mixer.js            # lecture multipiste
│  │  ├─ render.js           # OfflineAudioContext
│  │  └─ encoder.worker.js   # encodage MP3
│  ├─ ui/
│  │  ├─ router.js           # navigation des vues
│  │  ├─ library.js          # panneau bibliothèque
│  │  ├─ visualizer.js       # canvas onde
│  │  ├─ timeline.js         # rendu + drag & drop
│  │  ├─ episodes.js         # liste des épisodes
│  │  └─ views/              # guide, studio, editor, settings
│  └─ styles/
│     ├─ variables.css       # tokens (dark studio)
│     ├─ layout.css          # grille, sidebar, bottom nav
│     ├─ components.css      # boutons, cartes, clips
│     └─ responsive.css      # mobile / tablette / desktop
├─ tests/                    # un fichier de test par module
├─ wiki/                     # une page par fichier + pages transverses
└─ .github/workflows/        # lint, test, build, deploy
```

Si un fichier approche 180 lignes, on le scinde avant de continuer.

## 4. Architecture en couches

```
ui  ->  audio  ->  core
```

- `core` ne connaît ni le DOM ni Web Audio : testable en Node.
- `audio` dépend de `core`, jamais de `ui`.
- `ui` dépend des deux et orchestre via des événements simples (`EventTarget`).
- Aucune dépendance circulaire (vérifiée par `eslint-plugin-import`).

## 5. Phases de réalisation

### Phase 0 — Socle et garde-fous
1. `npm create vite@latest` (vanilla), Vitest, ESLint.
2. Écrire `check-lines.mjs` et `check-wiki.mjs`, brancher `npm run check`.
3. Créer le wiki initial : `Home`, `Architecture`, `Règles`, `Journal-décisions`.
4. Workflow CI : lint -> test -> check -> build.

Livrable : dépôt vide mais vert en CI.

### Phase 1 — Données (`core`)
1. `db.js` : ouverture `PodcastStudioDB`, magasins `recordings` et `episodes`.
2. `storage.js` : `save/list/rename/delete` + estimation de quota.
3. `settings.js` : lecture, écriture, valeurs par défaut.
4. Tests avec `fake-indexeddb`.

### Phase 2 — Interface et design system
1. `variables.css` : palette `#080810`, `#8940fa`, `#ff0055`, `#22d3a5`, police Inter.
2. `layout.css` + `responsive.css` : sidebar desktop, bottom nav mobile.
3. `router.js` : 5 vues (Guide, Studio, Éditeur, Épisodes, Paramètres).
4. Vue Paramètres + jauge de stockage (première vue complète).

### Phase 3 — Enregistrement et bibliothèque
1. `recorder.js` : start / pause / stop, sauvegarde du Blob.
2. `visualizer.js` : onde via `AnalyserNode`, 60 FPS.
3. `library.js` : import, pré-écoute, renommage, suppression, bottom sheet mobile.

### Phase 4 — Montage multipiste
1. `timeline-math.js` : conversion px/secondes, pas de graduation variable (testé).
2. `mixer.js` : `addTrack`, `play`, `stop`, volume, fondus (`GainNode`).
3. `timeline.js` : briques colorées, drag & drop, tête de lecture.
4. Pistes multiples (voix / musique) et zoom de la timeline.

### Phase 5 — Export et publication
1. `render.js` : rendu `OfflineAudioContext`.
2. `encoder.worker.js` : Float32 -> Int16 -> MP3 (LAME, blocs de 1152).
3. `episodes.js` : lecteur, téléchargement, suppression.
4. `rss.js` : flux `podcast.xml` (balises `itunes:*`, `enclosure`).

### Phase 6 — PWA et déploiement
1. Plugin PWA (manifest + service worker), test hors ligne.
2. `base` de Vite adapté au dépôt ; workflow GitHub Pages.
3. Audit Lighthouse, tests manuels iOS / Android / desktop.

## 6. Stratégie de tests

| Niveau | Outil | Cibles |
|---|---|---|
| Unitaire | Vitest | `timeline-math`, `rss`, `settings`, `storage` |
| DOM | Vitest + jsdom | `router`, `library`, vues |
| Audio | mocks Web Audio | `mixer`, `render`, `recorder` |
| Manuel | navigateurs réels | micro, export MP3, hors ligne |

## 7. Documentation wiki (règle R4)

- Une page par fichier : `wiki/modules/<nom>.md`, générée depuis un modèle.
- Contenu type : rôle, API publique (fonctions, paramètres), dépendances, tests liés, exemple.
- Pages transverses : Architecture, Règles de contribution, Journal des décisions, Guide utilisateur.
- `check-wiki.mjs` compare `src/**` et `wiki/modules/**` et échoue s'il manque une page.
- Publication : dossier `wiki/` recopié vers le wiki GitHub par la CI.

## 8. Risques et décisions

- LAME : charger `lamejs` en module dans le worker plutôt qu'en script global.
- Quota IndexedDB : avertir l'utilisateur au-delà de 80 % d'usage.
- Safari iOS : `MediaRecorder` limité -> prévoir un format de repli et le tester tôt.
- Fichiers qui grossissent : scinder dès 180 lignes (règle R2).

## 9. Ordre de livraison conseillé

Phase 0 -> 1 -> 2 -> 3 -> 4 -> 5 -> 6. Chaque phase se termine par : tests verts, wiki à jour, `npm run check` réussi.
