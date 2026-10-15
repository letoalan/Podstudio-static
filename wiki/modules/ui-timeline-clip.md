# Module `ui-timeline-clip`

## Rôle
brique d'une piste sur la timeline, déplaçable à la souris/au doigt et au clavier.

## Dépendances
- `./dom.js`
- `../core/timeline-math.js`
- `./timeline-trim.js`

## API Publique
- `buildClip`

## Tests liés
Validation fonctionnelle et tests d’intégration.

## Exemple d'utilisation
```javascript
lane.append(buildClip(track, 10, { onSelect, onMove, onDelete, laneAt }));
```
