import {
  BufferGeometry, CanvasTexture, CatmullRomCurve3, DoubleSide, Float32BufferAttribute, Group, MeshStandardMaterial,
  RepeatWrapping, Shape, ShapeGeometry, SphereGeometry, TubeGeometry, Vector3,
} from 'three';
import { createNoise3D } from '../utils/noise.js';
import { createRandom } from '../utils/random.js';
import { addMesh, characterMaterial, ellipsoid, tube } from './avatarParts.js';

// A faceless head, like a stylised mannequin: a smooth skull with a broad crown
// and square jaw, short hair, ears and Mounir's signature rectangular glasses.
// Head-local space: chin at y = 0, face toward +z, top of the hair near 0.47.
const SKIN = '#6c4331';
const HEAD = { centreY: 0.2265, halfHeight: 0.2265, halfWidth: 0.157, halfDepth: 0.185, frontFlattening: 1.02, backFlattening: 0.86 };
const HAIRLINE = [[0, 0.372], [0.4, 0.368], [0.65, 0.348], [0.9, 0.31], [1.15, 0.272], [1.4, 0.265], [1.8, 0.235], [2.4, 0.13], [Math.PI, 0.08]];
const GLASSES = { lensWidth: 0.116, lensHeight: 0.064, centreX: 0.071, centreY: 0.212 };

