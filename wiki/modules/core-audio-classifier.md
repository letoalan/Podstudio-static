# Module `src/core/audio-classifier.js`

## Rôle
Module d'intelligence artificielle locale analysant le contenu sonore et la répartition des clips dans un bloc pour en déduire automatiquement sa nature :
- 🗣️ **Monologue** : voix solo, narration, récit continu sur une piste.
- 👥 **Conversation** : dialogue, interview, alternance multi-pistes.
- 🎵 **Musique** : nappe musicale, virgule, jingle, fond sonore rythmé.
- ✨ **Bruitage / Ambiance** : effets sonores courts, ponctuations audio.

## API exportée
- `classifyBlockContent(block)` : retourne l'objet de classification `{ type, label, icon, badge, suggestedRole, details }`.
- `evaluateSpeechDialogue(block)` : évalue la probabilité conversation vs monologue (topologie de pistes, alternance turn-taking, chevauchements, lexique et diarisation acoustique).

## Exemple d'utilisation
```javascript
import { classifyBlockContent, evaluateSpeechDialogue } from './audio-classifier.js';

const nature = classifyBlockContent(block);
console.log(nature.icon, nature.label); // "👥" "Conversation"
console.log(nature.details?.reasons); // ["2 pistes actives (multi-voix)", "Chevauchement vocal / cross-talk"]
```

