# Salle de sport — Basic-Fit Angers, rue Clément Ader

Références vérifiées le 27 octobre 2026. Le club réel a été choisi comme référence architecturale pour le lieu « musculation ». Ce choix ne signifie pas que Mounir est adhérent ou fréquente cet établissement.

## Sources et vues inspectées

1. [Page officielle du club Basic-Fit Angers rue Clément Ader](https://www.basic-fit.com/fr-fr/clubs/basic-fit-angers-rue-clement-ader-24-7-99e36662cac44b399eea0ee2abb6b31a.html) : adresse dans le quartier Saint-Serge à Angers. Sa galerie fournit la photographie extérieure et les vues de la zone de poids libres utilisées ci-dessous. Les offres commerciales, horaires et tarifs ne sont pas intégrés au jeu.
2. [Photographie extérieure officielle, club 4449](https://brand.basic-fit.com/match/KP_Number/4449/Club_area/Front_club_outside/Front_club_outside), ouverte et inspectée dans le navigateur. Elle montre un bâtiment allongé à deux niveaux, deux rangées de vitrages, un bandeau de bardage rouge horizontal, deux avant-corps anthracite avec enseignes orange et deux marquises plates. Cette photographie est la référence principale, pas un modèle de hangar générique.
3. [Photographie intérieure officielle, poids libres](https://brand.basic-fit.com/match/KP_Number/4449/Club_area/Free_weight_zone_1/Free_weight_zone_1?io=transform%3Afit%2Cwidth%3A700), également inspectée. Bancs noirs/gris, racks et disques graphite à touches orange, longs supports d'haltères, structures tubulaires et éclairage industriel. Les machines du modèle sont des interprétations géométriques de ce vocabulaire.
4. [Hurban, opération de réhabilitation à Angers](https://www.hurban.fr/angers-49-programme-31.html) : programme de loisirs dans les quais de Saint-Serge, environ 2 000 m² sur deux niveaux, livré en 2020, architecte Agence FAAR. [Vue de projet inspectée](https://www.hurban.fr/uploads/images/programme/image1_31_1579518091.jpg) : elle renseigne la silhouette générale et le retour latéral, mais paraît être une illustration architecturale et n'est pas présentée comme une photographie de l'état livré.

## Modèle et limites

- `src/world/landmarks/gym.js` exporte `buildGym(kit, context)`.
- Façade longue vitrée, deux étages, bardage rouge nervuré, deux panneaux d'enseigne anthracite en relief, auvents plats et enseigne latérale ; logo Basic-Fit officiel appliqué sans fond blanc ni déformation. Provenance du logo dans `public/brands/SOURCES.md`.
- Le bâtiment est miniaturisé sur un plateau de rayon 6,5. Aucun plan coté n'a été obtenu : les dimensions, le nombre de travées, la distribution intérieure et la façade arrière sont simplifiés pour le jeu.
- Matériel visible derrière les vitrages : rack à barre, bancs, rangement d'haltères, station à câbles, tapis de course et vélo. Les éléments de cardio complètent l'interprétation d'une salle de sport ; aucune marque ou référence commerciale précise de machine n'est revendiquée.
- Porte principale ouverte, passage central au rez-de-chaussée et collisions autour des murs, vitrages fixes, machines basses, jardinières et arceaux vélos. L'étage est scénique : il ne reçoit pas de plateforme de collision, afin que le contrôleur radial existant ne transporte pas le visiteur sur un plancher situé au-dessus de sa tête.
- Socle enterré, sol bas légèrement au-dessus du terrain, volumes fermés sur les côtés et à l'arrière. Les vues photographiques ne sont pas distribuées avec le portfolio.
