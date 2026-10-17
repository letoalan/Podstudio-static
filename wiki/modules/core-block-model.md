# Module `core-block-model`

## Rôle
fabrique et validation du modèle de bloc (couleur, 2 pistes par défaut, clips) ; un bloc n'a ni nom ni type.

## Dépendances
- `./palette.js`

## API Publique
- `generateId`
- `createDefaultTracks`
- `createClip`
- `createBlock`
- `validateBlock`
- `isBlockEmpty`
- `getBlockContentDuration`
- `getBlockTotalDuration`

## Tests liés
[`tests/core-block-model.test.js`](../../tests/core-block-model.test.js)

## Exemple d'utilisation
```javascript
const block = createBlock({ color: '#ff0055' }); isBlockEmpty(block); // true
```
