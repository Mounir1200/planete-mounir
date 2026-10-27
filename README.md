# Planète Mounir

Portfolio jouable de Mounir DABIRE : une petite planète à explorer, quinze lieux, cinq balises de projets et huit compétences à découvrir. Français et anglais, clavier/souris et commandes tactiles.

**En ligne : https://mounir1200.github.io/planete-mounir/**

## Lancer le projet

Prérequis : Node.js 22.12+ et Rust stable, avec la cible WebAssembly.

```powershell
rustup target add wasm32-unknown-unknown
npm install
npm run dev -- --host 127.0.0.1 --port 5180
```

Ouvrir http://127.0.0.1:5180/. Sous Windows, le script retrouve aussi Cargo dans `%USERPROFILE%\.cargo\bin` si le terminal ne l'a pas dans son PATH. La variable `CARGO` permet d'indiquer un autre exécutable.

```powershell
npm run test:rust
npm test
npm run build
npm run preview -- --port 5181
```

`dev` et `build` compilent le cœur Rust en mode release et copient son module dans `public/wasm/planet_core.wasm`. Le crate n'a aucune dépendance externe et compile avec Cargo `--offline` une fois Rust et sa cible installés. Le résultat de production se trouve dans `dist/` ; il doit être servi en HTTP, pas ouvert avec `file://`.

## Déploiement

Chaque push sur `main` déclenche `.github/workflows/deploy.yml` : installation de Node et Rust (cible WebAssembly), `npm test`, `npm run build`, puis publication de `dist/` sur GitHub Pages.

## Jouer

- ZQSD / WASD / flèches : déplacement ; Maj : courir ; Espace : saut et double saut.
- Glisser la souris : regarder ; molette : distance de caméra.
- E : ouvrir le lieu proche ; J : carnet et voyages ; M : carte ; N : jour/nuit.
- Échap : fermer une fiche ou ouvrir la pause. Les réglages permettent de réduire les mouvements, alléger l'interface, changer la qualité et activer le son.
- Mobile : joystick et boutons tactiles. Le carnet donne aussi directement accès au contenu.

La progression et les préférences sont enregistrées localement dans le navigateur sous `planete-mounir:v1`. Aucun compte ni serveur applicatif n'est nécessaire. Le son nécessite une activation volontaire.

## Architecture

- `rust/planet-core/` : simulation du joueur, accélération, vitesse tangentielle, gravité radiale, double saut, atterrissage et événements de pas. Module WebAssembly chargé par `src/core/RustPhysics.js`.
- `src/player/PlayerController.js` : adaptateur entre la simulation Rust et les requêtes de terrain/collisions Three.js. Il n'y a pas de simulation JavaScript de secours silencieuse.
- `src/world/` : planète, terrain, chemins, mer, végétation et bâtiments procéduraux. Les plateaux sont des plans tangents raccordés au relief ; rendu et marche utilisent le même échantillonnage.
- `src/world/landmarks/` : campus et lieux, géométrie, collisions, plateformes et animations. Le port calcule la flottaison des bateaux sur la surface sphérique de l'océan.
- `src/content/` : parcours, projets, traductions, photos, marques et emplacements.
- `src/ui/` : carnet, fiches, galerie, carte et réglages accessibles au clavier.

Le rendu reste Three.js/WebGL, conformément au choix Rust/WebAssembly + Three.js. Python n'est pas requis pour développer ou exécuter le portfolio.

## Références architecturales

Les campus ESSCA Angers, ESAIP Angers, RWU, KTU, le siège historique Moov Africa Burkina et une salle Basic-Fit d'Angers sont reproduits de façon stylisée à partir de photographies réelles. Les formes reconnaissables sont conservées, les proportions et les parties non documentées sont adaptées à la planète. Ce ne sont pas des relevés architecturaux cotés. Les autres lieux conservent une liberté de création.

La zone Ouagadougou reprend la Maison du Peuple, documentée par les photographies du World Monuments Fund. Le Labo IA reprend le vocabulaire architectural de Cyber Valley I à Tübingen, avec un aménagement de démonstration inspiré des équipements du Robotic Fabrication Lab de l'ETH Zurich. Ces références décrivent les décors ; les fiches conservent le parcours et les projets de Mounir.

Voir [les références et limites](ARCHITECTURE_REFERENCES.md), ainsi que [les sources des logos officiels](public/brands/SOURCES.md). Les photographies de recherche sous `qa/references/` ne sont pas distribuées dans `dist/`.

La seconde passe de modélisation comprend une maison-atelier angevine, un belvédère photographique sous verrière, un arbre-monde, un observatoire à coupole ouverte, un port avec trois bateaux détaillés, un bureau de poste Art déco, un phare breton et un avatar articulé sans visage aux couleurs de Mounir. Ces modèles sont créés dans les builders locaux, avec fusion des géométries statiques par matériau. Les balises restent visibles depuis l’orbite, avec un faisceau atténué au sol pour préserver les détails.

## Vérification

`npm test` couvre notamment le raccordement du terrain, les plateformes, les collisions, la caméra, le clavier, l'audio et le pont Rust/WebAssembly. `npm run test:rust` teste la simulation native. Pour les scénarios navigateur, démarrer le serveur local puis lancer :

```powershell
npm run test:browser
```

Ces scénarios utilisent Playwright et Chrome installé, avec WebGL logiciel pour le contrôle automatisé. `PLANET_URL` permet de tester un autre serveur. Ils couvrent les voyages, les cinq balises, la finale, les réglages, la sauvegarde, le clavier, le tactile et l'absence de WebGL. Les captures sont enregistrées dans `qa/screenshots/`. Ces contrôles ne constituent pas une mesure de performances sur tous les appareils.

Avec le build servi sur le port 5181, `node qa/production-smoke.cjs` vérifie aussi le chargement HTTP du WebAssembly, les quinze lieux et l'arrivée animée à l'ESAIP avec les réglages de mouvement par défaut.

Le paramètre local `?debug=1` expose `window.planet` pour les captures et diagnostics. Le chargement du module Rust peut être confirmé avec `planet.player.physics.backend` et le compteur `planet.player.physics.steps`.
