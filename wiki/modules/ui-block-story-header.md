# Module `src/ui/block-story-header.js`

## Rôle
Composants de l'organisation narrative dans chaque carte de bloc :
- Badge interactif du rôle narratif (Intro, Interview, Chronique, Virgule, Outro).
- Champ de saisie du sujet/titre de chapitre.
- Badge timecode cumulé dans l'épisode (`start → end`).
- Tiroir de notes de conducteur d'émission.

## API exportée
- `renderStoryRoleBadge(block, onUpdate)` : crée le bouton-badge de rôle cyclique.
- `renderStoryTopicInput(block, onUpdate)` : champ de texte du sujet de chapitre.
- `renderStoryTimecode(timeRange)` : génère le badge timecode cumulé de la carte.
- `renderStoryNotes(block, onUpdate)` : génère le bloc pliable de notes pour l'animateur.
- `renderNatureBadge(block, onUpdate)` : badge interactif d'intelligence sonore affichant la nature détectée (Monologue, Conversation, Musique, Bruitage) et permettant sa modification manuelle.
