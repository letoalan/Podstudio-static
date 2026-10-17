# audio/transitions.js

## Rôle
Génération et synthèse de flux audio pour les cartes transitions (pause, balayage whoosh, jingle harmonique, fondu).

## Fonctionnalités
- `renderTransitionBuffer(transition, sampleRate)` : synthétise le signal audio de la transition
- `previewTransition(transition, ctx)` : pré-écoute immédiate via l'AudioContext du navigateur

## Types supportés
- `pause` : silence stérile
- `whoosh` : balayage de fréquence avec souffle
- `jingle` : arpège 3 notes (Do, Mi, Sol)
- `crossfade` : transition fluide
- `fade` : transition avec fondu au noir
