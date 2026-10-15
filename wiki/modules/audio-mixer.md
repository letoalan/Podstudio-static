# Module `audio-mixer`

## Rôle
lecture multipiste en temps réel (Web Audio) avec décalage, volume, fondus et lignes.

## Dépendances
- `./envelope.js`
- `../core/timeline-math.js`

## API Publique
- `Mixer`

## Tests liés
[`tests/audio-mixer.test.js`](../../tests/audio-mixer.test.js)

## Exemple d'utilisation
```javascript
const mixer = new Mixer(); await mixer.addTrack('c1', blob, { offset: 2 }); mixer.play();
```
