# Module `src/ui/block-waveform.js`

## Rôle
Affichage de l'équalizer dynamique haute-définition sur toute la largeur de la carte de bloc :
- Barres d'amplitude dégradées cyan / violet avec lueur néon.
- Animation de lecture interactive lorsque `isPlaying` est actif.
- Curseur de navigation (scrubber) et écouteur de recherche (seek).
- État vide incitatif lorsque le bloc ne contient pas encore d'audio.

## API exportée
- `renderBlockEqualizer(block, callbacks)` : génère le conteneur `.block-equalizer-lane` avec ses barres d'égalisation.

## Exemple d'utilisation
```javascript
const eq = renderBlockEqualizer(block, {
  isPlaying: true,
  onSeek: (seconds) => console.log('Seek to', seconds),
});
```
