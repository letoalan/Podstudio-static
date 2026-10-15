# Module `audio-wav`

## Rôle
conversion AudioBuffer <-> WAV Blob et encodage/décodage Base64 Data URL.

## Dépendances
- Aucune

## API Publique
- `audioBufferToWav`
- `blobToDataUrl`
- `dataUrlToBlob`

## Tests liés
[`tests/audio-wav.test.js`](../../tests/audio-wav.test.js)

## Exemple d'utilisation
```javascript
const blob = audioBufferToWav(buffer); const dataUrl = await blobToDataUrl(blob);
```
