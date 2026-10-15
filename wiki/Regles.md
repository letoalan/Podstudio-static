# Règles d'ingénierie et de contribution

Pour préserver la lisibilité, la modularité et la pérennité de l'application, l'équipe applique 5 règles strictes vérifiées automatiquement à chaque commit et dans le pipeline CI.

## Tableau des règles imposées

| Règle | Intitulé | Description & Contrôle |
|---|---|---|
| **R1** | **Stack Vite.js** | Stack moderne en modules ES natifs, build Vite et tests Vitest (`package.json`). |
| **R2** | **Limite de 200 lignes** | Aucun fichier de code, style, test, wiki ou documentation ne peut excéder 200 lignes (`scripts/check-lines.mjs`). |
| **R3** | **Fonctions courtes** | Aucune fonction ne doit dépasser 40 lignes de logique (ESLint `max-lines-per-function`). |
| **R4** | **Documentation Wiki** | Chaque fichier de `src/` doit posséder sa fiche wiki dédiée dans `wiki/modules/` (`scripts/check-wiki.mjs`). |
| **R5** | **Modularité stricte** | Responsabilité unique, aucune dépendance circulaire (`eslint-plugin-import`). |

## Définition du « Terminé » (Definition of Done)

Un fichier ou module est considéré comme terminé et recevable uniquement si :
1. Son code compte strictement moins de 200 lignes.
2. Toutes ses fonctions font au maximum 40 lignes.
3. Des tests unitaires dédiés valident son comportement.
4. Sa page wiki associée détaille son rôle, ses dépendances et son API.
5. `npm run ci` s'exécute avec succès sans aucune erreur ni avertissement.
