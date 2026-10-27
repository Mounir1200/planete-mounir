import {
  BufferAttribute, BufferGeometry, Color, IcosahedronGeometry, Mesh, MeshStandardMaterial, Vector3,
} from 'three';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { PLANET } from '../config.js';
import { createNoise3D, fractalNoise, ridgedNoise } from '../utils/noise.js';
import { createRandom } from '../utils/random.js';
import { angleBetween, clamp, directionFromLatLon, lerp, smoothstep } from '../utils/math.js';
import { BIOMES, DEEP_SEABED_COLOR, ROCK_COLOR, SEABED_COLOR, SNOW_COLOR } from './biomes.js';

const PATH_HALF_WIDTH = 1.05;
const PATH_CAUSEWAY_HEIGHT = 0.85;
const MOUNTAIN_HEIGHT = 7.5;
const SNOW_LINE = 4.8;
const BIOME_SHARPNESS = 16;

// Height and colour of the planet surface. The same functions drive the mesh
// and the player's ground queries, so walking always matches what is drawn.
export class Terrain {
  constructor(layout, seed = 1207) {
    const random = createRandom(seed);
    this.layout = layout;
    this.shapeNoise = createNoise3D(random);
    this.detailNoise = createNoise3D(random);
    this.biomes = Object.entries(BIOMES).map(([id, biome]) => ({
      id,
      direction: directionFromLatLon(...biome.center),
      ground: biome.ground.map(hex => new Color(hex)),
      path: new Color(biome.path),
      shore: new Color(biome.shore),
      mountains: biome.mountains,
    }));
    this.weights = new Float32Array(this.biomes.length);
    this.#settlePadHeights();
  }

  get biomeCount() {
    return this.biomes.length;
  }

  // Ground radius (distance from the planet centre) under a unit direction.
  heightAt(direction) {
    return this.sample(direction).height;
  }

  sample(direction) {
    const weights = this.biomeWeights(direction);
    const pathDistance = this.pathDistance(direction);
    let height = this.#naturalHeight(direction, weights, pathDistance);
    height = this.#applyPathCauseway(height, pathDistance);
    // Finish with the pads so paths meet the same plane as buildings and plazas.
    height = this.#applyPads(direction, height);
    return { height, weights, pathDistance };
  }

  biomeWeights(direction, target = this.weights) {
    const wobble = this.detailNoise(direction.x * 3.1, direction.y * 3.1, direction.z * 3.1) * 0.07;
    let total = 0;
    for (let index = 0; index < this.biomes.length; index++) {
      const value = Math.exp(BIOME_SHARPNESS * (direction.dot(this.biomes[index].direction) + wobble * (index % 2 ? 1 : -1)));
      target[index] = value;
      total += value;
    }
    for (let index = 0; index < this.biomes.length; index++) target[index] /= total;
    return target;
  }

  dominantBiome(direction) {
    const weights = this.biomeWeights(direction);
    let best = 0;
    for (let index = 1; index < weights.length; index++) if (weights[index] > weights[best]) best = index;
    return this.biomes[best].id;
  }

  // Distance in world units to the nearest path arc.
  pathDistance(direction) {
    let closest = Infinity;
    for (const path of this.layout.paths) {
      const betweenEnds = direction.dot(path.startSide) >= 0 && direction.dot(path.endSide) >= 0;
      const angle = betweenEnds
        ? Math.abs(Math.asin(clamp(direction.dot(path.normal), -1, 1)))
        : Math.min(angleBetween(direction, path.start), angleBetween(direction, path.end));
      if (angle < closest) closest = angle;
    }
    return closest * PLANET.radius;
  }

  isUnderwater(direction, margin = 0) {
    return this.heightAt(direction) < PLANET.seaLevel - margin;
  }

