# Module `ui-clip-inspector`

## Rôle
panneau de réglages du clip sélectionné (nom, volume, fondus, début, rognage, copier, couper).

## Dépendances
- `../core/bus.js`
- `../core/timeline-math.js`
- `./dom.js`

## API Publique
- `mountInspector`

## Tests liés
Validation fonctionnelle et tests d’intégration.

## Exemple d'utilisation
```javascript
const inspector = mountInspector(el, { mixer, onRemove, onCopy, onCut }); inspector.show(track);
```
