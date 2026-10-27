import { Matrix4, Quaternion, Vector3 } from 'three';
import { CAMERA, PLANET } from '../config.js';
import {
  clamp, damp, easeInOutCubic, projectOnTangentPlane, rotateTangentToward,
} from '../utils/math.js';

const AXIS_X = new Vector3(1, 0, 0);
const AXIS_Y = new Vector3(0, 1, 0);
const tempTarget = new Vector3();
const tempOffset = new Vector3();
const tempDirection = new Vector3();
const tempQuaternion = new Quaternion();

// Third-person camera that keeps the planet "down", an orbital view for the
// title and map screens, and smooth flights between the two.
export class CameraRig {
  constructor(camera, terrain, { reducedMotion = false } = {}) {
    this.camera = camera;
    this.terrain = terrain;
    this.mode = 'orbit';
    this.heading = new Vector3(0, 0, -1);
    this.pitch = CAMERA.pitch;
    this.distance = CAMERA.distance;
    this.timeSinceLook = 10;
    this.smoothedUp = new Vector3(0, 1, 0);
    this.smoothedTarget = new Vector3();
    this.orbitRotation = new Quaternion();
    this.orbitDistance = CAMERA.orbitDistance;
    this.reducedMotion = reducedMotion;
    this.autoRotate = !reducedMotion;
    this.flight = null;
    // How "in space" the view is, from 0 (on the ground) to 1 (orbit).
    this.spaceFactor = 1;
  }

  get isFlying() {
    return this.flight !== null;
  }

  look(deltaX, deltaY) {
    if ((!deltaX && !deltaY) || this.isFlying) return;
    if (this.mode === 'follow') {
      this.heading.applyAxisAngle(this.smoothedUp, -deltaX * CAMERA.lookSensitivity);
      this.pitch = clamp(this.pitch + deltaY * CAMERA.lookSensitivity, CAMERA.minPitch, CAMERA.maxPitch);
      this.timeSinceLook = 0;
    } else if (this.mode === 'orbit') {
      const up = AXIS_Y.clone().applyQuaternion(this.orbitRotation);
      const side = AXIS_X.clone().applyQuaternion(this.orbitRotation);
      tempQuaternion.setFromAxisAngle(up, -deltaX * 0.006);
      this.orbitRotation.premultiply(tempQuaternion);
      tempQuaternion.setFromAxisAngle(side, -deltaY * 0.006);
      this.orbitRotation.premultiply(tempQuaternion);
      this.autoRotate = false;
    }
  }

  zoom(amount) {
    if (this.isFlying) return;
    if (this.mode === 'follow') this.distance = clamp(this.distance * (1 + amount), CAMERA.minDistance, CAMERA.maxDistance);
    else this.orbitDistance = clamp(this.orbitDistance * (1 + amount), CAMERA.minOrbitDistance, CAMERA.maxOrbitDistance);
  }

  // Orbit view centred above a surface direction, with `headingHint` pointing up on screen.
  setOrbitAbove(direction, headingHint) {
    const back = direction.clone().normalize();
    const up = projectOnTangentPlane(headingHint ?? AXIS_Y, back).normalize();
    const right = new Vector3().crossVectors(up, back).normalize();
    up.crossVectors(back, right).normalize();
    this.orbitRotation.setFromRotationMatrix(new Matrix4().makeBasis(right, up, back));
  }

  orbitPose() {
    const position = new Vector3(0, 0, this.orbitDistance).applyQuaternion(this.orbitRotation);
    const up = AXIS_Y.clone().applyQuaternion(this.orbitRotation);
    return { position, target: new Vector3(), up };
  }

  followPose(player) {
    const up = player.up;
    projectOnTangentPlane(this.heading, up, this.heading);
    if (this.heading.lengthSq() < 1e-6) this.heading.copy(player.facing);
    this.heading.normalize();
    const target = tempTarget.copy(player.position).addScaledVector(up, CAMERA.targetHeight).clone();
    const offset = tempOffset.copy(this.heading).multiplyScalar(-Math.cos(this.pitch) * this.distance)
      .addScaledVector(up, Math.sin(this.pitch) * this.distance + 0.6);
    const position = target.clone().add(offset);
    this.#keepAboveGround(position);
    return { position, target, up: up.clone() };
  }

