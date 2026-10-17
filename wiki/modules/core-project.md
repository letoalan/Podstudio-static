# Module `core-project`

## Rôle
gestion immuable du projet et de sa ligne de blocs numérotés (ajout, insertion, déplacement, suppression, duplication).

## Dépendances
- `./block-model.js`
- `./palette.js`
- `./project-io.js`

## API Publique
- `createProject`
- `findBlock`
- `getBlockNumber`
- `getBlockColor`
- `insertBlockAt`
- `addBlock`
- `removeBlock`
- `moveBlock`
- `duplicateBlock`
- `updateBlock`
- `getPlayableBlocks`
- `getProjectDuration`

## Tests liés
[`tests/core-project.test.js`](../../tests/core-project.test.js)

## Exemple d'utilisation
```javascript
const p2 = insertBlockAt(project, 1, newBlock); getBlockNumber(p2, newBlock.id); // 2
```
