# Module `ui-editor-ruler`

## Rôle
règle temporelle de l'éditeur de bloc avec graduations et déplacement de la tête de lecture au clic.

## Dépendances
- `../dom.js`
- `../../core/timeline-math.js`

## API Publique
- `createRuler`

## Tests liés
Validation fonctionnelle et tests d’intégration.

## Exemple d'utilisation
```javascript
const ruler = createRuler({ duration: 60, pps: 20, onSeek });
```
