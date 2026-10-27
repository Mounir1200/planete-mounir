import { BRANDS } from '../../content/brands.js';
import { brandPlaque } from './brandPlaque.js';
import { bench, plaza } from './common.js';
import { plantingStrip } from './townDetails.js';

// ESSCA, 1 rue Joseph Lakanal, Angers. Modelled from ESSCA's 2024
// official campus photograph and the façade contractor's entrance photograph.
// The low L-shaped wings, inset ribbon windows, glazed hall and taller narrow
// stair bay replace the former fictional tower. See qa/essca-architecture-notes.md.
const WHITE = '#e9e8e3';
const EDGE = '#c8cac5';
const FRAME = '#87938f';
const ROOF = '#929995';
const BASE = '#8b9290';

function glazing(kit, { x = 0, y = 0.35, z = 0, width, height, columns = 6, rows = 2, rotation = 0 }) {
  const group = kit.group({ x, y, z, ry: rotation });
  const glassTints = ['#738e96', '#698892', '#87a0a6', '#68828c'];
  const cellWidth = width / columns;
  const cellHeight = height / rows;
  kit.box(width + 0.07, height + 0.07, 0.065, '#4e626a', { parent: group, y: -0.035, z: -0.035 });
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const glass = kit.materials.glow('#f0ce95', {
        day: 0.015, night: 0.38,
        base: glassTints[(column * 3 + row) % glassTints.length],
      });
      kit.box(cellWidth - 0.035, cellHeight - 0.035, 0.028, glass, {
        parent: group, x: -width / 2 + (column + 0.5) * cellWidth,
        y: row * cellHeight + 0.0175, z: 0.005, shadow: false,
      });
    }
  }
  for (let column = 0; column <= columns; column += 1) {
    kit.box(0.028, height, 0.075, FRAME, { parent: group, x: -width / 2 + column * cellWidth, z: 0.028 });
  }
  for (let row = 0; row <= rows; row += 1) {
    kit.box(width, 0.025, 0.075, FRAME, { parent: group, y: row * cellHeight - 0.0125, z: 0.028 });
  }
  return group;
}

function ribbon(kit, { x, z, width, y = 3.15, height = 0.72, rotation = 0, columns = 10 }) {
  const group = kit.group({ x, z, ry: rotation });
  kit.box(width + 0.24, height + 0.26, 0.16, EDGE, { parent: group, y: y - 0.13 });
  // A projecting rectangular concrete surround is a distinctive part of this campus.
  kit.box(width + 0.32, 0.1, 0.24, WHITE, { parent: group, y: y + height + 0.05, z: 0.035 });
  kit.box(width + 0.32, 0.1, 0.24, WHITE, { parent: group, y: y - 0.15, z: 0.035 });
  [-1, 1].forEach(side => kit.box(0.11, height + 0.3, 0.24, WHITE, {
    parent: group, x: side * (width / 2 + 0.105), y: y - 0.15, z: 0.035,
  }));
  const pane = glazing(kit, { width, height, y, columns, rows: 1 });
  pane.removeFromParent();
  group.add(pane);
  pane.position.z = 0.095;
}

function building(kit, x, z, width, depth, height) {
  kit.box(width, height, depth, WHITE, { x, z, y: 0.06 });
  kit.box(width + 0.06, 0.22, depth + 0.06, BASE, { x, z, y: -0.06 });
  kit.box(width - 0.16, 0.08, depth - 0.16, ROOF, { x, z, y: height + 0.06 });
  [-1, 1].forEach(side => {
    kit.box(width, 0.11, 0.09, EDGE, { x, z: z + side * (depth / 2 - 0.04), y: height + 0.06 });
    kit.box(0.09, 0.11, depth, EDGE, { x: x + side * (width / 2 - 0.04), z, y: height + 0.06 });
  });
  kit.collideBox(x, z, width + 0.04, depth + 0.04);
}

