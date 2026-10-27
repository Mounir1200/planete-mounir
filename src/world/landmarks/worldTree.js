import {
  BufferAttribute, BufferGeometry, CatmullRomCurve3, DoubleSide, MeshStandardMaterial,
  RingGeometry, SphereGeometry, TubeGeometry, Vector3,
} from 'three';
import { plaza } from './common.js';

// Original world-tree design. Curved, tapered geometry and individually modelled
// leaves replace the old cylinders/cones. Sources: qa/fantasy-landmarks-notes.md.
const TAU = Math.PI * 2;
const v = point => new Vector3(...point);
const mix = (a, b, t) => a + (b - a) * t;

function random(seed = 12741) {
  return () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
}

function woodTube(kit, points, radii, material, { segments = 20, sides = 9, fluting = 0, parent, shadow = true } = {}) {
  const curve = new CatmullRomCurve3(points.map(v), false, 'catmullrom', 0.42);
  const geometry = new TubeGeometry(curve, segments, 1, sides, false);
  const positions = geometry.attributes.position;
  const vertex = new Vector3();
  for (let ring = 0; ring <= segments; ring += 1) {
    const t = ring / segments;
    const center = curve.getPointAt(t);
    const section = t * (radii.length - 1);
    const lower = Math.min(radii.length - 2, Math.floor(section));
    const radius = mix(radii[lower], radii[lower + 1], section - lower);
    for (let side = 0; side <= sides; side += 1) {
      const index = ring * (sides + 1) + side;
      const angle = side / sides * TAU;
      const ridge = 1 + fluting * Math.sin(angle * 5 + t * 9) + fluting * 0.35 * Math.cos(angle * 9 - t * 14);
      vertex.fromBufferAttribute(positions, index).sub(center).multiplyScalar(radius * ridge).add(center);
      positions.setXYZ(index, vertex.x, vertex.y, vertex.z);
    }
  }
  geometry.computeVertexNormals();
  kit.mesh(geometry, material, { parent, shadow });
  return curve;
}

function leafGeometry(length, width) {
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(new Float32Array([
    0, 0, 0, -width, length * 0.43, 0.015,
    0, length, -0.025, width, length * 0.43, 0.015,
    0, length * 0.46, 0.07,
  ]), 3));
  geometry.setIndex([0, 1, 4, 1, 2, 4, 2, 3, 4, 3, 0, 4]);
  geometry.computeVertexNormals();
  return geometry;
}

function stone(kit, radius, height, material, { x = 0, y = 0, z = 0, scale = [1, 1, 1], phase = 0 } = {}) {
  const geometry = new SphereGeometry(radius, 8, 5);
  const positions = geometry.attributes.position;
  for (let index = 0; index < positions.count; index += 1) {
    const px = positions.getX(index), py = positions.getY(index), pz = positions.getZ(index);
    const uneven = 1 + 0.08 * Math.sin(px * 5 + pz * 3 + phase);
    positions.setXYZ(index, px * uneven * scale[0], py * height / (radius * 2) * scale[1], pz * uneven * scale[2]);
  }
  geometry.computeVertexNormals();
  return kit.mesh(geometry, material, { x, y: y + height / 2, z });
}

