# Module `core-level`

## Rôle
définition des 3 niveaux d'interface progressive (Simple, Intermédiaire, Avancé) et filtrage des outils visibles.

## Dépendances
- Aucune

## API Publique
- `LEVELS`
- `LEVEL_LABELS`
- `LEVEL_TOOLS`
- `validateLevel`
- `isToolEnabled`
- `getVisibleTools`
- `suggestLevelUpgrade`

## Tests liés
[`tests/core-level.test.js`](../../tests/core-level.test.js)

## Exemple d'utilisation
```javascript
if (isToolEnabled(level, 'advancedEditing')) { ... }
```
