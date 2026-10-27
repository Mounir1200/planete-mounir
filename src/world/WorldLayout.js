import { Quaternion, Vector3 } from 'three';
import { PLANET } from '../config.js';
import { directionFromLatLon, orientationFromUpForward, tangentToward } from '../utils/math.js';

const PAD_BLEND_UNITS = 5;
const PAD_SUPPORT_MARGIN = 0.5;

// Resolves the content plan (lat/lon, paths, basins) into vectors the world systems use.
export class WorldLayout {
  constructor({ places, paths, basins }) {
    this.places = places.map(place => this.#resolvePlace(place, places));
    this.paths = paths.map(([fromId, toId]) => this.#resolvePath(this.place(fromId), this.place(toId)));
    this.basins = basins.map(basin => ({
      direction: directionFromLatLon(...basin.latLon),
      innerAngle: degreesToRadians(basin.innerAngle),
      outerAngle: degreesToRadians(basin.outerAngle),
      depth: basin.depth,
    }));
  }

  place(id) {
    return this.places.find(place => place.id === id);
  }

  #resolvePlace(place, allPlaces) {
    const direction = directionFromLatLon(...place.latLon);
    const lookTarget = typeof place.faceTo === 'string'
      ? directionFromLatLon(...allPlaces.find(other => other.id === place.faceTo).latLon)
      : directionFromLatLon(...place.faceTo);
    const facing = tangentToward(direction, lookTarget);
    const padHeight = PLANET.radius + PLANET.baseElevation;
    const padSupportRadius = place.padRadius + PAD_SUPPORT_MARGIN;
    const padAngle = Math.atan(padSupportRadius / padHeight);
    return {
      ...place,
      direction,
      facing,
      orientation: orientationFromUpForward(direction, facing, new Quaternion()),
      // Radii are measured in the landmark's tangent plane, not along a sphere.
      // A small shoulder keeps every plaza edge supported by the terrain mesh.
      padSupportRadius,
      padBlendUnits: PAD_BLEND_UNITS,
      padAngle,
      blendAngle: Math.atan((padSupportRadius + PAD_BLEND_UNITS) / padHeight) - padAngle,
      padHeight,
    };
  }

  #resolvePath(from, to) {
    const start = from.direction.clone();
    const end = to.direction.clone();
    const normal = new Vector3().crossVectors(start, end).normalize();
    return {
      start,
      end,
      normal,
      // Half-spaces bounding the arc: a point lies between the ends when both dot products are positive.
      startSide: new Vector3().crossVectors(normal, start),
      endSide: new Vector3().crossVectors(end, normal),
      fromId: from.id,
      toId: to.id,
    };
  }
}

function degreesToRadians(degrees) {
  return (degrees * Math.PI) / 180;
}
