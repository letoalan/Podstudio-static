# Module `core-db`

## Rôle
accès bas niveau à IndexedDB (base PodcastStudioDB, magasins recordings et episodes).

## Dépendances
- Aucune

## API Publique
- `DB_NAME`
- `DB_VERSION`
- `STORES`
- `openDB`
- `put`
- `get`
- `getAll`
- `remove`
- `clear`

## Tests liés
[`tests/core-db.test.js`](../../tests/core-db.test.js)

## Exemple d'utilisation
```javascript
await put('recordings', { id: '1', created: new Date().toISOString(), audio: blob });
```
