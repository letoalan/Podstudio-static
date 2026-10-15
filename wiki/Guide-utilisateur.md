# Guide utilisateur — PodStudio

PodStudio permet de concevoir un épisode de podcast complet en 4 étapes simples.

## 1. Enregistrement vocal (Vue Studio)

1. Connectez votre micro et autorisez l'accès lorsque le navigateur le demande.
2. Cliquez sur le bouton rouge **Enregistrer**.
3. Parlez face au micro : l'onde oscilloscopique s'anime en direct sur le canvas.
4. Cliquez sur **Arrêter** : votre enregistrement est immédiatement sauvegardé dans la Bibliothèque locale.

## 2. Importation de sons & musiques

- Dans la colonne latérale **Bibliothèque**, cliquez sur **Importer audio**.
- Sélectionnez vos fichiers `.mp3` ou `.wav` (jingles, ambiances, musiques de fond).
- Vous pouvez pré-écouter chaque élément ou le renommer à tout moment.

## 3. Montage multipiste (Vue Éditeur)

1. Glissez-déposez un enregistrement ou jingle depuis la bibliothèque vers la piste souhaitée de la timeline.
2. Déplacez les blocs horizontalement pour caler vos interventions au millimètre près.
3. **Rognage (Trim)** :
   - Attrapez la poignée latérale gauche pour rogner le début du clip.
   - Attrapez la poignée latérale droite pour rogner la fin du clip.
   - Ou ajustez directement les champs *Rognage début* et *Durée* dans l'Inspecteur.
4. **Presse-papier & Édition** :
   - **Copier** (`Ctrl+C` ou bouton 📋 Copier) : mémorise le clip sélectionné.
   - **Couper** (`Ctrl+X` ou bouton ✂️ Couper) : copie le clip et le retire de la piste.
   - **Coller** (`Ctrl+V` ou bouton 📥 Coller) : colle le clip à la position de la tête de lecture.
   - **Scinder** (`S` ou bouton ✂️ Scinder) : découpe automatiquement le morceau situé sous le curseur rouge (tête de lecture) en deux segments distincts.
5. Cliquez sur un clip pour ouvrir l'**Inspecteur** et ajuster le volume et les fondus.
6. Lancez la lecture avec la barre d'espace ou le bouton **Lecture** pour valider votre mix.

## 4. Export & Diffusion (Vue Épisodes)

1. Cliquez sur **Exporter l'épisode** dans l'Éditeur.
2. Donnez un titre et une description à votre création.
3. Le moteur mixe les pistes et génère un fichier MP3 128 kbps haute qualité.
4. Téléchargez le MP3 ou téléchargez le flux **RSS podcast.xml** pour le diffuser sur vos plateformes favorites.

## 5. Sauvegarde & Restauration de projet (JSON)

- **Sauvegarder** : Cliquez sur **💾 Sauvegarder JSON** dans l'en-tête de l'Éditeur. Un fichier `.json` 100 % autonome contenant la timeline, les réglages et l'audio est téléchargé sur votre ordinateur.
- **Restaurer** : Cliquez sur **📂 Ouvrir JSON** et sélectionnez votre fichier `.json`. Les pistes, leurs rognages, leurs réglages et leurs données audio sont immédiatement décodés et rechargés sur la timeline.
