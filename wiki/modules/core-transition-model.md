# core/transition-model.js

## Rôle
Modèle et fabrique de cartes transitions insérées entre les blocs de la timeline verticale.

## Types de transitions
- `crossfade` : Fondu enchaîné (superposition douce)
- `pause` : Silence / Pause
- `whoosh` : Balayage sonore dynamique
- `jingle` : Virgule sonore mélodique
- `fade` : Fondu au noir (Fade Out / Fade In)

## API exportée
- `TRANSITION_TYPES` : liste des presets disponibles
- `getTransitionMeta(type)` : métadonnées d'un type
- `normalizeTransition(raw)` : validation et valeurs par défaut
- `createTransitionBlock(props)` : instanciation d'un bloc transition
- `isTransitionBlock(block)` : vérification de type
