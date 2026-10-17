# Module `ui-editor-track-view`

## Rôle
affichage et contrôles d'une piste de la timeline (en-tête volume/mute/solo et conteneur des clips).

## Dépendances
- `../dom.js`
- `./clip-view.js`

## API Publique
- `createTrackView`

## Tests liés
Validation fonctionnelle et tests d’intégration.

## Exemple d'utilisation
```javascript
const el = createTrackView(track, { clips, pps, onUpdateTrack, onSelectClip });
```