  createMesh(detail) {
    const geometry = this.#buildGeometry(detail);
    const material = new MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.94, metalness: 0 });
    const mesh = new Mesh(geometry, material);
    mesh.receiveShadow = true;
    mesh.name = 'terrain';
    return mesh;
  }

  #naturalHeight(direction, weights, pathDistance) {
    const { x, y, z } = direction;
    let height = PLANET.radius + PLANET.baseElevation;
    height += fractalNoise(this.shapeNoise, x * 1.8, y * 1.8, z * 1.8, 4) * 0.95;
    height += fractalNoise(this.detailNoise, x * 7, y * 7, z * 7, 2) * 0.22;

    let mountainMask = 0;
    for (let index = 0; index < weights.length; index++) mountainMask += weights[index] * this.biomes[index].mountains;
    const valley = smoothstep(PATH_HALF_WIDTH * 2, PATH_HALF_WIDTH * 9, pathDistance);
    const ridge = Math.max(0, ridgedNoise(this.shapeNoise, x * 2.4 + 7, y * 2.4, z * 2.4, 3) - 0.38) / 0.62;
    height += ridge ** 1.6 * MOUNTAIN_HEIGHT * mountainMask * valley;

    for (const basin of this.layout.basins) {
      const edgeNoise = this.detailNoise(x * 4, y * 4 + 3, z * 4) * 0.045;
      const angle = angleBetween(direction, basin.direction) + edgeNoise;
      if (angle > basin.outerAngle) continue;
      const amount = smoothstep(basin.outerAngle, basin.innerAngle, angle);
      const seabed = PLANET.seaLevel - basin.depth + this.shapeNoise(x * 5, y * 5, z * 5) * 0.5;
      height = lerp(height, Math.min(height, seabed), amount);
    }
    return height;
  }

  #applyPathCauseway(height, pathDistance) {
    if (pathDistance > PATH_HALF_WIDTH * 2) return height;
    const amount = smoothstep(PATH_HALF_WIDTH * 2, PATH_HALF_WIDTH * 0.7, pathDistance);
    return Math.max(height, lerp(height, PLANET.seaLevel + PATH_CAUSEWAY_HEIGHT, amount));
  }

  #applyPads(direction, height) {
    let totalWeight = 1;
    let blendedHeight = height;
    for (const place of this.layout.places) {
      const dot = clamp(direction.dot(place.direction), -1, 1);
      if (dot <= 0 || dot < Math.cos(place.padAngle + place.blendAngle)) continue;
      // Intersect the radial ground query with the landmark's plane:
      // point = direction * radius, point.dot(place.direction) = padHeight.
      const planeHeight = place.padHeight / dot;
      const planeDistance = planeHeight * Math.sqrt(Math.max(0, 1 - dot * dot));
      const amount = smoothstep(place.padSupportRadius + place.padBlendUnits, place.padSupportRadius, planeDistance);
      if (amount >= 1) return planeHeight;

      // When skirts overlap, neither may warp a neighbour's exact flat core.
      // These weights approach that core continuously and are order-independent.
      const weight = amount / (1 - amount);
      blendedHeight += planeHeight * weight;
      totalWeight += weight;
    }
    return blendedHeight / totalWeight;
  }

  // Pads sit on the natural ground, but never below the shore.
  #settlePadHeights() {
    for (const place of this.layout.places) {
      const weights = this.biomeWeights(place.direction, new Float32Array(this.biomes.length));
      const natural = this.#naturalHeight(place.direction, weights, Infinity);
      place.padHeight = Math.max(PLANET.seaLevel + 0.75, Math.min(natural, PLANET.seaLevel + 3.2));
      place.padAngle = Math.atan(place.padSupportRadius / place.padHeight);
      place.blendAngle = Math.atan((place.padSupportRadius + place.padBlendUnits) / place.padHeight) - place.padAngle;
    }
  }

  #buildGeometry(detail) {
    let indexed = new IcosahedronGeometry(1, detail);
    indexed.deleteAttribute('normal');
    indexed.deleteAttribute('uv');
    indexed = mergeVertices(indexed);

    const positions = indexed.attributes.position;
    const vertexCount = positions.count;
    const biomeCount = this.biomes.length;
    const heights = new Float32Array(vertexCount);
    const paths = new Float32Array(vertexCount);
    const weights = new Float32Array(vertexCount * biomeCount);
    const direction = new Vector3();

    for (let vertex = 0; vertex < vertexCount; vertex++) {
      direction.fromBufferAttribute(positions, vertex).normalize();
      const sample = this.sample(direction);
      heights[vertex] = sample.height;
      paths[vertex] = sample.pathDistance;
      weights.set(sample.weights, vertex * biomeCount);
      positions.setXYZ(vertex, direction.x * sample.height, direction.y * sample.height, direction.z * sample.height);
    }

    const index = indexed.index.array;
    const faceCount = index.length / 3;
    const flatPositions = new Float32Array(faceCount * 9);
    const flatColors = new Float32Array(faceCount * 9);
    const corners = [new Vector3(), new Vector3(), new Vector3()];
    const edgeA = new Vector3();
    const edgeB = new Vector3();
    const normal = new Vector3();
    const centroid = new Vector3();
    const faceWeights = new Float32Array(biomeCount);
    const color = new Color();

    for (let face = 0; face < faceCount; face++) {
      let height = 0;
      let pathDistance = 0;
      faceWeights.fill(0);
      for (let corner = 0; corner < 3; corner++) {
        const vertex = index[face * 3 + corner];
        corners[corner].fromBufferAttribute(positions, vertex);
        height += heights[vertex] / 3;
        pathDistance += paths[vertex] / 3;
        for (let biome = 0; biome < biomeCount; biome++) faceWeights[biome] += weights[vertex * biomeCount + biome] / 3;
        flatPositions.set([corners[corner].x, corners[corner].y, corners[corner].z], face * 9 + corner * 3);
      }
      centroid.copy(corners[0]).add(corners[1]).add(corners[2]).normalize();
      edgeA.subVectors(corners[1], corners[0]);
      edgeB.subVectors(corners[2], corners[0]);
      normal.crossVectors(edgeA, edgeB).normalize();
      const slope = 1 - Math.abs(normal.dot(centroid));

      this.#faceColor(color, centroid, height, slope, faceWeights, pathDistance);
      for (let corner = 0; corner < 3; corner++) flatColors.set([color.r, color.g, color.b], face * 9 + corner * 3);
    }
    indexed.dispose();

    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(flatPositions, 3));
    geometry.setAttribute('color', new BufferAttribute(flatColors, 3));
    geometry.computeVertexNormals();
    geometry.computeBoundingSphere();
    return geometry;
  }

  #faceColor(target, direction, height, slope, weights, pathDistance) {
    const { x, y, z } = direction;
    const sea = PLANET.seaLevel;
    if (height < sea - 0.08) {
      return target.set(SEABED_COLOR).lerp(scratch.set(DEEP_SEABED_COLOR), smoothstep(sea - 0.3, sea - 3.5, height));
    }

    const variant = this.detailNoise(x * 9, y * 9, z * 9);
    const spots = this.shapeNoise(x * 15 + 4, y * 15, z * 15);
    target.setRGB(0, 0, 0);
    for (let index = 0; index < weights.length; index++) {
      const palette = this.biomes[index].ground;
      scratch.copy(palette[0]).lerp(palette[1], smoothstep(-0.4, 0.5, variant));
      if (spots > 0.55) scratch.lerp(palette[2], 0.8);
      target.r += scratch.r * weights[index];
      target.g += scratch.g * weights[index];
      target.b += scratch.b * weights[index];
    }

    const shoreAmount = smoothstep(sea + 0.55, sea + 0.15, height);
    if (shoreAmount > 0) target.lerp(this.#blend(weights, 'shore'), shoreAmount);

    const rockAmount = smoothstep(0.22, 0.42, slope) * (height > sea + 0.6 ? 1 : 0);
    if (rockAmount > 0) target.lerp(scratch.set(ROCK_COLOR), rockAmount * 0.85);

    const snowAmount = smoothstep(sea + SNOW_LINE, sea + SNOW_LINE + 1.2, height + variant * 0.6);
    if (snowAmount > 0) target.lerp(scratch.set(SNOW_COLOR), snowAmount);

    const pathAmount = smoothstep(PATH_HALF_WIDTH * 1.35, PATH_HALF_WIDTH * 0.8, pathDistance);
    if (pathAmount > 0) target.lerp(this.#blend(weights, 'path'), pathAmount);

    const brightness = 1 + this.detailNoise(x * 40, y * 40, z * 40) * 0.05;
    return target.multiplyScalar(brightness);
  }

  #blend(weights, key) {
    blended.setRGB(0, 0, 0);
    for (let index = 0; index < weights.length; index++) {
      const source = this.biomes[index][key];
      blended.r += source.r * weights[index];
      blended.g += source.g * weights[index];
      blended.b += source.b * weights[index];
    }
    return blended;
  }
}

const scratch = new Color();
const blended = new Color();
