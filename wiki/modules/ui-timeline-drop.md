# Module `ui-timeline-drop`

## Rôle
ajout d'un enregistrement sur la timeline (bouton ＋ ou glisser-déposer depuis la bibliothèque).

## Dépendances
- `../core/storage.js`
- `../core/timeline-math.js`
- `./library-item.js`
- `./toast.js`

## API Publique
- `bindDrop`

## Tests liés
Validation fonctionnelle et tests d’intégration.

## Exemple d'utilisation
```javascript
bindDrop(timeline); await addRecordingToTimeline(timeline, item, { lane: 1 });
```
