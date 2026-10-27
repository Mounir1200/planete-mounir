# Port ADQUA — seconde passe de modélisation

Création originale pour le jeu. L’ambiance de vieux port atlantique est nourrie par une recherche visuelle sur [le Vieux-Port et les tours de La Rochelle](https://www.nous-larochelle.fr/fr/information-touristique/patrimoine-culturel/tours-de-la-rochelle), sans prétendre reproduire son plan ni ses monuments. Aucun modèle téléchargé ni texture extérieure n’est intégré.

`src/world/landmarks/harbourCraft.js` construit les coques à partir d’un contour courbe et de cinq profils de largeur/hauteur. Le voilier possède un pont, des hublots, une cabine aux arêtes adoucies, un cockpit, une barre, un gréement et deux voiles bombées. Le bateau de pêche dispose de vitres, de défenses, d’une bouée et de casiers. La barque possède des bancs et des avirons. Chaque bateau est fusionné par matériau avant d’être placé sur la mer sphérique ; la flottaison animée conserve cette normale locale.

La capitanerie comporte deux niveaux, des ouvertures cintrées, corniches, volets, toiture à rangs d’ardoises et cheminée. Le quai rejoint un ponton en T et une digue courbe fondée sous l’eau. Les pieux, cordages, bollards, feu de navigation et auvent de marché complètent les volumes. Les plateformes navigables et les obstacles restent raccordés à la simulation existante.

`qa/harbour-grounding.test.mjs` contrôle une marche réelle du quai au bout du ponton et la flottaison bornée des trois bateaux après fusion des géométries. `qa/harbour-preview.cjs` capture la vue d’ensemble et le ponton dans le jeu. Ces vérifications ne constituent pas un relevé architectural ni une simulation nautique.
