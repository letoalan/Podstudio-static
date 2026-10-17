# Module `ui-editor-clip-view`

## Rôle
affichage et interaction d'un clip sur la timeline (sélection, déplacement, poignées de rognage début et fin).

## Dépendances
- `../dom.js`
- `../../core/clip-ops.js`

## API Publique
- `createClipView`

## Tests liés
Validation fonctionnelle et tests d’intégration.

## Exemple d'utilisation
```javascript
const el = createClipView(clip, { pps: 20, onSelect, onTrim, onMove });
```
