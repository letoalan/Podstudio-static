# Module `src/ui/views/blocks-export-helper.js`

## Rôle
Gestionnaire d'export et d'échange de fichiers pour la vue Blocs :
- Rendu audio WAV du podcast complet (concaténation avec transitions).
- Téléchargement du fichier WAV et persistance en base IndexedDB.
- Sauvegarde et restauration du projet au format JSON.

## API exportée
- `exportPodcastAction(project, storage)` : effectue le mixdown complet et déclenche le téléchargement.
- `triggerDownload(blob, filename)` : crée un lien éphémère de téléchargement.
- `handleOpenProject(file, onLoaded)` : lit un fichier JSON local et désérialise le projet.
- `saveProjectFile(project)` : sérialise et télécharge le fichier projet `.json`.