function campusLamp(kit, x, z) {
  kit.cylinder(0.033, 0.045, 2.55, '#525e62', { x, z, segments: 8 });
  kit.box(0.28, 0.055, 0.13, '#525e62', { x: x + 0.09, z, y: 2.5 });
  kit.box(0.2, 0.016, 0.09, kit.materials.glow('#ffe2aa', { day: 0.1, night: 2 }), { x: x + 0.1, z, y: 2.49, shadow: false });
  kit.collideCircle(x, z, 0.1);
}

export function buildEssca(kit, { loadTexture } = {}) {
  const brand = BRANDS.essca;
  plaza(kit, 7.25, '#d4d1c5');

  // The left teaching wing projects toward the street; the entrance is recessed.
  building(kit, -4.1, -0.8, 3.2, 6.4, 4.4);
  building(kit, 0.2, -3.05, 5.6, 1.9, 3.65);
  building(kit, 4.2, -2.4, 2.5, 3.2, 2.95);

  // Tall glazing and white piers beneath the upper ribbon on the left wing.
  for (let bay = 0; bay < 6; bay += 1) {
    const z = -3.55 + bay * 0.98;
    glazing(kit, { x: -2.485, y: 0.3, z, width: 0.66, height: 2.55, columns: 2, rows: 3, rotation: Math.PI / 2 });
    glazing(kit, { x: -5.715, y: 0.42, z, width: 0.68, height: 2.34, columns: 2, rows: 3, rotation: -Math.PI / 2 });
  }
  ribbon(kit, { x: -2.47, z: -1.1, width: 4.95, y: 3.25, height: 0.7, rotation: Math.PI / 2, columns: 11 });
  ribbon(kit, { x: -5.72, z: -0.8, width: 5.55, y: 3.25, height: 0.7, rotation: -Math.PI / 2, columns: 12 });
  // The red end panel and cantilevered white upper frame are visible in the official photo.
  kit.box(0.83, 2.8, 0.06, brand.primary, { x: -2.99, z: 2.435, y: 0.2 });
  glazing(kit, { x: -4.53, y: 0.3, z: 2.44, width: 1.95, height: 2.55, columns: 3, rows: 3 });
  kit.box(3.31, 0.2, 0.22, WHITE, { x: -4.1, y: 3.05, z: 2.46 });
  brandPlaque(kit, brand, loadTexture, { width: 2.55, height: 0.85, x: -4.1, y: 3.8, z: 2.445 });

  // Main curtain-wall hall: two glass levels under a concrete classroom band.
  glazing(kit, { x: 0.05, y: 0.33, z: -2.08, width: 4.65, height: 2.13, columns: 9, rows: 3 });
  ribbon(kit, { x: 0.05, z: -2.02, width: 4.62, y: 2.85, height: 0.55, columns: 10 });
  // Main doorway sits inside the grid, with narrow aluminium handles and transom.
  [-0.27, 0.27].forEach(x => kit.box(0.025, 0.34, 0.045, '#d5dcda', { x, y: 0.82, z: -1.97 }));
  kit.box(1.2, 0.045, 0.11, FRAME, { x: 0, y: 1.66, z: -2.005 });

  // A narrow raised stair bay, not a freestanding tower.
  kit.box(0.96, 4.32, 0.8, WHITE, { x: 2.5, z: -1.75, y: 0.06 });
  glazing(kit, { x: 2.5, y: 0.28, z: -1.335, width: 0.75, height: 3.88, columns: 2, rows: 10 });
  kit.box(0.1, 4.42, 0.15, EDGE, { x: 2.01, z: -1.29 });
  kit.box(0.1, 4.42, 0.15, EDGE, { x: 2.99, z: -1.29 });
  kit.box(1.08, 0.1, 0.94, EDGE, { x: 2.5, y: 4.32, z: -1.75 });
  kit.collideBox(2.5, -1.75, 1.04, 0.9);

  glazing(kit, { x: 4.25, y: 0.4, z: -0.785, width: 2.07, height: 2.12, columns: 4, rows: 3 });
  glazing(kit, { x: 5.465, y: 0.45, z: -2.4, width: 2.6, height: 1.94, columns: 5, rows: 3, rotation: Math.PI / 2 });
  kit.box(2.25, 0.12, 0.17, EDGE, { x: 4.25, y: 2.58, z: -0.76 });

  // Back elevations use the same observed vocabulary. Their exact bay counts
  // are inferred because the published reference images show the forecourt.
  ribbon(kit, { x: 0.1, z: -4.03, width: 4.68, y: 2.85, height: 0.55, rotation: Math.PI, columns: 10 });
  glazing(kit, { x: 0.1, y: 0.42, z: -4.025, width: 4.7, height: 1.96, columns: 9, rows: 3, rotation: Math.PI });
  ribbon(kit, { x: -4.1, z: -4.03, width: 2.55, y: 3.25, height: 0.7, rotation: Math.PI, columns: 5 });
  glazing(kit, { x: -4.1, y: 0.45, z: -4.025, width: 2.45, height: 2.25, columns: 4, rows: 3, rotation: Math.PI });
  glazing(kit, { x: 4.2, y: 0.42, z: -4.025, width: 2.06, height: 2.05, columns: 4, rows: 3, rotation: Math.PI });
  [-5.55, -2.7, 5.3].forEach(x => kit.cylinder(0.025, 0.025, 2.9, '#a1aaa6', { x, z: -4.07, y: 0.05, segments: 6 }));

  // The steps shown by the façade contractor, each paired with a walkable top.
  for (let step = 0; step < 3; step += 1) {
    const depth = 1.1 - step * 0.3;
    const top = 0.115 + step * 0.08;
    const z = -1.53 - step * 0.15;
    kit.box(3.6, top, depth, '#bdbdb2', { x: -0.15, z });
    kit.platform(-0.15, z, 3.6, depth, top);
  }
  [-1.85, 1.55].forEach(x => {
    kit.bar([x, 0.22, -1.95], [x, 0.83, -1.95], 0.035, '#8d9999');
    kit.bar([x, 0.09, -0.92], [x, 0.69, -0.92], 0.035, '#8d9999');
    kit.bar([x, 0.83, -1.95], [x, 0.69, -0.92], 0.04, '#8d9999');
  });

  plantingStrip(kit, -1.95, 1.0, 0.52, 2.15, { color: '#7f9d59' });
  plantingStrip(kit, 4.5, 0.35, 1.4, 0.8, { color: '#7f9d59' });
  plantingStrip(kit, 0.2, -4.45, 4.5, 0.47, { color: '#698d51' });
  // Short fence sections evoke the street boundary while keeping the play route open.
  for (const side of [-1, 1]) {
    const center = side * 3.8;
    for (let picket = 0; picket < 13; picket += 1) {
      kit.box(0.018, 0.7, 0.024, '#515b5d', { x: center - 1.08 + picket * 0.18, z: 3.7, y: 0.04 });
    }
    [0.18, 0.56].forEach(y => kit.box(2.23, 0.025, 0.025, '#515b5d', { x: center, z: 3.7, y }));
    kit.collideBox(center, 3.7, 2.3, 0.08);
  }

  // Two red institutional banners are visible on the official street photograph.
  [3.65, 4.6].forEach((x, index) => {
    const z = 1.15 + index * 0.12;
    kit.cylinder(0.026, 0.035, 3.1, '#a8b0ad', { x, z, segments: 8 });
    kit.box(0.5, 0.85, 0.025, brand.primary, { x: x + 0.26, y: 2.1, z, shadow: false });
    kit.collideCircle(x, z, 0.1);
  });

  // Welcome totem, matching the red/white entrance sign without fictional artwork.
  kit.box(0.62, 1.6, 0.12, brand.primary, { x: 1.95, z: 1.6 });
  brandPlaque(kit, brand, loadTexture, { width: 0.56, height: 0.31, x: 1.95, y: 1.28, z: 1.67 });
  kit.collideBox(1.95, 1.6, 0.7, 0.2);
  bench(kit, -4.1, 3.0);
  campusLamp(kit, -1.35, 3.45);
  campusLamp(kit, 1.35, 3.45);
  return { interactAt: [0, 0.45], beaconAt: [3.55, 2.75], labelHeight: 6.2 };
}
