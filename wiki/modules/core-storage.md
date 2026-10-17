# Module `core-storage`

## Rôle
façade métier du stockage (enregistrements et épisodes) + estimation du quota.

## Dépendances
- `./db.js`

## API Publique
- `QUOTA_WARNING_RATIO`
- `saveRecording`
- `saveEpisode`
- `listRecordings`
- `listEpisodes`
- `getRecording`
- `renameRecording`
- `renameEpisode`
- `deleteRecording`
- `deleteEpisode`
- `updateRecordingAnalysis`
- `isQuotaCritical`

## Tests liés
[`tests/core-storage.test.js`](../../tests/core-storage.test.js)

## Exemple d'utilisation
```javascript
const rec = await saveRecording({ title: 'Intro', duration: 12 }, blob);
```
