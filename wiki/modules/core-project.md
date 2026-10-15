# Module `core-project`

## Rôle
schéma, validation et formatage des fichiers de projet JSON de PodStudio.

## Dépendances
- Aucune

## API Publique
- `PROJECT_FORMAT`
- `PROJECT_VERSION`
- `sanitizeFileName`
- `createProjectData`
- `validateProject`

## Tests liés
[`tests/core-project.test.js`](../../tests/core-project.test.js)

## Exemple d'utilisation
```javascript
const project = createProjectData(settings, tracks); validateProject(project);
```
