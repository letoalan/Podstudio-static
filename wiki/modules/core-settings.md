# Module `core-settings`

## Rôle
métadonnées du podcast (titre, auteur, langue…) et couleurs des blocs persistées dans localStorage.

## Dépendances
- `./palette.js`

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
