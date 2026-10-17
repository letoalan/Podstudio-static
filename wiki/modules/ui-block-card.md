# Module `ui-block-card`

## Rôle
carte d'un bloc de la ligne (rail vertical, pastille numérotée, aperçu, lecture, outils si sélectionné).

## Dépendances
- `./dom.js`
- `../core/timeline-math.js`
- `../core/block-model.js`
- `./block-rail.js`
- `./block-tools.js`
- `./block-story-header.js`

## API Publique
- `createBlockCard`

## Tests liés
[`tests/ui-block-card.test.js`](../../tests/ui-block-card.test.js)

## Exemple d'utilisation
```javascript
const card = createBlockCard(block, { rank: 1, color: '#8940fa', isSelected: true, onSelect, onOpen, onUpdate, onDelete });
```
