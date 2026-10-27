import { Group, Matrix4, Vector3 } from 'three';
import { Beacon } from './Beacon.js';
import { Kit } from './Kit.js';
import { buildPoste } from './landmarks/postOffice.js';
import { buildMaison } from './landmarks/home.js';
import { buildGalerie } from './landmarks/belvedere.js';
import { buildEssca } from './landmarks/esscaCampus.js';
import { buildEsaip } from './landmarks/esaipCampus.js';
import { buildUrdwell } from './landmarks/worldTree.js';
import { buildHindsight } from './landmarks/observatory.js';
import { buildKtu, buildRwu } from './landmarks/erasmusCampuses.js';
import { buildPhare } from './landmarks/lighthouse.js';
import { buildLabo } from './landmarks/aiLaboratory.js';
import { buildOuaga } from './landmarks/ouagadougou.js';
import { buildMoov } from './landmarks/moovCampus.js';
import { buildPort } from './landmarks/harbour.js';
import { buildGym } from './landmarks/gym.js';

const BUILDERS = {
  maison: buildMaison,
  essca: buildEssca,
  esaip: buildEsaip,
  poste: buildPoste,
  galerie: buildGalerie,
  urdwell: buildUrdwell,
  rwu: buildRwu,
  hindsight: buildHindsight,
  ktu: buildKtu,
  labo: buildLabo,
  moov: buildMoov,
  ouaga: buildOuaga,
  phare: buildPhare,
  port: buildPort,
  gym: buildGym,
};

const QUERY_MARGIN_UNITS = 8;
const localPoint = new Vector3();

// Places every landmark on its pad and answers spatial questions about them:
// solid obstacles, walkable platforms, interaction spots and label anchors.
export class Landmarks {
  constructor({ layout, materials, loadTexture, galleryPhotos }) {
    this.group = new Group();
    this.entries = layout.places.map(place => this.#build(place, { materials, loadTexture, photos: galleryPhotos }));
  }

  entry(id) {
    return this.entries.find(entry => entry.place.id === id);
  }

  #build(place, context) {
    const kit = new Kit(context.materials, place);
    const spec = BUILDERS[place.id](kit, { ...context, place });
    let beacon = null;
    if (place.beacon) {
      beacon = new Beacon(place.accent, context.materials);
      beacon.object.position.set(spec.beaconAt[0], 0, spec.beaconAt[1]);
      kit.root.add(beacon.object);
      kit.collideCircle(spec.beaconAt[0], spec.beaconAt[1], 0.6);
    }
    const root = kit.bake();
    root.position.copy(place.direction).multiplyScalar(place.padHeight);
    root.quaternion.copy(place.orientation);
    root.updateMatrixWorld(true);
    this.group.add(root);

    const toWorld = root.matrixWorld.clone();
    const toLocal = new Matrix4().copy(toWorld).invert();
    const localToWorld = (x, y, z) => new Vector3(x, y, z).applyMatrix4(toWorld);
    return {
      place,
      root,
      beacon,
      updaters: kit.updaters,
      colliders: kit.colliders,
      platforms: kit.platforms,
      toLocal,
      toWorld,
      queryAngle: (place.padRadius + QUERY_MARGIN_UNITS) / place.padHeight,
      interactPoint: localToWorld(spec.interactAt[0], 0, spec.interactAt[1]),
      spawnPoint: localToWorld(spec.interactAt[0], 0, spec.interactAt[1] + 1.6),
      labelAnchor: localToWorld(0, spec.labelHeight, 0),
      beaconPoint: beacon ? localToWorld(spec.beaconAt[0], 1.8, spec.beaconAt[1]) : null,
    };
  }

  nearby(direction) {
    return this.entries.filter(entry => direction.dot(entry.place.direction) > Math.cos(entry.queryAngle));
  }

  // Pushes a world position out of every solid footprint around it.
  resolveCollisions(position, radius) {
    for (const entry of this.nearby(position.clone().normalize())) {
      if (entry.colliders.length === 0) continue;
      localPoint.copy(position).applyMatrix4(entry.toLocal);
      let moved = false;
      for (const collider of entry.colliders) moved = pushOut(localPoint, collider, radius) || moved;
      if (moved) position.copy(localPoint.applyMatrix4(entry.toWorld));
    }
    return position;
  }

  // Highest platform top under a world position, as a radius from the planet centre.
  platformHeight(direction, radius) {
    let best = -Infinity;
    for (const entry of this.nearby(direction)) {
      if (entry.platforms.length === 0) continue;
      const alignment = direction.dot(entry.place.direction);
      if (alignment <= 0) continue;
      for (const platform of entry.platforms) {
        // Intersect the ray with the actual tangent plane, including at the end of a dock.
        const surfaceRadius = (entry.place.padHeight + platform.top) / alignment;
        localPoint.copy(direction).multiplyScalar(surfaceRadius).applyMatrix4(entry.toLocal);
        const dx = localPoint.x - platform.x;
        const dz = localPoint.z - platform.z;
        const inside = platform.type === 'circle'
          ? dx * dx + dz * dz <= platform.radius * platform.radius
          : Math.abs(dx) <= platform.halfWidth && Math.abs(dz) <= platform.halfDepth;
        if (inside) best = Math.max(best, surfaceRadius);
      }
    }
    return best;
  }

  update(time, deltaSeconds, worldState) {
    for (const entry of this.entries) {
      entry.updaters.forEach(update => update(time, deltaSeconds, worldState));
      entry.beacon?.update(time, deltaSeconds, worldState);
    }
  }
}

function pushOut(point, collider, radius) {
  if (collider.type === 'circle') {
    const dx = point.x - collider.x;
    const dz = point.z - collider.z;
    const minimum = collider.radius + radius;
    const distanceSquared = dx * dx + dz * dz;
    if (distanceSquared >= minimum * minimum) return false;
    const distance = Math.sqrt(distanceSquared) || 1e-4;
    point.x = collider.x + (dx / distance) * minimum;
    point.z = collider.z + (dz / distance) * minimum;
    return true;
  }
  const overlapX = collider.halfWidth + radius - Math.abs(point.x - collider.x);
  const overlapZ = collider.halfDepth + radius - Math.abs(point.z - collider.z);
  if (overlapX <= 0 || overlapZ <= 0) return false;
  if (overlapX < overlapZ) point.x += Math.sign(point.x - collider.x || 1) * overlapX;
  else point.z += Math.sign(point.z - collider.z || 1) * overlapZ;
  return true;
}
