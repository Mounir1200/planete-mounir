import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Object3D, Vector3 } from 'three';
import { PLANET, PLAYER } from '../src/config.js';
import { PLACES, PATHS, WATER_BASINS } from '../src/content/places.js';
import { Terrain } from '../src/world/Terrain.js';
import { WorldLayout } from '../src/world/WorldLayout.js';
import { PlayerController } from '../src/player/PlayerController.js';
import { initRustPhysics } from '../src/core/RustPhysics.js';
import { angleBetween, directionFromLatLon, tangentToward } from '../src/utils/math.js';

function world() {
  const layout = new WorldLayout({ places: PLACES, paths: PATHS, basins: WATER_BASINS });
  return { layout, terrain: new Terrain(layout) };
}

function directionOnPad(place, distance, bearing = 0) {
  return place.direction.clone().multiplyScalar(place.padHeight)
    .addScaledVector(place.facing.clone().applyAxisAngle(place.direction, bearing), distance).normalize();
}

function arcDirection(path, fraction) {
  const angle = angleBetween(path.start, path.end);
  return path.start.clone().multiplyScalar(Math.sin((1 - fraction) * angle))
    .addScaledVector(path.end, Math.sin(fraction * angle)).normalize();
}

test('all landmark footprints lie on their exact tangent plane, including plaza edges', () => {
  const { layout, terrain } = world();
  for (const place of layout.places) {
    for (const fraction of [0, 0.3, 0.7, 1]) {
      for (let step = 0; step < 24; step++) {
        const direction = directionOnPad(place, place.padSupportRadius * fraction, step * Math.PI / 12);
        const worldPoint = direction.multiplyScalar(terrain.heightAt(direction));
        assert.ok(Math.abs(worldPoint.dot(place.direction) - place.padHeight) < 1e-8, `${place.id}: unsupported footprint`);
      }
    }
  }
});

test('pad shoulders meet natural ground continuously and overlapping skirts are order-independent', () => {
  const { layout, terrain } = world();
  for (const place of [...layout.places]) {
    for (const radius of [place.padSupportRadius, place.padSupportRadius + place.padBlendUnits]) {
      for (let step = 0; step < 16; step++) {
        const bearing = step * Math.PI / 8;
        const before = directionOnPad(place, radius - 0.0001, bearing);
        const after = directionOnPad(place, radius + 0.0001, bearing);
        assert.ok(Math.abs(terrain.heightAt(before) - terrain.heightAt(after)) < 0.002, `${place.id}: discontinuous shoulder`);
        const expected = terrain.heightAt(after);
        layout.places.reverse();
        assert.ok(Math.abs(terrain.heightAt(after) - expected) < 1e-9, `${place.id}: order-dependent overlap`);
        layout.places.reverse();
      }
    }
  }
});

test('every connecting path stays dry and has no ground-snap-sized discontinuities', () => {
  const { layout, terrain } = world();
  for (const path of layout.paths) {
    const steps = Math.ceil(angleBetween(path.start, path.end) * PLANET.radius / 0.1);
    let previous;
    for (let step = 0; step <= steps; step++) {
      const direction = arcDirection(path, step / steps);
      const height = terrain.heightAt(direction);
      assert.ok(terrain.pathDistance(direction) < 1e-6);
      assert.ok(height >= PLANET.seaLevel + 0.74, `${path.fromId} → ${path.toId}: submerged path`);
      if (previous !== undefined) assert.ok(Math.abs(height - previous) < PLAYER.groundSnapDistance, `${path.fromId}: abrupt path height`);
      previous = height;
    }
  }
});

test('the player walks across adjacent pad shoulders without floating or falling', async t => {
  await initRustPhysics({ bytes: await readFile(new URL('../public/wasm/planet_core.wasm', import.meta.url)) });
  const { layout, terrain } = world();
  const start = layout.place('maison');
  const end = layout.place('galerie');
  const emitted = [];
  const player = new PlayerController({
    terrain,
    landmarks: { resolveCollisions() {}, platformHeight: () => -Infinity },
    scatter: { nearbyColliders: () => [] },
    avatar: { object: new Object3D(), update() {}, land() {} },
    events: { emit: event => emitted.push(event) },
  });
  t.after(() => player.dispose());
  player.placeAt(start.direction.clone().multiplyScalar(start.padHeight));
  let arrived = false;
  for (let frame = 0; frame < 600; frame++) {
    const direction = player.position.clone().normalize();
    if (angleBetween(direction, end.direction) * PLANET.radius < 0.5) { arrived = true; break; }
    player.update(1 / 60, { x: 0, y: 1, run: false, jump: false }, tangentToward(direction, end.direction));
    assert.equal(player.isGrounded, true);
    assert.ok(Math.abs(player.position.length() - terrain.heightAt(player.position.clone().normalize())) < 1e-8);
  }
  assert.ok(arrived, 'the player should reach the next plateau');
  assert.ok(!emitted.includes('deepWater'));
});

test('the drawn terrain triangles and collision queries agree inside planar pads', () => {
  const { layout, terrain } = world();
  const mesh = terrain.createMesh(16);
  const positions = mesh.geometry.attributes.position;
  const corners = [new Vector3(), new Vector3(), new Vector3()];
  let planarFaces = 0;
  for (let vertex = 0; vertex < positions.count; vertex += 3) {
    corners.forEach((point, index) => point.fromBufferAttribute(positions, vertex + index));
    const place = layout.places.find(candidate => corners.every(point => angleBetween(point.clone().normalize(), candidate.direction) < candidate.padAngle - 0.0001));
    if (!place) continue;
    corners.forEach(point => assert.ok(Math.abs(point.dot(place.direction) - place.padHeight) < 0.00001));
    const center = corners[0].clone().add(corners[1]).add(corners[2]).multiplyScalar(1 / 3);
    assert.ok(Math.abs(center.length() - terrain.heightAt(center.clone().normalize())) < 0.00001);
    planarFaces++;
  }
  assert.ok(planarFaces > 100);
  mesh.geometry.dispose();
  mesh.material.dispose();
});

test('ocean basins and distant mountain relief survive the local grounding changes', () => {
  const { terrain } = world();
  const ocean = directionFromLatLon(-58, -40);
  assert.ok(terrain.heightAt(ocean) < PLANET.seaLevel - 3);
  let highest = -Infinity;
  for (let latitude = -80; latitude <= 80; latitude += 10) {
    for (let longitude = -180; longitude < 180; longitude += 10) {
      highest = Math.max(highest, terrain.heightAt(directionFromLatLon(latitude, longitude)));
    }
  }
  assert.ok(highest > PLANET.seaLevel + 5, 'mountain relief remains outside the settlements');
});
