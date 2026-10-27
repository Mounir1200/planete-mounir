import {
  BufferAttribute, Color, ConeGeometry, CylinderGeometry, DodecahedronGeometry, Euler, Group, IcosahedronGeometry,
  InstancedMesh, Matrix4, MeshStandardMaterial, OctahedronGeometry, Quaternion, Vector3,
} from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { PLANET } from '../config.js';
import { angleBetween, orientationFromUpForward, anyTangent } from '../utils/math.js';
import { createRandom, randomBetween } from '../utils/random.js';

const CANDIDATE_COUNT = 5600;
const PAD_CLEARANCE_UNITS = 2.2;
const PATH_CLEARANCE_UNITS = 1.9;
const LAMP_SPACING_UNITS = 9;
const LAMP_SIDE_OFFSET = 1.7;

// Weighted prop tables per biome; the remainder of the probability stays empty.
const BIOME_PROPS = {
  loire: [['roundTree', 0.3], ['bush', 0.18], ['flowers', 0.26], ['rock', 0.04], ['pine', 0.04]],
  alpes: [['pine', 0.5], ['rock', 0.14], ['bush', 0.1], ['flowers', 0.06]],
  nord: [['snowPine', 0.45], ['rock', 0.1], ['snowRock', 0.1]],
  savane: [['acacia', 0.16], ['baobab', 0.05], ['dryBush', 0.26], ['rock', 0.08]],
  cote: [['palm', 0.2], ['bush', 0.16], ['flowers', 0.2], ['rock', 0.08]],
  labo: [['roundTree', 0.16], ['bush', 0.16], ['flowers', 0.09], ['rock', 0.04]],
};

// Trunk radius (before scale) that blocks the player, or 0 for walk-through props.
const PROP_COLLISION = {
  roundTree: 0.3, pine: 0.28, snowPine: 0.28, palm: 0.25, baobab: 0.9, acacia: 0.2,
  rock: 0.5, snowRock: 0.5, crystal: 0.4, bush: 0, dryBush: 0, flowers: 0,
};

function colored(geometry, color, transform) {
  const target = geometry.index ? geometry.toNonIndexed() : geometry;
  target.deleteAttribute('uv');
  if (transform) target.applyMatrix4(transform);
  const tint = new Color(color);
  const colors = new Float32Array(target.attributes.position.count * 3);
  for (let index = 0; index < colors.length; index += 3) colors.set([tint.r, tint.g, tint.b], index);
  target.setAttribute('color', new BufferAttribute(colors, 3));
  return target;
}

function eulerMatrix(x, y, z, rx, ry, rz, sx = 1, sy = 1, sz = 1) {
  return new Matrix4().compose(new Vector3(x, y, z), new Quaternion().setFromEuler(new Euler(rx, ry, rz)), new Vector3(sx, sy, sz));
}

