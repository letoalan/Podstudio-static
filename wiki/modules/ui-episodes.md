# Module `ui-episodes`

## Rôle
vue « Épisodes » (lecteur, téléchargement MP3, suppression) et export du flux RSS.

## Dépendances
- `../core/storage.js`
- `../core/settings.js`
- `../core/rss.js`
- `../core/bus.js`
- `../core/format.js`
- `../core/timeline-math.js`
- `./dom.js`
- `./toast.js`

## API Publique
- `buildEpisodeCard`
- `mountEpisodes`

## Tests liés
Validation fonctionnelle et tests d’intégration.

## Exemple d'utilisation
```javascript
mountEpisodes(document.getElementById('view-episodes'));
```
