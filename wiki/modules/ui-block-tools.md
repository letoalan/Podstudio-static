# Module `ui-block-tools`

## Rôle
barre d'outils du bloc sélectionné (micro, import, bibliothèque, éditeur, duplication, suppression).

## Dépendances
- `./dom.js`
- `./toast.js`
- `../core/block-model.js`
- `../core/storage.js`
- `../audio/recorder.js`
- `../audio/probe.js`

## API Publique
- `mountBlockTools`

## Tests liés
[`tests/ui-block-tools.test.js`](../../tests/ui-block-tools.test.js)

## Exemple d'utilisation
```javascript
mountBlockTools(container, { block, onUpdateBlock, onOpenEditor, onDuplicate, onDelete });
```
