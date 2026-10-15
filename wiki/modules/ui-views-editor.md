# Module `ui-views-editor`

## Rôle
vue Éditeur — assemble transport, zoom, édition (copier/couper/coller/scinder), timeline, inspecteur et export.

## Dépendances
- `../../core/bus.js`
- `../../audio/mixer.js`
- `../clipboard.js`
- `../clip-inspector.js`
- `../project-action.js`
- `../dom.js`
- `../export-action.js`
- `../timeline.js`
- `../timeline-drop.js`
- `../toast.js`
- `../transport.js`

## API Publique
- `mountEditor`

## Tests liés
Validation fonctionnelle et tests d’intégration.

## Exemple d'utilisation
```javascript
mountEditor(document.getElementById('view-editor'), { mixer });
```
