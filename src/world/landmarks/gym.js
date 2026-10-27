import { DoubleSide, MeshBasicMaterial, MeshStandardMaterial, PlaneGeometry } from 'three';
import { BRANDS } from '../../content/brands.js';
import { plaza } from './common.js';

// Based on the photographed Basic-Fit club, rue Clément Ader, Angers.
// Two glazed levels, red horizontal cladding and two projecting charcoal
// entrance panels. This is a hobby landmark, not a claim of membership.
export function buildGym(kit, { loadTexture } = {}) {
  const brand = BRANDS.basicfit;
  const charcoal = '#33383b';
  const cladding = '#953d45';
  const steel = '#596468';
  const rubber = '#373c3d';
  const front = 1.3;
  const back = -3.3;
  const width = 11.2;
  const centreZ = -1;
  const floor = 0.075;
  const upper = 2.21;
  const glass = new MeshStandardMaterial({
    color: '#b6d5d7', transparent: true, opacity: 0.12, roughness: 0.18,
    metalness: 0.05, depthWrite: false, side: DoubleSide,
  });
  const light = kit.materials.glow('#fff0da', { day: 0.3, night: 1.35, base: '#fff4e4' });

  plaza(kit, 6.48, '#bdbab0');
  kit.box(width + 0.15, 0.24, 4.75, '#93958f', { y: floor - 0.24, z: centreZ });
  kit.box(width, 0.045, 4.6, rubber, { y: floor - 0.045, z: centreZ });
  kit.platform(0, centreZ, width, 4.6, floor);

  // Open shell: the ground-floor entrance and central aisle remain walkable.
  kit.box(width, 4.08, 0.14, charcoal, { z: back });
  kit.collideBox(0, back, width, 0.14);
  for (const side of [-1, 1]) {
    kit.box(0.14, 4.08, 4.6, charcoal, { x: side * width / 2, z: centreZ });
    kit.box(0.16, 2.01, 4.64, cladding, { x: side * width / 2, y: 2.07, z: centreZ });
    kit.collideBox(side * width / 2, centreZ, 0.14, 4.6);
    // The side elevation has small upper service windows, as seen in the
    // developer's project view; rear details are a restrained extrapolation.
    for (const z of [-2.72, -1.8, -0.88]) {
      kit.box(0.035, 0.49, 0.53, '#8ea6ac', { x: side * (width / 2 + 0.1), y: 2.7, z });
      kit.box(0.04, 0.035, 0.56, steel, { x: side * (width / 2 + 0.12), y: 2.68, z });
    }
    for (let line = 0; line < 17; line++) kit.box(0.012, 0.018, 4.64, '#71343b', {
      x: side * (width / 2 + 0.085), y: 2.13 + line * 0.116, z: centreZ, shadow: false,
    });
  }
  // A visible mezzanine serves the miniature interior. It is intentionally
  // scenic: registering it as ground would snap the existing radial controller
  // onto an overhead floor when the visitor walks beneath it.
  kit.box(width, 0.12, 4.6, '#858a84', { y: upper - 0.12, z: centreZ });
  kit.box(width, 0.025, 4.6, '#5c6261', { y: upper, z: centreZ });
  kit.box(width + 0.17, 0.16, 4.76, '#474e50', { y: 4.08, z: centreZ });
  kit.box(width - 0.16, 0.03, 4.42, '#727875', { y: 4.24, z: centreZ });

  // Glazing is segmented exactly around the two charcoal sign panels.
  for (const [start, end] of [[-5.54, -2.85], [-0.55, 2.91], [4.49, 5.54]]) {
    glazedBay(kit, glass, start, end, front, 0.09, 1.92, steel, true);
    glazedBay(kit, glass, start, end, front, 2.24, 1.32, steel, false);
  }
  // Primary doorway is actually open, with narrow fixed side lights.
  glazedBay(kit, glass, -2.83, -2.31, front, 0.09, 1.91, steel, true);
  glazedBay(kit, glass, -1.09, -0.57, front, 0.09, 1.91, steel, true);
  kit.box(0.1, 1.95, 0.15, brand.primary, { x: -2.29, y: floor, z: front });
  kit.box(0.1, 1.95, 0.15, brand.primary, { x: -1.11, y: floor, z: front });
  kit.box(1.28, 0.16, 0.15, brand.primary, { x: -1.7, y: 1.9, z: front });
  // Secondary entrance remains glazed and is treated as a wall.
  glazedBay(kit, glass, 2.96, 4.44, front, 0.09, 1.92, steel, true);

  kit.box(width, 0.12, 0.15, cladding, { y: 2.05, z: front });
  kit.box(width, 0.48, 0.16, cladding, { y: 3.6, z: front });
  for (let line = 0; line < 5; line++) kit.box(width, 0.016, 0.015, '#71343b', {
    y: 3.65 + line * 0.085, z: front + 0.09, shadow: false,
  });
  for (const [x, panelWidth] of [[-1.7, 2.22], [3.7, 1.52]]) {
    kit.box(panelWidth, 2.24, 0.3, charcoal, { x, y: 2.03, z: front + 0.14 });
    kit.box(panelWidth + 0.2, 0.09, 0.32, '#242a2d', { x, y: 4.27, z: front + 0.14 });
    for (let seam = 0; seam < 6; seam++) kit.box(panelWidth, 0.012, 0.012, '#252a2e', {
      x, y: 2.23 + seam * 0.34, z: front + 0.298, shadow: false,
    });
    kit.box(panelWidth + 0.27, 0.1, 0.83, charcoal, { x, y: 2.02, z: front + 0.43 });
    basicFitSign(kit, brand, loadTexture, { x, y: 3.47, z: front + 0.307, width: panelWidth - 0.21 });
  }
  // Secondary signage on the side is part of the documented building identity.
  basicFitSign(kit, brand, loadTexture, { x: -5.705, y: 3.63, z: -1.6, width: 1.9, ry: -Math.PI / 2 });

  // Back elevation closes the model without inventing a full interior plan.
  kit.box(width, 1.98, 0.025, cladding, { y: 2.09, z: back - 0.09 });
  for (const x of [-4.45, -2.68, 0, 2.68, 4.45]) {
    kit.box(0.96, 0.73, 0.035, '#8ea6ac', { x, y: 2.6, z: back - 0.12 });
    kit.box(0.045, 0.73, 0.04, steel, { x, y: 2.6, z: back - 0.147 });
  }
  kit.box(0.85, 1.65, 0.04, '#596468', { x: 4.46, y: floor, z: back - 0.09 });

  // Equipment proportions and graphite/orange palette are taken from the
  // club's official free-weight photographs, in a compressed readable layout.
  strengthRack(kit, -4.1, -1.75, floor, brand.primary, true);
  bench(kit, -3.8, 0.05, floor, 0, true);
  bench(kit, 0.05, -0.7, floor, Math.PI / 2, true);
  dumbbellRack(kit, 0.65, -2.8, floor, 3.4, brand.primary, true);
  cableMachine(kit, 3.65, -1.76, floor, brand.primary);
  for (const x of [-4.58, -3.27, 0.25, 1.58]) treadmill(kit, x, 0.28, upper + 0.03, brand.primary);
  stationaryBike(kit, 4.32, -1.15, upper + 0.03, brand.primary);
  dumbbellRack(kit, -0.7, -2.76, upper + 0.03, 2.6, brand.primary, false);

  // A few lit strips make the machinery readable through the real glass bays.
  for (const level of [1.98, 3.94]) {
    for (const x of [-4.1, -0.3, 3.8]) kit.box(1.35, 0.035, 0.13, light, {
      x, y: level, z: -0.65, shadow: false,
    });
  }
  for (const x of [-3.7, 2.7]) {
    kit.box(1.1, 0.33, 0.74, '#b3b9b4', { x, y: 4.27, z: -2.2 });
    for (let grille = 0; grille < 5; grille++) kit.box(0.84, 0.02, 0.035, '#596468', {
      x, y: 4.32 + grille * 0.045, z: -1.818, shadow: false,
    });
  }
  // Keep the approach clear, echoing the planted forecourt and bicycle area.
  for (const x of [-4.45, 4.45]) planter(kit, x, 3.12);
  for (const x of [2.55, 3.1, 3.65]) {
    kit.bar([x, 0.04, 3.55], [x, 0.65, 3.55], 0.045, steel);
    kit.bar([x, 0.65, 3.55], [x, 0.65, 3.97], 0.045, steel);
    kit.bar([x, 0.65, 3.97], [x, 0.04, 3.97], 0.045, steel);
  }
  kit.collideBox(3.1, 3.76, 1.3, 0.5);

  return { interactAt: [-1.7, 3.2], labelHeight: 5.9 };
}

