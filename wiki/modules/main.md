# Module `main`

## Rôle
point d'entrée — monte les vues, les bibliothèques (bureau + mobile), le routeur et la PWA.

## Dépendances
- `./core/db.js`
- `./ui/episodes.js`
- `./ui/library.js`
- `./ui/library-modal.js`
- `./ui/router.js`
- `./ui/toast.js`
- `./ui/views/editor.js`
- `./ui/views/guide.js`
- `./ui/views/settings.js`
- `./ui/views/blocks.js`
- `./pwa.js`

## API Publique
- `mountViews`
- `mountLibraries`

## Tests liés
Validation fonctionnelle et tests d’intégration.

## Exemple d'utilisation
```javascript
bootstrap(); // appelé au chargement du DOM
```
