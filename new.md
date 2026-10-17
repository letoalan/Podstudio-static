# Plan d'implémentation — PodStudio Blocs (Vite.js)

> Refonte de PodStudio Static (voir `fonctionnement.md`) : une pile **verticale de blocs**
> illimités. Un clic sur un bloc ouvre son **éditeur timeline** (comme la version actuelle).
> L'édition est **facultative** : l'interface s'adapte au niveau de l'utilisateur.
> Inspiration : Mon P'tit Podcast (blocs voix / jingle, rognage, export, sauvegarde projet).

## 1. Règles imposées

| # | Règle | Contrôle |
|---|---|---|
| R1 | Stack : **Vite.js** (JS ES modules), tests Vitest | `package.json` |
| R2 | **200 lignes maximum par fichier** (code, CSS, tests, wiki, ce plan) | `scripts/check-lines.mjs` |
| R3 | Fonction de 40 lignes maximum | ESLint `max-lines-per-function` |
| R4 | **Doc wiki pour chaque fichier produit** | `scripts/check-wiki.mjs` |
| R5 | Modularisation, dépendances à sens unique | ESLint `import/no-cycle` |

Fichier terminé = code < 200 lignes + test + page wiki + lint vert.

## 2. Concept : bloc + timeline interne

Le projet est une liste verticale de blocs. Chaque bloc contient sa propre mini-timeline.

| Propriété du bloc | Description |
|---|---|
| `id`, `title`, `subtitle`, `color` | identité |
| `kind` | `voice`, `jingle`, `music`, `import` (extensible) |
| `tracks[]` | **2 pistes au départ**, bouton « + » pour en ajouter |
| `clips[]` | `{ trackId, sourceId, start, offset, duration, gain, fadeIn, fadeOut }` |
| `edited` | `false` tant que l'utilisateur n'a pas ouvert l'éditeur |
| `padBefore`, `padAfter` | silences autour du bloc |

Règles :
- Nombre de blocs **et** de pistes illimité (aucune constante de maximum).
- Un bloc vide ou jamais édité reste rendu tel quel : **l'édition n'est jamais obligatoire**.
- Éditer un bloc ne modifie jamais les autres.
- Le rendu d'un bloc = mixage de ses pistes ; la sortie finale = blocs mis bout à bout.

## 3. Interface progressive (3 niveaux)

| Niveau | Public | Ce qui est visible |
|---|---|---|
| Simple | élèves, débutants | pile de blocs, enregistrer, importer, rogner par poignées, ajouter jingle |
| Intermédiaire | usage courant | + éditeur timeline au clic, 2 pistes, bibliothèque, volume, fondus |
| Avancé | projets complexes | + pistes illimitées, couper / copier / coller, raccourcis, zoom, multi-sélection |

- Le niveau est un réglage (Paramètres) mémorisé ; il masque ou affiche des outils, jamais des données.
- Un projet reste ouvrable à tous les niveaux.
- Suggestion automatique : proposer le niveau supérieur si le bloc dépasse 2 pistes ou 5 clips.

## 4. Outils de l'éditeur timeline (par bloc)

