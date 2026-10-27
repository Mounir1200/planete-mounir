# Validation locale — 27 octobre 2026

- `npm run test:rust` : **8 tests natifs réussis** (gravité, marche tangentielle, vitesses, sauts, atterrissage, littoral, téléportation, fréquences de simulation).
- `npm test` : **46 tests réussis** (JavaScript, module WebAssembly réel, audio, clavier, caméra, géométrie, collisions, raccordement au terrain et ponton). Les cinq contrôles de l’arbre et de l’observatoire ont également été repassés après la dernière retouche du feuillage.
- `npm run build` : compilation Rust release puis Vite réussie, module `planet_core.wasm` de 29 Ko copié dans `dist/wasm/`.
- Scénarios de `test:browser` : bureau et mobile réussis, **18 contrôles UI**, cinq balises, finale, préférences, pause de la simulation Rust, mouvement clavier, saut tactile, absence de WebGL et contrôle du rendu des balises. L’attente après rechargement du test UI a été corrigée pour attendre `window.planet` ; les contrôles UI puis balises ont été relancés avec succès. Le navigateur de test est maintenant fermé même en cas d’échec.
- `node qa/production-smoke.cjs` sur `http://127.0.0.1:5181/` : quinze lieux, module Rust servi avec HTTP 200 et `application/wasm`, arrivée animée à l'ESAIP, interaction E, fermeture Échap et texte de prompt clair ; aucune erreur JavaScript ni ressource HTTP en échec.
- Les six bandes de marque des fiches ont été ouvertes et leurs images chargées contrôlées. Les arrivées ESSCA, ESAIP, RWU, KTU, Moov et salle de sport ont été vérifiées via les boutons du carnet, puis interaction E. Les captures Moov et gym ont également été contrôlées dans le navigateur visible.

Les captures sous `screenshots/` comprennent le port, les campus depuis le sol et leurs différentes façades. Les photographies de référence et leurs limites sont documentées dans `*-architecture-notes.md`. La correspondance visuelle est une revue humaine des images, pas une précision métrique déduite des tests.

## Seconde passe : six modèles

- Maison et belvédère : arrivée par le carnet, interaction E, ouverture des fiches et retour au jeu contrôlés dans Chrome ; cinq textures photographiques chargées et visionneuse fonctionnelle. `qa/atelier-mesh-check.mjs` vérifie les approches, les obstacles avec le vrai résolveur, les surfaces navigables et les valeurs finies. Six captures inspectées.
- UrdWell et HindSight : voyages, interaction E, rendu de jour, de nuit et arrière vérifiés. Le feuillage nocturne et les filaments de l’arbre, l’ouverture physique de la coupole et la lunette ont été inspectés dans les captures finales.
- Port : ponton praticable, trois bateaux sur la surface sphérique, coque et gréement inspectés depuis le ponton et en vue d’ensemble. Une intersection entre la barque et le bateau de pêche a été corrigée, puis les tests de flottaison et les deux captures ont été repassés.
- Avatar : portrait, face, trois-quarts et dos inspectés dans la scène locale `qa/avatar-preview.html`. Visage continu, normales de raccord corrigées, cheveux courts texturés, lunettes transparentes et articulations. 600 mises à jour d’animation contrôlées ; hauteur 2,016 unités et pieds au niveau zéro au repos. 23 028 triangles / 52 meshes.
- Budgets après fusion, hors balises : maison 19 411 triangles / 24 meshes ; belvédère 32 056 / 29 ; arbre 41 610 / 31 ; observatoire 44 144 / 30. Ce sont des budgets géométriques, pas des mesures de FPS.

Le build Rust/Vite et le contrôle de production sur 5181 ont été répétés après cette passe. Aucun échec d’asset ni erreur JavaScript dans le contrôle final. Le serveur temporaire 5181 a été arrêté ; le serveur de développement 5180 reste disponible.

## Troisième passe : Ouagadougou et laboratoire IA

- Ouagadougou : Maison du Peuple reconstruite d’après les photographies WMF et la notice de la liste indicative UNESCO. Façade elliptique, quarante lanternons séparés, reliefs de brique, escaliers et deux éléphants. L’entrée respecte la hauteur du personnage. Contrôle CPU final : 39 152 triangles, 27 meshes, 30 obstacles, 3 plateformes ; circulation, colonnes et séparation des chapeaux vérifiées.
- Labo IA : architecture inspirée du Cyber Valley I construit à Tübingen, équipements inspirés de photos de l’ETH. Façades inclinées, étage haut en retrait, atrium, robot articulé, trois baies de calcul et deux postes visibles à travers la façade. Les abords du biome utilisent désormais une palette de campus planté. Contrôle CPU final : 28 104 triangles / 28 meshes, hors enseigne canvas.
- `npm test` : **48 tests réussis**. Les deux contrôles du laboratoire et le contrôle Ouaga ont été repassés après leurs dernières retouches.
- `node qa/reference-landmarks-preview.cjs` : arrivées réelles par le carnet, prompt du bon lieu, ouverture avec E et fermeture avec Échap ; aucune erreur JavaScript. Dix captures de jour, de nuit, de dos, depuis le sol et en détail inspectées. Les jardinières et le flanc haut du labo ont été corrigés puis recapturés.
- `npm run build` : compilation Rust/WebAssembly puis Vite réussie après les finitions des deux modèles. Les photos utilisées pour les références restent dans `qa/references`, hors du bundle public.

Les tests navigateur automatisés utilisent Chrome avec SwiftShader ; les performances sur les appareils réels restent dépendantes du GPU, de la résolution et du réglage de qualité. Les tests de physique et le chargement de production ont été réalisés avec le module compilé du projet, sans substitution JavaScript.
