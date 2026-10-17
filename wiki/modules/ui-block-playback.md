# ui/block-playback.js

## Rôle
Gestion de la lecture audio pour la vue des cartes verticales (lecture d'un bloc isolé avec pré-chargement des tampons, ou lecture séquentielle de tous les blocs actifs).

## API exportée
- `stopPlayback(state, player, render)` : stoppe toute lecture en cours
- `togglePlayBlock(block, deps)` : démarre ou arrête l'écoute d'un bloc spécifique
- `togglePlayAll(project, deps)` : enchaîne la lecture de tous les blocs actifs

## Dépendances
- `src/core/block-model.js`
- `src/core/project.js`
- `src/audio/block-render.js`
- `src/ui/toast.js`
