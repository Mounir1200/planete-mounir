import { PLANET } from '../../config.js';
import { lamp } from './common.js';
import { craftedBoat, harbourOffice } from './harbourCraft.js';

const WOOD = ['#a97b52', '#b3875a', '#9a714e', '#ad8158'];
const STONE = ['#b6b3a8', '#c5c1b4', '#aeafa8', '#cec8b8'];
const SEA = PLANET.seaLevel;

// A working miniature harbour. The quay is founded in the shore, piles reach
// the seabed, and boats are placed on the spherical sea (not a flat y=0 plane).
export function buildPort(kit, { place }) {
  const waterAt = (x, z) => Math.sqrt(Math.max(1, SEA * SEA - x * x - z * z)) - place.padHeight;
  const quayTop = 0.085;
  kit.box(10.2, 1.65, 4.6, '#999b94', { y: quayTop - 1.65, z: -0.65 });
  // Actual masonry courses on the exposed waterfront, with alternating joints.
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 13; col++) {
      const x = -4.8 + col * 0.8 + (row % 2) * 0.2;
      if (x > 4.95) continue;
      kit.box(0.77, 0.29, 0.19, STONE[(col + row) % STONE.length], { x, y: -1.48 + row * 0.3, z: 1.68 });
    }
  }
  for (let col = 0; col < 17; col++) {
    kit.box(0.59, 0.13, 0.45, STONE[col % 4], { x: -4.8 + col * 0.6, y: quayTop - 0.04, z: 1.55 });
  }
  kit.box(10.2, 0.04, 4.5, '#cbc4b0', { y: quayTop - 0.04, z: -0.65, shadow: false });
  kit.platform(0, -0.65, 10.2, 4.6, quayTop);
  // A curved stone arm protects the moorings: the harbour has a shoreline
  // silhouette and an entrance, rather than just a jetty sticking into open sea.
  for (let segment = 0; segment < 11; segment++) {
    const t = segment / 10, x = -4.9 - Math.sin(t * Math.PI * 0.82) * 0.8, z = 1.65 + t * 5.4;
    const bottom = waterAt(x, z) - 1.1;
    const topY = -0.05 - t * 0.3;
    kit.box(0.92, topY - bottom, 0.58, STONE[segment % 4], { x, z, y: bottom, ry: -Math.cos(t * 2.58) * 0.34 });
    kit.box(1, 0.12, 0.6, '#d7ceba', { x, z, y: topY, ry: -Math.cos(t * 2.58) * 0.34 });
    kit.collideCircle(x, z, 0.51);
  }
  const lightX = -5.33, lightZ = 7.05, lightBase = -0.24;
  kit.cylinder(0.59, 0.68, 0.28, '#d5c8ac', { x: lightX, z: lightZ, y: lightBase, segments: 24 });
  kit.cylinder(0.19, 0.32, 1.6, '#59786c', { x: lightX, z: lightZ, y: lightBase + 0.28, segments: 20 });
  kit.cylinder(0.24, 0.24, 0.14, '#ebe3ca', { x: lightX, z: lightZ, y: lightBase + 1.3, segments: 20 });
  kit.cylinder(0.29, 0.29, 0.09, '#324c48', { x: lightX, z: lightZ, y: lightBase + 1.88, segments: 20 });
  kit.cylinder(0.19, 0.19, 0.35, kit.materials.glow('#c4e7ba', { day: 0.2, night: 1.3 }), { x: lightX, z: lightZ, y: lightBase + 1.97, segments: 16 });
  kit.cone(0.32, 0.19, '#324c48', { x: lightX, z: lightZ, y: lightBase + 2.32, segments: 16 });
  // Preserve the opening onto the pier while preventing walking through the quay edge.
  [-3.3, 3.3].forEach(x => kit.collideBox(x, 1.85, 3.6, 0.1));

  const start = 1.65, end = 10, top = 0.16;
  const plankCount = 31;
  kit.box(2.35, 0.22, end - start, '#634b37', { z: (start + end) / 2, y: top - 0.25 });
  for (let index = 0; index < plankCount; index++) {
    const z = start + (index + 0.5) * (end - start) / plankCount;
    kit.box(2.42, 0.11, (end - start) / plankCount - 0.016, WOOD[index % 4], { z, y: top - 0.11 });
    [-0.98, 0.98].forEach(x => kit.cylinder(0.018, 0.018, 0.006, '#4e463d', { x, z, y: top + 0.002, segments: 6, shadow: false }));
  }
  kit.platform(0, (start + end) / 2, 2.42, end - start, top);
  // The jetty opens onto a wider mooring head rather than ending as a narrow plank.
  for (let row = 0; row < 8; row++) kit.box(4.2, 0.12, 0.22, WOOD[row % 4], { z: 8.25 + row * 0.235, y: top - 0.12 });
  kit.platform(0, 9.1, 4.2, 1.95, top);
  const posts = [2.2, 4.1, 6, 7.9];
  for (const x of [-1.22, 1.22]) {
    posts.forEach(z => {
      const bottom = waterAt(x, z) - 5;
      kit.cylinder(0.11, 0.15, top - bottom + 0.78, '#77604a', { x, z, y: bottom, segments: 10 });
      kit.cylinder(0.135, 0.135, 0.06, '#d2c3a2', { x, z, y: top + 0.7, segments: 10 });
    });
    for (let index = 1; index < posts.length; index++) {
      rope(kit, [x, top + 0.64, posts[index - 1]], [x, top + 0.64, posts[index]], 0.14);
    }
    kit.collideBox(x, (posts[0] + 8.05) / 2, 0.12, 8.05 - posts[0]);
  }
  for (const x of [-2.1, 2.1]) for (const z of [8.2, 9.96]) {
    const bottom = waterAt(x, z) - 4;
    kit.cylinder(0.13, 0.17, top - bottom + 0.68, '#77604a', { x, z, y: bottom, segments: 12 });
    kit.cylinder(0.15, 0.15, 0.07, '#d2c3a2', { x, z, y: top + 0.61, segments: 12 });
    bollard(kit, x * 0.88, top, z > 9 ? 9.65 : 8.4);
  }
  rope(kit, [-2.1, top + 0.59, 9.96], [2.1, top + 0.59, 9.96], 0.18);
  kit.collideBox(0, 10, 4.35, 0.1);
  // Cross-braces below the walking deck show how the pier is actually supported.
  for (let index = 1; index < posts.length; index++) {
    for (const x of [-1.12, 1.12]) {
      kit.bar([x, waterAt(x, posts[index - 1]) + 0.15, posts[index - 1]], [x, top - 0.25, posts[index]], 0.1, '#64503d');
    }
  }
  lifebuoy(kit, 1.25, top + 0.45, 4.1, Math.PI / 2);

  // Capitanerie: slate roof, real window frames, chart board and shuttered sides.
  harbourOffice(kit);

  // A small lattice crane, not a featureless bar.
  const crane = kit.group({ x: 3.8, z: 0.7 });
  kit.cylinder(0.65, 0.85, 0.32, '#6d746f', { parent: crane, segments: 8 });
  for (const x of [-0.28, 0.28]) {
    kit.box(0.1, 3.4, 0.1, '#dba84b', { parent: crane, x, y: 0.3 });
  }
  for (let row = 0; row < 5; row++) {
    kit.bar([-0.28, 0.4 + row * 0.62, 0], [0.28, 1.02 + row * 0.62, 0], 0.065, '#bf8d3e', { parent: crane });
  }
  const boom = kit.group({ parent: crane, y: 3.65, ry: -0.4, dynamic: true });
  kit.bar([-0.8, 0, 0], [2.1, 0.5, 0], 0.14, '#e3b455', { parent: boom });
  kit.bar([-0.8, 0.35, 0], [2.1, 0.85, 0], 0.09, '#e3b455', { parent: boom });
  for (let index = 0; index < 6; index++) {
    kit.bar([-0.8 + index * 0.48, index * 0.083, 0], [-0.32 + index * 0.48, 0.43 + index * 0.083, 0], 0.045, '#d1a048', { parent: boom });
  }
  kit.box(0.6, 0.45, 0.5, '#34444b', { parent: boom, x: -0.7, y: -0.3 });
  kit.bar([2.1, 0.5, 0], [2.1, -1.5, 0], 0.022, '#34444b', { parent: boom });
  kit.torus(0.12, 0.035, '#34444b', { parent: boom, x: 2.1, y: -1.55, arc: Math.PI * 1.45, tubularSegments: 12 });
  kit.onUpdate(time => { boom.rotation.y = -0.4 + Math.sin(time * 0.22) * 0.16; });
  kit.collideCircle(3.8, 0.7, 0.8);

  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 3; col++) {
      const x = 2.1 + col * 0.62, z = -1.55 + row * 0.66;
      crate(kit, x, quayTop, z, col % 2 ? '#487f8a' : '#be9b62');
    }
  }
  kit.collideBox(2.75, -1.2, 2.1, 1.45);
  // A little sailcloth market shelter gives the quay a lived-in frontage.
  const stall = kit.group({ x: 2.7, z: -1.2 });
  for (const x of [-1.05, 1.05]) for (const z of [-0.7, 0.7]) {
    kit.cylinder(0.045, 0.06, 2.25, '#695640', { parent: stall, x, z, segments: 10 });
    kit.bar([x, 1.7, z], [x * 0.55, 2.2, z], 0.045, '#695640', { parent: stall });
  }
  for (let stripe = 0; stripe < 10; stripe++) {
    kit.box(0.235, 0.06, 1.65, stripe % 2 ? '#d3c2a1' : '#457b83', { parent: stall, x: -1.06 + stripe * 0.235, y: 2.2, rx: -0.1 });
    kit.box(0.235, 0.19, 0.055, stripe % 2 ? '#d3c2a1' : '#457b83', { parent: stall, x: -1.06 + stripe * 0.235, y: 1.94, z: 0.82 });
  }
  kit.sign('LES MARÉES', { parent: stall, width: 1.65, height: 0.24, y: 1.75, z: 0.74, background: '#3c666b', color: '#fff0cd' });
  [-4.6, -1.7, 1.7, 4.7].forEach(x => bollard(kit, x, quayTop, 1.38));
  lamp(kit, -1.55, -1.9, { height: 2.8 });
  lamp(kit, 4.65, -2.55, { height: 2.8 });

  craftedBoat(kit, place, waterAt, { x: -3.25, z: 9, width: 1.65, length: 4.1, color: '#2d6972', kind: 'fishing', yaw: -0.08 });
  craftedBoat(kit, place, waterAt, { x: 3.35, z: 9.25, width: 1.65, length: 4.8, color: '#f1eee1', kind: 'sail', yaw: 0.08 });
  craftedBoat(kit, place, waterAt, { x: -5.75, z: 9.9, width: 0.95, length: 2.5, color: '#a95942', kind: 'rowing', yaw: -0.25 });
  rope(kit, [-1.22, 0.35, 7.9], [-2.4, waterAt(-3.05, 8.8) + 0.3, 8.8], 0.1);
  rope(kit, [1.22, 0.35, 7.9], [2.5, waterAt(3.15, 9) + 0.3, 9], 0.1);
  return { interactAt: [0, 2.2], beaconAt: [1.8, 0.35], labelHeight: 5.9 };
}

