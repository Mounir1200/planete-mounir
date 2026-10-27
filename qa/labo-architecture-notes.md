# Le Labo — built references and original procedural model

Research and modelling date: 27 October 2026. This is a compact, stylized architectural interpretation for Mounir's portfolio, not a surveyed replica, an ETH/Cyber Valley affiliation claim, or a claim that Mounir worked in either institution. Existing ChartMind / academic-project content is preserved.

## Primary architecture: Cyber Valley I, Tübingen

The primary reference is the **built** Cyber Valley I research building by Heinle Wischer, not a proposal render. The architect lists completion in October 2025; its photographs show the finished exterior and interior. The earlier IMPRS news item describes the opening research facility in July 2025, while the architect describes the formal November 2025 opening. Dates refer to different milestones; the model does not display an inauguration date.

- [Heinle Wischer project page](https://www.heinlewischer.de/projekte/detail/universitaet-tuebingen-neubau-innovationscampus-cyber-valley-1-bauabschnitt/) — primary architecture and photographs, credited there to Brigida González.
- [IMPRS-IS, Cyber Valley Building Opens in Tübingen](https://imprs.is.tue.mpg.de/news/cyber-valley-building-opens-in-tubingen-a-new-hub-for-ai-research) — confirms the AI/robotics research use and built laboratory/atrium programme.

The following photographs were opened and visually inspected, not merely found in search results:

1. [Exterior, lowered shades](https://www.heinlewischer.de/fileadmin/projekte/18-053_tuebingen_cyber_valley/1.jpg), `qa/references/labo-cyber-valley-exterior.jpg`: ribbed white ground floor, stepped upper mass, repeated inclined metal frames and horizontal photovoltaic spandrels.
2. [Same exterior, open shades](https://www.heinlewischer.de/fileadmin/projekte/18-053_tuebingen_cyber_valley/2.jpg), `qa/references/labo-cyber-valley-open-shades.jpg`: actual windows behind the outer prism structure; open and closed shades are distinct components.
3. [Atrium](https://www.heinlewischer.de/fileadmin/projekte/18-053_tuebingen_cyber_valley/5.jpg), `qa/references/labo-cyber-valley-atrium.jpg`: white gallery bands, slender frames, glazed rooms and an open central volume.
4. [Interior ceiling and signage](https://www.heinlewischer.de/fileadmin/projekte/18-053_tuebingen_cyber_valley/9.jpg), `qa/references/labo-cyber-valley-interior.jpg`: exposed service trays, linear luminaires and suspended acoustic panels.
5. [Glazed workspace partitions](https://www.heinlewischer.de/fileadmin/projekte/18-053_tuebingen_cyber_valley/11.jpg), `qa/references/labo-cyber-valley-glass-partitions.jpg`: light timber floor, slender silver framing, ordinary research furniture.

The model keeps five levels with a stepped top volume, a white ribbed base, metallic tilted facade supports, dark spandrels, some lowered textile shades, rooftop solar panels and an atrium. Its footprint and floor heights are compressed to the game's 7.5-unit clearing. Exact dimensions, structural engineering, facade-module counts and the original trapezoidal ground plan are not reproduced.

## Secondary equipment reference: ETH Robotic Fabrication Lab

- [ETH Architecture and Building Systems: Robotic Fabrication Lab](https://systems.arch.ethz.ch/rfl/robotic-fabrication-lab), built 2010–2016 in Arch_Tec_Lab.
- [Research hall photograph](https://images.squarespace-cdn.com/content/v1/5f743dde37014f676c1544f6/1608122887340-S6MEVI3PD0ZEC16N5IEI/RFL_copyright%2BAndrea%2BDiglas_ITA_Arch-Tec-Lab%2BAG_small%2Bmit%2Bcopy%2Binfo.jpg), `qa/references/labo-eth-robotics.jpg`, credited to Andrea Diglas / ITA / ETH Zurich on the image. Visually inspected: jointed industrial manipulators, rails, cables, suspended linear lights, full-height glazing and a clear work floor.

The in-game equipment arrangement is original. Its smaller manipulator stands on a floor pedestal, rather than replicating ETH's overhead gantry installation. It has separated shoulder/elbow/wrist joints, a cable route, a two-finger gripper and a work fixture. Three server racks include individual units, ventilation slots and status lights; two desks have physical monitors, chart pixels, keyboards, mice and chairs. None of these are claimed to document the actual equipment inside Cyber Valley I.

The original opaque front base has deliberately been opened into a glazed demonstration workshop so equipment can be seen from the normal player camera. A central doorway and lobby corridor remain physically accessible. The sign says only `LABO IA`; no institutional logo is added. The old dome, crystals, floating charts and purple neon circles are absent from the new builder.

## Implementation and validation

- Builder: `src/world/landmarks/aiLaboratory.js`, export `buildLabo(kit)`.
- After static material batching: **28,104 triangles, 28 mesh draw calls** in the CPU test. The browser adds one small canvas-text sign. Budget: 60,000 triangles / 60 draws. No imported mesh, texture, paid API or downloaded image is used in the game bundle.
- All vertices are finite, the radial footprint stays within 7.5, travel arrival is supported, and the central approach from outside into the lobby is clear. The interior floor has a walkable platform; equipment bays have collision boundaries.
- Screens, status indicators and strip lights use restrained emission; selected equipment surfaces fade gently brighter at night, so the interior can be read without point-light beams or broad bloom.
- `node --test qa/labo-architecture.test.mjs`: two tests pass. The parent's browser test also passed real travel, destination prompt, E interaction and day/night rendering. All five `qa/screenshots/labo-reference-{day,ground,night,detail,rear}.png` views were visually inspected: equipment is readable behind the front glass by day and night, and the stepped mass, ribbed base and tilted facade correspond to the inspected references.
- That inspection identified two small finish issues: the planter contents looked like bare rods, and the inner side of the uppermost floor lacked its facade. Both are corrected: green folded succulent rosettes replace the rods, and the same prismatic glazing/shade system now wraps the upper inner side. The two CPU tests pass again. The final parent capture verified both localized finishes, including the planted front detail and the completed upper facade from the rear.

Photographs stay in `qa/references` as development references, outside `public` and the shipped web bundle. Their original copyrights remain with their credited owners.
