import { Vector3 } from 'three';
import { PLANET, PLAYER } from '../config.js';
import { PHYSICS_EVENTS, RustPlayerPhysics } from '../core/RustPhysics.js';
import { orientationFromUpForward, projectOnTangentPlane } from '../utils/math.js';

const candidate = new Vector3();
const direction = new Vector3();
const offset = new Vector3();
const eventPosition = new Vector3();
const EVENT_ENTRIES = Object.entries(PHYSICS_EVENTS);

// Three.js adapter for the Rust/Wasm simulation. Terrain and mesh collision
// queries remain beside their rendered geometry; Rust owns player dynamics.
export class PlayerController {
  constructor({ terrain, landmarks, scatter, avatar, events }) {
    this.terrain = terrain;
    this.landmarks = landmarks;
    this.scatter = scatter;
    this.avatar = avatar;
    this.events = events;
    this.position = new Vector3();
    this.up = new Vector3();
    this.facing = new Vector3();
    this.velocity = new Vector3();
    this.physics = new RustPlayerPhysics(PLAYER);
    this.physics.readInto(this);
  }

  get speed() {
    return this.velocity.length();
  }

  placeAt(position, facingTarget) {
    direction.copy(position).normalize();
    this.physics.place(position, facingTarget, this.#groundRadius(direction, position.length()));
    this.physics.readInto(this);
    this.#syncAvatar();
  }

  // The two Wasm calls bracket mesh queries: integrate tangent movement, then
  // resolve the world contacts and apply radial gravity/jumps inside Rust.
  update(deltaSeconds, input, cameraDirection) {
    this.physics.candidate(deltaSeconds, input, cameraDirection, candidate);
    const radius = candidate.length();
    this.landmarks.resolveCollisions(candidate, PLAYER.collisionRadius);
    this.#resolvePropCollisions(candidate, radius);
    candidate.setLength(radius);
    direction.copy(candidate).normalize();
    const platform = this.landmarks.platformHeight(direction, radius);
    const terrainHeight = this.terrain.heightAt(direction);
    const blockedWater = platform === -Infinity && terrainHeight < PLANET.seaLevel - PLAYER.maxWadingDepth;
    const wading = platform === -Infinity && terrainHeight < PLANET.seaLevel - 0.05;
    if (blockedWater) candidate.copy(this.position);
    direction.copy(candidate).normalize();
    const ground = this.#groundRadius(direction, candidate.length());

    this.physics.resolve(deltaSeconds, candidate, ground, { blockedWater, wading, jump: input.jump });
    this.physics.readInto(this);
    const state = this.physics.state;
    const eventFlags = state[21];
    eventPosition.fromArray(state, 24);
    if (state[23] === 1) this.avatar.land(state[20]);
    for (const [name, flag] of EVENT_ENTRIES) {
      if (eventFlags & flag) this.events.emit(name, eventPosition);
    }

    this.#syncAvatar();
    this.avatar.update(deltaSeconds, {
      speedRatio: Math.min(1, this.speed / PLAYER.runSpeed),
      airborne: !this.isGrounded,
      verticalSpeed: this.verticalSpeed,
    });
  }

  #resolvePropCollisions(position, radius) {
    const direction = offset.copy(position).normalize();
    for (const collider of this.scatter.nearbyColliders(direction)) {
      const separation = direction.clone().sub(collider.direction).multiplyScalar(radius);
      const tangential = projectOnTangentPlane(separation, collider.direction);
      const minimum = collider.radius + PLAYER.collisionRadius;
      const distance = tangential.length();
      if (distance >= minimum || distance < 1e-5) continue;
      position.addScaledVector(tangential.normalize(), minimum - distance);
      direction.copy(position).normalize();
    }
  }

  #groundRadius(direction, currentRadius) {
    const terrain = this.terrain.heightAt(direction);
    const platform = this.landmarks.platformHeight(direction, currentRadius);
    return Math.max(terrain, platform, PLANET.seaLevel - PLAYER.maxWadingDepth);
  }

  #syncAvatar() {
    this.avatar.object.position.copy(this.position);
    orientationFromUpForward(this.up, this.facing, this.avatar.object.quaternion);
  }

  dispose() {
    this.physics.dispose();
  }
}
