import {
  AdditiveBlending, ConeGeometry, DoubleSide, LatheGeometry, Mesh, ShaderMaterial, TorusGeometry, Vector2,
} from 'three';
import { archFrame, archPane, atelierMaterials, bevelBox } from './atelierGeometry.js';
import { lamp, signBoard } from './common.js';

// Grant Copilot's lighthouse: a Breton-style tower whose curved profile flares
// at the foot, banded coral and cream, with a spiral of small windows, a
// corbelled gallery, a glazed lantern around a glowing Fresnel lens, sweeping
// beams and a weather vane. Around it: the keeper's house, a fog bell, a
// lifebuoy, granite rocks and gulls circling the light.
const TOWER = { x: 0, z: -1.3, height: 8.6, topRadius: 0.9, baseRadius: 1.32, flare: 0.38 };
const LIGHT_Y = 9.75;
const BEAM_LENGTH = 15;

const towerRadius = y => TOWER.topRadius
  + (TOWER.baseRadius - TOWER.topRadius) * (1 - y / TOWER.height) ** 1.15
  + TOWER.flare * Math.exp(-y / 0.35);

function lathe(kit, profile, material, options = {}, segments = 40) {
  return kit.mesh(new LatheGeometry(profile.map(([radius, y]) => new Vector2(radius, y)), segments), material, options);
}

function towerSection(from, to, steps = 10) {
  return Array.from({ length: steps + 1 }, (_, index) => {
    const y = from + ((to - from) * index) / steps;
    return [towerRadius(y), y];
  });
}

export function buildPhare(kit) {
  const m = atelierMaterials({
    granite: '#a8a296', graniteDark: '#8c867b', cream: '#f5efe4', coral: '#e1593f', iron: '#2b3150', slate: '#3b4660',
    brass: '#d0a056', cobalt: '#2346c4', trim: '#fbf8f2', wood: '#8a6a48', gull: '#f4f4f2', wing: '#9aa3ad',
  });
  const glow = kit.materials.glow('#ffd9a0', { day: 0.3, night: 2.2, base: '#fff1d6' });
  buildGround(kit, m);
  buildTower(kit, m, glow);
  buildLantern(kit, m);
  buildBeams(kit);
  buildKeeperHouse(kit, m, glow);
  buildFogBell(kit, m, 2.75, -2.75);
  buildLifebuoy(kit, m, 1.75, 0.95);
  buildGulls(kit, m);
  signBoard(kit, 'Grant Copilot', -3.1, 1.25, { rotation: 0.45, background: '#b8862e', width: 2.2 });
  lamp(kit, -1.7, 1.95);
  return { interactAt: [0, 1.35], beaconAt: [2.6, 2.4], labelHeight: 12.8 };
}

function buildGround(kit, m) {
  kit.cylinder(2.75, 2.85, 0.14, m.granite, { x: TOWER.x, z: TOWER.z, segments: 40 });
  kit.cylinder(2.6, 2.6, 0.02, m.graniteDark, { x: TOWER.x, z: TOWER.z, y: 0.14, segments: 40, shadow: false });
  const rocks = [[3.6, -0.4, 1.0], [4.3, -2.4, 1.3], [2.1, -4.5, 1.1], [-0.5, -4.9, 1.4], [-2.6, -4.7, 1.0], [-4.9, -0.2, 0.9], [4.5, 1.4, 0.7], [-5.0, 0.8, 0.7]];
  rocks.forEach(([x, z, size], index) => {
    kit.rock(size, index % 2 ? m.granite : m.graniteDark, { x, z, y: size * 0.25, ry: index * 1.7, rx: index * 0.4, scale: [1, 0.7, 1.15] });
    kit.rock(size * 0.45, m.graniteDark, { x: x + size * 0.6, z: z + size * 0.3, y: size * 0.12, ry: index, scale: [1, 0.6, 1] });
    kit.collideCircle(x, z, size * 0.85);
  });
}

