import { BRANDS } from '../../content/brands.js';
import { brandPlaque } from './brandPlaque.js';
import { bench, plaza } from './common.js';
import { plantingStrip } from './townDetails.js';

// Recognisable campus landmarks, drawn from the universities' own photographs.
// They represent the institutions, not an assertion about Mounir's lecture rooms.
// Source images, observed features and modelling limits: qa/erasmus-architecture-notes.md.
const SILVER = '#c2c9c9';
const GLASS = ['#667d88', '#718b97', '#536e7a', '#8b9ea4'];

function window(kit, { x = 0, y, z, width, height, rotation = 0, mullion = true, tint = 0, frame = SILVER }) {
  const group = kit.group({ x, y, z, ry: rotation });
  kit.box(width + 0.06, height + 0.06, 0.065, '#455861', { parent: group, y: -0.03 });
  kit.box(width, height, 0.025, kit.materials.glow('#e8d0a3', {
    day: 0.015, night: 0.35, base: GLASS[tint % GLASS.length],
  }), { parent: group, z: 0.045, shadow: false });
  [-width / 2, width / 2].forEach(px => kit.box(0.023, height + 0.04, 0.08, frame, { parent: group, x: px, y: -0.02, z: 0.04 }));
  [0, height, height * 0.76].forEach(py => kit.box(width, 0.024, 0.08, frame, { parent: group, y: py - 0.012, z: 0.04 }));
  if (mullion) kit.box(0.025, height, 0.08, frame, { parent: group, z: 0.04 });
  return group;
}

function rwuBlock(kit, x, z, width, depth, height = 3.2) {
  kit.box(width, height, depth, '#c3bca9', { x, z, y: 0.03 });
  kit.box(width + 0.04, 0.14, depth + 0.04, '#888c87', { x, z, y: -0.06 });
  kit.box(width + 0.12, 0.17, depth + 0.12, '#b3a58f', { x, z, y: height - 0.03 });
  kit.box(width - 0.14, 0.035, depth - 0.14, '#73766c', { x, z, y: height + 0.14 });
  kit.collideBox(x, z, width + 0.08, depth + 0.08);
}

// Continuous concrete bands, horizontal blinds and the external silver frame
// distinguish RWU's H building from a generic glass office.
function rwuFacade(kit, { x = 0, z = 0, width, rotation = 0, columns = 9 }) {
  const group = kit.group({ x, z, ry: rotation });
  for (let floor = 0; floor < 3; floor += 1) {
    const y = 0.25 + floor * 0.99;
    const cell = width / columns;
    for (let bay = 0; bay < columns; bay += 1) {
      const pane = window(kit, { x: -width / 2 + (bay + 0.5) * cell, y, z: 0.045,
        width: cell - 0.065, height: 0.72, tint: bay + floor, mullion: false });
      pane.removeFromParent(); group.add(pane);
      // Partially lowered exterior blinds, as in the official courtyard view.
      const slats = floor === 0 ? 2 : ((bay + floor) % 4 === 0 ? 3 : 7);
      for (let slat = 0; slat < slats; slat += 1) {
        kit.box(cell - 0.055, 0.012, 0.065, '#a8b3b4', { parent: group,
          x: -width / 2 + (bay + 0.5) * cell, y: y + 0.66 - slat * 0.075, z: 0.14, shadow: false });
      }
    }
    kit.box(width + 0.05, 0.13, 0.16, '#e1e0d6', { parent: group, y: y - 0.18, z: 0.1 });
  }
  for (let bay = 0; bay <= columns; bay += 1) {
    const px = -width / 2 + bay * width / columns;
    kit.box(0.022, 2.94, 0.035, SILVER, { parent: group, x: px, y: 0.16, z: 0.235 });
    kit.bar([px, 3.08, 0.235], [px, 3.29, 0.04], 0.022, SILVER, { parent: group });
  }
  return group;
}

function globeLamp(kit, x, z) {
  kit.cylinder(0.025, 0.035, 2.05, SILVER, { x, z, segments: 8 });
  kit.sphere(0.16, kit.materials.glow('#f3eedc', { day: 0.03, night: 1.5, base: '#eeeedd' }), { x, z, y: 2.1 });
  kit.collideCircle(x, z, 0.1);
}

