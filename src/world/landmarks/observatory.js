import {
  BufferAttribute, BufferGeometry, CatmullRomCurve3, DoubleSide, ExtrudeGeometry,
  LatheGeometry, MeshStandardMaterial, Path, Shape, ShapeGeometry, TubeGeometry, Vector2, Vector3,
} from 'three';
import { plaza } from './common.js';

// Original astronomical pavilion informed by the OCA's historic buildings and
// instrument sections. Architectural references: qa/fantasy-landmarks-notes.md.
const TAU = Math.PI * 2;

function line(kit, points, radius, material, options = {}) {
  const curve = new CatmullRomCurve3(points.map(point => new Vector3(...point)));
  return kit.mesh(new TubeGeometry(curve, Math.max(6, points.length), radius, 5, false), material, options);
}

function archOutline(width, height, shape = new Shape(), bottom = 0) {
  const radius = width / 2;
  shape.moveTo(-radius, bottom);
  shape.lineTo(radius, bottom);
  shape.lineTo(radius, height - radius);
  shape.absarc(0, height - radius, radius, 0, Math.PI, false);
  shape.lineTo(-radius, bottom);
  return shape;
}

function archWindow(kit, { x, y, z, width = 0.66, height = 1.38, rotation = 0, parent, stone, glass, bronze }) {
  const group = kit.group({ x, y, z, ry: rotation, parent });
  const outer = archOutline(width + 0.23, height + 0.14);
  const inner = archOutline(width, height, new Path(), 0.085);
  outer.holes.push(inner);
  const frame = new ExtrudeGeometry(outer, { depth: 0.1, bevelEnabled: true, bevelSegments: 1, steps: 1,
    bevelSize: 0.025, bevelThickness: 0.025, curveSegments: 10 });
  kit.mesh(frame, stone, { parent: group });
  kit.mesh(new ShapeGeometry(archOutline(width - 0.025, height - 0.02), 12), glass, { parent: group, z: 0.012, shadow: false });
  kit.box(0.026, height - 0.06, 0.035, bronze, { parent: group, y: 0.035, z: 0.05 });
  [0.48, 0.94].filter(h => h < height - 0.1).forEach(h => kit.box(width - 0.06, 0.024, 0.035, bronze, { parent: group, y: h, z: 0.05 }));
  kit.box(width + 0.33, 0.1, 0.23, stone, { parent: group, y: -0.1, z: 0.04 });
  kit.box(0.17, 0.2, 0.15, stone, { parent: group, y: height - 0.02, z: 0.035 });
}

function column(kit, x, z, y, height, material, radius = 0.15) {
  const profile = [[radius * 1.45, 0], [radius * 1.45, 0.09], [radius * 1.12, 0.13], [radius, 0.2],
    [radius * 0.86, height - 0.28], [radius * 1.15, height - 0.2], [radius * 1.4, height - 0.11], [radius * 1.4, height]];
  kit.mesh(new LatheGeometry(profile.map(point => new Vector2(...point)), 20), material, { x, y, z });
  kit.box(radius * 3.1, 0.08, radius * 3.1, material, { x, y: y + height - 0.03, z });
}

