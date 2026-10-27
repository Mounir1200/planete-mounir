import test from 'node:test';
import assert from 'node:assert/strict';
import { Raycaster, Vector3 } from 'three';
import { PLACES, PATHS, WATER_BASINS } from '../src/content/places.js';
import { WorldLayout } from '../src/world/WorldLayout.js';
import { Terrain } from '../src/world/Terrain.js';
import { Landmarks } from '../src/world/Landmarks.js';
import { Kit } from '../src/world/Kit.js';
import { MaterialLibrary } from '../src/world/materials.js';
import { plaza } from '../src/world/landmarks/common.js';

function fixture(id, build) {
  const layout = new WorldLayout({ places: PLACES, paths: PATHS, basins: WATER_BASINS });
  new Terrain(layout);
  const place = layout.place(id);
  const kit = new Kit(new MaterialLibrary(), place);
  build(kit);
  const root = kit.bake();
  root.position.copy(place.direction).multiplyScalar(place.padHeight);
  root.quaternion.copy(place.orientation);
  root.updateMatrixWorld(true);
  const landmarks = new Landmarks({ layout: { places: [] }, materials: kit.materials });
  landmarks.entries = [{
    place,
    platforms: kit.platforms,
    queryAngle: (place.padRadius + 8) / place.padHeight,
    toLocal: root.matrixWorld.clone().invert(),
  }];
  const directionAt = (x, y, z) => new Vector3(x, y, z).applyMatrix4(root.matrixWorld).normalize();
  return { place, kit, root, landmarks, directionAt };
}

function drawnRadius(root, direction) {
  const ray = new Raycaster(direction.clone().multiplyScalar(100), direction.clone().negate());
  const hit = ray.intersectObject(root, true)[0];
  assert.ok(hit, 'the radial ray must hit the drawn platform');
  return hit.point.length();
}

test('dock collisions meet the actual drawn top from entrance to the far edge', () => {
  const { place, root, landmarks, directionAt } = fixture('port', kit => {
    kit.box(2.4, 0.16, 12.5, '#9a6a43', { y: 0.32, z: 6.85 });
    kit.platform(0, 6.85, 2.4, 12.5, 0.48);
  });
  for (const z of [0.61, 4, 8, 13.09]) {
    for (const x of [-1.19, 0, 1.19]) {
      const direction = directionAt(x, 0.48, z);
      const rendered = drawnRadius(root, direction);
      for (const playerRadius of [place.padHeight - 2, rendered, rendered + 8]) {
        assert.ok(Math.abs(landmarks.platformHeight(direction, playerRadius) - rendered) < 1e-6,
          `dock top mismatch at (${x}, ${z}), player radius ${playerRadius}`);
      }
    }
  }
});

test('dock footprint queries use the plane intersection rather than the current player radius', () => {
  const { place, landmarks, directionAt } = fixture('port', kit => {
    kit.platform(0, 6.85, 2.4, 12.5, 0.48);
  });
  for (const [x, z] of [[1.21, 8], [-1.21, 8], [0, 0.59], [0, 13.11]]) {
    assert.equal(landmarks.platformHeight(directionAt(x, 0.48, z), place.padHeight - 10), -Infinity);
  }
});

test('circular plazas collide at their drawn tangent height at different latitudes', () => {
  for (const id of ['maison', 'hindsight', 'urdwell', 'moov']) {
    const radius = 5.8;
    const { place, root, landmarks, directionAt } = fixture(id, kit => plaza(kit, radius, '#dfe6ee'));
    for (let bearing = 0; bearing < Math.PI * 2; bearing += Math.PI / 6) {
      const direction = directionAt(Math.cos(bearing) * radius * 0.96, 0.035, Math.sin(bearing) * radius * 0.96);
      const collision = landmarks.platformHeight(direction, place.padHeight);
      const rendered = drawnRadius(root, direction);
      // Paving joints and curbs are at most 6 mm above the nominal walking surface.
      assert.ok(Math.abs(collision - rendered) < 0.01, `${id}: unsupported paving`);
    }
    assert.equal(landmarks.platformHeight(directionAt(radius * 0.8, 0.035, radius * 0.8), place.padHeight), -Infinity);
    assert.equal(landmarks.platformHeight(directionAt(radius + 0.01, 0.035, 0), place.padHeight), -Infinity);
  }
});

test('overlapping surfaces return the highest actual tangent-plane intersection', () => {
  const { root, landmarks, directionAt } = fixture('maison', kit => {
    kit.cylinder(6, 6, 0.1, '#dfe6ee', { y: -0.065 });
    kit.platformCircle(6, 0.035);
    kit.box(3, 0.2, 3, '#9a6a43', { x: 2, z: 2, y: 1.3 });
    kit.platform(2, 2, 3, 3, 1.5);
  });
  const direction = directionAt(2, 1.5, 2);
  assert.ok(Math.abs(landmarks.platformHeight(direction, 34) - drawnRadius(root, direction)) < 1e-6);
});

test('baking plaza paving preserves all geometry and separates its shadow settings', t => {
  const kit = new Kit(new MaterialLibrary(), { id: 'maison' });
  plaza(kit, 6.8, '#e9dcc4');
  kit.box(2, 3, 2, '#e9dcc4', { z: -2, shadow: true });
  const errors = [];
  t.mock.method(console, 'error', (...parts) => errors.push(parts.join(' ')));
  let beforeVertices = 0;
  kit.root.traverse(object => {
    if (object.isMesh) beforeVertices += object.geometry.index?.count ?? object.geometry.attributes.position.count;
  });
  kit.bake();
  let afterVertices = 0;
  const groundMeshes = [];
  const shadowMeshes = [];
  kit.root.traverse(object => {
    if (!object.isMesh) return;
    assert.ok(object.geometry.attributes.position);
    assert.ok(object.geometry.attributes.normal);
    afterVertices += object.geometry.attributes.position.count;
    (object.castShadow ? shadowMeshes : groundMeshes).push(object);
  });
  assert.deepEqual(errors, []);
  assert.equal(afterVertices, beforeVertices);
  assert.equal(groundMeshes.length, 5, 'surface, joints and three curb shades share five draws');
  assert.equal(shadowMeshes.length, 1, 'the building retains its separate shadow-casting draw');
  assert.ok(groundMeshes.every(mesh => mesh.receiveShadow));
});
