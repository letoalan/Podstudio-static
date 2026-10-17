# Plan d'implémentation v2 — Ligne verticale de blocs numérotés

> Suite de `new.md` (socle livré : modèle, éditeur timeline, rendu). Cette v2 recentre
> l'interface : une **ligne verticale de blocs numérotés et colorés**. Le micro, l'import,
> la bibliothèque et l'éditeur de pistes sont des **outils** qui alimentent ou modifient
> le bloc sélectionné. Le podcast = tous les blocs mis bout à bout.

## 1. Décisions de conception

| Sujet | Décision |
|---|---|
| Identité d'un bloc | **Numéro** (position + 1) et **couleur**. Plus de titre, sous-titre ni type |
| Numérotation | Calculée, jamais stockée : déplacer / insérer / supprimer renumérote |
| Couleur | Palette paramétrable ; mode « cycle » (couleur selon le rang) ou couleur forcée par bloc |
| Rôle du bloc | Conteneur audio neutre (voix, jingle, musique : le contenu décide) |
| Outils | Micro, import, bibliothèque, éditeur : agissent sur le bloc **sélectionné** |
| Sortie | Blocs non vides rendus un par un, concaténés dans l'ordre de la ligne |
| Édition | Toujours facultative : un bloc jamais ouvert dans l'éditeur reste valide |

## 2. Modèle de données (changements sur `core`)

```
Bloc    { id, color: number|string|null, tracks[], clips[], padBefore, padAfter, edited }
Projet  { id, blocks[], settings: { palette: string[], colorMode: 'cycle'|'fixed' }, ... }
```

- `color: null` => couleur dérivée du rang dans la palette (mode cycle).
- `color: number` => index dans la palette ; `string` => couleur libre `#rrggbb`.
- `title`, `subtitle`, `kind` supprimés ; lus puis ignorés à l'import (migration v2 -> v3).
- Aucun maximum de blocs, de pistes ni de couleurs dans la palette (min. 1).

### Modules `core` à modifier / créer
| Fichier | Action |
|---|---|
| `block-model.js` | Retirer titre / type ; ajouter `color` ; `createBlock()` sans nom |
| `palette.js` (nouveau) | Palettes prédéfinies, `colorForBlock(block, rank, palette)`, validation hex, contraste du texte |
| `project.js` | `insertBlockAt`, renumérotation implicite, `getBlockNumber(project, id)` |
| `project-io.js` | Version 3, migration des blocs nommés, palette dans `settings` |
| `settings.js` | Valeurs par défaut `palette` et `colorMode` |
| `level.js` | Outils par niveau : couleur manuelle (intermédiaire+), éditeur de palette (avancé) |

## 3. Interface : la ligne verticale

```
  ①──┌───────────────────────────┐
  │  │ ▂▃▅▇▅▃▂  forme d'onde     │  0:12   ▶
  │  └───────────────────────────┘
  ＋   (insérer un bloc ici)
  ②──┌───────────────────────────┐
  │  │ ▁▂▁▂▇▇▅▃▂▁   (sélectionné)│  0:48   ▶
  │  └───────────────────────────┘
  │        🎤  📁  🎶  ✂️  ⧉  🗑   <- barre d'outils du bloc actif
  ③──┌ vide : « Ajoute un son »  ─┐
```

- **Rail gauche** : trait vertical continu reliant des pastilles rondes numérotées,
  chacune de la couleur du bloc. La pastille sert de poignée de glisser-déposer.
- **Carte** : aperçu en forme d'onde, durée, bouton écoute. Clic = sélection.
- **Bouton ＋ entre deux blocs** : insère un bloc à cet endroit (et en fin de ligne).
- **Barre d'outils du bloc actif** : 🎤 enregistrer, 📁 importer, 🎶 bibliothèque,
  ✂️ éditeur de pistes, ⧉ dupliquer, 🗑 vider / supprimer.
- **Barre globale** : « Tout écouter », durée totale, Exporter, Paramètres.
- Mobile : barre d'outils fixée en bas ; le rail se réduit à la pastille.
- Accessibilité : numéro en texte (pas seulement la couleur), contraste automatique.

## 4. Flux des outils

| Outil | Comportement sur le bloc sélectionné |
|---|---|
| 🎤 Micro | Enregistre, ajoute le clip à la fin ; si le bloc a du contenu : choix « ajouter » ou « remplacer » (confirmation) |
| 📁 Import | Décode le fichier, ajoute un clip (durée réelle lue via `probe.js`) |
| 🎶 Bibliothèque | Ajoute le son choisi, par défaut sur la piste 2 (fond) si la piste 1 est occupée |
| ✂️ Éditeur | Ouvre `editor-shell` plein écran sur ce bloc ; fermer = retour à la ligne, aperçu mis à jour |
| 🗑 | Vider le contenu (confirmation) ou supprimer le bloc |

Règle : un outil ne touche jamais un autre bloc. Aucun bloc sélectionné => outils grisés.

## 5. Génération du podcast

1. Parcours des blocs dans l'ordre ; les blocs vides sont **ignorés** (aucun silence ajouté).
2. `renderBlock()` par bloc (un contexte hors-ligne chacun), puis `concatAudioBuffers()`.
3. Durée totale affichée avant l'export (somme des blocs, paddings inclus).
4. Export WAV ou MP3 (worker LAME existant), puis enregistrement dans Épisodes.
5. « Tout écouter » : lecture séquentielle avec surlignage du bloc en cours sur le rail.

## 6. Paramètres de couleur