export function buildRwu(kit, { loadTexture } = {}) {
  plaza(kit, 5.78, '#d3cec0');
  // Three-level H building, with a projecting wing and recessed courtyard.
  rwuBlock(kit, 0, -2.45, 8.1, 1.9);
  rwuBlock(kit, -2.65, -0.1, 2.8, 2.85);
  rwuBlock(kit, 2.95, -1.35, 2.2, 0.8);
  rwuFacade(kit, { x: 0, z: -1.48, width: 8, columns: 14 });
  rwuFacade(kit, { x: -2.65, z: 1.345, width: 2.7, columns: 5 });
  rwuFacade(kit, { x: -1.23, z: -0.1, width: 2.75, rotation: Math.PI / 2, columns: 5 });
  rwuFacade(kit, { x: -4.075, z: -1.03, width: 4.7, rotation: -Math.PI / 2, columns: 8 });
  rwuFacade(kit, { x: 2.95, z: -0.925, width: 2.13, columns: 4 });
  rwuFacade(kit, { x: 4.075, z: -2.18, width: 2.36, rotation: Math.PI / 2, columns: 4 });
  rwuFacade(kit, { x: 0, z: -3.425, width: 8, rotation: Math.PI, columns: 14 });

  // Rectangular brick-red rooftop plant enclosures from the aerial photograph.
  [[-0.65, -2.45, 2.5, 1.1, 0.69], [-2.65, -1.15, 1.65, 1.1, 0.49], [1.03, -2.48, 0.8, 1.1, 0.48]].forEach(([x, z, w, d, h]) => {
    kit.box(w, h, d, '#88594b', { x, z, y: 3.37 });
    kit.box(w + 0.08, 0.045, d + 0.08, '#b6ac9b', { x, z, y: 3.37 + h });
  });
  kit.cylinder(0.012, 0.016, 1.1, '#a7acad', { x: -0.5, z: -2.4, y: 4.05, segments: 5 });
  kit.box(0.65, 0.012, 0.02, '#a7acad', { x: -0.5, z: -2.4, y: 4.9 });
  [-0.23, 0, 0.23].forEach(x => kit.box(0.012, 0.02, 0.21, '#a7acad', { x: x - 0.5, z: -2.4, y: 4.9 }));

  // Glazed vestibule sits in front of the rear wing. Its entrance faces +Z.
  const vestibule = kit.group({ x: 0.55, z: -1.03 });
  kit.box(1.55, 0.07, 0.9, '#49666d', { parent: vestibule, y: 1.03 });
  [-0.72, 0.72].forEach(x => kit.box(0.035, 1.03, 0.035, '#49666d', { parent: vestibule, x, z: 0.39 }));
  window(kit, { x: 0.55, z: -0.625, y: 0.1, width: 1.38, height: 0.9 });
  kit.collideBox(0.55, -1.05, 1.5, 0.86);
  brandPlaque(kit, BRANDS.rwu, loadTexture, { x: 0.55, y: 1.53, z: -1.255, width: 1.7, height: 0.6 });

  // Narrow entrance path and grassy courtyard match the photographed approach.
  plantingStrip(kit, -0.7, 2.7, 0.65, 2.8, { color: '#7c9f57' });
  plantingStrip(kit, 2.1, 1.7, 1.2, 3.0, { color: '#7c9f57' });
  plantingStrip(kit, -2.8, 2.2, 2.3, 0.6, { color: '#6e9457' });
  bench(kit, -2.8, 3.35);
  globeLamp(kit, -0.4, 0.8);
  globeLamp(kit, 1.65, 3.6);
  return { interactAt: [0.55, 0.7], labelHeight: 6.0 };
}

function ktuWindows(kit, { x, z, width, columns, rotation = 0, rear = false }) {
  const group = kit.group({ x, z, ry: rotation });
  const cell = width / columns;
  for (let bay = 0; bay < columns; bay += 1) {
    const px = -width / 2 + (bay + 0.5) * cell;
    for (let floor = 0; floor < 4; floor += 1) {
      const pane = window(kit, { x: px, y: 0.63 + floor * 1.04, z: 0.035,
        width: cell * 0.59, height: 0.75, tint: bay + floor, frame: '#6b7779', mullion: false });
      pane.removeFromParent(); group.add(pane);
    }
    const basement = window(kit, { x: px, y: 0.13, z: 0.04, width: cell * 0.52, height: 0.26, tint: bay, mullion: false });
    basement.removeFromParent(); group.add(basement);
    if (!rear) kit.box(cell * 0.25, 3.38, 0.16, '#d0cdc1', { parent: group, x: px - cell / 2, y: 1.5, z: 0.14 });
  }
  return group;
}

