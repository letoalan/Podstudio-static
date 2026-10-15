# Module `ui-views-studio`

## Rôle
vue Studio (visualiseur, chronomètre, boutons enregistrer/pause/stop, sauvegarde en bibliothèque).

## Dépendances
- `../../core/storage.js`
- `../../audio/recorder.js`
- `../../core/bus.js`
- `../../core/format.js`
- `../../core/timeline-math.js`
- `../dom.js`
- `../toast.js`
- `../visualizer.js`

## API Publique
- `micErrorMessage`
- `mountStudio`

## Tests liés
Validation fonctionnelle et tests d’intégration.

## Exemple d'utilisation
```javascript
mountStudio(document.getElementById('view-studio'), { recorder });
```
