# Module `ui-editor-toolbar`

## Rôle
barre d'outils de l'éditeur timeline (transport, copier/couper/coller, scinder, annuler/rétablir, zoom).

## Dépendances
- `../dom.js`
- `../../core/level.js`

## API Publique
- `createEditorToolbar`

## Tests liés
Validation fonctionnelle et tests d’intégration.

## Exemple d'utilisation
```javascript
const tb = createEditorToolbar({ onPlay, onSplit, onUndo });
```
