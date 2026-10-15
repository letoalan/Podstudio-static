# Module `ui-project-action`

## Rôle
sauvegarde (export) et restauration (import) des projets PodStudio au format JSON.

## Dépendances
- `../core/bus.js`
- `../core/project.js`
- `../core/settings.js`
- `../audio/wav.js`
- `./dom.js`
- `./toast.js`

## API Publique
- `createProjectControls`

## Tests liés
[`tests/ui-project-action.test.js`](../../tests/ui-project-action.test.js)

## Exemple d'utilisation
```javascript
exportProject(timeline); importProject(timeline, file);
```