function buildTower(kit, m, glow) {
  const { x, z, height } = TOWER;
  const bands = [[0, 0.95, m.granite], [0.95, 2.2, m.cream], [2.2, 3.6, m.coral], [3.6, 5.3, m.cream], [5.3, 6.8, m.coral], [6.8, height, m.cream]];
  for (const [from, to, material] of bands) lathe(kit, towerSection(from, to), material, { x, z });
  for (const y of [0.95, 2.2, 3.6, 5.3, 6.8]) {
    kit.mesh(new TorusGeometry(towerRadius(y) + 0.01, 0.035, 8, 48), m.trim, { x, z, y, rx: Math.PI / 2 });
  }
  kit.collideCircle(x, z, towerRadius(0.3) + 0.05);

  // The windows climb the tower in a spiral, following the stair inside.
  for (const [y, angle] of [[2.75, 0.55], [4.35, -0.75], [5.95, 0.35], [7.5, -0.95]]) {
    const radius = towerRadius(y);
    const opening = kit.group({ x: x + Math.sin(angle) * radius, y, z: z + Math.cos(angle) * radius, ry: angle });
    archPane(kit, 0.26, 0.5, glow, { parent: opening, z: 0.01 });
    archFrame(kit, 0.4, 0.62, 0.07, 0.1, m.trim, { parent: opening, y: -0.05, z: 0.02 });
  }

  // Granite porch with an arched cobalt door facing the sea.
  const porchZ = z + towerRadius(1) - 0.15;
  bevelBox(kit, 1.3, 2.05, 0.75, m.granite, { x, z: porchZ, y: 0.14 }, 0.05);
  bevelBox(kit, 1.45, 0.14, 0.9, m.graniteDark, { x, z: porchZ, y: 2.15 }, 0.04);
  archPane(kit, 0.72, 1.62, m.cobalt, { x, y: 0.16, z: porchZ + 0.38 });
  archFrame(kit, 0.95, 1.82, 0.12, 0.12, m.trim, { x, y: 0.14, z: porchZ + 0.39 });
  kit.sphere(0.04, m.brass, { x: x + 0.22, y: 0.95, z: porchZ + 0.42 });
  kit.collideBox(x, porchZ, 1.35, 0.8);
}

function buildLantern(kit, m) {
  const { x, z, height } = TOWER;
  lathe(kit, [[towerRadius(height - 0.4), height - 0.4], [1.05, height - 0.15], [1.38, height + 0.02], [1.42, height + 0.12], [0.85, height + 0.12]], m.iron, { x, z });
  const deck = height + 0.12;
  for (let post = 0; post < 18; post++) {
    const angle = (post / 18) * Math.PI * 2;
    kit.bar([x + Math.cos(angle) * 1.36, deck, z + Math.sin(angle) * 1.36], [x + Math.cos(angle) * 1.36, deck + 0.62, z + Math.sin(angle) * 1.36], 0.035, m.iron);
  }
  for (const y of [deck + 0.32, deck + 0.62]) kit.mesh(new TorusGeometry(1.36, 0.025, 6, 64), m.iron, { x, z, y, rx: Math.PI / 2 });

  kit.cylinder(0.84, 0.86, 0.45, m.iron, { x, z, y: deck, segments: 24 });
  const glassBottom = deck + 0.45;
  const glassHeight = 1.15;
  kit.cylinder(0.78, 0.78, glassHeight, kit.materials.glow('#ffe3b0', { day: 0.25, night: 1.2, opacity: 0.35 }), { x, z, y: glassBottom, segments: 12, shadow: false });
  for (let mullion = 0; mullion < 12; mullion++) {
    const angle = (mullion / 12) * Math.PI * 2;
    kit.bar([x + Math.cos(angle) * 0.79, glassBottom, z + Math.sin(angle) * 0.79], [x + Math.cos(angle) * 0.79, glassBottom + glassHeight, z + Math.sin(angle) * 0.79], 0.03, m.iron);
  }
  kit.mesh(new TorusGeometry(0.8, 0.025, 6, 48), m.iron, { x, z, y: glassBottom + glassHeight / 2, rx: Math.PI / 2 });

  // Fresnel lens: stacked glowing prisms around the lamp.
  const lens = kit.materials.glow('#ffc479', { day: 0.9, night: 3.4 });
  for (let ring = 0; ring < 6; ring++) {
    const y = glassBottom + 0.18 + ring * 0.16;
    const radius = 0.36 - Math.abs(ring - 2.5) * 0.035;
    kit.mesh(new TorusGeometry(radius, 0.045, 8, 32), lens, { x, z, y, rx: Math.PI / 2, shadow: false });
  }
  kit.sphere(0.17, kit.materials.neon('#fff3d6', 3.2), { x, z, y: LIGHT_Y, shadow: false });

  const roofBase = glassBottom + glassHeight;
  lathe(kit, [[0.95, roofBase], [0.9, roofBase + 0.1], [0.7, roofBase + 0.38], [0.42, roofBase + 0.62], [0.12, roofBase + 0.76], [0.001, roofBase + 0.78]], m.coral, { x, z });
  kit.sphere(0.15, m.iron, { x, z, y: roofBase + 0.88 });
  kit.cylinder(0.02, 0.02, 0.75, m.brass, { x, z, y: roofBase + 0.95, segments: 6 });

  const vane = kit.group({ x, z, y: roofBase + 1.5, dynamic: true });
  kit.bar([0, 0, -0.42], [0, 0, 0.32], 0.025, m.brass, { parent: vane });
  kit.mesh(new ConeGeometry(0.07, 0.18, 8), m.brass, { parent: vane, z: 0.4, rx: Math.PI / 2 });
  kit.box(0.02, 0.18, 0.22, m.brass, { parent: vane, y: -0.09, z: -0.36 });
  kit.onUpdate(time => { vane.rotation.y = Math.sin(time * 0.23) * 1.4 + Math.sin(time * 1.7) * 0.08; });
}

const beamVertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Bright at the lamp, fading out over the beam's length.
const beamFragmentShader = /* glsl */ `
  uniform float uStrength;
  varying vec2 vUv;
  void main() {
    float fade = pow(clamp(vUv.y, 0.0, 1.0), 1.8);
    gl_FragColor = vec4(vec3(1.0, 0.82, 0.52) * 1.4, fade * uStrength);
  }
`;

function buildBeams(kit) {
  const uniforms = { uStrength: { value: 0 } };
  const material = new ShaderMaterial({
    uniforms, vertexShader: beamVertexShader, fragmentShader: beamFragmentShader,
    transparent: true, depthWrite: false, blending: AdditiveBlending, side: DoubleSide,
  });
  const beams = kit.group({ x: TOWER.x, z: TOWER.z, y: LIGHT_Y, dynamic: true });
  for (const rotation of [0, Math.PI]) {
    const geometry = new ConeGeometry(1.9, BEAM_LENGTH, 24, 1, true);
    geometry.translate(0, -BEAM_LENGTH / 2, 0);
    geometry.rotateZ(Math.PI / 2);
    const beam = new Mesh(geometry, material);
    beam.rotation.y = rotation;
    beam.frustumCulled = false;
    beams.add(beam);
  }
  kit.onUpdate((time, _delta, world) => {
    beams.rotation.y = time * 0.8;
    uniforms.uStrength.value = 0.08 + world.nightFactor * 0.32;
  });
}

