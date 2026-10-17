# Module `audio-analyzer`

## Rôle
Pipeline d'analyse audio asynchrone (resampling 16 kHz mono) avec cache mémoire, persistance IndexedDB par `sourceId` et émission d'événements `block:classified`.

## Dépendances
- `../core/audio-dsp.js`
- `../core/audio-classifier.js`
- `../core/storage.js`
- `../core/bus.js`

## API Publique
- `analyzeRecording(sourceId, storage, ctx)`
- `analyzeProjectBlocks(project, storage, onClassified)`

## Tests liés
[`tests/audio-analyzer.test.js`](../../tests/audio-analyzer.test.js)

## Exemple d'utilisation
```javascript
import { analyzeProjectBlocks } from './audio-analyzer.js';

await analyzeProjectBlocks(project, storage);
```