function glazedBay(kit, material, start, end, z, y, height, frame, collide) {
  const width = end - start;
  const centre = (start + end) / 2;
  kit.mesh(new PlaneGeometry(width, height), material, { x: centre, y: y + height / 2, z, shadow: false });
  kit.box(width, 0.065, 0.09, frame, { x: centre, y, z });
  kit.box(width, 0.065, 0.09, frame, { x: centre, y: y + height - 0.065, z });
  const panels = Math.max(1, Math.round(width / 0.66));
  for (let column = 0; column <= panels; column++) kit.box(0.05, height, 0.09, frame, {
    x: start + column / panels * width, y, z,
  });
  kit.box(width, 0.028, 0.065, frame, { x: centre, y: y + height * 0.84, z });
  if (collide) kit.collideBox(centre, z, width, 0.07);
}

function basicFitSign(kit, brand, loadTexture, { width, ...position }) {
  if (!loadTexture) return;
  const texture = loadTexture(brand.logo);
  kit.mesh(new PlaneGeometry(width, width * brand.height / brand.width), new MeshBasicMaterial({
    map: texture, transparent: true, toneMapped: false, depthWrite: false,
  }), { ...position, shadow: false });
}

function bench(kit, x, z, y, ry, collide) {
  const group = kit.group({ x, y, z, ry });
  kit.box(0.46, 0.13, 1.27, '#293133', { parent: group, y: 0.43 });
  kit.box(0.34, 0.08, 0.3, '#293133', { parent: group, y: 0.48, z: 0.69, rx: -0.12 });
  for (const end of [-0.44, 0.44]) {
    kit.box(0.56, 0.06, 0.22, '#596468', { parent: group, z: end });
    kit.bar([0, 0.08, end], [0, 0.43, end * 0.55], 0.085, '#596468', { parent: group });
  }
  if (collide) kit.collideCircle(x, z, 0.51);
}

