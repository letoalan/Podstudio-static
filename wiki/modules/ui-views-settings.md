# Module `ui-views-settings`

## Rôle
vue Paramètres — formulaire de métadonnées, jauge de stockage (alerte à 80 %), réinitialisation.

## Dépendances
- `../../core/storage.js`
- `../../core/settings.js`
- `../../core/bus.js`
- `../../core/format.js`
- `../dom.js`
- `../toast.js`

## API Publique
- `FIELDS`
- `readForm`
- `mountSettings`

## Tests liés
Validation fonctionnelle et tests d’intégration.

## Exemple d'utilisation
```javascript
mountSettings(document.getElementById('view-settings'));
```