// Each half dome is a true shell bounded by x = +/- slitWidth/2. Unlike a
// painted stripe or missing wedge, this leaves a constant-width opening across
// the zenith, with real rails and room for the instrument.
function domePanel(radius, side, a0, a1, t0, t1, segmentsA = 2, segmentsT = 4) {
  const positions = [], indices = [];
  for (let ia = 0; ia <= segmentsA; ia += 1) {
    const a = a0 + (a1 - a0) * ia / segmentsA;
    for (let it = 0; it <= segmentsT; it += 1) {
      const theta = t0 + (t1 - t0) * it / segmentsT;
      positions.push(side * radius * Math.sin(a), radius * Math.cos(a) * Math.sin(theta), radius * Math.cos(a) * Math.cos(theta));
    }
  }
  for (let ia = 0; ia < segmentsA; ia += 1) {
    for (let it = 0; it < segmentsT; it += 1) {
      const a = ia * (segmentsT + 1) + it, b = a + segmentsT + 1;
      if (side > 0) indices.push(a, b, a + 1, b, b + 1, a + 1);
      else indices.push(a, a + 1, b, b, a + 1, b + 1);
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function splitDome(kit, { x, y, z, radius, slitWidth, copper, seam, parent }) {
  const group = kit.group({ x, y, z, parent });
  group.name = radius > 2 ? 'hindsight-main-dome' : 'hindsight-annex-dome';
  group.userData.slitWidth = slitWidth;
  const begin = Math.asin(slitWidth / (2 * radius));
  const divisions = 9;
  for (const side of [-1, 1]) {
    for (let strip = 0; strip < divisions; strip += 1) {
      const a0 = begin + (Math.PI / 2 - begin) * strip / divisions;
      const a1 = begin + (Math.PI / 2 - begin) * (strip + 1) / divisions;
      for (let panel = 0; panel < 7; panel += 1) {
        const t0 = panel / 7 * Math.PI, t1 = (panel + 1) / 7 * Math.PI;
        const shell = kit.mesh(domePanel(radius, side, a0, a1, t0, t1), copper[(strip * 3 + panel) % copper.length], { parent: group });
        shell.name = 'copper-dome-panel';
      }
      const points = [];
      for (let step = 0; step <= 22; step += 1) {
        const theta = step / 22 * Math.PI;
        points.push([side * (radius + 0.012) * Math.sin(a0), (radius + 0.012) * Math.cos(a0) * Math.sin(theta), (radius + 0.012) * Math.cos(a0) * Math.cos(theta)]);
      }
      line(kit, points, strip === 0 ? 0.044 : 0.018, seam, { parent: group });
    }
    for (let cross = 1; cross < 7; cross += 1) {
      const theta = cross / 7 * Math.PI;
      const points = [];
      for (let step = 0; step <= 18; step += 1) {
        const a = begin + (Math.PI / 2 - begin) * step / 18;
        points.push([side * (radius + 0.018) * Math.sin(a), (radius + 0.018) * Math.cos(a) * Math.sin(theta), (radius + 0.018) * Math.cos(a) * Math.cos(theta)]);
      }
      line(kit, points, 0.012, seam, { parent: group, shadow: false });
    }
  }
  return group;
}

function telescope(kit, { parent, bronze, iron, glass, ivory }) {
  kit.cylinder(0.43, 0.62, 0.16, iron, { parent, segments: 24 });
  kit.cylinder(0.23, 0.35, 0.81, ivory, { parent, y: 0.16, segments: 24 });
  const mount = kit.group({ parent, y: 0.9 });
  kit.cylinder(0.22, 0.23, 0.42, bronze, { parent: mount, y: -0.06, rx: -0.45, segments: 20 });
  for (const side of [-1, 1]) {
    line(kit, [[side * 0.15, 0.1, -0.05], [side * 0.43, 0.25, -0.02], [side * 0.43, 0.62, 0]], 0.09, iron, { parent: mount });
  }
  kit.cylinder(0.25, 0.25, 0.16, bronze, { parent: mount, x: -0.5, y: 0.55, rz: Math.PI / 2, segments: 24 });
  const tube = kit.group({ parent: mount, y: 0.62, rx: 0.82 });
  kit.cylinder(0.245, 0.19, 2.75, ivory, { parent: tube, y: -1.35, segments: 32 });
  [-1.31, -0.66, 0.61, 1.37].forEach(y => kit.cylinder(0.27, 0.27, 0.08, bronze, { parent: tube, y, segments: 24 }));
  kit.cylinder(0.295, 0.27, 0.32, iron, { parent: tube, y: 1.43, segments: 32 });
  kit.cylinder(0.255, 0.255, 0.025, glass, { parent: tube, y: 1.74, segments: 32, shadow: false });
  kit.cylinder(0.095, 0.13, 0.3, iron, { parent: tube, y: -1.65, segments: 16 });
  kit.cylinder(0.11, 0.11, 0.055, bronze, { parent: tube, y: -1.7, segments: 16 });
  // Guide scope and a counterweight belong to the mount, not to the roof.
  kit.cylinder(0.07, 0.07, 0.87, iron, { parent: tube, x: 0.35, y: 0.05, segments: 12 });
  [0.16, 0.65].forEach(y => kit.box(0.14, 0.07, 0.06, bronze, { parent: tube, x: 0.29, y }));
  kit.bar([0, 0.3, -0.1], [-0.8, 0.3, -0.1], 0.07, iron, { parent: mount });
  kit.cylinder(0.21, 0.21, 0.25, bronze, { parent: mount, x: -0.8, y: 0.3, rz: Math.PI / 2, segments: 16 });
}

function orrery(kit, { x, z, bronze, iron, ivory }) {
  kit.cylinder(0.63, 0.8, 0.16, ivory, { x, z, segments: 28 });
  kit.cylinder(0.2, 0.32, 0.94, ivory, { x, z, y: 0.16, segments: 24 });
  kit.cylinder(0.65, 0.43, 0.1, bronze, { x, z, y: 1.1, segments: 32 });
  kit.cylinder(0.04, 0.04, 0.54, bronze, { x, z, y: 1.2, segments: 12 });
  kit.sphere(0.16, bronze, { x, z, y: 1.73, widthSegments: 20, heightSegments: 12 });
  const system = kit.group({ x, y: 1.7, z, dynamic: true });
  [0.38, 0.62, 0.88].forEach((radius, index) => {
    kit.torus(radius, 0.014, bronze, { parent: system, rx: Math.PI / 2 + index * 0.14, radialSegments: 5, tubularSegments: 48 });
    const orbit = kit.group({ parent: system, ry: index * 1.8 });
    kit.bar([0, 0, 0], [radius, 0, 0], 0.018, bronze, { parent: orbit });
    kit.sphere(0.05 + index * 0.018, [iron, ivory, '#597e80'][index], { parent: orbit, x: radius, widthSegments: 12, heightSegments: 8 });
  });
  kit.onUpdate(time => { system.rotation.y = time * 0.08; });
  kit.collideCircle(x, z, 0.86);
}

export function buildHindsight(kit) {
  const ivory = new MeshStandardMaterial({ color: '#d9d1bd', roughness: 0.88 });
  const pale = new MeshStandardMaterial({ color: '#ece3ce', roughness: 0.82 });
  const foundation = new MeshStandardMaterial({ color: '#a8a799', roughness: 0.95 });
  const iron = new MeshStandardMaterial({ color: '#354c51', roughness: 0.5, metalness: 0.38 });
  const bronze = new MeshStandardMaterial({ color: '#ab9162', roughness: 0.46, metalness: 0.52 });
  const copper = ['#527e78', '#668b7f', '#799889', '#53847d', '#8b9d88', '#66857a'].map(color =>
    new MeshStandardMaterial({ color, roughness: 0.58, metalness: 0.38, side: DoubleSide }));
  const glass = new MeshStandardMaterial({ color: '#466d7b', roughness: 0.22, metalness: 0.3,
    emissive: '#d4c297', emissiveIntensity: 0.03 });
  kit.materials.trackGlow(glass, 0.03, 0.3);
  const cx = -0.65, cz = -1.55;
  plaza(kit, 7.18, '#c7c6b8');

  // Stone drum with built foundations, recessed openings and masonry courses.
  kit.cylinder(2.74, 2.89, 0.25, foundation, { x: cx, z: cz, y: -0.12, segments: 64 });
  kit.cylinder(2.55, 2.6, 3.38, ivory, { x: cx, z: cz, y: 0.12, segments: 64 });
  [0.18, 0.65, 2.62, 3.36].forEach((y, index) => {
    kit.cylinder(index === 3 ? 2.73 : 2.63, index === 3 ? 2.7 : 2.63, index === 3 ? 0.18 : 0.08,
      index % 2 ? pale : foundation, { x: cx, z: cz, y, segments: 64 });
  });
  kit.collideCircle(cx, cz, 2.69);
  for (let bay = 0; bay < 12; bay += 1) {
    const angle = bay / 12 * TAU;
    if (bay !== 0) {
      archWindow(kit, { x: cx + Math.sin(angle) * 2.555, y: 1.02,
        z: cz + Math.cos(angle) * 2.555, rotation: angle,
        stone: pale, glass, bronze });
    }
    const a = angle + Math.PI / 12;
    column(kit, cx + Math.sin(a) * 2.58, cz + Math.cos(a) * 2.58, 0.72, 2.56, pale, 0.085);
    // Recessed mortar lines on the lower stone course.
    const pilaster = kit.group({ x: cx + Math.sin(a) * 2.62, z: cz + Math.cos(a) * 2.62, ry: a });
    [0.26, 0.43].forEach(y => kit.box(0.5, 0.012, 0.018, foundation, { parent: pilaster, y, shadow: false }));
  }

  // Rotation rail, regularly spaced rollers and the two segmented copper shells.
  kit.cylinder(2.68, 2.68, 0.2, iron, { x: cx, z: cz, y: 3.54, segments: 64 });
  kit.torus(2.65, 0.05, bronze, { x: cx, z: cz, y: 3.68, rx: Math.PI / 2, radialSegments: 8, tubularSegments: 64 });
  for (let roller = 0; roller < 16; roller += 1) {
    const a = roller / 16 * TAU;
    kit.sphere(0.07, bronze, { x: cx + Math.sin(a) * 2.65, z: cz + Math.cos(a) * 2.65, y: 3.59, widthSegments: 8, heightSegments: 6 });
  }
  splitDome(kit, { x: cx, y: 3.75, z: cz, radius: 2.65, slitWidth: 0.98, copper, seam: bronze });
  // A dark floor makes the real opening legible, with the telescope on its pier.
  kit.cylinder(2.48, 2.48, 0.05, iron, { x: cx, z: cz, y: 3.71, segments: 64 });
  const instrument = kit.group({ x: cx, y: 3.73, z: cz });
  telescope(kit, { parent: instrument, bronze, iron, glass, ivory: pale });

  // Four-column entrance portico, recessed arched doorway and a triangular pediment.
  const entryZ = 1.6;
  kit.box(2.8, 0.2, 1.18, foundation, { x: cx, z: entryZ, y: 0.1 });
  kit.platform(cx, entryZ, 2.8, 1.18, 0.3);
  archWindow(kit, { x: cx, y: 0.36, z: 1.055, width: 1.16, height: 2.08, stone: pale, glass: iron, bronze });
  [-1.12, -0.76, 0.76, 1.12].forEach(offset => {
    column(kit, cx + offset, 2.02, 0.3, 2.32, pale, 0.105);
    kit.collideCircle(cx + offset, 2.02, 0.17);
  });
  kit.box(2.92, 0.19, 1.24, pale, { x: cx, z: entryZ, y: 2.61 });
  kit.box(3.04, 0.07, 1.33, foundation, { x: cx, z: entryZ, y: 2.8 });
  const pediment = new Shape();
  pediment.moveTo(-1.52, 0); pediment.lineTo(1.52, 0); pediment.lineTo(0, 0.55); pediment.closePath();
  kit.mesh(new ExtrudeGeometry(pediment, { depth: 0.15, bevelEnabled: true, bevelSize: 0.025, bevelThickness: 0.025, bevelSegments: 2 }), pale,
    { x: cx, y: 2.87, z: 2.05 });
  kit.torus(0.13, 0.025, bronze, { x: cx, y: 3.07, z: 2.24, radialSegments: 6, tubularSegments: 24 });
  for (let ray = 0; ray < 8; ray += 1) {
    const angle = ray / 8 * TAU;
    kit.bar([cx + Math.sin(angle) * 0.17, 3.07 + Math.cos(angle) * 0.17, 2.23],
      [cx + Math.sin(angle) * 0.25, 3.07 + Math.cos(angle) * 0.25, 2.23], 0.025, bronze);
  }
  for (let step = 0; step < 4; step += 1) {
    const top = 0.085 + step * 0.055;
    const depth = 1.1 - step * 0.22, z = 2.3 - step * 0.11;
    kit.box(2.9, top, depth, step % 2 ? pale : ivory, { x: cx, z });
    kit.platform(cx, z, 2.9, depth, top);
  }

  // Lower library wing and a second, smaller dome give the silhouette depth.
  kit.box(2.65, 1.57, 1.65, ivory, { x: 2.4, z: -1.85, y: 0.1 });
  kit.box(2.8, 0.12, 1.8, pale, { x: 2.4, z: -1.85, y: 1.67 });
  kit.collideBox(2.4, -1.85, 2.7, 1.7);
  kit.cylinder(1.15, 1.2, 2.0, ivory, { x: 3.87, z: -1.8, y: 0.06, segments: 48 });
  kit.cylinder(1.27, 1.25, 0.12, pale, { x: 3.87, z: -1.8, y: 2.06, segments: 48 });
  kit.collideCircle(3.87, -1.8, 1.28);
  splitDome(kit, { x: 3.87, y: 2.19, z: -1.8, radius: 1.23, slitWidth: 0.24, copper, seam: bronze });
  for (let index = 0; index < 6; index += 1) {
    const a = index / 6 * TAU;
    archWindow(kit, { x: 3.87 + Math.sin(a) * 1.16, y: 0.5,
      z: -1.8 + Math.cos(a) * 1.16, width: 0.42, height: 1.0, rotation: a, stone: pale, glass, bronze });
  }
  [-2.69, -1.01].forEach((z, index) => archWindow(kit, { x: 2.6, y: 0.4, z,
    width: 0.6, height: 1.0, rotation: index ? 0 : Math.PI, stone: pale, glass, bronze }));

  // A human-scale astronomical instrument belongs on the terrace, on its own plinth.
  orrery(kit, { x: -4.45, z: 2.5, bronze, iron, ivory: pale });
  // Low curved parapet at the rear and subtle lamps flank the approach.
  for (let bay = 0; bay < 12; bay += 1) {
    const a = Math.PI / 2 + bay / 11 * Math.PI;
    const x = Math.sin(a) * 5.7, z = Math.cos(a) * 5.7;
    kit.cylinder(0.095, 0.12, 0.72, pale, { x, z, segments: 12 });
    kit.sphere(0.13, pale, { x, y: 0.78, z, widthSegments: 10, heightSegments: 6 });
    kit.collideCircle(x, z, 0.12);
  }
  [-2.85, 1.6].forEach(x => {
    kit.cylinder(0.12, 0.18, 0.18, foundation, { x, z: 3.23, segments: 12 });
    kit.cylinder(0.045, 0.07, 1.72, iron, { x, z: 3.23, y: 0.18, segments: 12 });
    kit.sphere(0.13, kit.materials.glow('#e7d3a1', { day: 0.03, night: 0.9, base: '#d2c2a0' }),
      { x, z: 3.23, y: 1.96, widthSegments: 12, heightSegments: 8, shadow: false });
    kit.torus(0.18, 0.015, bronze, { x, z: 3.23, y: 1.96, rx: Math.PI / 2, radialSegments: 5, tubularSegments: 20 });
    kit.collideCircle(x, 3.23, 0.15);
  });
  return { interactAt: [cx, 3.3], beaconAt: [4.5, 2.8], labelHeight: 8.3 };
}
