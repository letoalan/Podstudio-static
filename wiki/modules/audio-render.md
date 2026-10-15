# Module `audio-render`

## Rôle
rendu hors-ligne du mixage (OfflineAudioContext) puis export MP3.

## Dépendances
- `./envelope.js`
- `./encoder-client.js`
- `../core/timeline-math.js`

## API Publique
- `EXPORT_SAMPLE_RATE`
- `EXPORT_CHANNELS`

## Tests liés
[`tests/audio-render.test.js`](../../tests/audio-render.test.js)

## Exemple d'utilisation
```javascript
const { blob, duration } = await exportMp3(mixer.getTracks());
```
