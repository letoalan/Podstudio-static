# Module `audio-recorder`

## Rôle
capture micro (MediaRecorder) avec pause/reprise, chronomètre et AnalyserNode pour le visualiseur.

## Dépendances
- Aucune

## API Publique
- `MIME_CANDIDATES`
- `pickMimeType`
- `Recorder`

## Tests liés
[`tests/audio-recorder.test.js`](../../tests/audio-recorder.test.js)

## Exemple d'utilisation
```javascript
const rec = new Recorder(); await rec.start(); const { blob } = await rec.stop();
```
