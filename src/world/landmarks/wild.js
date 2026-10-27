import { DoubleSide, MeshStandardMaterial, PlaneGeometry } from 'three';
import { PALETTE } from '../materials.js';
import { bench, flowerBed, lamp, pine, plaza, signBoard, windowPane } from './common.js';

// The Alps (UrdWell, RWU) and the North (HindSight, KTU).

export function buildUrdwell(kit) {
  const veinMaterial = kit.materials.glow('#b5dc79', { day: 0.9, night: 2.8 });
  plaza(kit, 7.8, '#4f8a4a');
  const trunkColor = '#7b5a3e';
  kit.cylinder(0.75, 1.3, 5.6, trunkColor, { z: -2, segments: 9 });
  kit.cylinder(0.55, 0.95, 4.6, '#6e5037', { x: 0.25, z: -2.1, rz: 0.08, segments: 7 });
  kit.cylinder(0.5, 0.85, 4.2, '#86634a', { x: -0.25, z: -1.9, rz: -0.07, segments: 7 });
  for (let index = 0; index < 6; index++) {
    const angle = (index / 6) * Math.PI * 2 + 0.3;
    const [dx, dz] = [Math.cos(angle), Math.sin(angle)];
    kit.bar([dx * 0.6, 1.1, -2 + dz * 0.6], [dx * 2.3, -0.2, -2 + dz * 2.3], 0.42, '#6e5037');
    kit.bar([dx * 0.75, 1.32, -2 + dz * 0.75], [dx * 2.3, 0.06, -2 + dz * 2.3], 0.08, veinMaterial, { shadow: false });
  }
  [[1.8, 6.6, -1], [-2, 6.3, -2.4], [0.4, 7.4, -3.6], [-0.6, 5.6, 0.2]].forEach(([x, y, z]) => {
    kit.bar([0, 4.6, -2], [x * 0.8, y - 0.6, z * 0.8 - 0.4], 0.32, trunkColor);
  });
  const leaves = ['#5aa64a', '#4b9142', '#6dbb57', '#5fbf9a', '#4f9e7f', '#68b45a'];
  [[0, 7.6, -2, 2.6], [2.2, 6.8, -1, 2], [-2.3, 6.6, -2.6, 2.1], [0.6, 8.6, -3.4, 1.9], [-0.8, 6.2, 0.4, 1.7], [1.6, 8.4, -2.6, 1.6], [-1.8, 8.1, -1.2, 1.5]]
    .forEach(([x, y, z, radius], index) => kit.ico(radius, leaves[index % leaves.length], { x, y, z, detail: 1 }));
  kit.collideCircle(0, -2, 1.5);

  const well = kit.group({ z: 1.9 });
  kit.cylinder(0.95, 1.02, 0.8, PALETTE.stone, { parent: well, segments: 12 });
  kit.cylinder(0.8, 0.8, 0.05, kit.materials.neon('#9dffcf', 1.8), { parent: well, y: 0.68, segments: 12, shadow: false });
  [-0.85, 0.85].forEach(x => kit.box(0.12, 1.9, 0.12, PALETTE.woodDark, { parent: well, x }));
  kit.roof(1.5, 0.6, 2.1, PALETTE.woodDark, { parent: well, y: 1.9, ry: Math.PI / 2 });
  kit.disc(0.06, 1.7, PALETTE.wood, { parent: well, y: 1.55, ry: Math.PI / 2 });
  kit.cylinder(0.14, 0.11, 0.24, PALETTE.wood, { parent: well, y: 0.95 });
  kit.box(0.02, 0.4, 0.02, PALETTE.ink, { parent: well, y: 1.15 });
  kit.collideCircle(0, 1.9, 1.05);

  [[-2.7, 2.6], [2.9, -0.4], [-3.1, -0.6]].forEach(([x, z], index) => {
    kit.box(0.5, 1.2 + index * 0.2, 0.3, PALETTE.rock, { x, z, ry: index });
    kit.box(0.12, 0.5, 0.05, veinMaterial, { x, z, y: 0.5, ry: index, shadow: false });
    kit.collideCircle(x, z, 0.4);
  });

  const memories = kit.group({ z: -2, dynamic: true });
  const cardMaterial = new MeshStandardMaterial({ color: '#eaffd0', emissive: '#b5dc79', emissiveIntensity: 1.6, side: DoubleSide, transparent: true, opacity: 0.85 });
  const cards = Array.from({ length: 12 }, (_, index) => {
    const card = kit.mesh(new PlaneGeometry(0.32, 0.42), cardMaterial, { parent: memories, shadow: false });
    card.userData.phase = index / 12;
    return card;
  });
  kit.onUpdate(time => {
    cards.forEach(card => {
      const progress = (time * 0.05 + card.userData.phase) % 1;
      const angle = card.userData.phase * Math.PI * 6 + time * 0.4;
      const radius = 2.4 + Math.sin(card.userData.phase * 17) * 0.8;
      card.position.set(Math.cos(angle) * radius, 1 + progress * 7, Math.sin(angle) * radius);
      card.rotation.set(Math.sin(time + angle), angle, 0.3);
      card.scale.setScalar(Math.sin(progress * Math.PI));
    });
  });

  signBoard(kit, 'UrdWell', -3.6, 3.4, { rotation: 0.4, background: '#3c6b35', width: 1.9 });
  return { interactAt: [0, 3.5], beaconAt: [3.2, 2.8], labelHeight: 11 };
}

