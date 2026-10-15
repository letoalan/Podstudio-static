# Module `ui-library`

## Rôle
panneau Bibliothèque (liste, import .mp3/.wav, renommage, suppression, ajout à la timeline).

## Dépendances
- `../core/storage.js`
- `../audio/probe.js`
- `../core/bus.js`
- `./dom.js`
- `./library-item.js`
- `./toast.js`

## API Publique
- `mountLibrary`

## Tests liés
Validation fonctionnelle et tests d’intégration.

## Exemple d'utilisation
```javascript
const lib = mountLibrary(document.getElementById('library-panel'));
```
