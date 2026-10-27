# Erasmus campus landmarks — photographic reconstruction

Checked 27 October 2026. These small procedural buildings replace the fictional chalet and stepped-gable castle. They are stylised reconstructions of identifiable real institutional buildings. The portfolio establishes exchanges at RWU and KTU; it does not establish which rooms Mounir attended, so the models do not make that claim.

## RWU: building H, Doggenriedstraße 70, Weingarten

Primary sources:

- [Official RWU campus guide](https://www.rwu.de/studium/studienorganisation/rwu-campus) explicitly identifies Gebäude H as its main building.
- [Official Electrical Engineering and Computer Science faculty page](https://www.rwu.de/hochschule/fakultaeten/elektrotechnik-und-informatik) gives the H building's visitor address as Doggenriedstraße 70, 88250 Weingarten.
- [Official courtyard photograph](https://www.rwu.de/sites/default/files/2025-08/gebaeude-h.jpg), inspected locally as `qa/references/rwu-h-official.jpg`.
- [Official aerial photograph, credited RWU 2023](https://www.rwu.de/sites/default/files/2025-08/rwu_luftbild_hauptgebaeude_foto_rwu_2023.jpg), inspected locally as `qa/references/rwu-aerial-official.jpg`.

Observed features retained: low three-level wings around an inset entrance court; cream horizontal concrete bands; continuous silver-framed windows; exterior venetian blinds and projecting vertical supports; flat dark roofs, raised red-brown rectangular service volumes and aerial; a small glazed entrance box; a paved approach through low planting; spherical lamp heads. Rear elevations continue the same window and blind vocabulary. The large campus wings have been compressed into the existing six-unit playable radius. The adjoining worksite visible in the 2023 aerial is omitted, because it is not evidence for the finished H building.

## KTU: central administration, K. Donelaičio g. 73, Kaunas

Primary sources:

- [KTU Museum's immovable heritage page](https://museum.ktu.edu/heritage/) identifies the administration building at K. Donelaičio St. 73 as the former Land Bank, designed by K. Reisonas, built in 1933–1935.
- [Official museum photograph](https://museum.ktu.edu/wp-content/uploads/sites/320/2017/07/CR.jpg), inspected locally as `qa/references/ktu-central-official.jpg`.
- [Current KTU institutional contacts](https://ktu.edu/kontaktai/struktura/) confirm the administration's address.

Observed features retained: the long pale modernist façade and flat roof; basement course in darker stone; four window levels; strong vertical strips between upper windows; two shallow raised vertical bays with narrow glazing; the projecting rectangular entrance at the right; broad shallow steps and the Lithuanian flag. The gabled brick building, conical turret, basketball hoop and snow roof of the former fictional model are removed. Side and rear bay counts are inferred from the visible front rather than surveyed.

## Scale, identity and verification

- Neither model is a measured architectural survey. Dimensions, bay counts, landscaping and rear elevations are simplified for the planet and third-person camera.
- The original university logos are reused through `brandPlaque`; their provenance is recorded in `public/brands/SOURCES.md`. The plaques are navigation aids, not a claim that today's exact signage appears at these precise positions on the source photos.
- The official photographs are research references under `qa/references`; they are not used as facade textures or distributed in the web bundle.
- `node --test qa/erasmus-architecture.test.mjs` verifies footprint, silhouette, collision-free arrival/interaction and supported KTU entrance steps. Browser screenshots separately verify the rendered result.
