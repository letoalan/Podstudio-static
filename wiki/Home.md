# Bienvenue sur le Wiki de PodStudio

PodStudio est un studio complet d'enregistrement, de montage audio multipiste et de publication de podcasts, s'exécutant à 100 % dans le navigateur web (technologie PWA, sans serveur de traitement).

## Objectifs du projet

- **Autonomie complète** : Fonctionne hors-ligne et conserve toutes les données en local via IndexedDB.
- **Accessibilité & Simplicité** : Conçu pour les créateurs, enseignants et élèves.
- **Qualité audio** : Moteur de mixage Web Audio API et export MP3 haute fidélité via LAME.
- **Publication simplifiée** : Génération de flux RSS 2.0 conformes aux normes Apple Podcasts.

## Structure de la documentation

- [Architecture](./Architecture.md) : Modèle architectural en couches (`ui` -> `audio` -> `core`).
- [Règles du projet](./Regles.md) : Contraintes strictes de qualité (R1 à R5, max 200 lignes).
- [Journal des décisions](./Journal-decisions.md) : Historique des choix d'ingénierie et d'architecture.
- [Guide utilisateur](./Guide-utilisateur.md) : Guide pas-à-pas pour enregistrer, monter et exporter.
- [Documentation des modules](./modules/) : Spécification technique de chaque fichier de code.
