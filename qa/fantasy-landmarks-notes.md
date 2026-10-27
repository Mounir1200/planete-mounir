# UrdWell world-tree and HindSight observatory — original models

These are original procedural interpretations for the portfolio, not claimed replicas of a game asset or surveyed historic monument. Research photographs and screenshots are retained only under `qa/references`, outside the web bundle. No paid generation service, downloaded mesh or third-party texture is used.

## References visually inspected, 27 October 2026

### Tree

- [Amirdrassil in Azeroth, Wowhead's in-game screenshot](https://www.wowhead.com/classic/tw/news/amirdrassils-location-in-azeroth-a-new-dragon-isles-zone-336235), [source image](https://wow.zamimg.com/uploads/blog/images/37867-amirdrassils-location-in-azeroth-a-new-dragon-isles-zone.jpg), local `qa/references/world-tree-amirdrassil.jpg`.
- The reference informed a broad branching silhouette, curving buttresses, delicate individual leaves and luminous markings inset into bark. The turquoise fog, exact trunk and leaf shapes, and Blizzard's texture artwork are not reproduced.
- The original UrdWell composition uses a bent, fluted trunk, seven tapered roots embracing a mineral spring, eight primary limbs with secondary twigs, folded leaf geometry, hanging vines and three tiny seed lanterns. The opening at +Z stays accessible; the spring's stone rim has a real collision boundary. The sage, blue and lavender canopy has a gentle emissive night fade. Hairline sap veins follow the limb surfaces, and eight fine luminous tendrils descend from real branch tips. These are restrained emissive surfaces without extra lights, shafts or large bloom spheres.

### Observatory

- [Observatoire de la Côte d'Azur: historic site and virtual visit](https://geoazur.oca.eu/fr/ocavv).
- [OCA exterior photograph](https://www.oca.eu/images/videos/Image1.jpg), local `qa/references/nice-observatory-front.jpg`: masonry base, a clearly structured entrance, supported spherical dome.
- [OCA interior dome photograph](https://geoazur.oca.eu/images/visite-oca-mg/grandecoupoledome.jpg), local `qa/references/nice-observatory-dome.jpg`: curved structural ribs and a genuine open observing slit.
- [OCA historic instrument section](https://geoazur.oca.eu/images/visite-oca-mg/plan5.gif), local `qa/references/nice-observatory-section.gif`: long refractor on an independent central support, opening aligned with the telescope.
- HindSight is an original round pavilion with weathered copper panels, arched windows, a four-column stone entrance, a lower library wing and a small annex dome. Nice's exterior dome is white: the copper palette and round architectural layout here are creative choices, not factual claims about Nice. The large overhead floating rings are replaced by a small mechanical orrery on a pedestal.

## Geometry and playability

- `worldTree.js`: 41,610 triangles, 31 meshes after material batching; supported within pad radius 8. Trunk, roots and limbs use smoothly shaded variable-radius curved tubes. Leaves are distinct folded surfaces, not canopy spheres. The canopy colour/lighting pass preserves the original random sequence, root geometry and collision boundaries.
- `observatory.js`: approximately 44,000 triangles, 30 meshes after batching; supported within pad radius 7.5. The split copper shells leave a true constant-width opening across the zenith; the long telescope, guide scope, fork, counterweight and pedestal are visible inside it. Four steps and an entrance landing register walkable tops.
- Counts exclude the shared project beacon added by `Landmarks`. Materials are reused, roof seams and plant details are static-batched, and only the small mechanical orrery rotates.
- `node --test qa/fantasy-landmarks.test.mjs` validates finite vertices, footprint and render budgets, clear approach/spawn/beacon areas and the physical roof opening. GPU screenshots and ground-level inspection are a separate validation stage.

## Visual validation completed

`node qa/fantasy-preview.cjs` passed in Chrome: journal travel, the real destination prompt, E opening the correct project panel, then daylight, night and rear views for both models. Screenshots are `qa/screenshots/urdwell-new-{ground,day,night,rear}.png` and `qa/screenshots/hindsight-new-{ground,day,night,rear}.png`. Both sets were visually inspected. A protruding upper root joint was corrected and the UrdWell views captured again. Five geometry/playability tests pass after that correction. No browser runtime errors were emitted.

The final sage/blue/lavender night-readability pass was captured again with `PLANET_LANDMARKS=urdwell node qa/fantasy-preview.cjs`: actual journal travel and E interaction passed, followed by day/night/rear views with no browser errors. All four updated UrdWell screenshots were visually inspected: individual leaves remain visible at night, with fine luminous veins and tendrils, while the spring and entrance stay unobstructed. The capture script updates both the material library and landmark night state after stopping the animation loop. Five geometry/playability tests also pass for this final version.
