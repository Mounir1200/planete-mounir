# ESSCA Angers — références de la maquette

Vérification : 27 octobre 2026. Bâtiment modélisé dans `src/world/landmarks/esscaCampus.js`.

## Identification et sources primaires

- [Page officielle du campus d’Angers](https://www.essca.eu/les-campus/angers/) : adresse **1 rue Joseph Lakanal, 49000 Angers**, quartier Belle-Beille. La page mentionne 17 200 m² de locaux et un environnement arboré. Cette surface n’est pas utilisée comme plan coté.
- [Kit média officiel ESSCA](https://www.essca.eu/a-propos/espace-presse-de-l-essca/kit-media/).
- [Photographie officielle du campus, 2024](https://www.essca.eu/app/uploads/2024/11/campus-essca-angers-2024-essca.jpg). Copie locale de référence : `qa/references/essca-official-front.jpg`. Image effectivement ouverte et examinée avant modélisation : aile gauche saillante, volumes blancs bas, vitrage du hall, bandeaux de fenêtres, cage d’escalier étroite, panneau rouge, clôture et drapeaux.
- [Réalisation ESSCA Angers — SECOMALU](https://www.secomalu.com/realisation-facade-rideaux-menuiserie-metallerie-vendee.html). Le façadier identifie ESSCA Angers, maîtrise d’œuvre ROLLAND / GTB, maîtrise d’ouvrage ESSCA. [Photographie du parvis](https://www.secomalu.com/images/essca.jpg), examinée visuellement et conservée dans `qa/references/essca-secomalu.jpg` : trame de la façade rideau, encadrement saillant des fenêtres hautes, marches et garde-corps.
- Logo ESSCA : SVG officiel fourni par `BRANDS.essca`, sans redessin ni recoloration ; provenance dans `public/brands/SOURCES.md`.

## Éléments reproduits

Ensemble horizontal en retour d’angle autour d’un parvis ouvert. Aile gauche plus haute et avancée, hall vitré en retrait, longues fenêtres hautes dans un encadrement béton saillant, extension droite plus basse et baie d’escalier verticale étroite. Menuiseries gris aluminium, vitrage gris bleuté, façades blanches, panneau rouge et signalétique officielle. Le parvis possède de petites marches, des plantations basses, des mâts et une clôture interrompue pour laisser passer le joueur.

La tour fictive, la grosse bulle holographique et les livres flottants de l’ancien lieu ne sont pas repris. La balise de projet reste un objet du jeu distinct de l’architecture.

## Limites explicites

Il s’agit d’une **interprétation 3D stylisée fondée sur des photographies**, pas d’un relevé architectural ni d’une reproduction métrique exacte. Les proportions sont condensées dans le rayon 7,5 du monde jouable. Les nombres de baies sont adaptés à la lisibilité à cette échelle ; les arrières, non visibles sur les deux références exploitées, prolongent le vocabulaire architectural observé sans prétendre reproduire leur disposition exacte. L’implantation est orientée pour le parcours du jeu, pas selon le nord réel. Aucun intérieur, plan d’étage ou géoréférencement exact n’est revendiqué.

Les photographies servent à la vérification locale et ne sont pas placées dans les textures publiques du jeu. Les éléments physiques conservés possèdent des collisions ; les marches ont des surfaces marchables. Le centre du portail, le point d’interaction `[0, 0.45]` et l’apparition du joueur `[0, 2.05]` restent libres.
