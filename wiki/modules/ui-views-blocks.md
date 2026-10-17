# Module `ui-views-blocks`

## Rôle
vue principale Blocs (ligne verticale de blocs numérotés, lecture globale séquentielle, export du podcast et éditeur).

## Dépendances
- `../dom.js`
- `../../core/project.js`
- `../../core/timeline-math.js`
- `../../core/autosave.js`
- `../block-list.js`
- `../editor/editor-shell.js`
- `../toast.js`
- `../../core/bus.js`
- `../../core/storage.js`
- `./blocks-export-helper.js`

## API Publique
- `mountBlocksView`

## Tests liés
[`tests/ui-views-blocks.test.js`](../../tests/ui-views-blocks.test.js)

## Exemple d'utilisation
```javascript
mountBlocksView(document.getElementById('view-studio'));
```
