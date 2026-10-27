import { AdditiveBlending, ConeGeometry, DoubleSide, MeshBasicMaterial, MeshStandardMaterial, SphereGeometry, TorusGeometry } from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { archFrame, archPane, atelierMaterials, bevelBox, curveRail, quad } from './atelierGeometry.js';
import { bench, lamp, plaza, roundTree } from './common.js';
import { plantingStrip } from './townDetails.js';

// The contact place: an Art Deco French post office. A streamlined hall with
// rounded corners, a stepped entrance pavilion carrying a working clock, a
// fan-light door, striped awnings and portholes; outside, a street post box,
// the postman's bicycle, parcels and a Morris column with the contact posters.
// A rooftop aerial sends out rings of light and paper planes circle the roof.
const HALL = { width: 5.6, depth: 3.8, height: 3.05, z: -1.7, corner: 0.45 };
const PAVILION = { width: 2.5, depth: 1.3, height: 4.3, z: 0.2 };
const FRONT_Z = HALL.z + HALL.depth / 2;
const PAVILION_FRONT_Z = PAVILION.z + PAVILION.depth / 2;

function roundedBox(kit, width, height, depth, material, options, radius, segments = 4) {
  return kit.mesh(new RoundedBoxGeometry(width, height, depth, segments, radius), material, { ...options, y: (options.y ?? 0) + height / 2 });
}

export function buildPoste(kit) {
  const m = atelierMaterials({
    stucco: '#f3c6a2', trim: '#fff1de', shade: '#dcae8e', plinth: '#b9a593', cobalt: '#2346c4', cobaltDeep: '#152a7a',
    brass: '#d0a056', iron: '#2b3150', roof: '#6c7082', kraft: '#c49a64', tape: '#ead7ad', column: '#2f5a46',
    peach: '#f08a5a', wicker: '#b88a4e', paper: '#fbf8f2',
  });
  const glass = kit.materials.glow('#ffc98a', { day: 0.2, night: 1.15, base: '#cfe0ea' });
  plaza(kit, 6.2, '#ecdcc4');
  buildForecourt(kit, m);
  buildHall(kit, m, glass);
  buildPavilion(kit, m, glass);
  buildAerial(kit, m);
  buildPostBox(kit, m, 2.35, 1.95);
  buildBicycle(kit, m, -2.45, 1.75, 0.55);
  buildParcels(kit, m, 1.8, 1.2);
  buildMorrisColumn(kit, m, -3.55, 2.75);
  buildPaperPlanes(kit);
  lamp(kit, -3.4, 0.6);
  lamp(kit, 3.45, 0.7);
  bench(kit, -3.75, -1.7, Math.PI / 2);
  roundTree(kit, 3.95, -3.5, 0.95);
  return { interactAt: [0, 2.05], labelHeight: 7.6 };
}

// A cobalt ring with an envelope inlaid in the paving marks where to stand.
function buildForecourt(kit, m) {
  kit.cylinder(1.15, 1.15, 0.02, m.cobalt, { z: 2.45, y: 0.05, segments: 40, shadow: false });
  kit.cylinder(1.03, 1.03, 0.025, m.trim, { z: 2.45, y: 0.05, segments: 40, shadow: false });
  kit.box(0.92, 0.012, 0.6, m.peach, { z: 2.45, y: 0.075, shadow: false });
  kit.bar([-0.44, 0.09, 2.17], [0, 0.09, 2.5], 0.03, m.trim, { shadow: false });
  kit.bar([0.44, 0.09, 2.17], [0, 0.09, 2.5], 0.03, m.trim, { shadow: false });
}

