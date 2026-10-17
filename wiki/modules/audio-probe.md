# Module `audio-probe`

## Rôle
lit la durée réelle d'un fichier audio importé via les métadonnées d'un élément <audio>.

## Dépendances
- Aucune

## API Publique
- `probeDuration`
- `probeAudioFeatures`

## Tests liés
[`tests/audio-probe.test.js`](../../tests/audio-probe.test.js)

## Exemple d'utilisation
```javascript
const seconds = await probeDuration(file); // 0 si illisible
const features = await probeAudioFeatures(file); // { silenceRatio, signalClass, ... }
```
