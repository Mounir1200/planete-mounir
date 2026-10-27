import {
  BoxGeometry, CylinderGeometry, Group, Mesh, MeshStandardMaterial, PointLight, SphereGeometry, TorusGeometry, Vector3,
} from 'three';
import { damp, orientationFromUpForward, projectOnTangentPlane } from '../utils/math.js';

const FOLLOW_OFFSET = { side: 0.95, back: 0.6, height: 2.05 };
const target = new Vector3();
const right = new Vector3();
const lookDirection = new Vector3();

// Pixel, Mounir's AI guide: a small drone that follows the visitor, lights the
// way at night and points toward the next beacon.
export class Companion {
  constructor() {
    this.object = new Group();
    this.model = new Group();
    this.object.add(this.model);
    this.position = new Vector3();
    this.lookTarget = null;
    this.isInitialised = false;

    const shell = new MeshStandardMaterial({ color: '#fff3e2', roughness: 0.35, metalness: 0.1, flatShading: true });
    const cobalt = new MeshStandardMaterial({ color: '#2448c9', roughness: 0.4, metalness: 0.3, flatShading: true });
    const visor = new MeshStandardMaterial({ color: '#0d1233', roughness: 0.2 });
    this.eyeMaterial = new MeshStandardMaterial({ color: '#ffb47e', emissive: '#ffb47e', emissiveIntensity: 2.4 });

    const body = new Mesh(new SphereGeometry(0.24, 16, 12), shell);
    const band = new Mesh(new TorusGeometry(0.245, 0.035, 6, 24), cobalt);
    band.rotation.x = Math.PI / 2;
    const face = new Mesh(new BoxGeometry(0.3, 0.15, 0.08), visor);
    face.position.set(0, 0.03, 0.2);
    this.eyes = [-0.065, 0.065].map(x => {
      const eye = new Mesh(new BoxGeometry(0.05, 0.06, 0.02), this.eyeMaterial);
      eye.position.set(x, 0.035, 0.245);
      return eye;
    });
    const antenna = new Mesh(new CylinderGeometry(0.012, 0.012, 0.16, 5), cobalt);
    antenna.position.y = 0.3;
    const tip = new Mesh(new SphereGeometry(0.04, 8, 6), this.eyeMaterial);
    tip.position.y = 0.39;
    this.rotor = new Mesh(new TorusGeometry(0.2, 0.015, 4, 20), cobalt);
    this.rotor.rotation.x = Math.PI / 2;
    this.rotor.position.y = -0.2;
    this.model.add(body, band, face, ...this.eyes, antenna, tip, this.rotor);
    this.model.traverse(child => { child.castShadow = true; });

    this.light = new PointLight('#ffd7b0', 0, 9, 1.6);
    this.light.position.y = 0.1;
    this.object.add(this.light);
    this.blinkTimer = 3;
  }

  // Orients Pixel's gaze toward a world point (e.g. the next beacon), or the player when null.
  lookAt(point) {
    this.lookTarget = point;
  }

  update(deltaSeconds, time, player, nightFactor) {
    right.crossVectors(player.facing, player.up).normalize();
    target.copy(player.position)
      .addScaledVector(player.up, FOLLOW_OFFSET.height + Math.sin(time * 2.1) * 0.12)
      .addScaledVector(right, FOLLOW_OFFSET.side)
      .addScaledVector(player.facing, -FOLLOW_OFFSET.back);
    if (!this.isInitialised) {
      this.position.copy(target);
      this.isInitialised = true;
    }
    this.position.lerp(target, damp(4.5, deltaSeconds));
    this.object.position.copy(this.position);

    const focus = this.lookTarget ?? player.position.clone().addScaledVector(player.facing, 4);
    projectOnTangentPlane(lookDirection.copy(focus).sub(this.position), player.up);
    if (lookDirection.lengthSq() < 1e-4) lookDirection.copy(player.facing);
    orientationFromUpForward(player.up, lookDirection.normalize(), this.object.quaternion);
    this.model.rotation.z = Math.sin(time * 1.7) * 0.08;
    this.model.rotation.x = Math.min(0.35, player.speed * 0.03);
    this.rotor.rotation.z += deltaSeconds * 18;

    this.light.intensity = nightFactor * 14;
    this.blinkTimer -= deltaSeconds;
    const blinking = this.blinkTimer < 0.1;
    this.eyes.forEach(eye => { eye.scale.y = blinking ? 0.2 : 1; });
    if (this.blinkTimer <= 0) this.blinkTimer = 2 + Math.random() * 4;
  }
}
