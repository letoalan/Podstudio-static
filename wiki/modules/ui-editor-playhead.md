# Module `ui-editor-playhead`

## Rôle
curseur rouge de lecture (playhead) avec synchronisation de position et déplacement manuel au glisser.

## Dépendances
- `../dom.js`
- `../../core/timeline-math.js`

## API Publique
- `createPlayhead`

## Tests liés
Validation fonctionnelle et tests d’intégration.

## Exemple d'utilisation
```javascript
const ph = createPlayhead({ pps: 20, onSeek }); ph.setTime(4.5);
```