function buildHall(kit, m, glass) {
  const { width, depth, height, z, corner } = HALL;
  roundedBox(kit, width + 0.3, 0.42, depth + 0.3, m.plinth, { z, y: -0.17 }, 0.3);
  roundedBox(kit, width, height, depth, m.stucco, { z, y: 0.22 }, corner, 5);
  roundedBox(kit, width + 0.25, 0.2, depth + 0.25, m.trim, { z, y: 3.24 }, 0.1);
  roundedBox(kit, width + 0.35, 0.08, depth + 0.35, m.shade, { z, y: 3.44 }, 0.04);
  kit.box(width - 0.4, 0.06, depth - 0.4, m.roof, { z, y: 3.46 });
  kit.collideBox(0, z, width + 0.3, depth + 0.3);

  // Three streamline "speed lines" run from the pavilion round the corners.
  const halfWidth = width / 2;
  const flatX = halfWidth - corner;
  for (const y of [2.75, 2.88, 3.01]) {
    for (const side of [-1, 1]) {
      const points = [[side * PAVILION.width / 2, y, FRONT_Z + 0.008], [side * flatX, y, FRONT_Z + 0.008]];
      for (let step = 1; step <= 6; step++) {
        const angle = (step / 6) * (Math.PI / 2);
        points.push([side * (flatX + Math.sin(angle) * (corner + 0.008)), y, FRONT_Z - corner + Math.cos(angle) * (corner + 0.008)]);
      }
      points.push([side * (halfWidth + 0.008), y, z - 0.6]);
      curveRail(kit, points, 0.022, m.cobalt, { shadow: false }, 48);
    }
  }

  // Tall front windows under striped awnings, with planters.
  for (const side of [-1, 1]) {
    const x = side * 1.82;
    framedWindow(kit, m, glass, x, 0.72, FRONT_Z + 0.01, 0.78, 1.72);
    buildAwning(kit, m, x, 2.62, FRONT_Z, 1.0);
    plantingStrip(kit, x, FRONT_Z + 0.32, 1.0, 0.38, { flowers: true });
  }
  // Portholes along the sides and two windows at the back.
  for (const side of [-1, 1]) {
    for (const portZ of [-0.95, -1.75, -2.55]) {
      const porthole = kit.group({ x: side * (halfWidth + 0.005), y: 1.6, z: portZ, ry: side * Math.PI / 2 });
      kit.disc(0.27, 0.04, glass, { parent: porthole, segments: 28 });
      kit.mesh(new TorusGeometry(0.29, 0.05, 10, 32), m.brass, { parent: porthole, z: 0.02 });
    }
  }
  for (const x of [-1.4, 1.4]) framedWindow(kit, m, glass, x, 0.8, z - depth / 2 - 0.01, 0.9, 1.5, Math.PI);
}

function framedWindow(kit, m, glass, x, y, z, width, height, rotation = 0) {
  const frame = kit.group({ x, y, z, ry: rotation });
  kit.box(width, height, 0.04, glass, { parent: frame });
  bevelBox(kit, width + 0.16, 0.08, 0.1, m.cobalt, { parent: frame, y: height }, 0.02);
  bevelBox(kit, width + 0.24, 0.1, 0.2, m.trim, { parent: frame, y: -0.1, z: 0.04 }, 0.03);
  for (const side of [-1, 1]) kit.box(0.07, height, 0.08, m.cobalt, { parent: frame, x: side * (width / 2 + 0.035) });
  kit.box(0.04, height, 0.06, m.cobalt, { parent: frame, z: 0.02 });
  for (const rowY of [height / 3, (height * 2) / 3]) kit.box(width, 0.035, 0.06, m.cobalt, { parent: frame, y: rowY, z: 0.02 });
}

// A sloping canvas awning in cobalt and cream stripes, with a scalloped edge.
function buildAwning(kit, m, x, y, z, width) {
  const stripes = 6;
  const reach = 0.55;
  const drop = 0.32;
  for (let index = 0; index < stripes; index++) {
    const x0 = x - width / 2 + (index * width) / stripes;
    const x1 = x0 + width / stripes;
    const material = index % 2 ? m.trim : m.cobalt;
    quad(kit, [[x0, y, z + 0.02], [x0, y - drop, z + reach], [x1, y - drop, z + reach], [x1, y, z + 0.02]], material);
    quad(kit, [[x0, y - drop, z + reach], [x0, y - drop - 0.12, z + reach + 0.01], [x1, y - drop - 0.12, z + reach + 0.01], [x1, y - drop, z + reach]], material);
  }
  kit.bar([x - width / 2, y + 0.02, z + 0.03], [x + width / 2, y + 0.02, z + 0.03], 0.04, m.iron);
  for (const side of [-1, 1]) kit.bar([x + side * width / 2, y, z + 0.03], [x + side * width / 2, y - drop, z + reach], 0.025, m.iron);
}

