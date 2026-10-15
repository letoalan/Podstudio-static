# Module `core-format`

## Rôle
fonctions pures de formatage (octets, date) partagées par l'UI et le RSS.

## Dépendances
- Aucune

## API Publique
- `formatBytes`
- `formatDateTime`

## Tests liés
[`tests/core-format.test.js`](../../tests/core-format.test.js)

## Exemple d'utilisation
```javascript
formatBytes(1536000) // "1,5 Mo"
```