function buildKeeperHouse(kit, m, glow) {
  const houseX = -3.25;
  const houseZ = -2.35;
  const house = kit.group({ x: houseX, z: houseZ, ry: 0.6 });
  bevelBox(kit, 2.7, 0.3, 2.2, m.graniteDark, { parent: house, y: -0.1 }, 0.04);
  bevelBox(kit, 2.6, 1.85, 2.1, m.granite, { parent: house, y: 0.18 }, 0.05);
  bevelBox(kit, 2.75, 0.12, 2.25, m.trim, { parent: house, y: 2.02 }, 0.03);
  kit.roof(2.5, 1.15, 3.0, m.slate, { parent: house, y: 2.12, ry: Math.PI / 2 });
  bevelBox(kit, 0.42, 1.0, 0.42, m.granite, { parent: house, x: 0.85, y: 2.3, z: -0.45 }, 0.03);
  bevelBox(kit, 0.5, 0.1, 0.5, m.trim, { parent: house, x: 0.85, y: 3.28, z: -0.45 }, 0.02);
  archPane(kit, 0.62, 1.35, m.cobalt, { parent: house, y: 0.2, z: 1.06 });
  archFrame(kit, 0.84, 1.52, 0.1, 0.1, m.trim, { parent: house, y: 0.18, z: 1.07 });
  for (const windowX of [-0.75, 0.75]) {
    kit.box(0.5, 0.6, 0.04, glow, { parent: house, x: windowX, y: 0.85, z: 1.06 });
    bevelBox(kit, 0.62, 0.72, 0.05, m.trim, { parent: house, x: windowX, y: 0.79, z: 1.045 }, 0.02);
    kit.box(0.04, 0.6, 0.06, m.trim, { parent: house, x: windowX, y: 0.85, z: 1.08 });
    bevelBox(kit, 0.7, 0.07, 0.16, m.trim, { parent: house, x: windowX, y: 0.74, z: 1.12 }, 0.02);
  }
  kit.box(0.04, 0.6, 0.52, glow, { parent: house, x: 1.31, y: 0.85 });
  kit.collideCircle(houseX, houseZ, 1.65);
}

function buildFogBell(kit, m, x, z) {
  const frame = kit.group({ x, z, ry: -0.6 });
  for (const side of [-1, 1]) kit.bar([side * 0.45, 0, 0], [side * 0.38, 1.65, 0], 0.08, m.wood, { parent: frame });
  kit.bar([-0.5, 1.62, 0], [0.5, 1.62, 0], 0.09, m.wood, { parent: frame });
  const bell = kit.group({ parent: frame, y: 1.58, dynamic: true });
  lathe(kit, [[0.001, -0.52], [0.28, -0.52], [0.26, -0.48], [0.19, -0.34], [0.15, -0.14], [0.08, -0.04], [0.001, -0.02]], m.brass, { parent: bell }, 28);
  kit.sphere(0.05, m.iron, { parent: bell, y: -0.55 });
  kit.onUpdate(time => { bell.rotation.x = Math.sin(time * 1.1) * 0.12; });
  kit.collideCircle(x, z, 0.6);
}

function buildLifebuoy(kit, m, x, z) {
  const post = kit.group({ x, z, ry: -0.3 });
  kit.cylinder(0.05, 0.06, 1.3, m.wood, { parent: post, segments: 8 });
  for (let quarter = 0; quarter < 4; quarter++) {
    kit.mesh(new TorusGeometry(0.28, 0.075, 10, 12, Math.PI / 2), quarter % 2 ? m.trim : m.coral, { parent: post, y: 1.05, z: 0.09, rz: (quarter * Math.PI) / 2 });
  }
  kit.collideCircle(x, z, 0.3);
}

function buildGulls(kit, m) {
  const flock = kit.group({ x: TOWER.x, z: TOWER.z, dynamic: true });
  const gulls = [0, 1, 2].map(index => {
    const gull = kit.group({ parent: flock });
    kit.sphere(0.09, m.gull, { parent: gull, scale: [1, 0.8, 2.4] });
    const wings = [-1, 1].map(side => {
      const wing = kit.group({ parent: gull, x: side * 0.06 });
      kit.box(0.42, 0.015, 0.14, m.wing, { parent: wing, x: side * 0.21, y: -0.0075 });
      return wing;
    });
    return { gull, wings, radius: 4.6 + index * 0.9, height: 9 + index * 0.9, speed: 0.45 + index * 0.08, phase: index * 2.2 };
  });
  kit.onUpdate(time => {
    for (const { gull, wings, radius, height, speed, phase } of gulls) {
      const angle = time * speed + phase;
      gull.position.set(Math.cos(angle) * radius, height + Math.sin(angle * 1.7) * 0.5, Math.sin(angle) * radius);
      gull.rotation.set(0, -angle, -0.3);
      const flap = Math.sin(time * 7 + phase) * 0.45;
      wings[0].rotation.z = -flap;
      wings[1].rotation.z = flap;
    }
  });
}