export function buildRwu(kit) {
  const beam = '#5a3a24';
  const plaster = '#f7f1e3';
  plaza(kit, 5.8, '#d9cdb8');
  kit.box(4.2, 2.6, 3.4, plaster, { z: -1.2 });
  kit.box(4.6, 1.7, 3.8, plaster, { y: 2.6, z: -1.2 });
  kit.roof(4, 2.9, 5.1, '#a2482f', { y: 4.3, z: -1.2, ry: Math.PI / 2 });
  [-2.05, -1, 0, 1, 2.05].forEach(x => kit.box(0.14, 2.6, 0.06, beam, { x, z: 0.52 }));
  [-2.25, -1.1, 0, 1.1, 2.25].forEach(x => kit.box(0.14, 1.7, 0.06, beam, { x, y: 2.6, z: 0.72 }));
  [0.02, 2.55].forEach(y => kit.box(4.3, 0.14, 0.06, beam, { y, z: 0.53 }));
  [2.6, 4.2].forEach(y => kit.box(4.7, 0.14, 0.06, beam, { y, z: 0.73 }));
  [[-2.25, -1.1], [1.1, 2.25]].forEach(([from, to]) => {
    kit.bar([from, 2.65, 0.74], [to, 4.2, 0.74], 0.12, beam);
    kit.bar([to, 2.65, 0.74], [from, 4.2, 0.74], 0.12, beam);
  });
  windowPane(kit, 0, 3, 0.74, 0.7, 0.8, { frame: beam });
  [-1.5, 1.5].forEach(x => {
    windowPane(kit, x, 0.9, 0.52, 0.7, 0.85, { frame: beam });
    flowerBed(kit, x, 0.8, 1, ['#e8473b', '#ff8fb1', '#fff3e2']);
  });
  kit.box(0.9, 1.8, 0.1, beam, { z: 0.55 });
  kit.collideBox(0, -1.2, 4.7, 3.9);

  const pole = kit.group({ x: 3.4, z: 1.4 });
  for (let index = 0; index < 9; index++) {
    kit.cylinder(0.11, 0.12, 0.8, index % 2 ? '#2f63c8' : '#f7f5f0', { parent: pole, y: index * 0.8, segments: 8 });
  }
  kit.torus(0.55, 0.12, '#3f8a45', { parent: pole, y: 6.2, rx: Math.PI / 2 });
  kit.cone(0.2, 0.6, '#3f8a45', { parent: pole, y: 7.2 });
  kit.collideCircle(3.4, 1.4, 0.3);

  signBoard(kit, 'RWU · 2024–2025', -3, 2.4, { rotation: 0.3, width: 2.4 });
  lamp(kit, 2.6, 3.6);
  pine(kit, -4.4, -2.4, 1.1);
  pine(kit, 4.2, -3, 0.9);
  return { interactAt: [0, 2], labelHeight: 9 };
}

