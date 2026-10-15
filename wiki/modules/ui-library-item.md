# Module `ui-library-item`

## Rôle
construit la carte d'un enregistrement de la bibliothèque (pré-écoute, renommage, glisser, actions).

## Dépendances
- `./dom.js`
- `../core/timeline-math.js`

## API Publique
- `DRAG_MIME`
- `buildLibraryItem`

## Tests liés
Validation fonctionnelle et tests d’intégration.

## Exemple d'utilisation
```javascript
list.append(buildLibraryItem(item, { onAdd, onRename, onDelete }));
```
