# Module `core-project-io`

## Rôle
sérialisation, validation et migration des fichiers de projet PodStudio (v3 : blocs numérotés, palette).

## Dépendances
- `./block-model.js`
- `./palette.js`

## API Publique
- `PROJECT_FORMAT`
- `PROJECT_VERSION`
- `sanitizeFileName`
- `validateProjectData`
- `serializeProject`
- `deserializeProject`
- `createProjectData`
- `validateProject`

## Tests liés
[`tests/core-project-io.test.js`](../../tests/core-project-io.test.js)

## Exemple d'utilisation
```javascript
const json = serializeProject(project); const loaded = deserializeProject(json);
```
