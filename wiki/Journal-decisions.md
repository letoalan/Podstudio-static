# Journal des décisions architecturales (ADR)

## ADR 01 — Migration de Vanilla SPA vers Vite.js
- **Contexte** : L'ancienne version comportait des fichiers monolithiques difficiles à tester et à maintenir.
- **Décision** : Adopter Vite.js avec des modules ES natifs et Vitest.
- **Conséquence** : Temps de build quasi-instantané, isolation des modules et tests unitaires fiables.

## ADR 02 — Encodage MP3 dans un Web Worker
- **Contexte** : L'encodage LAME d'un mix multipiste bloque le thread principal de l'interface utilisateur.
- **Décision** : Déporter tout l'encodage Float32 -> Int16 -> MP3 dans un Web Worker dédié (`src/audio/encoder.worker.js`) communiquant par transferts de ArrayBuffer.
- **Conséquence** : Interface fluide à 60 FPS pendant l'export avec progression en temps réel.

## ADR 03 — Architecture en couches sans framework lourd
- **Contexte** : React ou Vue introduisent des dépendances externes volumineuses et des cycles de vie complexes pour les flux audio.
- **Décision** : Utiliser un micro-helper DOM pur (`src/ui/dom.js`) combiné à un bus d'événements interne (`src/core/bus.js`).
- **Conséquence** : Empreinte finale inférieure à 40 kB gzip, chargement immédiat en PWA.

## ADR 04 — Règle stricte des 200 lignes
- **Contexte** : Risque constant de dérive vers des composants spaghetti.
- **Décision** : Plafonner chaque fichier à 200 lignes maximum avec découpage systématique (ex: inspecteur, drop, règle, curseur).
- **Conséquence** : Fichiers lisibles d'un seul coup d'œil, réutilisables et faciles à tester unitairement.
