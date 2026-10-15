# Module `audio-encoder-client`

## Rôle
pont promesse <-> Web Worker pour encoder du PCM en MP3 sans bloquer l'interface.

## Dépendances
- Aucune

## API Publique
- `encodeInWorker`

## Tests liés
[`tests/audio-encoder-client.test.js`](../../tests/audio-encoder-client.test.js)

## Exemple d'utilisation
```javascript
const blob = await encodeInWorker(channels, 44100, { onProgress: (r) => {} });
```
