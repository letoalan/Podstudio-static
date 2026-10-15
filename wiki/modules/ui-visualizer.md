# Module `ui-visualizer`

## Rôle
visualiseur d'onde sur <canvas> alimenté par un AnalyserNode (boucle requestAnimationFrame).

## Dépendances
- Aucune

## API Publique
- `Visualizer`

## Tests liés
Validation fonctionnelle et tests d’intégration.

## Exemple d'utilisation
```javascript
const viz = new Visualizer(canvas); viz.start(recorder.analyser); viz.stop();
```