export function buildHindsight(kit) {
  const violet = '#b9a2ff';
  plaza(kit, 7.6, '#dfe7f2');
  kit.cylinder(2.65, 2.85, 3.2, '#f2efe8', { z: -1.5, segments: 18 });
  kit.cylinder(2.78, 2.78, 0.25, PALETTE.brass, { y: 3, z: -1.5, segments: 18 });
  kit.box(1, 1.9, 0.3, '#2c3558', { z: 1.2 });
  kit.box(1.4, 0.18, 0.7, PALETTE.stone, { z: 1.5 });
  [-1.6, 1.6].forEach(x => windowPane(kit, x, 1.1, 0.8 - Math.abs(x) * 0.2, 0.5, 0.8, { frame: '#2c3558', rotation: Math.sign(x) * 0.62 }));
  kit.collideCircle(0, -1.5, 2.95);

  const dome = kit.group({ y: 3.25, z: -1.5, dynamic: true });
  kit.sphere(2.6, kit.materials.metal('#8c9ac4'), { parent: dome, thetaLength: Math.PI / 2, widthSegments: 18, heightSegments: 7 });
  kit.box(0.7, 2.1, 0.3, PALETTE.ink, { parent: dome, y: 1.12, z: 1.52, rx: -0.96 });
  kit.cylinder(0.24, 0.34, 2.4, PALETTE.brass, { parent: dome, y: 0.93, z: 1.49, rx: 0.61, segments: 10 });
  kit.onUpdate(time => { dome.rotation.y = Math.sin(time * 0.15) * 0.9; });

  const clock = kit.group({ y: 2.15, z: 1.36 });
  kit.disc(0.55, 0.08, PALETTE.cream, { parent: clock });
  kit.torus(0.55, 0.05, PALETTE.brass, { parent: clock });
  const hourHand = kit.box(0.06, 0.3, 0.03, PALETTE.ink, { parent: clock, z: 0.06, dynamic: true, shadow: false });
  const minuteHand = kit.box(0.04, 0.45, 0.03, PALETTE.ink, { parent: clock, z: 0.08, dynamic: true, shadow: false });
  // Move each hand's pivot from its centre to its base, at the clock centre.
  [hourHand, minuteHand].forEach(hand => {
    hand.geometry.translate(0, hand.position.y, 0);
    hand.position.y = 0;
  });
  kit.onUpdate(() => {
    const now = new Date();
    const minutes = now.getMinutes() + now.getSeconds() / 60;
    minuteHand.rotation.z = -(minutes / 60) * Math.PI * 2;
    hourHand.rotation.z = -(((now.getHours() % 12) + minutes / 60) / 12) * Math.PI * 2;
  });

  const rings = kit.group({ y: 8.6, z: -1.5, dynamic: true });
  const outer = kit.group({ parent: rings });
  kit.torus(3.4, 0.09, PALETTE.brass, { parent: outer, rx: Math.PI / 2, tubularSegments: 64 });
  for (let tick = 0; tick < 12; tick++) {
    const angle = (tick / 12) * Math.PI * 2;
    kit.box(0.12, 0.12, 0.45, PALETTE.brass, { parent: outer, x: Math.cos(angle) * 3.4, z: Math.sin(angle) * 3.4, y: -0.06, ry: -angle });
  }
  const inner = kit.group({ parent: rings, rx: 0.5 });
  kit.torus(2.6, 0.07, kit.materials.neon(violet, 1.8), { parent: inner, rx: Math.PI / 2, tubularSegments: 64, shadow: false });
  const hourglass = kit.group({ parent: rings });
  const sand = kit.materials.glow(violet, { day: 1, night: 2.2, opacity: 0.75 });
  kit.cone(0.5, 0.8, sand, { parent: hourglass, y: 0, segments: 8, shadow: false });
  kit.cone(0.5, 0.8, sand, { parent: hourglass, y: -0.8, rx: Math.PI, segments: 8, shadow: false });
  kit.onUpdate(time => {
    outer.rotation.y = time * 0.25;
    inner.rotation.y = -time * 0.4;
    inner.rotation.z = Math.sin(time * 0.3) * 0.3;
    hourglass.rotation.z = Math.floor(time / 6) * Math.PI + Math.min(1, (time % 6) / 1.2) * Math.PI;
    rings.position.y = 8.6 + Math.sin(time * 0.8) * 0.25;
  });

  lamp(kit, -4.8, 2.8);
  pine(kit, -5.4, -2.6, 1.1, { snowy: true });
  pine(kit, 5.2, -3.4, 1.2, { snowy: true });
  return { interactAt: [0, 2.7], beaconAt: [3.6, 2.6], labelHeight: 13 };
}

