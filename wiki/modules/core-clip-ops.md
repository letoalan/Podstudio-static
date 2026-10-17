# Module `core-clip-ops`

## Rôle
opérations pures de manipulation des clips audio (déplacement, rognage début/fin, scission, suppression).

## Dépendances
- `./block-model.js`

## API Publique
- `moveClip`
- `trimClipStart`
- `trimClipEnd`
- `splitClip`
- `deleteClip`
- `updateClip`

## Tests liés
[`tests/core-clip-ops.test.js`](../../tests/core-clip-ops.test.js)

## Exemple d'utilisation
```javascript
const [c1, c2] = splitClip(clip, 4.5); const moved = moveClip(clip, { start: 2 });
```