export function buildKtu(kit, { loadTexture } = {}) {
  plaza(kit, 5.78, '#c7c8c1');
  const stone = '#d0cdc1';
  const plinth = '#9a9286';
  const edge = '#b4b0a5';
  // K. Donelaičio 73: the long, flat-roofed modernist former Land Bank.
  kit.box(8.8, 5.0, 2.7, stone, { z: -1.15, y: 0.03 });
  kit.box(8.86, 0.51, 2.76, plinth, { z: -1.15, y: -0.05 });
  kit.box(8.88, 0.07, 2.78, '#73756f', { z: -1.15, y: 5.03 });
  kit.box(8.6, 0.04, 2.5, '#777a73', { z: -1.15, y: 5.1 });
  kit.collideBox(0, -1.15, 8.9, 2.8);
  ktuWindows(kit, { x: 0, z: 0.225, width: 8.52, columns: 15 });
  ktuWindows(kit, { x: 0, z: -2.525, width: 8.52, columns: 15, rotation: Math.PI, rear: true });
  ktuWindows(kit, { x: -4.425, z: -1.15, width: 2.5, columns: 4, rotation: -Math.PI / 2, rear: true });
  ktuWindows(kit, { x: 4.425, z: -1.15, width: 2.5, columns: 4, rotation: Math.PI / 2, rear: true });
  // Continuous cornices and a high smooth parapet; no fictional stepped gable.
  [0.47, 1.46, 4.83].forEach(y => kit.box(8.9, 0.08, 0.2, edge, { y, z: 0.27 }));
  kit.box(8.8, 0.36, 0.13, stone, { y: 4.9, z: 0.23 });
  kit.box(8.94, 0.06, 0.21, '#888b82', { y: 5.26, z: 0.23 });
  // Two shallow vertical risalits with three very narrow glazing strips.
  [-3.48, 1.52].forEach(x => {
    kit.box(0.98, 5.05, 0.19, edge, { x, z: 0.325, y: 0.45 });
    [-0.29, 0, 0.29].forEach((offset, i) => {
      const pane = window(kit, { x: x + offset, y: 0.73, z: 0.435, width: 0.15, height: 4.0, mullion: false, tint: i, frame: '#777d79' });
      for (let floor = 1; floor < 5; floor += 1) kit.box(0.17, 0.1, 0.025, stone, { parent: pane, y: floor * 0.78, z: 0.1 });
    });
    kit.box(1.04, 0.07, 0.28, '#85877f', { x, z: 0.325, y: 5.49 });
  });
  // The square portico is offset to the right, as on the official museum photo.
  const doorX = 3.05;
  kit.box(1.98, 0.12, 1.0, edge, { x: doorX, z: 0.62, y: 2.12 });
  kit.box(1.85, 0.55, 0.22, stone, { x: doorX, z: 1.02, y: 1.57 });
  [-0.8, 0.8].forEach(offset => {
    kit.box(0.25, 1.64, 0.85, stone, { x: doorX + offset, z: 0.65 });
    kit.collideBox(doorX + offset, 0.65, 0.25, 0.85);
  });
  kit.box(1.35, 1.5, 0.035, '#3d4543', { x: doorX, z: 0.29, y: 0.32 });
  kit.box(0.04, 1.4, 0.04, '#8b8b7a', { x: doorX, z: 0.33, y: 0.37 });
  brandPlaque(kit, BRANDS.ktu, loadTexture, { x: doorX, y: 1.83, z: 1.145, width: 1.5, height: 0.6 });
  // Each visible step is a registered walkable plane.
  for (let step = 0; step < 4; step += 1) {
    const depth = 1.15 - step * 0.22;
    const top = 0.115 + step * 0.08;
    const z = 1.15 - step * 0.11;
    kit.box(1.5, top, depth, '#aaa69a', { x: doorX, z });
    kit.platform(doorX, z, 1.5, depth, top);
  }
  // Horizontal stone joints on the basement course, all sides modelled.
  [0.2, 0.42].forEach(y => {
    kit.box(8.84, 0.012, 0.015, '#827e72', { y, z: 0.243 });
    kit.box(8.84, 0.012, 0.015, '#827e72', { y, z: -2.543 });
  });
  // A Lithuanian tricolour identifies the photographed institutional entrance.
  const poleX = 4.33;
  kit.cylinder(0.018, 0.022, 2.85, '#c0c8c7', { x: poleX, z: 1.3, segments: 6 });
  ['#eabf3f', '#3d8158', '#ae4a43'].forEach((color, index) => {
    kit.box(0.55, 0.14, 0.018, color, { x: poleX + 0.28, y: 2.65 - index * 0.14, z: 1.3, shadow: false });
  });
  kit.collideCircle(poleX, 1.3, 0.08);
  plantingStrip(kit, -1.75, 1.15, 3.7, 0.6, { color: '#668858' });
  bench(kit, -2.7, 3.25);
  return { interactAt: [doorX, 2.15], labelHeight: 7 };
}
