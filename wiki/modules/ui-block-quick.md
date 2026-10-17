# Module `ui-block-quick`

## Rôle
outils rapides pour bloc (enregistrement direct, import audio, jingle express sans ouvrir l'éditeur).

## Dépendances
- `./dom.js`
- `./toast.js`
- `../core/block-model.js`
- `../core/storage.js`
- `../audio/recorder.js`

## API Publique
- `mountBlockQuick`

## Tests liés
Validation fonctionnelle et tests d’intégration.

## Exemple d'utilisation
```javascript
mountBlockQuick(container, { block, onUpdateBlock });
```
