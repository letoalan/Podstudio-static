# Module `ui-clipboard`

## Rôle
gestion du presse-papier (copier, couper, coller) et scission de clips audio.

## Dépendances
- `../core/bus.js`
- `../core/timeline-math.js`
- `./toast.js`

## API Publique
- `hasClipboard`
- `copyClip`
- `cutClip`
- `pasteClip`
- `findTrackAtPosition`
- `splitClip`
- `splitAtPlayhead`

## Tests liés
[`tests/ui-clipboard.test.js`](../../tests/ui-clipboard.test.js)

## Exemple d'utilisation
```javascript
copyClip(track); pasteClip(timeline);
```