function buildPavilion(kit, m, glass) {
  const { width, depth, height, z } = PAVILION;
  roundedBox(kit, width, height, depth, m.trim, { z, y: 0.22 }, 0.12);
  roundedBox(kit, width - 0.4, 0.34, depth - 0.18, m.trim, { z, y: 4.52 }, 0.08);
  roundedBox(kit, width - 1.0, 0.3, depth - 0.38, m.shade, { z, y: 4.86 }, 0.07);
  roundedBox(kit, width - 1.6, 0.26, depth - 0.6, m.trim, { z, y: 5.16 }, 0.06);
  kit.collideBox(0, z, width, depth);
  for (const x of [-0.98, -0.78, 0.78, 0.98]) kit.box(0.07, 1.25, 0.05, m.cobalt, { x, y: 3.2, z: PAVILION_FRONT_Z + 0.01 });

  // Fan-light entrance: arched frame, glazing with brass sunburst, double cobalt doors.
  const doorZ = PAVILION_FRONT_Z;
  archPane(kit, 1.22, 2.38, glass, { y: 0.3, z: doorZ - 0.05 });
  archFrame(kit, 1.56, 2.55, 0.17, 0.26, m.cobaltDeep, { y: 0.3, z: doorZ + 0.01 });
  const spring = 0.3 + 2.55 - 1.56 / 2;
  kit.box(1.22, 0.045, 0.05, m.brass, { y: spring - 0.02, z: doorZ - 0.02 });
  for (let ray = 0; ray < 6; ray++) {
    const angle = (Math.PI * (ray + 0.5)) / 6;
    kit.bar([0, spring + 0.01, doorZ - 0.02], [Math.cos(angle) * 0.6, spring + 0.01 + Math.sin(angle) * 0.6, doorZ - 0.02], 0.028, m.brass);
  }
  for (const side of [-1, 1]) {
    bevelBox(kit, 0.58, 1.76, 0.06, m.cobalt, { x: side * 0.3, y: 0.3, z: doorZ - 0.02 }, 0.02);
    kit.box(0.34, 0.86, 0.02, glass, { x: side * 0.3, y: 0.98, z: doorZ + 0.015 });
    kit.box(0.03, 0.34, 0.04, m.brass, { x: side * 0.07, y: 0.98, z: doorZ + 0.03 });
  }
  for (let step = 0; step < 2; step++) {
    const top = 0.12 + step * 0.1;
    const stepDepth = 0.5;
    const stepZ = doorZ + 0.55 - step * 0.22;
    bevelBox(kit, 2.3 - step * 0.3, top + 0.06, stepDepth, m.plinth, { z: stepZ, y: -0.06 }, 0.03);
    kit.platform(0, stepZ, 2.3 - step * 0.3, stepDepth, top);
  }

  kit.sign('CONTACT', { width: 1.9, height: 0.34, y: 3.04, z: doorZ + 0.02, background: '#152a7a', color: '#ffd2b0' });
  kit.sign('POSTE', { width: 0.9, height: 0.22, y: 4.69, z: z + (depth - 0.18) / 2 + 0.01, background: '#fff1de', color: '#2346c4' });
  buildClock(kit, m, 0, 3.78, doorZ + 0.02);
}

// The clock shows the visitor's real local time.
function buildClock(kit, m, x, y, z) {
  const clock = kit.group({ x, y, z });
  kit.disc(0.42, 0.06, m.paper, { parent: clock, segments: 40 });
  kit.mesh(new TorusGeometry(0.42, 0.045, 10, 48), m.brass, { parent: clock, z: 0.03 });
  for (let tick = 0; tick < 12; tick++) {
    const angle = (tick / 12) * Math.PI * 2;
    kit.box(0.025, tick % 3 ? 0.05 : 0.09, 0.02, m.iron, { parent: clock, x: Math.sin(angle) * 0.33, y: Math.cos(angle) * 0.33 - 0.03, z: 0.04, rz: -angle });
  }
  const hourHand = kit.box(0.04, 0.2, 0.02, m.iron, { parent: clock, z: 0.06, dynamic: true, shadow: false });
  const minuteHand = kit.box(0.028, 0.3, 0.02, m.iron, { parent: clock, z: 0.075, dynamic: true, shadow: false });
  // Move each hand's pivot from its centre to its base, at the clock centre.
  for (const hand of [hourHand, minuteHand]) {
    hand.geometry.translate(0, hand.position.y, 0);
    hand.position.y = 0;
  }
  kit.onUpdate(() => {
    const now = new Date();
    const minutes = now.getMinutes() + now.getSeconds() / 60;
    minuteHand.rotation.z = -(minutes / 60) * Math.PI * 2;
    hourHand.rotation.z = -(((now.getHours() % 12) + minutes / 60) / 12) * Math.PI * 2;
  });
}

