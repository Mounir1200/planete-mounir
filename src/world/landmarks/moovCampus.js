import { MeshBasicMaterial, Shape, ShapeGeometry } from 'three';
import { BRANDS } from '../../content/brands.js';
import { brandPlaque } from './brandPlaque.js';
import { plaza } from './common.js';

// Stylised historic ONATEL / Moov Africa headquarters, Ouagadougou.
// The cream tiled portal, salmon piers and rounded stair tower come from
// inspected photographs; see qa/moov-architecture-notes.md for limits/sources.
export function buildMoov(kit, { loadTexture } = {}) {
  const brand = BRANDS.moov;
  const cream = '#e6e0d2';
  const salmon = '#d39982';
  const inset = '#c6a18c';
  const joint = '#c2bbad';
  const glass = '#52737d';
  const frame = '#eae9df';
  const trim = '#b8b2a5';
  const centreZ = -1.45;
  const frontZ = 0.71;
  const backZ = -3.61;
  const buildingHeight = 6.15;

  plaza(kit, 6.03, '#c5b39a');
  // The entire building bears on the terrain plane, with a buried stone footing.
  kit.box(9.4, 0.28, 4.5, '#b5aa95', { y: -0.22, z: centreZ });
  kit.box(9.2, buildingHeight, 4.3, cream, { z: centreZ });
  kit.box(9.35, 0.17, 4.43, cream, { y: buildingHeight, z: centreZ });
  kit.box(8.83, 0.035, 3.9, '#a9a59a', { y: buildingHeight + 0.17, z: centreZ });

  // Floor bands and salmon-coloured structural rhythm wrap around all sides.
  for (let floor = 0; floor < 4; floor++) {
    const base = 0.32 + floor * 1.4;
    kit.box(9.22, 0.11, 4.32, salmon, { y: base, z: centreZ });
    for (const x of [-3.62, -2.48, 2.48, 3.62]) {
      facadeWindow(kit, { x, y: base + 0.29, z: frontZ, width: 0.73, height: 0.78, glass, frame, salmon });
    }
    for (const x of [-3.65, -2.2, -0.74, 0.74, 2.2, 3.65]) {
      facadeWindow(kit, { x, y: base + 0.29, z: backZ, ry: Math.PI, width: 0.8, height: 0.78, glass, frame, salmon });
    }
    for (const side of [-1, 1]) {
      for (const z of [-2.95, -1.45, 0.05]) {
        facadeWindow(kit, { x: side * 4.61, y: base + 0.29, z, ry: side * Math.PI / 2, width: 0.78, height: 0.78, glass, frame, salmon });
      }
    }
  }
  for (const x of [-4.4, -1.86, 1.86, 4.4]) {
    kit.box(0.2, buildingHeight, 0.12, salmon, { x, z: frontZ + 0.02 });
    kit.box(0.2, buildingHeight, 0.12, salmon, { x, z: backZ - 0.02 });
  }
  for (const side of [-1, 1]) {
    for (const z of [-3.42, -0.72, 0.47]) kit.box(0.12, buildingHeight, 0.18, salmon, { x: side * 4.62, z });
  }

  // A deep monumental rectangular portal is the clearest feature of the
  // present-day courtyard photograph. The entrance sits in its shaded recess.
  kit.box(2.33, 5.85, 0.08, inset, { y: 0.08, z: frontZ + 0.08 });
  for (const x of [-1.42, 1.42]) {
    kit.box(0.56, 6.85, 0.75, cream, { x, z: frontZ + 0.26 });
    for (let row = 0; row < 19; row++) kit.box(0.564, 0.012, 0.012, joint, { x, y: 0.2 + row * 0.35, z: frontZ + 0.645, shadow: false });
    kit.collideBox(x, frontZ + 0.26, 0.56, 0.75);
  }
  kit.box(3.4, 0.79, 0.75, cream, { y: 6.06, z: frontZ + 0.26 });
  for (const x of [-0.76, 0, 0.76]) kit.box(0.12, 0.2, 0.025, '#5b625f', { x, y: 6.4, z: frontZ + 0.65 });
  for (let floor = 1; floor < 4; floor++) {
    facadeWindow(kit, { x: 0, y: floor * 1.4 + 0.5, z: frontZ + 0.15, width: 1.45, height: 0.79, glass, frame, salmon });
  }
  kit.box(1.55, 1.72, 0.1, '#2b4d59', { y: 0.08, z: frontZ + 0.2 });
  kit.box(0.055, 1.72, 0.13, frame, { y: 0.08, z: frontZ + 0.26 });
  for (const x of [-0.17, 0.17]) kit.box(0.035, 0.3, 0.08, '#c7c4ae', { x, y: 0.75, z: frontZ + 0.34 });
  kit.box(2.15, 0.12, 1.15, cream, { y: 1.9, z: frontZ + 0.45 });
  brandPlaque(kit, brand, loadTexture, { width: 1.86, height: 0.86, y: 2.57, z: frontZ + 0.24 });

  // Rounded tiled stairwell, documented by the historic close-up photograph.
  const towerX = -4.28;
  const towerZ = -1.03;
  kit.cylinder(0.68, 0.68, 6.65, salmon, { x: towerX, z: towerZ, segments: 24 });
  kit.cylinder(0.72, 0.72, 0.14, cream, { x: towerX, z: towerZ, y: 6.65, segments: 24 });
  for (let floor = 0; floor < 4; floor++) {
    kit.box(0.3, 0.95, 0.035, glass, { x: towerX - 0.12, y: 0.44 + floor * 1.42, z: towerZ + 0.677 });
    kit.box(0.034, 0.95, 0.042, frame, { x: towerX - 0.12, y: 0.44 + floor * 1.42, z: towerZ + 0.701 });
  }
  kit.collideCircle(towerX, towerZ, 0.71);
  kit.collideBox(0, centreZ, 9.2, 4.3);

  // Modest service details finish the unseen elevations without pretending
  // they are a measured reconstruction of the real office plan.
  for (const x of [-3.65, 2.2]) {
    kit.box(0.54, 0.34, 0.24, '#d3d3c8', { x, y: 2.2, z: backZ - 0.12 });
    for (let slat = 0; slat < 4; slat++) kit.box(0.42, 0.025, 0.02, '#858d88', { x, y: 2.25 + slat * 0.06, z: backZ - 0.25, shadow: false });
  }

  // The real courtyard has low clipped hedges, lawns and a flag mast.
  courtyardGarden(kit, -3.15, 2.7);
  courtyardGarden(kit, 3.15, 2.7);
  kit.cylinder(0.12, 0.2, 0.2, '#817f72', { x: 2.02, z: 4.15, segments: 10 });
  kit.cylinder(0.035, 0.045, 3.9, '#e7e5d8', { x: 2.02, z: 4.15, segments: 8 });
  burkinaFlag(kit, 2.02, 3.15, 4.15);
  kit.collideCircle(2.02, 4.15, 0.23);

  // A restrained portfolio flourish: three data packets above the roof,
  // distinct from the photographed architecture and no fictional radio tower.
  const packets = kit.group({ y: 6.75, z: centreZ, dynamic: true });
  const packetMaterial = kit.materials.neon(brand.primary, 1.5);
  const lights = [-1, 0, 1].map((x, index) => kit.box(0.1, 0.1, 0.1, packetMaterial, {
    parent: packets, x: x * 0.42, y: 0.1 + index * 0.04, shadow: false,
  }));
  kit.onUpdate(time => lights.forEach((light, index) => {
    light.position.y = 0.12 + Math.sin(time * 1.5 + index * 1.8) * 0.07;
    light.rotation.y = time * 0.55 + index;
  }));

  return { interactAt: [0, 2.7], labelHeight: 8.25 };
}

