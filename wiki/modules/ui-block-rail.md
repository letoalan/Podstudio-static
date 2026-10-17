# Module `ui-block-rail`

## Rôle
pastille numérotée et segment de rail vertical pour un bloc de podcast.

## Dépendances
- `./dom.js`
- `../core/palette.js`

## API Publique
- `createBlockBadge`
- `createBlockRail`

## Tests liés
[`tests/ui-block-rail.test.js`](../../tests/ui-block-rail.test.js)

## Exemple d'utilisation
```javascript
const rail = createBlockRail({ rank: 1, color: '#8940fa', isFirst: true, isLast: false, onSelect });
```
