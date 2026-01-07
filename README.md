# 🎙️ PodStudio Static
> **Le Studio de Podcast professionnel, 100% dans votre navigateur.**

PodStudio est une application web de production de podcasts conçue pour être **gratuite, statique et entièrement respectueuse de la vie privée (RGPD)**. Contrairement aux plateformes classiques, aucune donnée audio ne quitte jamais votre ordinateur.

---

## ✨ Points Forts

### ✂️ Édition Style "Anchor.fm"
Profitez d'un éditeur horizontal moderne basé sur une métaphore de **"Lego Audio"** :
- **Timeline Horizontale** : Visualisez votre montage de gauche à droite de manière intuitive.
- **Briques de Couleur** : Identification instantanée des segments (Violets = Studio, Verts = Imports).
- **Contrôle du Volume Dynamique** : Ajustez le gain et configurez des **Fades In/Out** (fondus) pour chaque segment.
- **Drag & Drop** : Glissez vos fichiers depuis votre bibliothèque directement sur la timeline.

### 🎤 Studio d'Enregistrement Complet
- **Capture HD** : Enregistrez votre voix directement depuis le navigateur.
- **Visualiseur Temps Réel** : Retour visuel sur votre signal audio.
- **Pause & Resume** : Gérez vos sessions d'enregistrement avec souplesse.
- **Conversion MP3 Interne** : Encodage rapide via le processeur de votre ordinateur (Web Workers).

### 💾 Architecture "Privacy-First"
- **Zéro Serveur** : Pas de base de données distante, pas de compte cloud requis.
- **Stockage Local (IndexedDB)** : Vos fichiers et projets sont conservés en toute sécurité dans l'espace de stockage de votre navigateur.
- **Flux RSS Autonome** : Générez votre flux compatible Apple/Spotify directement côté client.

---

## 🚀 Démarrage Rapide

### Hébergement (GitHub Pages)
1.  **Clonez** ce dépôt sur votre compte GitHub.
2.  **Activer GitHub Pages** dans `Settings > Pages` sur la branche `main`.
3.  **C'est prêt !** Votre studio est accessible à l'URL fournie par GitHub.

### Développement Local
```bash
# Clonez le dépôt
git clone https://github.com/votre-user/cloneAnchor.git

# Lancez un serveur statique local (exemple avec Python)
python -m http.server 8000
```
*Ouvrez `http://localhost:8000` dans votre navigateur.*

---

## 🛠️ Stack Technique
- **Vanilla JS (ES6+)** : Pas de frameworks lourds, performance maximale.
- **Web Audio API** : Pour le mixage multipiste et les effets de volume.
- **IndexedDB** : Pour la persistance des fichiers audio volumineux (via Native DB API).
- **Lame.js** : Encodage MP3 côté client.
- **CSS Grid & Variables** : Interface dynamique et thème Premium Dark.

---

## 🔒 Confidentialité & RGPD
Cette application est conforme au RGPD par conception :
- **Aucune transmission de données personnelles.**
- **Aucun cookie de traçage.**
- **Contrôle total** : Vous pouvez réinitialiser toutes les données locales en un clic dans les paramètres.

---

## 📄 Licence
Sous licence [MIT](LICENSE).

---
*Fait avec ❤️ pour les podcasteurs indépendants.*
