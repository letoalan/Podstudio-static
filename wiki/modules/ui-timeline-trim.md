# Module `ui-timeline-trim`

## Rôle
poignées interactives de rognage (trim gauche/droite) sur les clips de la timeline.

## Dépendances
- `./dom.js`
- `../core/timeline-math.js`

## API Publique
- `attachTrimHandles`

## Tests liés
[`tests/ui-timeline-trim.test.js`](../../tests/ui-timeline-trim.test.js)

## Exemple d'utilisation
```javascript
attachTrimHandles(clipEl, track, pps, handlers);
```