// Brass aerial on the crown: rings of light ripple out from its tip.
function buildAerial(kit, m) {
  const top = 5.42;
  kit.cylinder(0.035, 0.05, 0.9, m.brass, { z: PAVILION.z, y: top, segments: 10 });
  kit.sphere(0.08, kit.materials.neon('#ffb47e', 2.4), { z: PAVILION.z, y: top + 0.95, shadow: false });
  const rings = kit.group({ z: PAVILION.z, y: top + 0.95, dynamic: true });
  const waves = [0, 1, 2].map(() => {
    const material = new MeshBasicMaterial({ color: '#ffb47e', transparent: true, opacity: 0, blending: AdditiveBlending, depthWrite: false, side: DoubleSide });
    return kit.mesh(new TorusGeometry(0.3, 0.02, 6, 40), material, { parent: rings, rx: Math.PI / 2, shadow: false });
  });
  kit.onUpdate((time, _delta, world) => {
    waves.forEach((wave, index) => {
      const phase = (time * 0.45 + index / waves.length) % 1;
      wave.scale.setScalar(0.4 + phase * 5);
      wave.material.opacity = (1 - phase) * (0.35 + world.nightFactor * 0.45);
    });
  });
}

// A French street post box in Mounir's peach, with an envelope emblem.
function buildPostBox(kit, m, x, z) {
  const box = kit.group({ x, z, ry: -0.35 });
  kit.cylinder(0.31, 0.33, 0.12, m.iron, { parent: box, segments: 24 });
  kit.cylinder(0.27, 0.28, 1.0, m.peach, { parent: box, y: 0.12, segments: 32 });
  kit.mesh(new SphereGeometry(0.29, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2), m.peach, { parent: box, y: 1.12 });
  kit.sphere(0.06, m.brass, { parent: box, y: 1.45 });
  kit.box(0.26, 0.035, 0.06, m.iron, { parent: box, y: 0.9, z: 0.26 });
  bevelBox(kit, 0.34, 0.05, 0.09, m.peach, { parent: box, y: 0.95, z: 0.27 }, 0.02);
  kit.box(0.22, 0.14, 0.02, m.paper, { parent: box, y: 0.6, z: 0.28 });
  kit.bar([-0.1, 0.73, 0.295], [0, 0.66, 0.295], 0.014, m.cobalt, { parent: box });
  kit.bar([0.1, 0.73, 0.295], [0, 0.66, 0.295], 0.014, m.cobalt, { parent: box });
  kit.box(0.18, 0.09, 0.02, m.trim, { parent: box, y: 0.36, z: 0.28 });
  kit.collideCircle(x, z, 0.38);
}

function buildBicycle(kit, m, x, z, rotation) {
  const bike = kit.group({ x, z, ry: rotation, rz: 0.08 });
  for (const wheelZ of [-0.48, 0.48]) {
    kit.mesh(new TorusGeometry(0.3, 0.028, 8, 32), m.iron, { parent: bike, y: 0.31, z: wheelZ, ry: Math.PI / 2 });
    for (let spoke = 0; spoke < 4; spoke++) {
      const angle = (spoke / 4) * Math.PI;
      kit.bar([0, 0.31 + Math.sin(angle) * 0.28, wheelZ + Math.cos(angle) * 0.28], [0, 0.31 - Math.sin(angle) * 0.28, wheelZ - Math.cos(angle) * 0.28], 0.008, m.paper, { parent: bike, shadow: false });
    }
  }
  const rearHub = [0, 0.31, -0.48];
  const frontHub = [0, 0.31, 0.48];
  const crank = [0, 0.33, 0];
  const seat = [0, 0.82, -0.16];
  const head = [0, 0.86, 0.34];
  const headLow = [0, 0.7, 0.37];
  for (const [from, to] of [[rearHub, crank], [rearHub, seat], [crank, seat], [seat, head], [crank, headLow], [headLow, frontHub], [head, headLow]]) {
    kit.bar(from, to, 0.035, m.cobalt, { parent: bike });
  }
  kit.bar(head, [0, 0.98, 0.37], 0.03, m.iron, { parent: bike });
  kit.bar([-0.24, 0.98, 0.38], [0.24, 0.98, 0.38], 0.03, m.iron, { parent: bike });
  bevelBox(kit, 0.13, 0.05, 0.24, m.iron, { parent: bike, y: 0.84, z: -0.18 }, 0.02);
  bevelBox(kit, 0.36, 0.22, 0.3, m.wicker, { parent: bike, y: 0.82, z: 0.64 }, 0.03);
  for (let letter = 0; letter < 3; letter++) {
    kit.box(0.2, 0.15, 0.012, letter === 1 ? m.peach : m.paper, { parent: bike, x: -0.07 + letter * 0.07, y: 1.03, z: 0.6 + letter * 0.03, rx: -0.2 + letter * 0.15 });
  }
  kit.bar([0.03, 0.33, -0.02], [0.18, 0.02, -0.15], 0.02, m.iron, { parent: bike });
  kit.collideCircle(x, z, 0.6);
}

