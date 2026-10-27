import {
  BufferGeometry, CatmullRomCurve3, Color, ExtrudeGeometry, Float32BufferAttribute, Mesh, MeshStandardMaterial,
  Shape, SphereGeometry, TubeGeometry, Vector3,
} from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const TAU = Math.PI * 2;
const UNIT_SPHERE = new SphereGeometry(1, 24, 16);

// Character materials get a soft rim light so the figure reads against any
// background, day or night, as in most stylised third-person games.
export function characterMaterial(color, { roughness = 0.7, metalness = 0, rim = 0.35, rimColor = '#ffe2c8', ...options } = {}) {
  const material = new MeshStandardMaterial({ color, roughness, metalness, ...options });
  const tint = new Color(rimColor);
  material.onBeforeCompile = shader => {
    shader.uniforms.uRimColor = { value: tint };
    shader.uniforms.uRimStrength = { value: rim };
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform vec3 uRimColor;\nuniform float uRimStrength;')
      .replace('#include <opaque_fragment>', /* glsl */ `
        float facing = clamp(dot(normalize(normal), normalize(vViewPosition)), 0.0, 1.0);
        outgoingLight += uRimColor * pow(1.0 - facing, 3.0) * uRimStrength;
        #include <opaque_fragment>`);
  };
  material.customProgramCacheKey = () => 'mounir-character-rim';
  return material;
}

export function addMesh(parent, geometry, material, { x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, scale } = {}) {
  const mesh = new Mesh(geometry, material);
  mesh.position.set(x, y, z);
  mesh.rotation.set(rx, ry, rz);
  if (scale) mesh.scale.set(...scale);
  mesh.castShadow = !material.transparent;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

export function ellipsoid(parent, material, [x, y, z], [sx, sy, sz], rotation = {}) {
  return addMesh(parent, UNIT_SPHERE, material, { x, y, z, scale: [sx, sy, sz], ...rotation });
}

export function tube(parent, material, points, radius, { segments = 16, radialSegments = 6 } = {}) {
  const path = new CatmullRomCurve3(points.map(point => new Vector3(...point)));
  return addMesh(parent, new TubeGeometry(path, segments, radius, radialSegments, false), material);
}

// Flat piece of fabric (collar, pocket flap) extruded from a 2D outline.
export function panel(parent, material, outline, { z = 0, depth = 0.012 } = {}) {
  const shape = new Shape();
  outline.forEach(([x, y], index) => (index ? shape.lineTo(x, y) : shape.moveTo(x, y)));
  shape.closePath();
  const geometry = new ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelSize: 0.004, bevelThickness: 0.004, bevelSegments: 2, curveSegments: 4 });
  return addMesh(parent, geometry, material, { z });
}

// Smooth section-by-section surface. Each profile is [y, halfWidth, halfDepth, zOffset].
// A partial `arc` leaves an opening at the front (an unbuttoned shirt).
export function loft(profiles, { segments = 28, start = 0, arc = TAU, squareness = 1, caps = true } = {}) {
  const positions = [];
  const indices = [];
  const shape = value => Math.sign(value) * Math.abs(value) ** squareness;
  for (const [y, halfWidth, halfDepth, zOffset = 0] of profiles) {
    for (let index = 0; index <= segments; index++) {
      const angle = start + (arc * index) / segments;
      positions.push(shape(Math.sin(angle)) * halfWidth, y, shape(Math.cos(angle)) * halfDepth + zOffset);
    }
  }
  for (let row = 0; row < profiles.length - 1; row++) {
    for (let index = 0; index < segments; index++) {
      const a = row * (segments + 1) + index;
      const b = a + segments + 1;
      indices.push(a, a + 1, b, a + 1, b + 1, b);
    }
  }
  const isClosed = Math.abs(arc - TAU) < 1e-3;
  if (caps && isClosed) {
    for (const row of [0, profiles.length - 1]) {
      const centre = positions.length / 3;
      positions.push(0, profiles[row][0], profiles[row][3] ?? 0);
      for (let index = 0; index < segments; index++) {
        const a = row * (segments + 1) + index;
        indices.push(...(row === 0 ? [centre, a + 1, a] : [centre, a, a + 1]));
      }
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  if (isClosed) weldSeamNormals(geometry, profiles.length, segments);
  return geometry;
}

// The first and last column of a closed loft share positions; average their normals.
function weldSeamNormals(geometry, rows, segments) {
  const normals = geometry.attributes.normal;
  const average = new Vector3();
  for (let row = 0; row < rows; row++) {
    const first = row * (segments + 1);
    const last = first + segments;
    average.set(normals.getX(first) + normals.getX(last), normals.getY(first) + normals.getY(last), normals.getZ(first) + normals.getZ(last)).normalize();
    normals.setXYZ(first, average.x, average.y, average.z);
    normals.setXYZ(last, average.x, average.y, average.z);
  }
}

// Merges a rig node's direct meshes per material; child groups stay articulated.
export function bakeNode(node) {
  for (const child of [...node.children]) if (child.isGroup) bakeNode(child);
  const batches = new Map();
  for (const child of [...node.children]) {
    if (!child.isMesh || child.userData.keep) continue;
    child.updateMatrix();
    const geometry = child.geometry.clone().applyMatrix4(child.matrix);
    for (const name of Object.keys(geometry.attributes)) if (name !== 'position' && name !== 'normal') geometry.deleteAttribute(name);
    const triangles = geometry.index ? geometry.toNonIndexed() : geometry;
    if (!batches.has(child.material)) batches.set(child.material, []);
    batches.get(child.material).push(triangles);
    node.remove(child);
  }
  for (const [material, geometries] of batches) {
    addMesh(node, mergeGeometries(geometries, false), material);
    geometries.forEach(geometry => geometry.dispose());
  }
}