- Ajouter un son depuis la bibliothèque (glisser-déposer ou bouton +).
- Déplacer un clip, changer de piste.
- Trimer (poignées gauche / droite).
- Couper (split à la tête de lecture), supprimer.
- Copier / coller (presse-papiers interne, collage à la tête de lecture).
- Volume, fondus, mute / solo par piste.
- Annuler / rétablir (pile d'historique par bloc).
- Lecture du bloc seul, ou « à partir de ce bloc ».

## 5. Structure du dépôt

```
podstudio/
├─ index.html, vite.config.js, package.json
├─ scripts/        # check-lines.mjs, check-wiki.mjs
├─ src/
│  ├─ main.js
│  ├─ core/        # logique pure, sans DOM
│  │  ├─ block-model.js     # fabrique + validation (2 pistes par défaut)
│  │  ├─ project.js         # liste de blocs : add/move/remove/duplicate
│  │  ├─ clip-ops.js        # split, trim, move, delete (fonctions pures)
│  │  ├─ clipboard.js       # copier / coller interne
│  │  ├─ history.js         # annuler / rétablir
│  │  ├─ timeline-math.js   # px <-> secondes, graduations
│  │  ├─ level.js           # niveaux d'interface et outils visibles
│  │  ├─ project-io.js      # export / import du fichier projet
│  │  ├─ db.js, storage.js  # IndexedDB, blobs, quota
│  │  ├─ autosave.js        # sauvegarde différée (30 s)
│  │  ├─ settings.js, rss.js
│  ├─ audio/
│  │  ├─ recorder.js        # capture micro
│  │  ├─ decode.js          # décodage à la demande + cache LRU
│  │  ├─ block-player.js    # lecture multipiste d'un bloc
│  │  ├─ block-render.js    # OfflineAudioContext par bloc
│  │  ├─ concat.js, wav.js
│  │  └─ encoder.worker.js  # MP3 (LAME)
│  ├─ ui/
│  │  ├─ router.js
│  │  ├─ block-list.js      # pile verticale + glisser-déposer
│  │  ├─ block-card.js      # carte du bloc (aperçu, clic = éditeur)
│  │  ├─ block-quick.js     # outils simples (enregistrer, importer)
│  │  ├─ editor/
│  │  │  ├─ editor-shell.js   # panneau / modale de l'éditeur
│  │  │  ├─ track-view.js     # une piste
│  │  │  ├─ clip-view.js      # une brique + poignées de trim
│  │  │  ├─ ruler.js, playhead.js, toolbar.js
│  │  │  └─ shortcuts.js      # Ctrl+C / V / X, S (split), Suppr
│  │  ├─ sound-library.js, waveform.js, visualizer.js
│  │  ├─ episodes.js, views/
│  └─ styles/       # variables, layout, blocks, editor, responsive
├─ tests/           # un test par module
├─ wiki/            # une page par fichier + pages transverses
└─ .github/workflows/
```

Scinder tout fichier dès 180 lignes.

## 6. Architecture en couches

```
ui  ->  audio  ->  core
```

`core` reste pur (testable en Node). `ui` communique par `EventTarget` (`block:changed`, `clip:selected`).

## 7. Phases de réalisation

### Phase 0 — Socle et garde-fous
Projet Vite, Vitest, ESLint, scripts `check-lines` / `check-wiki`, wiki initial, CI.

### Phase 1 — Modèle (`core`)
1. `block-model.js` : bloc avec 2 pistes, `edited: false`.
2. `project.js` : opérations immuables sur la liste (test à 1 000 blocs).
3. `clip-ops.js`, `clipboard.js`, `history.js` : tests unitaires complets.
4. `level.js` : table niveau -> outils.

### Phase 2 — Stockage
`db.js`, `storage.js` (blobs par source), `autosave.js`, `project-io.js`.

### Phase 3 — Pile de blocs
1. Design system dark studio, layout, mobile (barre basse).
2. `block-list.js`, `block-card.js` : + bloc, glisser-déposer, renommage, suppression.
3. `block-quick.js` : enregistrer, importer, jingle, sans ouvrir l'éditeur.

### Phase 4 — Éditeur timeline par bloc
1. `editor-shell.js` ouvert au clic sur la carte ; fermeture = retour à la pile.
2. `track-view.js` : 2 pistes, bouton « + » pour en ajouter.
3. `clip-view.js` : déplacement, trim, changement de piste.
4. `toolbar.js` + `shortcuts.js` : couper, copier, coller, annuler.
5. `sound-library.js` : ajout de sons dans la timeline.
6. `block-player.js` : lecture multipiste, volume, fondus, mute / solo.
7. Marquer `edited: true` à la première modification.

### Phase 5 — Niveaux d'interface
Sélecteur de niveau, masquage des outils, suggestion automatique, tests DOM.

### Phase 6 — Rendu et export
`block-render.js` (un contexte par bloc), `concat.js`, `wav.js`, MP3 worker,
durée totale avant export, `episodes.js`, `rss.js`.

### Phase 7 — PWA et déploiement
Manifest, service worker, test hors ligne, GitHub Pages, Lighthouse, tests iOS / Android.

### Phase 8 — Options
Fondu enchaîné entre blocs, modèles de projet, vue d'ensemble horizontale.

## 8. Risques et parades

| Risque | Parade |
|---|---|
| Mémoire (blocs et pistes infinis) | Blobs en IndexedDB, décodage du seul bloc ouvert |
| Rendu long | Un contexte par bloc, puis concaténation |
| Liste longue | Affichage virtualisé, formes d'onde à l'affichage |
| Complexité de l'éditeur | Niveaux progressifs, outils masqués par défaut |
| Perte de travail | Autosave + fichier projet + historique |
| Safari iOS | Tester `MediaRecorder` tôt, format de repli |

## 9. Tests et wiki

- Unitaire : `block-model`, `project`, `clip-ops`, `clipboard`, `history`, `timeline-math`, `level`, `rss`.
- Stockage : `fake-indexeddb`. DOM : jsdom. Audio : mocks Web Audio.
- Wiki : `wiki/modules/<nom>.md` par fichier (rôle, API, dépendances, tests, exemple).
- Pages transverses : Architecture, Modèle de bloc, Niveaux d'interface, Contribution, Décisions.
- Chaque phase se termine par : tests verts, wiki à jour, `npm run check` réussi.
