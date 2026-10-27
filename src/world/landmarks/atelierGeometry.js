import { BufferGeometry, CatmullRomCurve3, DoubleSide, ExtrudeGeometry, Float32BufferAttribute, LatheGeometry, MeshStandardMaterial, Path, Shape, ShapeGeometry, TubeGeometry, Vector2, Vector3 } from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// Small architectural vocabulary for the house and photo belvedere. Materials
// are shared by colour; smooth profiles retain their normals after Kit.bake().
export function atelierMaterials(colors) {
  return Object.fromEntries(Object.entries(colors).map(([key, color]) => [key,
    new MeshStandardMaterial({ color, roughness: key === 'iron' ? 0.45 : 0.8, metalness: key === 'iron' || key === 'brass' ? 0.35 : 0, flatShading: false }),
  ]));
}

export function bevelBox(kit, width, height, depth, material, options = {}, radius = 0.035) {
  return kit.mesh(new RoundedBoxGeometry(width, height, depth, 1, Math.min(radius, width / 4, height / 4, depth / 4)), material,
    { ...options, y: (options.y ?? 0) + height / 2 });
}

export function archShape(width, height, bottom = 0) {
  const radius = width / 2;
  const spring = height - radius;
  const shape = new Shape();
  shape.moveTo(-radius, bottom);
  shape.lineTo(radius, bottom);
  shape.lineTo(radius, spring);
  shape.absarc(0, spring, radius, 0, Math.PI, false);
  shape.lineTo(-radius, bottom);
  shape.closePath();
  return shape;
}

export function archFrame(kit, width, height, thickness, depth, material, options = {}) {
  const shape = archShape(width, height);
  const radius = width / 2 - thickness;
  const spring = height - width / 2;
  const hole = new Path();
  hole.moveTo(-radius, 0.001);
  hole.lineTo(-radius, spring);
  hole.absarc(0, spring, radius, Math.PI, 0, true);
  hole.lineTo(radius, 0.001);
  hole.closePath();
  shape.holes.push(hole);
  const geometry = new ExtrudeGeometry(shape, { depth, curveSegments: 12, bevelEnabled: true, bevelSize: 0.018, bevelThickness: 0.015, bevelSegments: 1, steps: 1 });
  geometry.translate(0, 0, -depth / 2);
  return kit.mesh(geometry, material, options);
}

export function archPane(kit, width, height, material, options = {}) {
  return kit.mesh(new ShapeGeometry(archShape(width, height), 20), material, options);
}

export function quad(kit, points, material, options = {}) {
  const [a, b, c, d] = points;
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(c === d ? [...a, ...b, ...c] : [...a, ...b, ...c, ...a, ...c, ...d], 3));
  geometry.computeVertexNormals();
  return kit.mesh(geometry, material, options);
}

export function curveRail(kit, points, radius, material, options = {}, segments = 36) {
  return kit.mesh(new TubeGeometry(new CatmullRomCurve3(points.map(point => new Vector3(...point))), segments, radius, 6, false), material, options);
}

export function turnedColumn(kit, height, radius, material, options = {}, slim = false) {
  const profile = slim
    ? [[0.7, 0], [1, 0.08], [0.7, 0.16], [0.4, 0.3], [0.3, 0.65], [0.7, 0.8], [1, 0.9], [0.7, 1]]
    : [[1.4, 0], [1.4, 0.04], [1.12, 0.08], [1.12, 0.13], [0.78, 0.18], [0.68, 0.83], [0.95, 0.87], [1.16, 0.91], [1.4, 0.94], [1.4, 1]];
  return kit.mesh(new LatheGeometry(profile.map(([r, y]) => new Vector2(r * radius, y * height)), 12), material, options);
}

export function architecturalGlass(color = '#b4d8de', opacity = 0.17) {
  return new MeshStandardMaterial({ color, roughness: 0.13, metalness: 0.15, transparent: true, opacity, depthWrite: false, side: DoubleSide });
}
