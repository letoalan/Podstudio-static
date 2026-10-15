# Module `audio-envelope`

## Rôle
courbe de gain d'une piste (volume + fondus entrée/sortie), partagée par le mixeur et le rendu.

## Dépendances
- Aucune

## API Publique
- `clampFades`
- `gainAt`
- `envelopePoints`
- `scheduleEnvelope`

## Tests liés
[`tests/audio-envelope.test.js`](../../tests/audio-envelope.test.js)

## Exemple d'utilisation
```javascript
scheduleEnvelope(gainNode.gain, { volume: 1, fadeIn: 2, fadeOut: 3, duration: 20 }, when);
```
