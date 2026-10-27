import {
  BoxGeometry, CanvasTexture, ConeGeometry, CylinderGeometry, DodecahedronGeometry, ExtrudeGeometry, Group,
  IcosahedronGeometry, Mesh, MeshStandardMaterial, OctahedronGeometry, PlaneGeometry, SRGBColorSpace, Shape,
  SphereGeometry, TorusGeometry, Vector3,
} from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const SIGN_FONT = '"Space Grotesk Variable", "Segoe UI", sans-serif';
const UP = new Vector3(0, 1, 0);

// Small modelling toolkit used by the place builders. Shapes are positioned by
// their base (y = ground) so buildings stack naturally. Static meshes are merged
// per material by `bake()` to keep draw calls low.
export class Kit {
  constructor(materials, place = null) {
    this.materials = materials;
    this.place = place;
    this.root = new Group();
    this.colliders = [];
    this.platforms = [];
    this.updaters = [];
  }

  material(value) {
    return typeof value === 'string' ? this.materials.solid(value) : value;
  }

  group({ x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, parent, dynamic = false } = {}) {
    parent ??= this.root;
    const group = new Group();
    group.position.set(x, y, z);
    group.rotation.set(rx, ry, rz);
    group.userData.dynamic = dynamic;
    parent.add(group);
    return group;
  }

  mesh(geometry, material, { x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, scale, parent = this.root, dynamic = false, shadow = true } = {}) {
    const mesh = new Mesh(geometry, this.material(material));
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    if (scale !== undefined) Array.isArray(scale) ? mesh.scale.set(...scale) : mesh.scale.setScalar(scale);
    mesh.castShadow = shadow;
    mesh.receiveShadow = true;
    mesh.userData.dynamic = dynamic;
    parent.add(mesh);
    return mesh;
  }

  box(width, height, depth, material, options = {}) {
    return this.mesh(new BoxGeometry(width, height, depth), material, { ...options, y: (options.y ?? 0) + height / 2 });
  }

  cylinder(radiusTop, radiusBottom, height, material, { segments = 12, open = false, ...options } = {}) {
    const geometry = new CylinderGeometry(radiusTop, radiusBottom, height, segments, 1, open);
    return this.mesh(geometry, material, { ...options, y: (options.y ?? 0) + height / 2 });
  }

  cone(radius, height, material, { segments = 10, ...options } = {}) {
    return this.mesh(new ConeGeometry(radius, height, segments), material, { ...options, y: (options.y ?? 0) + height / 2 });
  }

  sphere(radius, material, { widthSegments = 14, heightSegments = 10, phiLength, thetaLength, ...options } = {}) {
    const geometry = new SphereGeometry(radius, widthSegments, heightSegments, 0, phiLength ?? Math.PI * 2, 0, thetaLength ?? Math.PI);
    return this.mesh(geometry, material, options);
  }

  ico(radius, material, { detail = 0, ...options } = {}) {
    return this.mesh(new IcosahedronGeometry(radius, detail), material, options);
  }

  rock(radius, material, options = {}) {
    return this.mesh(new DodecahedronGeometry(radius, 0), material, options);
  }

  octa(radius, material, options = {}) {
    return this.mesh(new OctahedronGeometry(radius, 0), material, options);
  }

  torus(radius, tube, material, { radialSegments = 8, tubularSegments = 32, arc = Math.PI * 2, ...options } = {}) {
    return this.mesh(new TorusGeometry(radius, tube, radialSegments, tubularSegments, arc), material, options);
  }

  // Flat cylinder facing +Z (clock faces, wheels), centred on its position.
  disc(radius, thickness, material, { segments = 24, ...options } = {}) {
    const geometry = new CylinderGeometry(radius, radius, thickness, segments);
    geometry.rotateX(Math.PI / 2);
    return this.mesh(geometry, material, options);
  }

  // Square-section bar between two points, for lattices and timber frames.
  bar(from, to, thickness, material, options = {}) {
    const start = new Vector3(...from);
    const direction = new Vector3(...to).sub(start);
    const length = direction.length();
    const geometry = new BoxGeometry(thickness, length, thickness);
    const mesh = this.mesh(geometry, material, options);
    mesh.position.copy(start).addScaledVector(direction, 0.5);
    mesh.quaternion.setFromUnitVectors(UP, direction.normalize());
    return mesh;
  }