const PROP_GEOMETRIES = {
  roundTree: () => mergeGeometries([
    colored(new CylinderGeometry(0.12, 0.18, 1.3, 6), '#7a5536', eulerMatrix(0, 0.65, 0, 0, 0, 0)),
    colored(new IcosahedronGeometry(0.85, 0), '#55a347', eulerMatrix(0, 1.8, 0, 0, 0, 0)),
    colored(new IcosahedronGeometry(0.6, 0), '#6cbb55', eulerMatrix(0.35, 2.3, 0.1, 0, 0, 0)),
    colored(new IcosahedronGeometry(0.55, 0), '#478d3f', eulerMatrix(-0.3, 2.05, -0.2, 0, 0, 0)),
  ]),
  pine: () => mergeGeometries([
    colored(new CylinderGeometry(0.1, 0.14, 0.8, 5), '#6b4a30', eulerMatrix(0, 0.4, 0, 0, 0, 0)),
    colored(new ConeGeometry(0.95, 1.5, 7), '#2f6e4b', eulerMatrix(0, 1.35, 0, 0, 0, 0)),
    colored(new ConeGeometry(0.72, 1.3, 7), '#357a52', eulerMatrix(0, 2, 0, 0, 0.3, 0)),
    colored(new ConeGeometry(0.48, 1.1, 7), '#3c8559', eulerMatrix(0, 2.6, 0, 0, 0.6, 0)),
  ]),
  snowPine: () => mergeGeometries([
    colored(new CylinderGeometry(0.1, 0.14, 0.8, 5), '#6b4a30', eulerMatrix(0, 0.4, 0, 0, 0, 0)),
    colored(new ConeGeometry(0.95, 1.5, 7), '#2d6a52', eulerMatrix(0, 1.35, 0, 0, 0, 0)),
    colored(new ConeGeometry(0.62, 0.55, 7), '#f3f7fc', eulerMatrix(0, 1.86, 0, 0, 0, 0)),
    colored(new ConeGeometry(0.72, 1.3, 7), '#2d6a52', eulerMatrix(0, 2.05, 0, 0, 0.3, 0)),
    colored(new ConeGeometry(0.48, 1.1, 7), '#f3f7fc', eulerMatrix(0, 2.7, 0, 0, 0.6, 0)),
  ]),
  palm: () => {
    const parts = [];
    for (let segment = 0; segment < 5; segment++) {
      parts.push(colored(new CylinderGeometry(0.11, 0.14, 0.62, 6), segment % 2 ? '#a07a50' : '#8d6a44', eulerMatrix(segment * 0.08, 0.31 + segment * 0.58, 0, 0, 0, -0.08)));
    }
    for (let leaf = 0; leaf < 6; leaf++) {
      const angle = (leaf / 6) * Math.PI * 2;
      parts.push(colored(new ConeGeometry(0.22, 1.7, 4), leaf % 2 ? '#4fa64a' : '#5cb653',
        eulerMatrix(0.4 + Math.cos(angle) * 0.75, 3.05, Math.sin(angle) * 0.75, Math.sin(angle) * 1.9, 0, -Math.cos(angle) * 1.9, 1, 1, 0.35)));
    }
    parts.push(colored(new IcosahedronGeometry(0.13, 0), '#6b4a30', eulerMatrix(0.5, 2.95, 0.12, 0, 0, 0)));
    return mergeGeometries(parts);
  },
  baobab: () => mergeGeometries([
    colored(new CylinderGeometry(0.6, 1, 3, 8), '#9d7c63', eulerMatrix(0, 1.5, 0, 0, 0, 0)),
    colored(new CylinderGeometry(0.12, 0.25, 1.2, 5), '#8b6b52', eulerMatrix(0.6, 3.3, 0, 0, 0, -0.7)),
    colored(new CylinderGeometry(0.12, 0.25, 1.2, 5), '#8b6b52', eulerMatrix(-0.5, 3.3, 0.3, 0.4, 0, 0.7)),
    colored(new IcosahedronGeometry(0.8, 0), '#76a23f', eulerMatrix(1, 3.9, 0, 0, 0, 0, 1.3, 0.5, 1.3)),
    colored(new IcosahedronGeometry(0.7, 0), '#6b9638', eulerMatrix(-0.8, 3.8, 0.5, 0, 0, 0, 1.3, 0.5, 1.3)),
  ]),
  acacia: () => mergeGeometries([
    colored(new CylinderGeometry(0.07, 0.11, 1.8, 5), '#6e4f35', eulerMatrix(0.15, 0.9, 0, 0, 0, -0.16)),
    colored(new CylinderGeometry(1.4, 1.1, 0.32, 8), '#7f9a3c', eulerMatrix(0.3, 1.95, 0, 0, 0, 0)),
    colored(new CylinderGeometry(0.9, 0.8, 0.22, 7), '#8eaa45', eulerMatrix(0.1, 2.2, 0.2, 0, 0.4, 0)),
  ]),
  bush: () => mergeGeometries([
    colored(new IcosahedronGeometry(0.45, 0), '#4f9a45', eulerMatrix(0, 0.25, 0, 0, 0, 0, 1, 0.75, 1)),
    colored(new IcosahedronGeometry(0.32, 0), '#62ad50', eulerMatrix(0.3, 0.3, 0.1, 0, 0, 0)),
  ]),
  dryBush: () => mergeGeometries([
    colored(new IcosahedronGeometry(0.36, 0), '#b8893e', eulerMatrix(0, 0.22, 0, 0, 0, 0, 1, 0.7, 1)),
    colored(new IcosahedronGeometry(0.24, 0), '#c99a4a', eulerMatrix(0.25, 0.25, 0.1, 0, 0, 0)),
  ]),
  flowers: () => {
    const colors = ['#ff8fb1', '#ffd36b', '#ffffff', '#ff9a5c', '#c4a6ff'];
    const parts = [];
    for (let flower = 0; flower < 6; flower++) {
      const angle = flower * 2.4;
      const radius = 0.15 + (flower % 3) * 0.12;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      parts.push(colored(new CylinderGeometry(0.015, 0.015, 0.3, 3), '#3f8a45', eulerMatrix(x, 0.15, z, 0, 0, 0)));
      parts.push(colored(new IcosahedronGeometry(0.075, 0), colors[flower % colors.length], eulerMatrix(x, 0.32, z, 0, 0, 0)));
    }
    return mergeGeometries(parts);
  },
  rock: () => colored(new DodecahedronGeometry(0.55, 0), '#958f88', eulerMatrix(0, 0.2, 0, 0, 0, 0, 1, 0.7, 1)),
  snowRock: () => mergeGeometries([
    colored(new DodecahedronGeometry(0.55, 0), '#8a8f99', eulerMatrix(0, 0.2, 0, 0, 0, 0, 1, 0.7, 1)),
    colored(new DodecahedronGeometry(0.42, 0), '#f3f7fc', eulerMatrix(0, 0.42, 0, 0, 0.5, 0, 1, 0.45, 1)),
  ]),
  crystal: () => mergeGeometries([
    colored(new OctahedronGeometry(0.35, 0), '#a58bff', eulerMatrix(0, 0.6, 0, 0, 0, 0, 1, 2.2, 1)),
    colored(new OctahedronGeometry(0.22, 0), '#7df9ff', eulerMatrix(0.35, 0.35, 0.1, 0, 0, 0.4, 1, 2, 1)),
    colored(new OctahedronGeometry(0.2, 0), '#d58cff', eulerMatrix(-0.3, 0.3, -0.15, 0.3, 0, -0.3, 1, 1.8, 1)),
  ]),
};

