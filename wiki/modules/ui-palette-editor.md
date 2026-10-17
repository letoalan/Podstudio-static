# Module `ui-palette-editor`

## Rôle
éditeur visuel de palette de couleurs (presets, mode cycle ou fixe, sélecteurs natifs).

## Dépendances
- `./dom.js`
- `../core/palette.js`

## API Publique
- `mountPaletteEditor`

## Tests liés
[`tests/ui-palette-editor.test.js`](../../tests/ui-palette-editor.test.js)

## Exemple d'utilisation
```javascript
mountPaletteEditor(container, { settings, onChange });
```