function weightBar(kit, parent, x, y, z, width, orange) {
  kit.bar([x - width / 2, y, z], [x + width / 2, y, z], 0.045, '#bec6c4', { parent });
  for (const side of [-1, 1]) {
    kit.cylinder(0.23, 0.23, 0.105, '#293133', { parent, x: x + side * width * 0.37, y: y - 0.0525, z, rz: Math.PI / 2, segments: 14 });
    kit.cylinder(0.075, 0.075, 0.113, orange, { parent, x: x + side * width * 0.37, y: y - 0.0565, z, rz: Math.PI / 2, segments: 10 });
  }
}

function strengthRack(kit, x, z, y, orange, collide) {
  const group = kit.group({ x, y, z });
  kit.box(1.58, 0.035, 1.6, '#293133', { parent: group });
  for (const side of [-1, 1]) {
    kit.box(0.1, 1.9, 0.12, orange, { parent: group, x: side * 0.63, z: -0.46 });
    kit.box(0.1, 1.9, 0.12, '#596468', { parent: group, x: side * 0.63, z: 0.5 });
    kit.box(0.12, 0.07, 1.36, '#596468', { parent: group, x: side * 0.63 });
    kit.bar([side * 0.63, 1.86, -0.46], [side * 0.63, 1.86, 0.5], 0.09, orange, { parent: group });
  }
  kit.bar([-0.63, 1.87, 0.5], [0.63, 1.87, 0.5], 0.07, '#bec6c4', { parent: group });
  weightBar(kit, group, 0, 1.24, -0.37, 1.75, orange);
  if (collide) kit.collideBox(x, z, 1.55, 1.6);
}

