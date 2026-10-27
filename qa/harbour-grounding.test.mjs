import test, { mock } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Object3D, Vector3 } from 'three';
import { PLANET } from '../src/config.js';
import { PLACES, PATHS, WATER_BASINS } from '../src/content/places.js';
import { WorldLayout } from '../src/world/WorldLayout.js';
import { Terrain } from '../src/world/Terrain.js';
import { Landmarks } from '../src/world/Landmarks.js';
import { Kit } from '../src/world/Kit.js';
import { MaterialLibrary } from '../src/world/materials.js';
import { buildPort } from '../src/world/landmarks/harbour.js';
import { PlayerController } from '../src/player/PlayerController.js';
import { initRustPhysics } from '../src/core/RustPhysics.js';
import { tangentToward } from '../src/utils/math.js';

mock.method(Kit.prototype, 'sign', () => {});

function harbour() {
  const layout = new WorldLayout({ places: PLACES, paths: PATHS, basins: WATER_BASINS });
  const terrain = new Terrain(layout);
  const place = layout.place('port');
  const kit = new Kit(new MaterialLibrary(), place);
  // Text rasterisation is covered in browser captures, not this physics fixture.
  kit.sign = () => {};
  buildPort(kit, { place });
  const root = kit.bake();
  root.position.copy(place.direction).multiplyScalar(place.padHeight);
  root.quaternion.copy(place.orientation);
  root.updateMatrixWorld(true);
  const toWorld = root.matrixWorld.clone(), toLocal = toWorld.clone().invert();
  const landmarks = new Landmarks({ layout: { places: [] }, materials: kit.materials });
  landmarks.entries = [{ place, platforms: kit.platforms, colliders: kit.colliders,
    queryAngle: (place.padRadius + 8) / place.padHeight, toWorld, toLocal }];
  return { kit, terrain, landmarks, root, toWorld, toLocal };
}

test('the actual harbour can be walked from the quay to the far end without falling into water', async t => {
  await initRustPhysics({ bytes: await readFile(new URL('../public/wasm/planet_core.wasm', import.meta.url)) });
  const { terrain, landmarks, toWorld, toLocal } = harbour();
  const events = [];
  const player = new PlayerController({ terrain, landmarks, scatter: { nearbyColliders: () => [] },
    avatar: { object: new Object3D(), update() {}, land() {} }, events: { emit: name => events.push(name) } });
  t.after(() => player.dispose());
  const end = new Vector3(0, 0.16, 9.4).applyMatrix4(toWorld);
  player.placeAt(new Vector3(0, 0.085, 0).applyMatrix4(toWorld), end);
  let arrived = false;
  for (let frame = 0; frame < 240; frame++) {
    const local = player.position.clone().applyMatrix4(toLocal);
    if (local.z >= 9.2) { arrived = true; break; }
    player.update(1 / 60, { x: 0, y: 1, run: false, jump: false },
      tangentToward(player.position.clone().normalize(), end.clone().normalize()));
    assert.ok(player.isGrounded, `lost support at pier z=${local.z}`);
    assert.ok(local.y >= 0.075 && local.y <= 0.18, `wrong walking height ${local.y}`);
    assert.ok(Math.abs(local.x) < 0.1, 'no sideways collision on the centre walkway');
  }
  assert.ok(arrived);
  assert.ok(!events.includes('deepWater'));
});

test('all three boats float on the spherical sea and keep a bounded bob after baking', () => {
  const { kit, root, terrain } = harbour();
  const boats = ['fishing', 'sail', 'rowing'].map(name => {
    const boat = root.getObjectByName(`harbour-boat-${name}`);
    assert.ok(boat, `${name}: dynamic vessel survives geometry merging`);
    const resting = boat.getWorldPosition(new Vector3());
    assert.ok(Math.abs(resting.length() - PLANET.seaLevel) < 1e-8);
    assert.ok(terrain.heightAt(resting.clone().normalize()) < PLANET.seaLevel - 0.45, `${name}: clear water below hull`);
    return boat;
  });
  for (const time of [0, 1.7, 4.2, 8.5]) {
    kit.updaters.forEach(update => update(time, 1 / 60, {}));
    root.updateMatrixWorld(true);
    for (const boat of boats) {
      const position = boat.getWorldPosition(new Vector3());
      assert.ok(Math.abs(position.length() - PLANET.seaLevel) < 0.04);
    }
  }
});
