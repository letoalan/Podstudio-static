# Module `core-bus`

## Rôle
bus d'événements global (EventTarget) qui découple les modules UI.

## Dépendances
- Aucune

## API Publique
- `emit`
- `on`

## Tests liés
[`tests/core-bus.test.js`](../../tests/core-bus.test.js)

## Exemple d'utilisation
```javascript
const off = on('library:changed', refresh); emit('library:changed'); off();
```
