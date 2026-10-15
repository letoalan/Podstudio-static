# Module `ui-toast`

## Rôle
notifications éphémères accessibles (zone aria-live) à la place des alert().

## Dépendances
- `./dom.js`

## API Publique
- `showToast`

## Tests liés
[`tests/ui-toast.test.js`](../../tests/ui-toast.test.js)

## Exemple d'utilisation
```javascript
showToast('Enregistrement ajouté', { type: 'success' });
```
