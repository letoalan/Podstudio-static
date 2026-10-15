# Module `core-settings`

## Rôle
métadonnées du podcast (titre, auteur, langue…) persistées dans localStorage.

## Dépendances
- Aucune

## API Publique
- `SETTINGS_KEY`
- `DEFAULT_SETTINGS`
- `getSettings`
- `saveSettings`
- `resetSettings`

## Tests liés
[`tests/core-settings.test.js`](../../tests/core-settings.test.js)

## Exemple d'utilisation
```javascript
saveSettings({ title: 'Mon émission' }); getSettings().title;
```