  // Animated transition; `getDestination` is re-evaluated every frame so the goal can move.
  flyTo(getDestination, { duration = 2.6, arc = 30, onDone } = {}) {
    if (this.reducedMotion || duration <= 0) {
      this.#finishFlight(getDestination(), onDone);
      return;
    }
    this.flight = {
      from: { position: this.camera.position.clone(), target: this.#currentTarget(), up: this.camera.up.clone() },
      getDestination, duration, arc, onDone, elapsed: 0,
    };
  }

  update(deltaSeconds, player) {
    if (this.flight) this.#updateFlight(deltaSeconds);
    else if (this.mode === 'follow') this.#updateFollow(deltaSeconds, player);
    else this.#updateOrbit(deltaSeconds);
  }

  #updateFollow(deltaSeconds, player) {
    this.timeSinceLook += deltaSeconds;
    this.smoothedUp.lerp(player.up, damp(8, deltaSeconds)).normalize();
    projectOnTangentPlane(this.heading, player.up, this.heading).normalize();
    if (player.speed > 1 && this.timeSinceLook > CAMERA.autoAlignDelay) {
      rotateTangentToward(this.heading, player.facing, player.up, CAMERA.autoAlignSpeed * deltaSeconds * Math.min(1, player.speed / 6));
    }
    const pose = this.followPose(player);
    if (this.smoothedTarget.lengthSq() === 0) this.smoothedTarget.copy(pose.target);
    this.smoothedTarget.lerp(pose.target, damp(14, deltaSeconds));
    this.camera.position.copy(pose.position).add(this.smoothedTarget).sub(pose.target);
    this.#keepAboveGround(this.camera.position);
    this.camera.up.copy(this.smoothedUp);
    this.camera.lookAt(this.smoothedTarget);
    this.spaceFactor = 0;
  }

  #updateOrbit(deltaSeconds) {
    if (this.autoRotate && !this.reducedMotion) {
      tempQuaternion.setFromAxisAngle(AXIS_Y.clone().applyQuaternion(this.orbitRotation), deltaSeconds * 0.06);
      this.orbitRotation.premultiply(tempQuaternion);
    }
    const pose = this.orbitPose();
    this.camera.position.copy(pose.position);
    this.camera.up.copy(pose.up);
    this.camera.lookAt(pose.target);
    this.spaceFactor = 1;
  }

  #updateFlight(deltaSeconds) {
    const flight = this.flight;
    flight.elapsed += deltaSeconds;
    const progress = Math.min(1, flight.elapsed / flight.duration);
    const eased = easeInOutCubic(progress);
    const destination = flight.getDestination();
    if (progress >= 1) {
      this.#finishFlight(destination, flight.onDone);
      return;
    }

    // Interpolate around the planet (direction + radius) so the path never cuts through it.
    const fromRadius = flight.from.position.length();
    const toRadius = destination.position.length();
    tempDirection.copy(flight.from.position).normalize();
    const toDirection = destination.position.clone().normalize();
    tempQuaternion.setFromUnitVectors(tempDirection, toDirection);
    const partial = new Quaternion().slerp(tempQuaternion, eased);
    const direction = tempDirection.applyQuaternion(partial);
    const radius = fromRadius + (toRadius - fromRadius) * eased + Math.sin(progress * Math.PI) * flight.arc;
    this.camera.position.copy(direction).multiplyScalar(radius);

    const target = flight.from.target.clone().lerp(destination.target, eased);
    this.camera.up.copy(flight.from.up).lerp(destination.up, eased);
    if (this.camera.up.lengthSq() < 1e-4) this.camera.up.copy(destination.up);
    this.camera.up.normalize();
    this.camera.lookAt(target);
    this.spaceFactor = clamp((radius - PLANET.radius - 18) / 40, 0, 1);
  }

  // The first follow frame must start at the arrival pose, not at a previous continent.
  #finishFlight(destination, onDone) {
    this.camera.position.copy(destination.position);
    this.camera.up.copy(destination.up).normalize();
    this.camera.lookAt(destination.target);
    this.smoothedTarget.copy(destination.target);
    this.smoothedUp.copy(destination.up).normalize();
    this.spaceFactor = clamp((destination.position.length() - PLANET.radius - 18) / 40, 0, 1);
    this.flight = null;
    onDone?.();
  }

  #currentTarget() {
    const forward = new Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
    const distanceToCentre = this.camera.position.length();
    return this.camera.position.clone().addScaledVector(forward, this.mode === 'follow' ? this.distance : distanceToCentre);
  }

  #keepAboveGround(position) {
    const direction = position.clone().normalize();
    const minimum = this.terrain.heightAt(direction) + CAMERA.terrainClearance;
    if (position.length() < minimum) position.setLength(minimum);
  }
}