const SCALE_RANGES = {
  roundTree: [0.8, 1.35], pine: [0.85, 1.5], snowPine: [0.85, 1.4], palm: [0.85, 1.2], baobab: [1, 1.4], acacia: [0.9, 1.3],
  bush: [0.7, 1.3], dryBush: [0.7, 1.3], flowers: [0.8, 1.2], rock: [0.5, 1.6], snowRock: [0.6, 1.5], crystal: [0.7, 1.6],
};

// Vegetation, rocks and street lamps, drawn with one instanced mesh per prop type.
export class Scatter {
  constructor({ terrain, layout, materials, density = 1, seed = 4242 }) {
    this.group = new Group();
    this.colliders = [];
    this.terrain = terrain;
    this.layout = layout;
    const random = createRandom(seed);
    const placements = this.#placeProps(random, density);
    this.#buildInstances(placements, materials);
    this.#buildLamps(materials);
  }

  // Colliders near a direction, as { direction, radius } on the surface.
  nearbyColliders(direction, maxAngle = 0.12) {
    const threshold = Math.cos(maxAngle);
    return this.colliders.filter(collider => collider.direction.dot(direction) > threshold);
  }

  #isClearOfPlaces(direction, extraUnits) {
    return this.layout.places.every(place => angleBetween(direction, place.direction) * PLANET.radius > place.padRadius + extraUnits);
  }

  #placeProps(random, density) {
    const placements = {};
    const count = Math.round(CANDIDATE_COUNT * density);
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    const direction = new Vector3();
    for (let index = 0; index < count; index++) {
      const y = 1 - ((index + random()) / count) * 2;
      const ring = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = goldenAngle * index + random() * 0.6;
      direction.set(Math.cos(theta) * ring, y, Math.sin(theta) * ring).normalize();

      const sample = this.terrain.sample(direction);
      if (sample.height < PLANET.seaLevel + 0.3) continue;
      if (sample.pathDistance < PATH_CLEARANCE_UNITS) continue;
      if (!this.#isClearOfPlaces(direction, PAD_CLEARANCE_UNITS)) continue;

      const type = pickProp(BIOME_PROPS[this.terrain.dominantBiome(direction)], random());
      if (!type) continue;
      const [minScale, maxScale] = SCALE_RANGES[type];
      const scale = randomBetween(random, minScale, maxScale);
      (placements[type] ??= []).push({ direction: direction.clone(), height: sample.height - 0.05, scale, yaw: random() * Math.PI * 2 });
      if (PROP_COLLISION[type] > 0) this.colliders.push({ direction: direction.clone(), radius: PROP_COLLISION[type] * scale });
    }
    return placements;
  }

  #buildInstances(placements, materials) {
    const plain = new MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.85 });
    const crystal = new MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.3, emissive: new Color('#6b4dff'), emissiveIntensity: 0.5 });
    materials.trackGlow(crystal, 0.35, 1.6);
    const matrix = new Matrix4();
    const orientation = new Quaternion();
    const position = new Vector3();
    const scaleVector = new Vector3();
    const tangent = new Vector3();
    for (const [type, items] of Object.entries(placements)) {
      const mesh = new InstancedMesh(PROP_GEOMETRIES[type](), type === 'crystal' ? crystal : plain, items.length);
      items.forEach((item, index) => {
        anyTangent(item.direction, tangent).applyAxisAngle(item.direction, item.yaw);
        orientationFromUpForward(item.direction, tangent, orientation);
        position.copy(item.direction).multiplyScalar(item.height);
        matrix.compose(position, orientation, scaleVector.setScalar(item.scale));
        mesh.setMatrixAt(index, matrix);
      });
      mesh.castShadow = !['flowers'].includes(type);
      mesh.receiveShadow = true;
      mesh.computeBoundingSphere();
      this.group.add(mesh);
    }
  }

  #buildLamps(materials) {
    const spots = [];
    for (const path of this.layout.paths) {
      const arc = angleBetween(path.start, path.end);
      const steps = Math.floor((arc * PLANET.radius) / LAMP_SPACING_UNITS);
      for (let step = 1; step < steps; step++) {
        const along = path.start.clone().applyAxisAngle(path.normal, (arc * step) / steps);
        const side = (step % 2 ? 1 : -1) * LAMP_SIDE_OFFSET / PLANET.radius;
        const direction = along.addScaledVector(path.normal, side).normalize();
        if (!this.#isClearOfPlaces(direction, 1) || this.terrain.isUnderwater(direction, -0.2)) continue;
        spots.push(direction);
      }
    }
    const post = new CylinderGeometry(0.06, 0.09, 2.3, 6);
    post.translate(0, 1.15, 0);
    const head = new IcosahedronGeometry(0.17, 0);
    head.translate(0, 2.5, 0);
    const posts = new InstancedMesh(post, materials.solid('#2b3150'), spots.length);
    const heads = new InstancedMesh(head, materials.glow('#ffd29a', { day: 0.25, night: 3.4 }), spots.length);
    const matrix = new Matrix4();
    const orientation = new Quaternion();
    const tangent = new Vector3();
    spots.forEach((direction, index) => {
      orientationFromUpForward(direction, anyTangent(direction, tangent), orientation);
      matrix.compose(direction.clone().multiplyScalar(this.terrain.heightAt(direction) - 0.05), orientation, new Vector3(1, 1, 1));
      posts.setMatrixAt(index, matrix);
      heads.setMatrixAt(index, matrix);
      this.colliders.push({ direction: direction.clone(), radius: 0.22 });
    });
    posts.castShadow = true;
    [posts, heads].forEach(mesh => { mesh.computeBoundingSphere(); this.group.add(mesh); });
  }
}

function pickProp(table, roll) {
  let cumulative = 0;
  for (const [type, probability] of table) {
    cumulative += probability;
    if (roll < cumulative) return type;
  }
  return null;
}
