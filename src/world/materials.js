import { Color, DoubleSide, FrontSide, MeshStandardMaterial } from 'three';
import { lerp } from '../utils/math.js';

export const PALETTE = {
  cobalt: '#2448c9',
  cobaltDeep: '#162d86',
  peach: '#ffb47e',
  peachDeep: '#f08a5a',
  cream: '#fff3e2',
  tuffeau: '#efe5d1',
  slate: '#3b4660',
  wood: '#9a6a43',
  woodDark: '#6b4a30',
  brass: '#d8a95b',
  stone: '#cfc7ba',
  rock: '#8f8b86',
  white: '#f7f5f0',
  ink: '#151b36',
  brick: '#b4553e',
  banco: '#c98a52',
  snow: '#f3f7fc',
  steel: '#9aa3b5',
  window: '#ffcf8f',
};

// Caches materials so identical colours share one GPU program and one draw call
// once static meshes are merged. "Glow" materials brighten as night falls.
export class MaterialLibrary {
  #cache = new Map();
  #glowing = [];

  solid(color, { roughness = 0.82, metalness = 0, doubleSided = false } = {}) {
    return this.#cached(`solid:${color}:${roughness}:${metalness}:${doubleSided}`, () => new MeshStandardMaterial({
      color, roughness, metalness, flatShading: true, side: doubleSided ? DoubleSide : FrontSide,
    }));
  }

  metal(color) {
    return this.solid(color, { roughness: 0.35, metalness: 0.65 });
  }

  glass(color, opacity = 0.35) {
    return this.#cached(`glass:${color}:${opacity}`, () => new MeshStandardMaterial({
      color, roughness: 0.1, metalness: 0.2, transparent: true, opacity, depthWrite: false, flatShading: true,
    }));
  }

  glow(color, { day = 0.35, night = 2.4, base, opacity } = {}) {
    return this.#cached(`glow:${color}:${day}:${night}:${base}:${opacity}`, () => {
      const material = new MeshStandardMaterial({
        color: base ?? color,
        emissive: new Color(color),
        emissiveIntensity: day,
        roughness: 0.5,
        flatShading: true,
        transparent: opacity !== undefined,
        opacity: opacity ?? 1,
        depthWrite: opacity === undefined,
      });
      this.#glowing.push({ material, day, night });
      return material;
    });
  }

  // Always-bright emissive, independent of the time of day.
  neon(color, intensity = 2) {
    return this.glow(color, { day: intensity, night: intensity * 1.2 });
  }

  // Registers an externally created emissive material for the night fade.
  trackGlow(material, day, night) {
    this.#glowing.push({ material, day, night });
  }

  updateNight(nightFactor) {
    for (const entry of this.#glowing) {
      entry.material.emissiveIntensity = lerp(entry.day, entry.night, nightFactor);
    }
  }

  #cached(key, create) {
    if (!this.#cache.has(key)) this.#cache.set(key, create());
    return this.#cache.get(key);
  }
}
