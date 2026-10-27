# Maison-atelier et belvédère photographique

Direction : créations originales inspirées de l’architecture angevine, sans prétendre représenter l’adresse de Mounir ni reproduire un monument historique précis. Références consultées et réellement ouvertes en images le 27 octobre 2026.

## Références visuelles

- [AEC — maison angevine, matériaux et typologie](https://www.aec49.fr/angers/maison-angevine-habitat-typique/). [Photographie du tissu bâti angevin](https://www.aec49.fr/wp-content/uploads/maison-angevine.jpg), conservée pour inspection dans `qa/references/maison-angevine.jpg`. Visible : façades de pierre claire, couvertures d’ardoise, mansardes brisées, rangées de lucarnes à frontons cintrés, corniches et cheminées. Le panorama n’est pas présenté comme une photo d’une maison précise à copier.
- [Musées d’Angers — galerie David d’Angers](https://musees.angers.fr/lieux/galerie-david-d-angers/index.html), source municipale. [Vue de la nef et de la verrière](https://musees.angers.fr/uploads/tx_opening/lieuillu_gda.jpg), conservée dans `qa/references/galerie-david-exterieur.jpg` (le nom local est historique : il s’agit bien d’une vue intérieure). Visible : tuffeau clair, arcades profondes, réseaux de nervures de la verrière et contraste entre pierre ancienne et métal/verre.
- [Vue de la mezzanine](https://musees.angers.fr/typo3temp/assets/_processed_/1/d/csm_parcours_histoire_1_6d86e0897b.jpg), conservée dans `qa/references/galerie-david-verriere.jpg`. Visible : moulures de pierre et menuiseries bois des espaces d’exposition. Aucun moulage ni sculpture du musée n’est reproduit dans le jeu.

## Traduction en jeu

`home.js` : composition originale de maison-atelier, avec mansarde à quatre pans, terrassons supérieurs, deux lucarnes cintrées, bow-window à trois faces, verrière latérale avec étagères, porte cobalt et laiton, auvent vitré sur consoles, gouttières et descentes, cheminée maçonnée avec mitrons, parterres et jardin clos ouvert sur un chemin central. Les faces latérales et arrière sont dessinées. Les marches correspondent à des surfaces navigables.

`belvedere.js` : galerie ouverte en fer à cheval et cinq arcades réelles ajourées, colonnes profilées, verrière nervurée sur plan courbe, terrasse à joints radiaux et rose des vents, balustrade profilée, bancs et longue-vue. Les cinq photographies fournies par le contexte du jeu sont réellement chargées et encadrées, avec leur ratio original et un matériau sans émission pour préserver leur lecture. Les références externes servent uniquement à la conception; elles ne sont pas utilisées comme textures de produit.

`atelierGeometry.js` : vocabulaire géométrique dédié, comprenant boîtes à arêtes adoucies, arcs extrudés avec trous et biseaux, profils tournés et rails courbes. Les matériaux sont mutualisés par bâtiment. Le contrat des builders et les coordonnées locales suivent le système existant. Aucun changement du moteur, de `Kit`, de l’interface ou du terrain n’est requis.

Budget demandé : moins de 45 000 triangles et 60 appels de dessin par bâtiment après fusion, textures comprises. Statistiques et contrôle visuel consignés lors de validation.

Contrôle géométrique `qa/atelier-mesh-check.mjs` : maison 19 411 triangles / 24 appels de dessin, belvédère 32 056 triangles / 29 appels de dessin (photos et textes inclus), aucun NaN dans les positions ou normales. Les deux points d’apparition sont hors des obstacles ; les bases de terrasse et les marches ont des surfaces de marche déclarées. Ces contrôles statiques ne remplacent pas l’inspection des captures.

## Validation intégrée

`qa/atelier-inspect.cjs` passe dans Chrome à 1 440 × 900 : arrivée normale par l’introduction, ouverture de la Maison par **E**, fermeture par Échap, voyage vers le Belvédère via le carnet, ouverture par **E**, ouverture d’une vraie photo dans la visionneuse puis retour à la fiche et au jeu. Les cinq textures photo de la scène sont effectivement chargées (`complete` et `naturalWidth > 0`). Aucune erreur JavaScript navigateur. Le navigateur est fermé à la fin du script.

Les six captures `qa/screenshots/atelier-{maison,galerie}-{gameplay,front,rear}.png` ont été inspectées : mansarde et lucarnes, verrière latérale, profondeur des fenêtres, corniches et arrière de la maison sont lisibles ; la galerie montre bien ses cinq photos, les arcades ajourées, la verrière et la circulation centrale. Les captures `gameplay` utilisent la caméra et les arrivées du jeu ; les vues `front` et `rear` emploient une caméra d’inspection pour vérifier les faces cachées.

Le contrôle de circulation exécute le vrai `Landmarks.resolveCollisions` avec le rayon joueur réel de 0,45, sur des pas de déplacement courts : chemin central jusqu’au perron de la Maison libre ; mur de façade et verrière latérale solides ; entrée et centre du Belvédère libres ; cadres photo et balustrade extérieure bloquants. Il s’agit d’une simulation CPU du résolveur, en complément du parcours navigateur et non d’un parcours clavier exhaustif autour de chaque élément.
