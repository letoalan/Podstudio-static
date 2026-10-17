# Module `core-history`

## Rôle
gestion de l'historique annuler/rétablir (undo/redo) immuable avec limite de pile paramétrable.

## Dépendances
- Aucune

## API Publique
- `createHistory`
- `canUndo`
- `canRedo`
- `pushState`
- `undo`
- `redo`
- `clearHistory`

## Tests liés
[`tests/core-history.test.js`](../../tests/core-history.test.js)

## Exemple d'utilisation
```javascript
let h = pushState(history, state); const res = undo(h, currentState);
```
