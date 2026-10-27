import { Color, RingGeometry } from 'three';
import { PALETTE } from '../materials.js';

// Street furniture shared by several places.

export function plaza(kit, radius, color) {
  // An inset surface, supported by the flattened terrain: no floating disc or dark underside.
  const natural = ['urdwell', 'ouaga', 'moov'].includes(kit.place?.id);
  const top = 0.035;
  const surface = kit.cylinder(radius, radius + 0.08, 0.2, color, { y: top - 0.2, segments: 64, shadow: false });
  kit.platformCircle(radius, top);
  if (natural) return surface;

  const tint = new Color(color);
  const joint = `#${tint.clone().multiplyScalar(0.88).getHexString()}`;
  // Fine, clipped paving joints give the entrance squares a human scale.
  for (let axis = -Math.floor(radius); axis <= Math.floor(radius); axis++) {
    const offset = axis * 0.85;
    const chord = Math.sqrt(Math.max(0, (radius - 0.2) ** 2 - offset ** 2)) * 2;
    if (chord < 0.2) continue;
    kit.box(chord, 0.003, 0.014, joint, { y: top + 0.001, z: offset, shadow: false });
    kit.box(0.014, 0.003, chord, joint, { y: top + 0.001, x: offset, shadow: false });
  }
  const curbTints = [0.89, 0.93, 0.97].map(shade => `#${tint.clone().multiplyScalar(shade).getHexString()}`);
  const blocks = Math.ceil(radius * 10);
  const arc = Math.PI * 2 / blocks;
  for (let index = 0; index < blocks; index++) {
    kit.mesh(new RingGeometry(radius - 0.19, radius + 0.03, 2, 1, index * arc + 0.004, arc - 0.008), curbTints[index % 3], {
      y: top + 0.006, rx: -Math.PI / 2, shadow: false,
    });
  }
  return surface;
}

export function lamp(kit, x, z, { height = 2.3 } = {}) {
  kit.cylinder(0.06, 0.09, height, '#2b3150', { x, z, segments: 6 });
  kit.cylinder(0.22, 0.14, 0.14, '#2b3150', { x, z, y: height, segments: 6 });
  kit.ico(0.17, kit.materials.glow('#ffd29a', { day: 0.25, night: 3.4 }), { x, z, y: height + 0.24, detail: 0 });
  kit.cone(0.25, 0.22, '#2b3150', { x, z, y: height + 0.38, segments: 6 });
  kit.collideCircle(x, z, 0.25);
}

export function bench(kit, x, z, rotation = 0) {
  const seat = kit.group({ x, z, ry: rotation });
  kit.box(1.5, 0.08, 0.45, PALETTE.wood, { parent: seat, y: 0.42 });
  kit.box(1.5, 0.35, 0.07, PALETTE.wood, { parent: seat, y: 0.55, z: -0.22 });
  [-0.6, 0.6].forEach(offset => kit.box(0.08, 0.42, 0.4, '#2b3150', { parent: seat, x: offset }));
  kit.collideCircle(x, z, 0.6);
}

export function roundTree(kit, x, z, scale = 1) {
  kit.cylinder(0.12 * scale, 0.18 * scale, 1.3 * scale, '#7a5536', { x, z, segments: 6 });
  kit.ico(0.85 * scale, '#5aa64a', { x, z, y: 1.8 * scale, detail: 0 });
  kit.ico(0.6 * scale, '#6dbb57', { x: x + 0.35 * scale, z, y: 2.3 * scale, detail: 0 });
  kit.ico(0.55 * scale, '#4b9142', { x: x - 0.3 * scale, z: z - 0.2 * scale, y: 2.1 * scale, detail: 0 });
  kit.collideCircle(x, z, 0.35 * scale);
}

export function pine(kit, x, z, scale = 1, { snowy = false } = {}) {
  kit.cylinder(0.1 * scale, 0.14 * scale, 0.8 * scale, '#6b4a30', { x, z, segments: 5 });
  const tiers = [[0.95, 1.5, 0.6], [0.72, 1.3, 1.35], [0.48, 1.1, 2.05]];
  tiers.forEach(([radius, height, y], index) => {
    kit.cone(radius * scale, height * scale, index === 2 && snowy ? PALETTE.snow : '#2f6e4b', { x, z, y: y * scale, segments: 7 });
  });
  kit.collideCircle(x, z, 0.3 * scale);
}

export function flowerBed(kit, x, z, width, colors = ['#ff8fb1', '#ffd36b', '#fff3e2', '#ff9a5c']) {
  kit.box(width, 0.22, 0.55, PALETTE.woodDark, { x, z });
  const count = Math.max(3, Math.round(width * 3));
  for (let index = 0; index < count; index++) {
    const offset = -width / 2 + 0.2 + (index * (width - 0.4)) / (count - 1);
    kit.ico(0.11, colors[index % colors.length], { x: x + offset, z: z + (index % 2 ? 0.1 : -0.1), y: 0.34, detail: 0, shadow: false });
  }
}

export function signBoard(kit, text, x, z, { rotation = 0, background = PALETTE.cobaltDeep, width = 2.2 } = {}) {
  const board = kit.group({ x, z, ry: rotation });
  [-width / 2 + 0.15, width / 2 - 0.15].forEach(offset => kit.box(0.1, 1.5, 0.1, PALETTE.woodDark, { parent: board, x: offset }));
  kit.box(width, 0.62, 0.08, PALETTE.woodDark, { parent: board, y: 0.95 });
  kit.sign(text, { parent: board, width: width - 0.16, height: 0.5, y: 1.26, z: 0.05, background });
  kit.collideCircle(x, z, width / 2);
}

export function windowPane(kit, x, y, z, width, height, { frame = PALETTE.cream, rotation = 0, parent } = {}) {
  const pane = kit.group({ x, y, z, ry: rotation, parent });
  kit.box(width + 0.16, height + 0.16, 0.08, frame, { parent: pane, y: -0.08 });
  kit.box(width, height, 0.1, kit.materials.glow(PALETTE.window, { day: 0.12, night: 1.9, base: '#ffe7c4' }), { parent: pane, z: 0.02 });
  kit.box(0.05, height, 0.12, frame, { parent: pane, z: 0.03 });
  kit.box(width, 0.05, 0.12, frame, { parent: pane, y: height / 2 - 0.025, z: 0.03 });
  return pane;
}
