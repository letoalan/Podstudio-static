# Module `audio-mp3-encoder`

## Rôle
conversion PCM Float32 -> MP3 (LAME) par blocs de 1152 échantillons, sans dépendance au DOM.

## Dépendances
- Aucune

## API Publique
- `MP3_KBPS`
- `BLOCK_SIZE`
- `floatToInt16`
- `encodeMp3`

## Tests liés
[`tests/audio-mp3-encoder.test.js`](../../tests/audio-mp3-encoder.test.js)

## Exemple d'utilisation
```javascript
const chunks = encodeMp3([left, right], 44100, Mp3Encoder, { onProgress });
```