  // Triangular roof: `width` across the ridge, `depth` along it, base at y.
  roof(width, height, depth, material, options = {}) {
    const shape = new Shape();
    shape.moveTo(-width / 2, 0);
    shape.lineTo(width / 2, 0);
    shape.lineTo(0, height);
    shape.closePath();
    const geometry = new ExtrudeGeometry(shape, { depth, bevelEnabled: false });
    geometry.translate(0, 0, -depth / 2);
    return this.mesh(geometry, material, options);
  }

  sign(text, { width = 2.4, height = 0.6, background = '#162d86', color = '#fff3e2', fontWeight = 700, ...options } = {}) {
    const texture = createTextTexture(text, { width, height, background, color, fontWeight });
    const material = new MeshStandardMaterial({ map: texture, roughness: 0.6, emissive: '#ffffff', emissiveMap: texture, emissiveIntensity: 0.25 });
    return this.mesh(new PlaneGeometry(width, height), material, { ...options, shadow: false });
  }

  picture(texture, width, height, options = {}) {
    const material = new MeshStandardMaterial({ map: texture, roughness: 0.7, emissive: '#ffffff', emissiveMap: texture, emissiveIntensity: 0.18 });
    return this.mesh(new PlaneGeometry(width, height), material, { ...options, shadow: false });
  }

  collideBox(x, z, width, depth) {
    this.colliders.push({ type: 'box', x, z, halfWidth: width / 2, halfDepth: depth / 2 });
  }

  collideCircle(x, z, radius) {
    this.colliders.push({ type: 'circle', x, z, radius });
  }

  // A walkable surface above the terrain (docks, steps).
  platform(x, z, width, depth, top) {
    this.platforms.push({ x, z, halfWidth: width / 2, halfDepth: depth / 2, top });
  }

  platformCircle(radius, top) {
    this.platforms.push({ type: 'circle', x: 0, z: 0, radius, top });
  }

  onUpdate(callback) {
    this.updaters.push(callback);
  }

  bake() {
    this.root.updateMatrixWorld(true);
    const buckets = new Map();
    const merged = [];
    this.root.traverse(object => {
      if (!object.isMesh || isDynamic(object) || object.material.map) return;
      const geometry = object.geometry.index ? object.geometry.toNonIndexed() : object.geometry.clone();
      geometry.deleteAttribute('uv');
      geometry.applyMatrix4(object.matrixWorld);
      // Ground coverings must not become shadow casters when baked.
      const key = `${object.material.uuid}:${object.castShadow}:${object.receiveShadow}`;
      const bucket = buckets.get(key) ?? { material: object.material, castShadow: object.castShadow, receiveShadow: object.receiveShadow, geometries: [] };
      bucket.geometries.push(geometry);
      buckets.set(key, bucket);
      merged.push(object);
    });
    merged.forEach(mesh => {
      mesh.removeFromParent();
      mesh.geometry.dispose();
    });
    for (const { material, castShadow, receiveShadow, geometries } of buckets.values()) {
      const mesh = new Mesh(mergeGeometries(geometries), material);
      mesh.castShadow = castShadow;
      mesh.receiveShadow = receiveShadow;
      this.root.add(mesh);
      geometries.forEach(geometry => geometry.dispose());
    }
    return this.root;
  }
}

function isDynamic(object) {
  for (let current = object; current; current = current.parent) {
    if (current.userData.dynamic) return true;
  }
  return false;
}

export function createTextTexture(text, { width, height, background, color, fontWeight = 700, pixelsPerUnit = 128 }) {
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(width * pixelsPerUnit);
  canvas.height = Math.round(height * pixelsPerUnit);
  const context = canvas.getContext('2d');
  if (background) {
    context.fillStyle = background;
    roundedRect(context, 0, 0, canvas.width, canvas.height, canvas.height * 0.22);
    context.fill();
  }
  context.fillStyle = color;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  let fontSize = canvas.height * 0.56;
  context.font = `${fontWeight} ${fontSize}px ${SIGN_FONT}`;
  while (context.measureText(text).width > canvas.width * 0.88 && fontSize > 8) {
    fontSize -= 2;
    context.font = `${fontWeight} ${fontSize}px ${SIGN_FONT}`;
  }
  context.fillText(text, canvas.width / 2, canvas.height / 2 + fontSize * 0.04);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function roundedRect(context, x, y, width, height, radius) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.arcTo(x + width, y, x + width, y + height, radius);
  context.arcTo(x + width, y + height, x, y + height, radius);
  context.arcTo(x, y + height, x, y, radius);
  context.arcTo(x, y, x + width, y, radius);
  context.closePath();
}