function rope(kit, start, end, sag = 0.1, parent) {
  let previous = start;
  for (let step = 1; step <= 6; step++) {
    const t = step / 6;
    const current = start.map((value, axis) => value + (end[axis] - value) * t - (axis === 1 ? Math.sin(t * Math.PI) * sag : 0));
    kit.bar(previous, current, 0.025, '#cbbb93', { parent });
    previous = current;
  }
}

function bollard(kit, x, y, z) {
  kit.cylinder(0.15, 0.21, 0.12, '#34444b', { x, y, z, segments: 10 });
  kit.cylinder(0.095, 0.11, 0.28, '#34444b', { x, y: y + 0.12, z, segments: 10 });
  kit.box(0.34, 0.07, 0.12, '#34444b', { x, y: y + 0.34, z });
  kit.torus(0.19, 0.025, '#cbbb93', { x, y: y + 0.12, z, rx: Math.PI / 2, tubularSegments: 16 });
}

function lifebuoy(kit, x, y, z, ry = 0, parent) {
  kit.torus(0.22, 0.06, '#ef7c47', { x, y, z, ry, parent, tubularSegments: 24 });
  for (let index = 0; index < 4; index++) {
    kit.torus(0.221, 0.063, '#fff3d9', { x, y, z, ry, rz: index * Math.PI / 2, arc: 0.25, parent, tubularSegments: 4 });
  }
}

function crate(kit, x, y, z, color, parent) {
  kit.box(0.54, 0.43, 0.54, color, { x, y, z, parent });
  for (let row = 0; row < 3; row++) {
    kit.box(0.49, 0.027, 0.01, '#554f43', { x, y: y + 0.09 + row * 0.1, z: z + 0.275, shadow: false, parent });
  }
  kit.box(0.58, 0.06, 0.58, color, { x, y: y + 0.43, z, parent });
}

