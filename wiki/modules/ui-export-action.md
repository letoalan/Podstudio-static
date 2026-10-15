# Module `ui-export-action`

## Rôle
action « Exporter » (rendu hors-ligne + MP3 + sauvegarde de l'épisode) avec retour d'état.

## Dépendances
- `../core/storage.js`
- `../core/bus.js`
- `../core/format.js`
- `../audio/render.js`
- `./toast.js`

## API Publique
- Module à effets de bord

## Tests liés
Validation fonctionnelle et tests d’intégration.

## Exemple d'utilisation
```javascript
await runExport(button, { mixer, storage });
```