export function buildUrdwell(kit) {
  const rng = random();
  const bark = new MeshStandardMaterial({ color: '#685646', roughness: 0.96 });
  const warmBark = new MeshStandardMaterial({ color: '#80715b', roughness: 0.94 });
  const darkBark = new MeshStandardMaterial({ color: '#4c4439', roughness: 1 });
  const moss = new MeshStandardMaterial({ color: '#526d4a', roughness: 1 });
  // Cool sap gives each leaf a little of its own light after dusk. These are
  // surface colours, not lights: the crown stays legible without washing out
  // neighbouring buildings or turning the individual leaves into bloom blobs.
  const foliage = ['#527d79', '#668e88', '#85aea4', '#a3bfa8',
    '#5d8e9d', '#8a9fac', '#8e87ad', '#b0a4c4'].map((color, index) => {
    const material = new MeshStandardMaterial({ color, emissive: color,
      emissiveIntensity: 0.015, roughness: 0.92, side: DoubleSide });
    material.name = `urdwell-leaf-${index}`;
    kit.materials.trackGlow(material, 0.015, index < 4 ? 0.26 : 0.34);
    return material;
  });
  const stones = ['#8b9386', '#a8aa95', '#777f75'].map(color => new MeshStandardMaterial({ color, roughness: 1 }));
  const rune = kit.materials.glow('#8fcdb2', { base: '#729b85', day: 0.025, night: 0.55 });
  const silverSap = kit.materials.glow('#a0d9d1', { base: '#80b7ae', day: 0.035, night: 0.72 });
  const violetSap = kit.materials.glow('#b9abd9', { base: '#9a8cb8', day: 0.025, night: 0.65 });
  const brass = kit.materials.metal('#b8a576');
  plaza(kit, 7.7, '#697c59');

  // A bent, fluted main trunk with long buttresses grows into an asymmetric crown.
  const trunkPoints = [[0, -0.2, -1.8], [-0.45, 1.8, -1.95], [-0.25, 4.2, -2.1],
    [0.45, 6.6, -1.9], [0.2, 8.8, -1.35], [0.8, 10.9, -1.4], [1.6, 12.2, -1.8]];
  woodTube(kit, trunkPoints, [1.45, 1.16, 0.98, 0.82, 0.61, 0.3, 0.025], bark, { segments: 44, sides: 20, fluting: 0.14 });
  kit.collideCircle(-0.2, -1.8, 1.5);

  const roots = [
    [[-0.5, 2.3, -1.65], [-1.15, 0.9, -0.5], [-2.05, 0.34, 1.15], [-2.4, 0.16, 2.5], [-3.9, -0.08, 3.5]],
    [[-0.15, 2.1, -1.9], [1.2, 0.85, -0.4], [2.15, 0.28, 0.8], [2.5, 0.12, 2.2], [3.75, -0.1, 3.4]],
    [[-0.6, 1.9, -2.1], [-1.7, 0.7, -2.3], [-3.1, 0.25, -1.4], [-4.8, -0.06, -0.5]],
    [[-0.15, 1.9, -2.2], [1.7, 0.75, -2.9], [3.3, 0.22, -3.3], [5.1, -0.1, -2.8]],
    [[-0.3, 1.7, -2.3], [-0.5, 0.6, -3.4], [-1.4, 0.2, -4.8], [-1.2, -0.1, -6.1]],
    [[0.25, 0.8, -1.8], [2.4, 0.35, -0.9], [4.1, 0.14, -0.5], [5.45, -0.06, 0.5]],
    [[-0.8, 0.9, -1.4], [-2.3, 0.32, -0.1], [-4.0, 0.17, 0.5], [-5.2, -0.08, 1.7]],
  ];
  roots.forEach((points, index) => {
    woodTube(kit, points, [0.48, 0.55, 0.26, 0.012], index % 2 ? warmBark : bark, { sides: 12, segments: 22, fluting: 0.12 });
    const curve = new CatmullRomCurve3(points.map(v));
    for (let step = 2; step < 9; step += 1) {
      const point = curve.getPoint(step / 10);
      kit.collideCircle(point.x, point.z, 0.25 + (1 - step / 10) * 0.28);
    }
  });

  // Bark ridges are curved along the growing trunk, rather than painted stripes.
  for (let ridge = 0; ridge < 13; ridge += 1) {
    const angle = ridge / 13 * TAU;
    const points = [];
    for (let ring = 0; ring < 7; ring += 1) {
      const t = ring / 6;
      const center = new CatmullRomCurve3(trunkPoints.map(v)).getPoint(t * 0.75);
      const radius = 1.34 - t * 0.7;
      const theta = angle + t * 0.65;
      points.push([center.x + Math.cos(theta) * radius, center.y, center.z + Math.sin(theta) * radius]);
    }
    woodTube(kit, points, [0.1, 0.06, 0.01], ridge % 3 === 0 ? moss : warmBark, { segments: 20, sides: 5 });
  }

  const crownTips = [];
  const branches = [
    [[-0.2, 4.4, -1.9], [-1.7, 5.9, -1.1], [-3.5, 7.0, -0.4], [-5.4, 8.1, -0.6]],
    [[0.25, 5.3, -2.0], [1.9, 6.7, -1.0], [3.7, 7.4, 0.1], [5.35, 9.0, 0.5]],
    [[0.35, 6.5, -1.85], [-1.7, 8.0, -2.5], [-3.6, 9.0, -3.8], [-4.9, 10.2, -4.2]],
    [[0.15, 7.0, -1.6], [1.6, 8.2, -3.1], [3.3, 9.5, -4.7], [4.4, 10.4, -4.8]],
    [[0.2, 7.5, -1.55], [-0.7, 8.9, -0.3], [-2.0, 10.1, 1.2], [-2.85, 10.6, 2.15]],
    [[0.35, 8.8, -1.5], [2.2, 9.8, -0.8], [3.5, 10.6, 0.7], [4.6, 11.3, 1.6]],
    [[0.55, 9.45, -1.4], [-0.8, 10.5, -2.7], [-2.0, 11.4, -3.0], [-2.6, 12.25, -3.6]],
    [[0.8, 10.8, -1.45], [1.1, 11.8, -0.3], [1.9, 12.6, 0.35], [2.55, 13.0, 0.0]],
  ];
  branches.forEach((points, index) => {
    const radii = [0.69 - index * 0.045, 0.42, 0.19, 0.018];
    const curve = woodTube(kit, points, radii, index % 3 === 0 ? warmBark : bark, { sides: 11, segments: 24, fluting: 0.07 });
    // Hairline veins follow the surface of the limbs, bending with their grain.
    // Keeping them on the bark avoids the old floating rings and laser shafts.
    const vein = [];
    for (let step = 0; step <= 16; step += 1) {
      const t = 0.08 + step / 16 * 0.83;
      const center = curve.getPointAt(t);
      const tangent = curve.getTangentAt(t);
      const forward = new Vector3(Math.sin(t * 3 + index) * 0.23, 0.12, 1);
      forward.addScaledVector(tangent, -forward.dot(tangent)).normalize();
      const section = t * (radii.length - 1), lower = Math.floor(section);
      const radius = mix(radii[lower], radii[lower + 1], section - lower);
      vein.push(center.addScaledVector(forward, radius * 1.02).toArray());
    }
    woodTube(kit, vein, [0.012, 0.021, 0.008], index % 3 === 0 ? violetSap : silverSap,
      { sides: 5, segments: 20, shadow: false });
    crownTips.push(v(points.at(-1)));
    for (let twig = 0; twig < 4; twig += 1) {
      const t = 0.43 + twig * 0.16;
      const p = curve.getPointAt(t);
      const side = twig % 2 ? -1 : 1;
      const q = p.clone().add(new Vector3(side * (0.6 + rng()), 0.9 + rng() * 0.55, side * (0.3 + rng() * 0.6)));
      const end = q.clone().add(new Vector3(side * 0.45, 0.35, 0.45 - rng() * 0.9));
      // Keep the silhouette on this landmark's clearing.
      const radial = Math.hypot(end.x, end.z);
      if (radial > 6.65) { end.x *= 6.65 / radial; end.z *= 6.65 / radial; }
      woodTube(kit, [p.toArray(), q.toArray(), end.toArray()], [0.16 * (1 - t) + 0.06, 0.055, 0.005], bark, { sides: 6, segments: 9 });
      crownTips.push(end);
    }
  });

  // Thousands of separate, folded lanceolate leaves form airy clusters. Their
  // silhouettes remain delicate from beneath the canopy, with no giant balls.
  const leaf = leafGeometry(0.58, 0.115);
  crownTips.forEach((tip, cluster) => {
    for (let index = 0; index < 74; index += 1) {
      const angle = rng() * TAU;
      const radial = Math.sqrt(rng());
      const px = tip.x + Math.cos(angle) * radial * 1.18;
      const pz = tip.z + Math.sin(angle) * radial * 0.83;
      if (Math.hypot(px, pz) > 7.0) continue;
      const py = tip.y + (rng() - 0.5) * 0.85 - radial * 0.3;
      kit.mesh(leaf.clone(), foliage[(index + cluster * 3) % foliage.length], {
        x: px, y: py, z: pz, rx: 0.8 + rng() * 1.3, ry: rng() * TAU, rz: rng() * TAU,
        scale: 0.65 + rng() * 0.65,
      });
    }
  });
  leaf.dispose();

  // Trailing branchlets and thin hanging vines bring the crown into the visitor's scale.
  for (let index = 0; index < 12; index += 1) {
    const tip = crownTips[index * 3 % crownTips.length];
    const length = 1.1 + rng() * 1.4;
    const points = [tip.toArray(), [tip.x + 0.17, tip.y - length * 0.5, tip.z + 0.1], [tip.x - 0.12, tip.y - length, tip.z + 0.25]];
    woodTube(kit, points, [0.035, 0.022, 0.004], moss, { segments: 9, sides: 5 });
    for (let hanging = 0; hanging < 5; hanging += 1) {
      const t = (hanging + 1) / 6;
      kit.mesh(leafGeometry(0.38, 0.07), foliage[index % foliage.length], {
        x: tip.x + Math.sin(t * 4) * 0.13, y: tip.y - length * t, z: tip.z + t * 0.25,
        ry: index, rz: Math.PI * (hanging % 2 ? 0.75 : -0.75), shadow: false,
      });
    }
  }

  // A few luminous tendrils extend from actual branch tips. Fine taper, gentle
  // irregular curves and tiny seeds give a weeping, enchanted silhouette.
  // No RNG is consumed here: the validated roots, stones and paths stay put.
  for (let index = 0; index < 8; index += 1) {
    const tip = crownTips[index * 5];
    const length = 1.8 + (index % 3) * 0.42;
    const curve = woodTube(kit, [tip.toArray(),
      [tip.x + 0.16, tip.y - length * 0.32, tip.z + 0.13],
      [tip.x - 0.08, tip.y - length * 0.72, tip.z + 0.3],
      [tip.x + 0.09, tip.y - length, tip.z + 0.18]],
    [0.016, 0.012, 0.004], index % 3 === 0 ? violetSap : silverSap,
    { sides: 4, segments: 14, shadow: false });
    for (let seed = 1; seed <= 3; seed += 1) {
      const p = curve.getPointAt(seed / 4);
      kit.mesh(leafGeometry(0.17, 0.035), index % 3 === 0 ? violetSap : silverSap, {
        x: p.x, y: p.y, z: p.z, rz: seed % 2 ? 0.65 : -0.65, ry: index * 0.7, shadow: false,
      });
    }
  }

  // Spring basin embraced by the two forward roots. A shallow mineral rim,
  // broken stone course and restrained runes replace the former neon well.
  const poolZ = 1.0;
  kit.cylinder(1.63, 1.85, 0.3, stones[2], { z: poolZ, y: -0.1, segments: 48 });
  kit.cylinder(1.55, 1.55, 0.025, new MeshStandardMaterial({
    color: '#4e8f88', emissive: '#4d9d8c', emissiveIntensity: 0.13,
    roughness: 0.21, metalness: 0.35,
  }), { z: poolZ, y: 0.21, segments: 64, shadow: false });
  for (let index = 0; index < 20; index += 1) {
    const a = index / 20 * TAU;
    const x = Math.cos(a) * 1.76, z = poolZ + Math.sin(a) * 1.76;
    const block = stone(kit, 0.33, 0.34, stones[index % 3], { x, z, y: 0.05, scale: [1.1, 1, 0.72], phase: index });
    block.rotation.y = -a;
    if (index % 2 === 0) {
      const mark = kit.group({ x: Math.cos(a) * 1.78, y: 0.39, z: poolZ + Math.sin(a) * 1.78, ry: -a });
      kit.box(0.018, 0.006, 0.15, rune, { parent: mark, shadow: false });
      kit.box(0.1, 0.006, 0.014, rune, { parent: mark, z: -0.035, ry: 0.45, shadow: false });
    }
  }
  kit.collideCircle(0, poolZ, 1.92);
  [0.64, 1.12].forEach(radius => kit.mesh(new RingGeometry(radius - 0.006, radius + 0.006, 48), rune,
    { z: poolZ, y: 0.241, rx: -Math.PI / 2, shadow: false }));

  // An inset heartwood spiral suggests memory without filling the view with bloom.
  const spiral = [];
  for (let index = 0; index < 40; index += 1) {
    const t = index / 39, a = t * TAU * 1.6;
    const radius = 0.05 + t * 0.48;
    spiral.push([-0.28 + Math.cos(a) * radius, 3.45 + Math.sin(a) * radius, -0.96 - t * 0.07]);
  }
  woodTube(kit, spiral, [0.012, 0.018, 0.012], rune, { segments: 48, sides: 5, shadow: false });

  // Ferns and scattered stones frame a clear approach from +Z.
  for (let index = 0; index < 24; index += 1) {
    const angle = index / 24 * TAU;
    const radius = 4.5 + rng() * 2.5;
    const x = Math.cos(angle) * radius, z = Math.sin(angle) * radius;
    if (z > 2.4 && Math.abs(x) < 2) continue;
    if (Math.hypot(x - 4.4, z - 2.6) < 1.2) continue;
    stone(kit, 0.25 + rng() * 0.25, 0.22 + rng() * 0.2, stones[index % 3], { x, z, phase: index });
    for (let frond = 0; frond < 5; frond += 1) {
      const a = frond / 5 * TAU;
      const stem = [[x, 0.12, z], [x + Math.cos(a) * 0.18, 0.48, z + Math.sin(a) * 0.18], [x + Math.cos(a) * 0.45, 0.32, z + Math.sin(a) * 0.45]];
      woodTube(kit, stem, [0.016, 0.012, 0.004], moss, { sides: 4, segments: 5, shadow: false });
      for (let l = 0; l < 4; l += 1) {
        kit.mesh(leafGeometry(0.2, 0.055), foliage[(frond + index) % 4], {
          x: x + Math.cos(a) * (0.12 + l * 0.07), y: 0.32 + Math.sin(l * 0.7) * 0.13,
          z: z + Math.sin(a) * (0.12 + l * 0.07), rx: 1.1, ry: a + (l % 2 ? 0.6 : -0.6), shadow: false,
        });
      }
    }
  }
  // Three suspended seed lanterns hang from real branchlets, with small warm points.
  [[-3.5, 6.5, 0.3], [3.2, 7, 0.7], [1.8, 8.8, -0.15]].forEach(([x, y, z]) => {
    woodTube(kit, [[x, y + 0.6, z], [x + 0.07, y + 0.3, z], [x, y, z]], [0.015, 0.012], darkBark, { segments: 5, sides: 5 });
    kit.sphere(0.095, kit.materials.glow('#dec784', { day: 0.05, night: 0.8, base: '#b6a16b' }), { x, y, z, widthSegments: 8, heightSegments: 6, shadow: false });
    kit.torus(0.11, 0.012, brass, { x, y, z, rx: Math.PI / 2, radialSegments: 4, tubularSegments: 12 });
  });
  return { interactAt: [0, 3.8], beaconAt: [4.4, 2.6], labelHeight: 15.8 };
}