export function buildKtu(kit) {
  plaza(kit, 5.8, '#d5dfe9');
  kit.box(4, 3, 3.2, PALETTE.brick, { z: -1.3 });
  for (let step = 0; step < 4; step++) {
    kit.box(3.6 - step * 0.9, 0.55, 0.4, PALETTE.brick, { y: 3 + step * 0.55, z: 0.1 });
    kit.box(3.7 - step * 0.9, 0.08, 0.5, PALETTE.snow, { y: 3.55 + step * 0.55, z: 0.1 });
  }
  kit.roof(4.2, 2.2, 3.2, PALETTE.snow, { y: 3, z: -1.5 });
  [-1.2, 0, 1.2].forEach(x => windowPane(kit, x, 1.7, 0.32, 0.45, 1, { frame: '#f0e6dc' }));
  [-1.2, 1.2].forEach(x => windowPane(kit, x, 0.5, 0.32, 0.45, 0.8, { frame: '#f0e6dc' }));
  kit.box(0.9, 1.9, 0.1, '#5c2a1f', { z: 0.32 });
  kit.box(1.2, 5.6, 1.2, PALETTE.brick, { x: 1.7, z: -2.5 });
  kit.cone(1, 1.7, '#4f8f7a', { x: 1.7, y: 5.6, z: -2.5, segments: 4, ry: Math.PI / 4 });
  kit.cone(0.65, 0.5, PALETTE.snow, { x: 1.7, y: 6.6, z: -2.5, segments: 4, ry: Math.PI / 4 });
  kit.collideBox(0, -1.3, 4.2, 3.4);
  kit.collideBox(1.7, -2.5, 1.4, 1.4);

  const hoop = kit.group({ x: 3.6, z: 2.2, ry: -Math.PI / 2 });
  kit.cylinder(0.07, 0.09, 3.1, PALETTE.ink, { parent: hoop, segments: 8 });
  kit.box(1.2, 0.8, 0.06, PALETTE.white, { parent: hoop, y: 2.75, z: 0.2 });
  kit.box(0.5, 0.36, 0.07, '#e8742a', { parent: hoop, y: 2.82, z: 0.21 });
  kit.torus(0.24, 0.025, '#e8742a', { parent: hoop, y: 2.85, z: 0.5, rx: Math.PI / 2, shadow: false });
  kit.collideCircle(3.6, 2.2, 0.3);
  kit.sphere(0.2, '#e07a2c', { x: 2.4, y: 0.2, z: 3 });

  signBoard(kit, 'KTU · Kaunas · 2023', -3, 2.4, { rotation: 0.3, width: 2.5, background: '#7c2f24' });
  bench(kit, -3.6, -0.6, Math.PI / 2);
  pine(kit, -4.6, -3, 1.1, { snowy: true });
  pine(kit, 4.4, -2.2, 1, { snowy: true });
  return { interactAt: [0, 2.1], labelHeight: 9 };
}
