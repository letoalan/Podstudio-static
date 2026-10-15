# Module `audio-encoder.worker`

## Rôle
worker d'encodage MP3 ; reçoit les canaux PCM, répond par progression puis Blob final.

## Dépendances
- `@breezystack/lamejs`
- `./mp3-encoder.js`

## API Publique
- Module à effets de bord

## Tests liés
[`tests/audio-encoder.worker.test.js`](../../tests/audio-encoder.worker.test.js)

## Exemple d'utilisation
```javascript
worker.postMessage({ command: 'encode', channels, sampleRate });
```
