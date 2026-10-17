# Module `audio-concat`

## Rôle
concaténation séquentielle de plusieurs AudioBuffers en un seul flux audio continu.

## Dépendances
- Aucune

## API Publique
- `concatAudioBuffers`

## Tests liés
[`tests/audio-concat.test.js`](../../tests/audio-concat.test.js)

## Exemple d'utilisation
```javascript
const fullBuffer = concatAudioBuffers([buf1, buf2], 44100);
```
