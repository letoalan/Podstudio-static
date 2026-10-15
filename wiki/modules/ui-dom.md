# Module `ui-dom`

## Rôle
helpers DOM sûrs (création d'éléments sans innerHTML, téléchargement de Blob).

## Dépendances
- Aucune

## API Publique
- `h`
- `clear`
- `downloadBlob`
- `makeUrl`

## Tests liés
[`tests/ui-dom.test.js`](../../tests/ui-dom.test.js)

## Exemple d'utilisation
```javascript
document.body.append(h('button', { class: 'btn', onClick: save }, 'Sauvegarder'));
```
