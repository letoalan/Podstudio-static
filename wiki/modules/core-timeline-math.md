# Module `core-timeline-math`

## Rôle
mathématiques pures de la timeline (px <-> secondes, graduations, durées, pistes).

## Dépendances
- Aucune

## API Publique
- `DEFAULT_PPS`
- `MIN_PPS`
- `MAX_PPS`
- `LANES`
- `secondsToPx`
- `pxToSeconds`
- `clampPps`
- `snap`
- `formatClock`
- `formatHms`
- `graduationStep`
- `buildTicks`
- `timelineDuration`
- `laneEnd`
- `clipDuration`
- `clampTrim`

## Tests liés
[`tests/core-timeline-math.test.js`](../../tests/core-timeline-math.test.js)

## Exemple d'utilisation
```javascript
secondsToPx(2.5, 10) // 25
```