function facadeWindow(kit, { x, y, z, ry = 0, width, height, glass, frame, salmon }) {
  const unit = kit.group({ x, y, z, ry });
  kit.box(width + 0.15, height + 0.14, 0.07, salmon, { parent: unit, y: -0.07 });
  kit.box(width, height, 0.08, glass, { parent: unit, z: 0.045 });
  kit.box(0.035, height, 0.025, frame, { parent: unit, z: 0.097 });
  kit.box(width, 0.035, 0.025, frame, { parent: unit, y: height * 0.53, z: 0.097 });
  kit.box(width + 0.18, 0.065, 0.18, frame, { parent: unit, y: -0.07, z: 0.04 });
}

function courtyardGarden(kit, x, z) {
  kit.cylinder(1.07, 1.1, 0.09, '#9aab64', { x, z, segments: 24, y: 0.03, shadow: false });
  for (let index = 0; index < 16; index++) {
    const angle = index * Math.PI / 8;
    kit.box(0.33, 0.23, 0.23, index % 2 ? '#92a747' : '#839940', {
      x: x + Math.cos(angle), z: z + Math.sin(angle), y: 0.06, ry: -angle, shadow: false,
    });
  }
  kit.cylinder(0.07, 0.1, 0.8, '#806249', { x, z, segments: 7 });
  kit.sphere(0.58, '#587f48', { x, z, y: 0.95, scale: [0.8, 1.35, 0.8], widthSegments: 10, heightSegments: 7 });
  kit.collideCircle(x, z, 0.56);
}

function burkinaFlag(kit, x, y, z) {
  const fabric = kit.group({ x: x + 0.42, y, z, ry: -0.14 });
  kit.box(0.84, 0.28, 0.025, '#cf3d3c', { parent: fabric, y: 0.28, shadow: false });
  kit.box(0.84, 0.28, 0.025, '#278247', { parent: fabric, shadow: false });
  const star = new Shape();
  for (let point = 0; point < 10; point++) {
    const angle = Math.PI / 2 + point * Math.PI / 5;
    const radius = point % 2 ? 0.052 : 0.13;
    const sx = Math.cos(angle) * radius;
    const sy = Math.sin(angle) * radius;
    if (point === 0) star.moveTo(sx, sy); else star.lineTo(sx, sy);
  }
  star.closePath();
  const gold = new MeshBasicMaterial({ color: '#efd658', toneMapped: false });
  for (const side of [-1, 1]) kit.mesh(new ShapeGeometry(star), gold, { parent: fabric, y: 0.28, z: side * 0.018, ry: side < 0 ? Math.PI : 0, shadow: false });
}
