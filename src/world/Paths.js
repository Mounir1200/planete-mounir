import { BufferAttribute, BufferGeometry, Color, Mesh, MeshStandardMaterial, Vector3 } from 'three';
import { PLANET } from '../config.js';
import { angleBetween } from '../utils/math.js';

// Continuous narrow ribbons follow the same ground function as the character.
// The underlying faceted path colour becomes a soft gravel shoulder, not the road edge.
export function buildPaths(terrain, layout) {
  const positions = [];
  const colors = [];
  const indices = [];
  const tint = new Color();
  const across = [-1.02, -0.86, 0, 0.86, 1.02];
  const direction = new Vector3();
  let vertex = 0;
  for (const path of layout.paths) {
    const from = layout.place(path.fromId);
    const to = layout.place(path.toId);
    const totalAngle = angleBetween(path.start, path.end);
    const startAngle = Math.atan((from.padRadius - 0.4) / from.padHeight);
    const endAngle = totalAngle - Math.atan((to.padRadius - 0.4) / to.padHeight);
    if (endAngle <= startAngle) continue;
    const steps = Math.max(2, Math.ceil((endAngle - startAngle) * PLANET.radius / 0.45));
    const firstVertex = vertex;
    for (let step = 0; step <= steps; step++) {
      const angle = startAngle + (endAngle - startAngle) * step / steps;
      const centre = path.start.clone().applyAxisAngle(path.normal, angle);
      for (let lane = 0; lane < across.length; lane++) {
        direction.copy(centre).addScaledVector(path.normal, across[lane] / PLANET.radius).normalize();
        const sample = terrain.sample(direction);
        tint.setRGB(0, 0, 0);
        terrain.biomes.forEach((biome, index) => {
          tint.r += biome.path.r * sample.weights[index];
          tint.g += biome.path.g * sample.weights[index];
          tint.b += biome.path.b * sample.weights[index];
        });
        const edge = lane === 0 || lane === across.length - 1;
        tint.multiplyScalar(edge ? 0.94 : 1.025);
        // Recess the outer edge into the terrain; centre has a barely perceptible crown.
        const lift = edge ? -0.025 : lane === 2 ? 0.045 : 0.025;
        const point = direction.clone().multiplyScalar(sample.height + lift);
        positions.push(point.x, point.y, point.z);
        colors.push(tint.r, tint.g, tint.b);
        vertex++;
      }
      if (step === 0) continue;
      for (let lane = 0; lane < across.length - 1; lane++) {
        const a = firstVertex + (step - 1) * across.length + lane;
        const b = a + across.length;
        indices.push(a, b, a + 1, a + 1, b, b + 1);
      }
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3));
  geometry.setAttribute('color', new BufferAttribute(new Float32Array(colors), 3));
  geometry.setIndex(indices);
  // Orient every triangle outward independently of arc orientation.
  const a = new Vector3(), b = new Vector3(), c = new Vector3(), normal = new Vector3();
  for (let index = 0; index < indices.length; index += 3) {
    a.fromBufferAttribute(geometry.attributes.position, indices[index]);
    b.fromBufferAttribute(geometry.attributes.position, indices[index + 1]);
    c.fromBufferAttribute(geometry.attributes.position, indices[index + 2]);
    normal.crossVectors(b.sub(a), c.sub(a));
    if (normal.dot(a) < 0) {
      geometry.index.setX(index + 1, indices[index + 2]);
      geometry.index.setX(index + 2, indices[index + 1]);
    }
  }
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  const mesh = new Mesh(geometry, new MeshStandardMaterial({ vertexColors: true, roughness: 1, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }));
  mesh.name = 'grounded-paths';
  mesh.receiveShadow = true;
  return mesh;
}
