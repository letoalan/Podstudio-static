# Module `audio-block-render`

## Rôle
rendu audio hors-ligne (OfflineAudioContext) d'un bloc ou du projet complet par concaténation de contextes.

## Dépendances
- `../core/block-model.js`
- `../core/project.js`
- `./envelope.js`
- `./concat.js`

## API Publique
- Module à effets de bord

## Tests liés
[`tests/audio-block-render.test.js`](../../tests/audio-block-render.test.js)

## Exemple d'utilisation
```javascript
const buffer = await renderBlock(block, buffersMap); const full = await renderProject(project, buffersMap);
```
