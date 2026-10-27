# ESAIP — campus d’Angers / Saint-Barthélemy-d’Anjou

Sources vérifiées et images ouvertes visuellement le 27 octobre 2026.

## Références officielles

- [Campus d’Angers — ESAIP](https://www.esaip.org/hub-vie-de-campus/campus-d-angers/) : adresse 18 rue du 8 mai 1945, Saint-Barthélemy-d’Anjou, campus dans un parc arboré.
- [Galerie officielle des portes ouvertes Angers](https://www.esaip.org/journees-portes-ouvertes-angers/) : contient les trois images ci-dessous, explicitement dans la section campus d’Angers.
- [Façade du bâtiment contemporain](https://www.esaip.org/wp-content/uploads/2023/01/une-article-rentree-ambitieuse-esaip-1-1024x576.jpg), référence locale `qa/references/esaip-campus-rentree.jpg`. Photo effectivement vue : volumes blancs rectangulaires à toitures plates, trois niveaux, baies vitrées sombres en retrait, façade d’angle plus pleine, rez-de-chaussée en retrait soutenu par un poteau en Y, liaison/atrium vitré sur la droite.
- [Vue depuis l’étang du parc](https://www.esaip.org/wp-content/uploads/2023/03/Campus-Esaip-3-1024x684.jpg), référence locale `qa/references/esaip-campus-3.jpg`. Photo effectivement vue : hauteur étagée, aile plus basse, grandes travées vitrées et petites fenêtres verticales, arrière tout aussi construit que l’avant.
- [Accès au parc et bâti ancien](https://www.esaip.org/wp-content/uploads/2023/03/Campus-Esaip-1-1024x684.jpg), référence locale `qa/references/esaip-campus-1.jpg`. Photo effectivement vue pour le contexte arboré. Le château visible n’est pas prétendu être le bâtiment contemporain représenté.
- [Identité ESAIP renouvelée le 18 septembre 2026](https://www.esaip.org/actualite/une-nouvelle-identite-visuelle-pour-lesaip/) : le modèle utilise l’identité actuelle « ESAIP Engineering School », même si les photos du bâtiment portent l’ancienne enseigne. Provenance des logos et couleurs dans `public/brands/SOURCES.md`.

## Traduction en miniature

`src/world/landmarks/esaipCampus.js` représente le bâtiment contemporain, et non un château scolaire imaginaire. Les marqueurs architecturaux conservés sont les trois niveaux blancs, le toit plat mince, les baies sombres rythmées et en retrait, l’angle en porte-à-faux avec poteau en Y, le volume vitré latéral, ainsi que l’aile arrière étagée. Aucune coiffe ni symbole flottant générique n’est ajouté.

Les dimensions et distances sont volontairement comprimées pour la place de rayon 6,5 du jeu : ce n’est pas un relevé architectural. Les photos ne donnent pas de plan complet; l’agencement du retour arrière, le mobilier et le nombre réduit de travées constituent une interprétation de miniature. Les vrais matériaux restent blancs/gris/verre, tandis que le bleu officiel est réservé à la signalétique. Les accès et collisions sont explicitement construits pour la navigation du joueur.

Le logo original reste une texture non redessinée et non déformée sur un matériau non éclairé (`MeshBasicMaterial`, `toneMapped:false`). La façade reçoit un panneau de 2,6 unités de large et un second panneau bas permet sa lecture depuis le chemin. L’émission est nulle. Le seuil global de bloom doit rester au-dessus de 1 pour ne pas faire rayonner le blanc SDR.
