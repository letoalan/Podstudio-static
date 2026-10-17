# Module `ui-editor-shortcuts`

## Rôle
gestion des raccourcis clavier de l'éditeur de timeline (Ctrl+C, Ctrl+X, Ctrl+V, S, Suppr, Ctrl+Z, Ctrl+Y).

## Dépendances
- Aucune

## API Publique
- `bindEditorShortcuts`

## Tests liés
Validation fonctionnelle et tests d’intégration.

## Exemple d'utilisation
```javascript
const unbind = bindEditorShortcuts(window, { onCopy, onSplit, onUndo });
```
