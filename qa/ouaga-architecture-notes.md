# Ouagadougou — Maison du Peuple

Référence réelle choisie pour remplacer le bâtiment pseudo-sahélien. La zone conserve son rôle biographique « Origines · CPGE La Salle » ; la maquette n’affirme aucun lien scolaire avec ce monument. Modélisation procédurale originale d’après photographies, avec proportions comprimées pour le rayon de place de 7 unités, et non relevé architectural.

## Sources consultées et images réellement inspectées

- [Notice déposée par le Burkina Faso sur la liste indicative UNESCO](https://whc.unesco.org/en/tentativelists/6939/) : béton brut, deux niveaux, au moins quarante lanternons pyramidaux à ventilation passive, paire de sculptures d’éléphants. Il s’agit d’une **liste indicative**, pas d’une inscription au patrimoine mondial.
- [World Monuments Fund — La Maison du Peuple, Ouagadougou](https://www.wmf.org/projects/la-maison-du-peuple-ouagadougou) : référence photographique principale. La page a été conservée dans `qa/references/ouaga-wmf-source.html`.
- [Vue extérieure](https://wmf.imgix.net/images/2f_ouagadougou_maison_du_peuple.jpeg) → `qa/references/ouaga-wmf-exterior.jpg` : volume courbe ocre, façade à panneaux de brique en relief, auvent d’entrée bas et grilles, éléphants sur socles cylindriques.
- [Vue latérale](https://wmf.imgix.net/images/65_bfa_la_maison_du_peuple_ouagadougou_05.jpg) → `qa/references/ouaga-wmf-05.jpg` : escaliers projetés, parapets pleins et répartition des motifs.
- [Détail extérieur](https://wmf.imgix.net/images/bf_bfa_la_maison_du_peuple_ouagadougou_06.jpg) → `qa/references/ouaga-wmf-06.jpg` : lanterneaux à gorge inclinée, larges chapeaux débordants, fins contreventements et couronnements cannelés.
- [Auditorium](https://wmf.imgix.net/images/5b_bfa_la_maison_du_peuple_ouagadougou_04.jpg), [passage intérieur](https://wmf.imgix.net/images/1b_bfa_la_maison_du_peuple_ouagadougou_07.jpg), [vue sous une pyramide de lumière](https://wmf.imgix.net/images/ac_bfa_la_maison_du_peuple_ouagadougou_08.jpg) → fichiers `ouaga-wmf-04.jpg`, `07.jpg`, `08.jpg` dans le même dossier. La trame triangulaire est visible.

Ces photographies sont uniquement des références de conception et de vérification, pas des textures ou images redistribuées dans `public/`.

## Interprétation en jeu

`src/world/landmarks/ouagadougou.js` construit un volume elliptique et sa corniche horizontale, quarante lanternons distincts, une peau courbe à panneaux de brique, les escaliers extérieurs, le porche et la paire d’éléphants. Les toitures restent séparées de leurs bases avec des ouvertures et des entretoises. Le nombre est documenté ; leur implantation exacte et leurs dimensions sont une interprétation compacte des vues disponibles. Les sculptures sont stylisées dans un état entretenu, sans prétendre refléter l’état actuel du site. Aucun monument du cinéma n’a été ajouté.

Le sol et les marches d’entrée ont des plateformes déclarées ; le corps elliptique, les escaliers techniques et les socles des sculptures sont solides. Les escaliers supérieurs ne constituent pas un itinéraire jouable. Le monument est entièrement statique et n’impose donc aucun mouvement en mode réduit. Matériaux mutualisés ; aucune texture distante ni animation additionnelle.

## Validation

Contrôle CPU : `node qa/ouaga-mesh-check.mjs`. Résultat final : **39 152 triangles, 27 appels de dessin, 40 lanternons, 30 obstacles, 3 plateformes**. Positions et normales finies. Le test de séparation sur les vrais sommets des chapeaux garantit l’absence d’intersection entre lanternons. Le point d’arrivée et le passage central sont libres ; le corps, les socles et les colonnes de porche sont vérifiés avec le vrai résolveur du jeu.

Les captures finales du parent (`qa/reference-landmarks-preview.cjs`, le 27 octobre 2026) ont été inspectées dans `qa/screenshots/ouaga-reference-{ground,day,night,rear,detail}.png`, puis comparées aux photographies WMF : courbure du volume, panneaux de brique, séparation des chapeaux, paire d’éléphants, escaliers et raccords de façade lisibles. La vue `ground` correspond à l’arrivée réelle par le carnet ; le script ouvre la fiche avec **E** et la referme avec Échap avant les vues d’inspection. La hauteur libre sous l’auvent est portée à 2,10 unités au-dessus du perron supérieur, pour l’avatar de 2,016 unités. Le dernier ajout de quatre colliders aux colonnes du porche ne modifie aucun pixel des captures.
