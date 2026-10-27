import { Vector3 } from 'three';
import { INTERACTION, PLANET } from '../config.js';
import { angleBetween, projectOnTangentPlane } from '../utils/math.js';

const toTarget = new Vector3();
const cameraForward = new Vector3();
const cameraRight = new Vector3();

// Answers "where am I relative to the places": the one within reach and the next beacon to light.
export class Navigator {
  constructor(landmarks) {
    this.landmarks = landmarks;
  }

  placeInReach(playerPosition) {
    let best = null;
    let bestDistance = INTERACTION.radius;
    for (const entry of this.landmarks.entries) {
      const distance = entry.interactPoint.distanceTo(playerPosition);
      if (distance < bestDistance) {
        best = entry;
        bestDistance = distance;
      }
    }
    return best;
  }

  // Nearest beacon not yet lit, with its walking distance and on-screen bearing.
  nextBeacon(player, camera, litIds) {
    const direction = player.position.clone().normalize();
    let best = null;
    let bestAngle = Infinity;
    for (const entry of this.landmarks.entries) {
      if (!entry.place.beacon || litIds.has(entry.place.id)) continue;
      const angle = angleBetween(direction, entry.place.direction);
      if (angle < bestAngle) {
        best = entry;
        bestAngle = angle;
      }
    }
    if (!best) return null;
    projectOnTangentPlane(toTarget.copy(best.interactPoint).sub(player.position), player.up);
    camera.getWorldDirection(cameraForward);
    projectOnTangentPlane(cameraForward, player.up, cameraForward).normalize();
    cameraRight.crossVectors(cameraForward, player.up).normalize();
    return {
      entry: best,
      place: best.place,
      distance: bestAngle * PLANET.radius,
      screenAngle: Math.atan2(toTarget.dot(cameraRight), toTarget.dot(cameraForward)),
    };
  }
}