- Vue Paramètres > « Couleurs des blocs » : palette de départ de **8 teintes**, modifiable.
- Sélecteurs de couleur natifs (`input[type=color]`), ajout / retrait de teintes, réinitialisation.
- Palettes prédéfinies : Vive (défaut), Pastel, Contraste élevé, Daltonien (Okabe-Ito).
- Mode cycle : le bloc n°*n* prend la teinte *(n-1) mod taille*. Mode fixé : couleur propre au bloc.
- Clic droit / appui long sur une pastille : choisir la couleur de ce bloc (niveau intermédiaire+).
- Palette enregistrée dans `settings` et dans le fichier projet.

## 7. Fichiers `ui` à modifier / créer

| Fichier | Action |
|---|---|
| `ui/block-card.js` | Retirer titre / type ; pastille numérotée ; onde ; sélection |
| `ui/block-list.js` | Rail vertical, boutons ＋ d'insertion, glisser par pastille, renumérotation animée |
| `ui/block-quick.js` | Devient `ui/block-tools.js` : barre d'outils du bloc actif |
| `ui/block-rail.js` (nouveau) | Pastille, trait de liaison, couleur et contraste |
| `ui/palette-editor.js` (nouveau) | Édition de la palette dans Paramètres |
| `ui/views/blocks.js` (nouveau) | Vue principale : ligne + barres ; remplace Studio et Éditeur |
| `ui/router.js` | Vues : Blocs, Épisodes, Paramètres, Guide |
| `styles/blocks.css` | Rail, pastilles, cartes, barre d'outils (< 200 lignes, scinder si besoin) |
| `styles/rail.css` (nouveau) | Trait vertical et animations |
| `main.js` | Monter la vue Blocs (les nouveaux modules ne sont pas encore branchés) |

Les anciens `views/studio.js`, `views/editor.js` et `timeline*.js` sont retirés une fois la
vue Blocs complète ; le visualiseur et `recorder.js` sont réutilisés par l'outil micro.

## 8. Phases

### Phase A — Modèle et palette (`core`)
1. Retirer titre / type de `block-model.js` ; ajouter `color`.
2. `palette.js` + tests (cycle, hex invalide, contraste noir / blanc).
3. `project-io.js` v3 + migration depuis les blocs nommés et l'ancien format `tracks`.
4. Critère : `npm test` vert, aucune fonction > 40 lignes.

### Phase B — Ligne verticale
1. `block-rail.js`, `block-list.js` : numéros, couleurs, insertion ＋, glisser-déposer.
2. Sélection d'un bloc, état vide, renumérotation après déplacement.
3. Tests DOM : 1 000 blocs sans lenteur (rendu virtualisé au-delà de 100 blocs).

### Phase C — Outils sur le bloc actif
1. `block-tools.js` : micro (avec visualiseur), import, bibliothèque.
2. Intégrer `library.js` en panneau latéral / feuille mobile.
3. Confirmations « remplacer / ajouter » et « vider ».

### Phase D — Éditeur de pistes comme outil
1. Ouvrir `editor-shell` depuis la barre d'outils ; retour à la ligne.
2. Brancher `BlockPlayer` (lecture du bloc seul) et les buffers décodés à la demande.
3. Marquer `edited: true` ; recalculer l'aperçu du bloc à la fermeture.

### Phase E — Génération et lecture globale
1. Lecture « Tout écouter » séquentielle avec surlignage.
2. Export : `renderProject` + encodeur ; durée totale ; sauvegarde en Épisodes.
3. Test d'intégration : 3 blocs -> durée et ordre exacts.

### Phase F — Paramètres de couleur
1. `palette-editor.js`, palettes prédéfinies, mode cycle / fixé.
2. Couleur par bloc (niveau intermédiaire+), contraste automatique.

### Phase G — Persistance et niveaux
1. Autosave 30 s (`autosave.js`) sur IndexedDB ; restauration à l'ouverture.
2. Fichier projet v3 ; niveaux Simple / Intermédiaire / Avancé appliqués à la barre d'outils.

### Phase H — Nettoyage et PWA
1. Suppression des vues et modules obsolètes (+ pages wiki correspondantes).
2. Guide mis à jour, Lighthouse, tests iOS / Android (micro, glisser tactile).

## 9. Niveaux d'interface appliqués

| Niveau | Visible |
|---|---|
| Simple | Ligne, ＋, 🎤, 📁, 🎶, écoute, export ; couleurs automatiques |
| Intermédiaire | + ✂️ éditeur (2 pistes), ⧉, couleur par bloc, volume / fondus |
| Avancé | + pistes illimitées, copier / coller, raccourcis, éditeur de palette complet |

## 10. Règles qualité (inchangées)

- 200 lignes max par fichier (ajouter `plan.md` à `scripts/check-lines.mjs`), 40 lignes max par fonction.
- Une page wiki par fichier source ; `npm run ci` vert avant chaque fin de phase.
- Dépendances `ui -> audio -> core`, aucun cycle.

## 11. Risques et parades

| Risque | Parade |
|---|---|
| Couleur seule non lisible (daltonisme) | Numéro toujours affiché ; palette Okabe-Ito |
| Longue ligne (centaines de blocs) | Virtualisation de la liste, ondes calculées à l'affichage |
| Perte de contenu en vidant un bloc | Confirmation + historique annuler / rétablir au niveau projet |
| Micro iOS (Safari) | Format de repli et test précoce en phase C |
| Mémoire audio | Décodage du seul bloc actif, blobs conservés en IndexedDB |
| Projets existants avec titres | Migration silencieuse : titres ignorés, numéros attribués |

## 12. Décisions prises

1. Bloc vide : **ignoré** à l'export ; l'icône 🗑 le retire de la ligne.
2. Pas de note ni de nom par bloc : numéro et couleur uniquement.
3. Palette par défaut : **8 teintes**.
