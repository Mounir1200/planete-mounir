# Moov Africa Burkina — référence architecturale

Vérifié le 27 octobre 2026. Le builder `src/world/landmarks/moovCampus.js` représente une interprétation miniature du siège historique ONATEL / Moov Africa Burkina à Ouagadougou. Il remplace l'antenne générique ; il ne modifie pas la fiche professionnelle de 2024.

## Identification et choix du bâtiment

- [BRVM, fiche officielle de l'émetteur](https://www.brvm.org/en/node/355) : société ONATEL-SA / Moov Africa Burkina Faso, adresse **705, avenue de la Nation, Ouagadougou**. La fiche professionnelle locale décrit une expérience Data engineering en 2024 ; aucune source consultée ne permet d'identifier le bureau ou l'étage personnel de Mounir.
- [Ministère de la Transition digitale, pose de première pierre du nouveau siège](https://www.mdenp.gov.bf/details-agenda?cHash=3df0a7c663880c6b01051e823478c171&tx_news_pi1%5Baction%5D=detail&tx_news_pi1%5Bcontroller%5D=News&tx_news_pi1%5Bnews%5D=1160), publication du 5 février 2026 : le nouveau siège ZACA est un projet lancé le 3 février 2026. Ses rendus d'architecture n'ont donc pas été utilisés pour illustrer une expérience de 2024.

## Photographies réellement inspectées

Les trois images suivantes ont été ouvertes et examinées visuellement dans le navigateur, pas seulement décrites par les résultats de recherche.

1. [Publication du compte Moov Africa Burkina sur LinkedIn](https://bf.linkedin.com/company/moovafricaburkina), cérémonie d'avril 2026 ; [photographie inspectée](https://media.licdn.com/dms/image/v2/D4D22AQEt-MRUDxGogg/feedshare-shrink_800/B4DZ1n7ajrHEAc-/0/1775565122768?e=2147483647&t=5O8EZwrx8AnqkvLWz_1Ijs5OVlkg_xZKT70S_3sjrUo&v=beta). Vue de la cour : bâtiment de plusieurs niveaux, grands montants et linteau carrelés ivoire formant un portail rectangulaire en retrait, pilastres saumon, fenêtres régulières, pelouse et haies taillées, mât. C'est la référence principale du volume et de la cour.
2. [LeFaso.net, reportage du 7 avril 2026](https://lefaso.net/spip.php?article145565) ; [photographie rapprochée inspectée](https://lefaso.net/IMG/jpg/3-8164.jpg). L'article situe la cérémonie à la direction générale de Ouagadougou. La photo confirme le carrelage carré clair, les encadrements saumon et les fenêtres à cadres clairs.
3. [Bourse News, article du 10 mai 2017 sur ONATEL](https://boursenews.ma/article/actualite/burkina-faso-la-filiale-de-maroc-telecom-reagi-a-la-hausse-des-prix-pratiquee-par-les-filiales-d-orange-cote-d-ivoire-et-mali) ; [photographie inspectée](https://boursenews.ma/uploads/actualites/59131b2863d5c.jpg). Vue rapprochée d'une tour arrondie carrelée terre cuite et d'un mur ivoire portant l'ancienne enseigne ONATEL. Ce cliché documente le vocabulaire de la cage d'escalier arrondie ; il ne suffit pas à établir un relevé complet du plan.

## Traduction 3D et limites

- Reprise des matériaux visibles : ivoire, saumon et enduit ocre clair. Les couleurs orange/bleu de la marque sont réservées au logo et aux détails de signalétique ; elles ne remplacent pas les couleurs photographiées de la façade.
- Corps compact à quatre niveaux, portail monumental, tour latérale arrondie, fenêtres en retrait, socle enterré, jardin taillé et drapeau burkinabè. La parcelle est réduite pour tenir sur le plateau de rayon 6 unités.
- Aucun relevé de métrés ni vue complète de l'arrière n'a été trouvé : proportions, position relative de la tour, nombre de travées et façades arrière/latérales sont une reconstruction stylisée cohérente, pas une restitution architecturale exacte.
- Les trois petits paquets lumineux au-dessus du toit sont un effet de portfolio évoquant le traitement de données. Aucun grand pylône radio n'est ajouté comme prétendu élément réel.
- Le logo est chargé par `brandPlaque` depuis l'asset officiel et les couleurs contrôlées dans `src/content/brands.js` ; provenance dans `public/brands/SOURCES.md`.
- Les photos servent de référence de conception. Elles ne sont pas copiées dans les assets distribués du portfolio.

## Vérifications techniques

Le builder produit des faces sur les quatre côtés, une fondation basse, un volume fermé, des collisions pour le bâtiment, les poteaux, la tour, les arbres et le mât. L'accès à la fiche reste `[0, 2.7]`, en dehors des obstacles. Le toit et les vitres ne sont pas des plateformes accessibles ; le terrain reste la surface de marche du parvis.