function dumbbellRack(kit, x, z, y, width, orange, collide) {
  const group = kit.group({ x, y, z });
  for (const side of [-1, 1]) kit.box(0.09, 0.85, 0.46, '#596468', { parent: group, x: side * (width / 2 - 0.12) });
  for (const level of [0.39, 0.76]) {
    kit.box(width, 0.065, 0.48, '#596468', { parent: group, y: level, rx: -0.12 });
    const count = Math.floor(width / 0.41);
    for (let index = 0; index < count; index++) {
      const dx = -width / 2 + 0.24 + index * 0.41;
      kit.bar([dx, level + 0.16, -0.15], [dx, level + 0.16, 0.15], 0.038, '#bec6c4', { parent: group });
      for (const dz of [-0.13, 0.13]) {
        kit.disc(0.105, 0.1, '#293133', { parent: group, x: dx, y: level + 0.16, z: dz, segments: 10 });
        kit.disc(0.04, 0.104, orange, { parent: group, x: dx, y: level + 0.16, z: dz, segments: 8 });
      }
    }
  }
  if (collide) kit.collideBox(x, z, width, 0.61);
}

function cableMachine(kit, x, z, y, orange) {
  const group = kit.group({ x, y, z });
  for (const side of [-1, 1]) {
    kit.box(0.34, 1.71, 0.45, '#293133', { parent: group, x: side * 0.63, z: -0.35 });
    for (let plate = 0; plate < 9; plate++) kit.box(0.26, 0.045, 0.37, '#596468', { parent: group, x: side * 0.63, z: -0.35, y: 0.1 + plate * 0.065 });
    kit.bar([side * 0.63, 1.65, -0.35], [side * 0.32, 0.88, 0.3], 0.018, '#bec6c4', { parent: group });
    kit.bar([side * 0.43, 0.88, 0.3], [side * 0.2, 0.88, 0.3], 0.055, '#293133', { parent: group });
  }
  kit.box(1.58, 0.14, 0.5, orange, { parent: group, y: 1.71, z: -0.35 });
  kit.box(1.73, 0.06, 1.2, '#596468', { parent: group });
  kit.collideBox(x, z, 1.73, 1.2);
}

function treadmill(kit, x, z, y, orange) {
  const group = kit.group({ x, y, z });
  kit.box(0.81, 0.13, 1.18, '#596468', { parent: group });
  kit.box(0.6, 0.025, 1.04, '#293133', { parent: group, y: 0.135 });
  for (const side of [-1, 1]) {
    kit.bar([side * 0.31, 0.12, 0.36], [side * 0.29, 0.87, 0.42], 0.055, '#596468', { parent: group });
    kit.bar([side * 0.29, 0.69, 0.42], [side * 0.29, 0.69, 0.03], 0.047, '#293133', { parent: group });
  }
  kit.box(0.65, 0.3, 0.09, '#596468', { parent: group, y: 0.72, z: 0.42, rx: -0.15 });
  kit.box(0.31, 0.16, 0.012, '#91c9d0', { parent: group, y: 0.8, z: 0.48, rx: -0.15, shadow: false });
  kit.box(0.18, 0.035, 0.014, orange, { parent: group, y: 0.75, z: 0.48, shadow: false });
}

function stationaryBike(kit, x, z, y, orange) {
  const group = kit.group({ x, y, z });
  kit.box(0.62, 0.065, 0.95, '#596468', { parent: group });
  kit.disc(0.28, 0.16, '#596468', { parent: group, y: 0.36, z: 0.2, ry: Math.PI / 2 });
  kit.bar([0, 0.2, -0.2], [0, 0.91, -0.12], 0.08, orange, { parent: group });
  kit.box(0.3, 0.07, 0.28, '#293133', { parent: group, y: 0.91, z: -0.12 });
  kit.bar([0, 0.28, 0.25], [0, 1.07, 0.42], 0.065, '#596468', { parent: group });
  kit.bar([-0.22, 1.07, 0.42], [0.22, 1.07, 0.42], 0.05, '#293133', { parent: group });
}

function planter(kit, x, z) {
  kit.box(0.9, 0.22, 0.62, '#8e9388', { x, z });
  kit.box(0.78, 0.035, 0.5, '#665b45', { x, z, y: 0.22 });
  for (let shoot = 0; shoot < 6; shoot++) {
    const angle = shoot * Math.PI / 3;
    kit.cone(0.14, 0.63, shoot % 2 ? '#728447' : '#8c985a', {
      x: x + Math.cos(angle) * 0.25, z: z + Math.sin(angle) * 0.14,
      y: 0.23, rx: Math.sin(angle) * 0.2, rz: Math.cos(angle) * 0.2, segments: 5,
    });
  }
  kit.collideBox(x, z, 0.92, 0.65);
}
