# Module `core-palette`

## Rôle
palettes de couleurs des blocs (8 teintes par défaut), couleur d'un bloc selon son rang et contraste du texte.

## Dépendances
- Aucune

## API Publique
- `PALETTE_SIZE`
- `PALETTES`
- `DEFAULT_PALETTE_ID`
- `DEFAULT_PALETTE`
- `COLOR_MODES`
- `isValidHex`
- `normalizePalette`
- `normalizeColorMode`
- `normalizeBlockColor`
- `colorForBlock`
- `textColorFor`

## Tests liés
[`tests/core-palette.test.js`](../../tests/core-palette.test.js)

## Exemple d'utilisation
```javascript
const color = colorForBlock(block, 3, palette, 'cycle'); const ink = textColorFor(color);
```
