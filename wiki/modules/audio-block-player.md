# Module `audio-block-player`

## Rôle
moteur de lecture multipiste d'un bloc avec gestion du volume, fondus, mute et solo.

## Dépendances
- `./envelope.js`

## API Publique
- `BlockPlayer`

## Tests liés
[`tests/audio-block-player.test.js`](../../tests/audio-block-player.test.js)

## Exemple d'utilisation
```javascript
const player = new BlockPlayer(); player.setBuffers(map); player.play(block, 0);
```
