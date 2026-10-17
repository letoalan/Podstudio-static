# Module `src/core/story-role.js`

## Rôle
Gestion des rôles narratifs du podcast (Intro, Interview, Chronique, Virgule, Outro) et calcul du conducteur d'épisode avec les repères temporels cumulés pour chaque bloc et transition.

## API exportée
- `STORY_ROLES` : tableau des 5 définitions de rôles (id, label, icon, color, desc).
- `getStoryRole(roleId)` : résout la définition du rôle narratif demandé (défaut 'chronique').
- `inferDefaultRole(index, total)` : déduit un rôle approprié par défaut selon le positionnement dans l'épisode.
- `calculateStoryTimeline(blocks)` : calcule les timecodes cumulés de début (`start`) et fin (`end`) de chaque segment.

## Exemple d'utilisation
```javascript
import { calculateStoryTimeline, getStoryRole } from './story-role.js';

const timeline = calculateStoryTimeline(project.blocks);
// [{ id: 'b-1', start: 0, end: 45, duration: 45 }, ...]
const role = getStoryRole('intro');
```