function buildParcels(kit, m, x, z) {
  const stack = kit.group({ x, z, ry: 0.25 });
  const parcels = [[0.5, 0.4, 0.45, 0, 0, 0, 0], [0.42, 0.32, 0.38, 0.02, 0.4, 0.03, 0.3], [0.3, 0.24, 0.3, 0.45, 0, 0.12, -0.2]];
  for (const [width, height, depth, px, py, pz, turn] of parcels) {
    const parcel = kit.group({ parent: stack, x: px, y: py, z: pz, ry: turn });
    bevelBox(kit, width, height, depth, m.kraft, { parent: parcel }, 0.015);
    kit.box(width + 0.005, 0.012, 0.07, m.tape, { parent: parcel, y: height });
    kit.box(0.07, 0.012, depth + 0.005, m.tape, { parent: parcel, y: height });
  }
  kit.collideCircle(x + 0.15, z, 0.48);
}

// A Parisian Morris column carrying the contact posters.
function buildMorrisColumn(kit, m, x, z) {
  const column = kit.group({ x, z });
  kit.cylinder(0.5, 0.52, 0.25, m.column, { parent: column, segments: 28 });
  kit.cylinder(0.42, 0.42, 2.0, m.column, { parent: column, y: 0.25, segments: 28 });
  kit.cylinder(0.47, 0.47, 0.1, m.column, { parent: column, y: 2.25, segments: 28 });
  kit.mesh(new SphereGeometry(0.47, 28, 10, 0, Math.PI * 2, 0, Math.PI / 2), m.column, { parent: column, y: 2.35, scale: [1, 0.6, 1] });
  kit.mesh(new ConeGeometry(0.08, 0.32, 12), m.brass, { parent: column, y: 2.8 });
  const posters = [['ÉCRIVEZ-MOI', '#2346c4', '#fff1de'], ['@', '#f08a5a', '#152a7a'], ['LinkedIn', '#152a7a', '#ffd2b0'], ['GitHub', '#fff1de', '#152a7a']];
  posters.forEach(([text, background, color], index) => {
    const angle = (index / posters.length) * Math.PI * 2;
    kit.sign(text, { parent: column, width: 0.6, height: 0.42, x: Math.sin(angle) * 0.43, y: 1.6, z: Math.cos(angle) * 0.43, ry: angle, background, color });
    kit.box(0.5, 0.62, 0.012, index % 2 ? m.trim : m.peach, { parent: column, x: Math.sin(angle + 0.785) * 0.425, y: 0.55, z: Math.cos(angle + 0.785) * 0.425, ry: angle + 0.785 });
  });
  kit.collideCircle(x, z, 0.55);
}

function buildPaperPlanes(kit) {
  const planes = kit.group({ z: HALL.z, dynamic: true });
  const paper = new MeshStandardMaterial({ color: '#ffffff', roughness: 0.6, side: DoubleSide, flatShading: true });
  const flights = [0, 1, 2].map(index => {
    const plane = kit.mesh(new ConeGeometry(0.22, 0.75, 3), paper, { parent: planes, scale: [1, 1, 0.25], shadow: false });
    return { plane, radius: 4.2 + index * 0.8, height: 4.2 + index * 0.75, speed: 0.7 - index * 0.12, phase: index * 2.1 };
  });
  kit.onUpdate(time => {
    for (const { plane, radius, height, speed, phase } of flights) {
      const angle = time * speed + phase;
      plane.position.set(Math.cos(angle) * radius, height + Math.sin(angle * 2) * 0.4, Math.sin(angle) * radius);
      plane.rotation.set(0, Math.PI / 2 - angle, Math.PI / 2 + 0.35);
    }
  });
}
