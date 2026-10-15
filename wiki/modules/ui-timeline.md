# Module `ui-timeline`

## Rôle
timeline multipiste (lignes Voix/Musique, règle, clips, tête de lecture, zoom, sélection).

## Dépendances
- `../core/bus.js`
- `../core/timeline-math.js`
- `./clipboard.js`
- `./dom.js`
- `./timeline-clip.js`
- `./timeline-drop.js`
- `./timeline-ruler.js`

## API Publique
- `Timeline`

## Tests liés
Validation fonctionnelle et tests d’intégration.

## Exemple d'utilisation
```javascript
const tl = new Timeline(el, { mixer, onSelect }); tl.render(); tl.zoomBy(1.5);
```
