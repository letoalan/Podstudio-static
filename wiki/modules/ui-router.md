# Module `ui-router`

## Rôle
routeur des 5 vues (Guide, Studio, Éditeur, Épisodes, Paramètres) via hash et événements.

## Dépendances
- `../core/bus.js`

## API Publique
- `VIEWS`
- `parseHash`
- `initRouter`

## Tests liés
[`tests/ui-router.test.js`](../../tests/ui-router.test.js)

## Exemple d'utilisation
```javascript
const router = initRouter(); router.go('studio'); // ou emit('view:go', 'studio')
```
