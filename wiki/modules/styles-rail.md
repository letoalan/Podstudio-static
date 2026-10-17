# Module `styles-rail`

## Rôle
Styles du rail vertical de blocs, pastilles numérotées, connecteurs, barre d'outils et capsule d'insertion ("Nouveau bloc" / "Transition").

## Dépendances
- Aucune

## Sélecteurs principaux
- `.block-card` : conteneur de la carte bloc
- `.block-rail-badge` : pastille numérotée sur le rail
- `.rail-insert-slot` : zone d'insertion intermédiaire et en bas de liste
- `.rail-insert-capsule` : conteneur capsule glassmorphique
- `.btn-insert-trigger` : bouton central `＋` avec rotation au survol/sélection
- `.btn-insert-wing` : ailes latérales dépliables animées
- `.btn-insert-block` : aile "Nouveau bloc"
- `.btn-insert-trans` : aile "Transition"
- `.block-selected-tools` : boîte à outils du bloc actif

## Tests liés
[`tests/ui-block-list.test.js`](../../tests/ui-block-list.test.js)
