# Module `ui-block-list`

## Rôle
Ligne verticale des blocs numérotés et transitions (rail, insertion via capsule interactive avec options "Nouveau bloc" et "Transition", sélection, glisser-déposer).

## Dépendances
- `./dom.js`
- `../core/block-model.js`
- `../core/transition-model.js`
- `../core/project.js`
- `./block-card.js`
- `./transition-card.js`

## API Publique
- `mountBlockList(container, deps)` : monte la liste verticale des cartes et slots d'insertion.

## Interaction Capsule d'Insertion
- Déclencheur central `＋` avec rotation animée.
- Déploiement des ailes latérales au survol (hover) ou au clic (sélection tactile).
- Aile gauche : "Nouveau bloc" (insère un bloc audio).
- Aile droite : "Transition" (insère une transition entre blocs).

## Tests liés
[`tests/ui-block-list.test.js`](../../tests/ui-block-list.test.js)

## Exemple d'utilisation
```javascript
mountBlockList(container, { project, selectedBlockId, onChange, onSelect, onOpenEditor });
```
