# Module `core-rss`

## Rôle
génération du flux RSS 2.0 / iTunes à partir des épisodes et des réglages.

## Dépendances
- `./timeline-math.js`

## API Publique
- `escapeXml`
- `durationTag`
- `buildItem`
- `generateRss`
- `rssBlob`

## Tests liés
[`tests/core-rss.test.js`](../../tests/core-rss.test.js)

## Exemple d'utilisation
```javascript
const xml = generateRss(episodes, getSettings());
```
