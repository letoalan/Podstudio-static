# Module `ui-editor-editor-shell`

## Rôle
Panneau de l'éditeur timeline d'un bloc (barre d'outils, pistes, lecture audio en temps réel, curseur/playhead, raccourcis, historique, inspecteur et fermeture).

## Dépendances
- `../dom.js`
- `../../core/timeline-math.js`
- `../../core/block-model.js`
- `../../core/history.js`
- `../../core/clipboard.js`
- `../../core/clip-ops.js`
- `./toolbar.js`
- `./track-view.js`
- `./ruler.js`
- `./playhead.js`
- `./shortcuts.js`
- `../../audio/block-player.js`
- `../../audio/block-render.js`
- `../../core/storage.js`
- `../toast.js`
- `./clip-inspector-view.js`

## API Publique
- `mountEditorShell(container, deps)` : monte l'interface complète de l'éditeur avec moteur de lecture multipiste.

## Tests liés
[`tests/ui-editor-editor-shell.test.js`](../../tests/ui-editor-editor-shell.test.js)

## Exemple d'utilisation
```javascript
const shell = mountEditorShell(container, { block, onUpdateBlock, onClose, storage });
```