const smoothstep = (edge0, edge1, value) => {
  const t = Math.min(1, Math.max(0, (value - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
};

// Horizontal scale of the skull at normalised height v ∈ [-1, 1]: wide cheeks, square jaw.
function widthFactor(v) {
  const cheeks = 0.06 * Math.exp(-(((v + 0.1) / 0.4) ** 2));
  const jaw = 0.1 * Math.exp(-(((v + 0.6) / 0.22) ** 2));
  const chin = -0.18 * smoothstep(-0.8, -1, v);
  return 1 + cheeks + jaw + chin;
}

// Above the brows the skull follows a superellipse: a broad, rounded-square crown.
const crownExponent = y => 1 - 0.24 * smoothstep(-0.1, 0.45, y);

function shapeHeadPoint(x, y, z, target = new Vector3()) {
  const exponent = crownExponent(y);
  const radial = Math.hypot(x, z);
  const radialScale = radial > 1e-6 ? radial ** exponent / radial : 0;
  const lift = Math.sign(y) * Math.abs(y) ** exponent;
  const width = HEAD.halfWidth * widthFactor(lift);
  const jawForward = 1 + 0.1 * smoothstep(-0.15, -0.75, lift);
  const depth = HEAD.halfDepth * (z > 0 ? HEAD.frontFlattening * jawForward : HEAD.backFlattening);
  return target.set(x * radialScale * width, HEAD.centreY + lift * HEAD.halfHeight, z * radialScale * depth);
}

// Depth of the face at a head-local (x, y) near eye level, used to seat the glasses.
function faceDepth(x, y) {
  const v = (y - HEAD.centreY) / HEAD.halfHeight;
  const u = x / (HEAD.halfWidth * widthFactor(v));
  return Math.sqrt(Math.max(0, 1 - u * u - v * v)) * HEAD.halfDepth * HEAD.frontFlattening;
}

function headGeometry() {
  const geometry = new SphereGeometry(1, 96, 72);
  const positions = geometry.attributes.position;
  const point = new Vector3();
  for (let index = 0; index < positions.count; index++) {
    shapeHeadPoint(positions.getX(index), positions.getY(index), positions.getZ(index), point);
    positions.setXYZ(index, point.x, point.y, point.z);
  }
  geometry.computeVertexNormals();
  return geometry;
}

// ---- Hair --------------------------------------------------------------------

// Tileable coil pattern used as a bump map for the hair.
function paintHairBump() {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const context = canvas.getContext('2d');
  const random = createRandom(77);
  context.fillStyle = '#404040';
  context.fillRect(0, 0, size, size);
  context.lineWidth = 1.6;
  for (let index = 0; index < 2600; index++) {
    const x = random() * size;
    const y = random() * size;
    const radius = 3 + random() * 4;
    const shade = 120 + Math.floor(random() * 120);
    const start = random() * Math.PI;
    context.strokeStyle = `rgb(${shade},${shade},${shade})`;
    for (const [dx, dy] of [[0, 0], [size, 0], [-size, 0], [0, size], [0, -size]]) {
      context.beginPath();
      context.arc(x + dx, y + dy, radius, start, start + Math.PI * 1.4);
      context.stroke();
    }
  }
  const texture = new CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = RepeatWrapping;
  texture.repeat.set(14, 4);
  return texture;
}

function hairlineHeight(angle) {
  const a = Math.abs(angle);
  for (let index = 1; index < HAIRLINE.length; index++) {
    const [a1, h1] = HAIRLINE[index];
    const [a0, h0] = HAIRLINE[index - 1];
    if (a <= a1) return h0 + (h1 - h0) * smoothstep(0, 1, (a - a0) / (a1 - a0));
  }
  return HAIRLINE[HAIRLINE.length - 1][1];
}

// Polar angle on the unit sphere whose shaped height matches the hairline.
function hairEdgeTheta(angle) {
  const target = Math.min(1, Math.max(-1, (hairlineHeight(angle) - HEAD.centreY) / HEAD.halfHeight));
  let y = target;
  for (let step = 0; step < 6; step++) y = Math.sign(target) * Math.abs(target) ** (1 / crownExponent(y));
  return Math.acos(y);
}

// Very short crop: a little volume on top, close-cut on the sides.
const hairThickness = progress => 0.004 + 0.013 * (1 - progress) ** 0.8;

function hairCapGeometry() {
  const rows = 48;
  const columns = 144;
  const noise = createNoise3D(createRandom(5));
  const positions = [];
  const uvs = [];
  const indices = [];
  const point = new Vector3();
  const outward = new Vector3();
  // One extra row tucks the cap edge down onto the skin, so no gap shows at the hairline.
  for (let row = 0; row <= rows + 1; row++) {
    for (let column = 0; column <= columns; column++) {
      const angle = -Math.PI + (Math.PI * 2 * column) / columns;
      const progress = Math.min(1, row / rows);
      const theta = hairEdgeTheta(angle) * progress;
      shapeHeadPoint(Math.sin(theta) * Math.sin(angle), Math.cos(theta), Math.sin(theta) * Math.cos(angle), point);
      outward.set(point.x, point.y - HEAD.centreY, point.z).normalize();
      const coils = noise(point.x * 70, point.y * 70, point.z * 70) * 0.0016 + noise(point.x * 22, point.y * 22, point.z * 22) * 0.0016;
      const lift = row > rows ? -0.002 : hairThickness(progress) + coils * (1 - progress * 0.6);
      point.addScaledVector(outward, lift);
      positions.push(point.x, point.y, point.z);
      uvs.push(column / columns, progress);
      if (row <= rows && column < columns) {
        const a = row * (columns + 1) + column;
        const b = a + columns + 1;
        indices.push(a, b, a + 1, a + 1, b, b + 1);
      }
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

// ---- Glasses -----------------------------------------------------------------

function roundedRectangle(width, height, radius) {
  const shape = new Shape();
  const x = -width / 2;
  const y = -height / 2;
  shape.moveTo(x + radius, y);
  shape.lineTo(x + width - radius, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + radius);
  shape.lineTo(x + width, y + height - radius);
  shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  shape.lineTo(x + radius, y + height);
  shape.quadraticCurveTo(x, y + height, x, y + height - radius);
  shape.lineTo(x, y + radius);
  shape.quadraticCurveTo(x, y, x + radius, y);
  return shape;
}

export function createHeadMaterials(skin) {
  skin.color.set(SKIN);
  return {
    skin,
    hair: characterMaterial('#16120f', {
      roughness: 0.95, rim: 0.14, rimColor: '#d8c4b0', bumpMap: typeof document === 'undefined' ? null : paintHairBump(), bumpScale: 2.2,
    }),
    innerEar: characterMaterial('#5a3322', { roughness: 0.8, rim: 0 }),
    frame: characterMaterial('#a7abae', { roughness: 0.22, metalness: 0.05, rim: 0.3, rimColor: '#ffffff' }),
    lens: new MeshStandardMaterial({
      color: '#8f7dff', emissive: '#5a3cff', emissiveIntensity: 0.25, transparent: true, opacity: 0.35,
      roughness: 0.04, metalness: 0.2, depthWrite: false, side: DoubleSide,
    }),
  };
}

export function buildHead(parent, materials) {
  addMesh(parent, headGeometry(), materials.skin);
  // The hair keeps its UVs for the bump map, so it is excluded from baking.
  addMesh(parent, hairCapGeometry(), materials.hair).userData.keep = true;
  buildEars(parent, materials);
  buildGlasses(parent, materials);
}

function buildEars(parent, materials) {
  const earY = 0.166;
  const v = (earY - HEAD.centreY) / HEAD.halfHeight;
  const earWidth = HEAD.halfWidth * widthFactor(v) * Math.sqrt(1 - v * v);
  for (const side of [-1, 1]) {
    const ear = new Group();
    ear.position.set(side * earWidth * 0.98, earY, -0.028);
    ear.rotation.set(0, -side * 0.22, side * 0.06);
    parent.add(ear);
    ellipsoid(ear, materials.skin, [side * 0.006, 0, 0], [0.013, 0.052, 0.028]);
    tube(ear, materials.skin, [[side * 0.013, -0.04, 0.011], [side * 0.018, -0.005, 0.024], [side * 0.018, 0.034, 0.016], [side * 0.016, 0.05, -0.005], [side * 0.013, 0.03, -0.025]], 0.0065, { segments: 22, radialSegments: 10 });
    ellipsoid(ear, materials.innerEar, [side * 0.015, 0.004, 0.004], [0.005, 0.028, 0.012]);
  }
}

// Rectangular grey-crystal frames with violet lenses: they wrap slightly, meet on
// a narrow bridge and run back over the ears.
function buildGlasses(parent, materials) {
  const { lensWidth, lensHeight, centreX, centreY } = GLASSES;
  const wrap = 0.2;
  const halfWidth = lensWidth / 2;
  const bridgeZ = faceDepth(0, centreY) + 0.004;
  const lensZ = bridgeZ - Math.sin(wrap) * halfWidth;
  const outline = roundedRectangle(lensWidth, lensHeight, 0.012);
  for (const side of [-1, 1]) {
    const lens = new Group();
    lens.position.set(side * centreX, centreY, lensZ);
    lens.rotation.y = side * wrap;
    parent.add(lens);
    addMesh(lens, new ShapeGeometry(outline, 12), materials.lens).castShadow = false;
    const rim = outline.getPoints(12).map(point => new Vector3(point.x, point.y, 0));
    addMesh(lens, new TubeGeometry(new CatmullRomCurve3(rim, true), 128, 0.0038, 8, true), materials.frame);
    addMesh(lens, new TubeGeometry(new CatmullRomCurve3(rim.filter(point => point.y > lensHeight * 0.3), false), 48, 0.005, 8, false), materials.frame);
    const hinge = [side * (centreX + Math.cos(wrap) * halfWidth), centreY + 0.026, lensZ - Math.sin(wrap) * halfWidth];
    tube(parent, materials.frame, [hinge, [side * 0.164, centreY + 0.036, hinge[2] - 0.05], [side * 0.168, 0.235, -0.012], [side * 0.166, 0.214, -0.05]], 0.0032, { segments: 28, radialSegments: 8 });
  }
  const innerX = centreX - Math.cos(wrap) * halfWidth;
  tube(parent, materials.frame, [[-innerX, centreY + 0.016, bridgeZ], [0, centreY + 0.021, bridgeZ + 0.003], [innerX, centreY + 0.016, bridgeZ]], 0.0032, { segments: 12, radialSegments: 8 });
}
