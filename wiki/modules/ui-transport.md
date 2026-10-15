# Module `ui-transport`

## Rôle
barre de transport (lecture/pause, stop, compteur) qui pilote le mixeur et la tête de lecture.

## Dépendances
- `../core/bus.js`
- `../core/timeline-math.js`
- `./dom.js`

## API Publique
- `Transport`

## Tests liés
Validation fonctionnelle et tests d’intégration.

## Exemple d'utilisation
```javascript
const transport = new Transport(el, { mixer, timeline }); transport.refresh();
```
