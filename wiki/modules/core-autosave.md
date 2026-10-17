# Module `core-autosave`

## Rôle
sauvegarde différée (autosave) avec temporisation (30 s par défaut) et vidage forcé (flush/beforeunload).

## Dépendances
- Aucune

## API Publique
- `createAutosave`

## Tests liés
[`tests/core-autosave.test.js`](../../tests/core-autosave.test.js)

## Exemple d'utilisation
```javascript
const auto = createAutosave((data) => saveProject(data), 30000); auto.trigger(project);
```
