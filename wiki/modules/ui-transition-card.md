# ui/transition-card.js

## Rôle
Composant d'interface pour la carte transition affichée dans la timeline verticale entre deux cartes de blocs.

## Fonctionnalités
- Choix du type de transition (fondu enchaîné, silence, whoosh, jingle, fondu au noir)
- Curseur de durée ajustable (0.2s à 5.0s)
- Bouton de pré-écoute audio en direct
- Bouton de suppression de la transition
- Glisser-déposer pour réordonner

## Dépendances
- `src/core/transition-model.js`
- `src/audio/transitions.js`
- `src/ui/dom.js`
