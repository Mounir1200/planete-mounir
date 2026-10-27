import {
  CylinderGeometry, DoubleSide, Group, Mesh, MeshStandardMaterial, RingGeometry, Sprite, SpriteMaterial, Vector3,
} from 'three';
import { INTERACTION } from '../config.js';
import { anyTangent, directionFromLatLon, orientationFromUpForward } from '../utils/math.js';
import { createTextTexture } from './Kit.js';

// Where each of the eight skills hides. `lift` above 2 needs a double jump.
const SPOTS = {
  python: { latLon: [20, -14], lift: 1.3 },
  fastapi: { latLon: [48, 40], lift: 1.3 },
  react: { latLon: [-12, -33], lift: 1.3 },
  rag: { latLon: [62, -92], lift: 1.3 },
  mcp: { latLon: [14, 160], lift: 3 },
  azure: { latLon: [78, 110], lift: 1.3 },
  aws: { latLon: [-18, -50], lift: 3 },
  'big-data': { latLon: [-46, 108], lift: 1.3 },
};

const PLAYER_CHEST_HEIGHT = 0.9;

// Floating coins carrying Mounir's stack; walking (or jumping) through one collects it.
export class SkillTokens {
  constructor({ terrain, skills, collectedIds }) {
    this.group = new Group();
    this.tokens = skills.map(skill => this.#createToken(skill, terrain, collectedIds.has(skill.id)));
  }

  get remaining() {
    return this.tokens.filter(token => !token.collected);
  }

  update(time, playerPosition) {
    const collected = [];
    for (const token of this.tokens) {
      if (token.collected) continue;
      token.coin.rotation.y = time * 2.2 + token.phase;
      token.floater.position.y = Math.sin(time * 2 + token.phase) * 0.15;
      if (playerPosition && token.position.distanceTo(playerPosition) < INTERACTION.collectRadius) {
        token.collected = true;
        token.object.visible = false;
        collected.push(token);
      }
    }
    return collected;
  }

  #createToken(skill, terrain, isCollected) {
    const spot = SPOTS[skill.id];
    const direction = directionFromLatLon(...spot.latLon);
    const ground = terrain.heightAt(direction);
    const object = new Group();
    object.position.copy(direction).multiplyScalar(ground);
    orientationFromUpForward(direction, anyTangent(direction), object.quaternion);

    const floater = new Group();
    floater.position.y = 0;
    const lift = new Group();
    lift.position.y = spot.lift;
    lift.add(floater);

    const faceMaterial = new MeshStandardMaterial({ color: '#ffb47e', emissive: '#ff9a5c', emissiveIntensity: 1.1, metalness: 0.4, roughness: 0.3, flatShading: true });
    const rimMaterial = new MeshStandardMaterial({ color: '#2448c9', emissive: '#2448c9', emissiveIntensity: 0.8, metalness: 0.5, roughness: 0.3, flatShading: true });
    const coin = new Group();
    const body = new Mesh(new CylinderGeometry(0.42, 0.42, 0.1, 6), faceMaterial);
    body.rotation.x = Math.PI / 2;
    const rim = new Mesh(new CylinderGeometry(0.48, 0.48, 0.08, 6), rimMaterial);
    rim.rotation.x = Math.PI / 2;
    coin.add(body, rim);
    coin.traverse(child => { child.castShadow = true; });

    const label = new Sprite(new SpriteMaterial({
      map: createTextTexture(skill.name, { width: 2.2, height: 0.5, background: 'rgba(21, 27, 54, 0.82)', color: '#fff3e2' }),
      depthWrite: false,
    }));
    label.scale.set(1.5, 0.34, 1);
    label.position.y = 0.85;
    floater.add(coin, label);

    const halo = new Mesh(new RingGeometry(0.5, 0.75, 24), new MeshStandardMaterial({
      color: '#ffb47e', emissive: '#ffb47e', emissiveIntensity: 1.4, transparent: true, opacity: 0.5, side: DoubleSide, depthWrite: false,
    }));
    halo.rotation.x = -Math.PI / 2;
    halo.position.y = 0.05;
    object.add(lift, halo);
    object.visible = !isCollected;
    this.group.add(object);

    object.updateMatrixWorld(true);
    return {
      skill,
      object,
      coin,
      floater,
      collected: isCollected,
      phase: Math.random() * Math.PI * 2,
      direction,
      position: direction.clone().multiplyScalar(ground + spot.lift - PLAYER_CHEST_HEIGHT),
      worldPosition: new Vector3().copy(direction).multiplyScalar(ground + spot.lift),
    };
  }
}
