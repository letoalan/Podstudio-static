# Architecture technique de PodStudio

PodStudio est structuré selon une architecture en couches unidirectionnelle stricte :

```
UI (Vues, Éléments DOM, Canvas)
  │
  ▼
Audio (Capture micro, Mixage temps réel, OfflineAudioContext, Encodage MP3)
  │
  ▼
Core (IndexedDB, Storage, Calculs Timeline, Flux RSS, Bus d'événements)
```

## 1. Couche `core`

- **Indépendance totale** : Aucun accès direct au DOM ni à l'API Web Audio.
- **Testabilité** : Directement testable sous Node / Vitest sans émulateurs lourds.
- **Responsabilités** :
  - `db.js` : Gestion IndexedDB bas niveau.
  - `storage.js` : Gestion des entités (enregistrements et épisodes).
  - `settings.js` : Configuration globale dans `localStorage`.
  - `timeline-math.js` : Fonctions pures de conversion temps <-> pixels.
  - `rss.js` : Sérialisation XML pour podcasts.
  - `bus.js` : Bus de publication/abonnement léger et découplé.

## 2. Couche `audio`

- Dépend uniquement de `core`.
- **Composants clés** :
  - `recorder.js` : Flux `MediaRecorder` + analyseur pour retour visuel.
  - `mixer.js` : Gestion multipiste temps réel avec `GainNode` et `AudioBufferSourceNode`.
  - `envelope.js` : Calcul et application des courbes d'atténuation (fade-in / fade-out).
  - `render.js` : Rendu ultra-rapide non-bloquant sur `OfflineAudioContext`.
  - `mp3-encoder.js` & `encoder.worker.js` : Encodage LAME dans un Web Worker dédié.

## 3. Couche `ui`

- Orchestre l'interface en réagissant aux événements émis par le bus et les modules audio.
- Manipulation du DOM sans frameworks lourds via des helpers sûrs (`dom.js`).
- Gestion de 5 vues principales : Guide, Studio, Éditeur, Épisodes, Paramètres.
