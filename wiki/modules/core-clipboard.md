# Module `core-clipboard`

## Rôle
gestion pure du presse-papier interne (copier, couper, coller des clips audio avec conservation des décalages relatifs).

## Dépendances
- `./block-model.js`

## API Publique
- `createClipboard`
- `copyClips`
- `cutClips`
- `pasteClips`
- `hasClips`

## Tests liés
[`tests/core-clipboard.test.js`](../../tests/core-clipboard.test.js)

## Exemple d'utilisation
```javascript
const clipb = copyClips([clip]); const nextBlock = pasteClips(clipb, block, 'track-1', 5.0);
```
