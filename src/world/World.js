import { Group, SRGBColorSpace, TextureLoader } from 'three';
import { PLACES, PATHS, WATER_BASINS } from '../content/places.js';
import { PHOTOGRAPHY } from '../content/photos.js';
import { SKILLS } from '../content/profile.js';
import { directionFromLatLon } from '../utils/math.js';
import { DayCycle } from './DayCycle.js';
import { Landmarks } from './Landmarks.js';
import { MaterialLibrary } from './materials.js';
import { Ocean } from './Ocean.js';
import { Fireflies, ParticlePool } from './Particles.js';
import { Scatter } from './Scatter.js';
import { SkillTokens } from './SkillTokens.js';
import { Sky } from './Sky.js';
import { Terrain } from './Terrain.js';
import { buildPaths } from './Paths.js';
import { WorldLayout } from './WorldLayout.js';

const GALLERY_PHOTO_INDEXES = [0, 2, 8, 1, 3];
const FIREFLY_ANCHORS = [[10, -10], [24, 12], [44, -78], [-4, 30], [30, -40], [-20, -36]];
const nextFrame = () => new Promise(resolve => requestAnimationFrame(() => resolve()));

// Assembles the planet: terrain, sea, sky, places, vegetation, skills and effects.
export class World {
  constructor({ scene, quality, collectedSkills, onProgress }) {
    this.scene = scene;
    this.quality = quality;
    this.collectedSkills = collectedSkills;
    this.onProgress = onProgress;
    this.group = new Group();
    this.materials = new MaterialLibrary();
    this.textureLoader = new TextureLoader();
  }

  // Built in steps, yielding to the browser so the loading screen stays alive.
  async build() {
    this.onProgress('terrain', 0.1);
    await nextFrame();
    this.layout = new WorldLayout({ places: PLACES, paths: PATHS, basins: WATER_BASINS });
    this.terrain = new Terrain(this.layout);
    const detail = this.quality.bloom ? 64 : 40;
    this.group.add(this.terrain.createMesh(detail));
    this.group.add(buildPaths(this.terrain, this.layout));
    this.ocean = new Ocean(this.quality.bloom ? 48 : 32);
    this.group.add(this.ocean.mesh);

    this.onProgress('places', 0.45);
    await nextFrame();
    this.landmarks = new Landmarks({
      layout: this.layout,
      materials: this.materials,
      loadTexture: url => this.#loadTexture(url),
      galleryPhotos: GALLERY_PHOTO_INDEXES.map(index => PHOTOGRAPHY[index]),
    });
    this.group.add(this.landmarks.group);

    this.onProgress('nature', 0.7);
    await nextFrame();
    this.scatter = new Scatter({ terrain: this.terrain, layout: this.layout, materials: this.materials, density: this.quality.scatterDensity });
    this.group.add(this.scatter.group);
    this.skillTokens = new SkillTokens({ terrain: this.terrain, skills: SKILLS, collectedIds: this.collectedSkills });
    this.group.add(this.skillTokens.group);

    this.sky = new Sky(this.scene, this.quality.shadowMapSize);
    this.group.add(this.sky.group);
    this.sparkles = new ParticlePool({ capacity: 700, additive: true, boost: 1.8 });
    this.dust = new ParticlePool({ capacity: 260 });
    this.fireflies = new Fireflies({ terrain: this.terrain, anchors: FIREFLY_ANCHORS.map(latLon => directionFromLatLon(...latLon)) });
    this.group.add(this.sparkles.points, this.dust.points, this.fireflies.object);

    this.dayCycle = new DayCycle(this.layout.place('maison').direction);
    this.scene.add(this.group);
    this.onProgress('ready', 1);
    await nextFrame();
  }

  setViewportHeight(height) {
    this.sparkles.setViewportHeight(height);
    this.dust.setViewportHeight(height);
    this.fireflies.pool.setViewportHeight(height);
  }

  update({ time, deltaSeconds, camera, up, focus, spaceFactor }) {
    this.dayCycle.update(deltaSeconds);
    this.sky.update({ camera, up, focus, sunDirection: this.dayCycle.sunDirection, spaceFactor, deltaSeconds });
    const nightFactor = this.sky.nightFactor * (1 - spaceFactor);
    this.materials.updateNight(Math.max(nightFactor, spaceFactor * 0.6));
    this.ocean.update(time);
    this.landmarks.update(time, deltaSeconds, { nightFactor, spaceFactor });
    this.sparkles.update(deltaSeconds);
    this.dust.update(deltaSeconds);
    this.fireflies.update(time, nightFactor);
    return nightFactor;
  }

  #loadTexture(url) {
    const texture = this.textureLoader.load(url);
    texture.colorSpace = SRGBColorSpace;
    texture.anisotropy = 4;
    return texture;
  }
}
