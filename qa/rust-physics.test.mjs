import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { Object3D, Vector3 } from 'three';
import { PLAYER } from '../src/config.js';
import { initRustPhysics, RustPlayerPhysics } from '../src/core/RustPhysics.js';
import { PlayerController } from '../src/player/PlayerController.js';

const bytes = await readFile(new URL('../public/wasm/planet_core.wasm', import.meta.url));
const wasm = await initRustPhysics({ bytes });

function fixture(overrides = {}) {
  const events = [];
  const impacts = [];
  const player = new PlayerController({
    terrain: { heightAt: () => 35 },
    landmarks: { platformHeight: () => -Infinity, resolveCollisions: value => value },
    scatter: { nearbyColliders: () => [] },
    avatar: { object: new Object3D(), update: () => {}, land: impact => impacts.push(impact) },
    events: { emit: (name, position) => events.push({ name, position: position.clone() }) },
    ...overrides,
  });
  player.placeAt(new Vector3(0, 35, 0), new Vector3(0, 35, 1));
  return { player, events, impacts };
}

function frame(player, input = {}) {
  player.update(1 / 60, { x: 0, y: 0, run: false, jump: false, ...input }, player.facing);
}

test('the shipped Wasm module exposes its real simulation ABI without host imports', () => {
  const module = new WebAssembly.Module(bytes);
  assert.deepEqual(WebAssembly.Module.imports(module), []);
  assert.equal(wasm.core_abi_version(), 1);
  assert.equal(wasm.player_state_len(), 27);
  assert.ok(wasm.memory instanceof WebAssembly.Memory);
});

test('PlayerController walks using Rust-owned state on every frame and emits footsteps', () => {
  const { player, events } = fixture();
  try {
    const origin = player.position.clone();
    for (let index = 0; index < 240; index += 1) frame(player, { y: 1 });
    assert.equal(player.physics.backend, 'rust-wasm');
    assert.equal(player.physics.steps, 240);
    assert.ok(player.position.distanceTo(origin) > 20);
    assert.ok(Math.abs(player.position.length() - 35) < 1e-9);
    assert.ok(Math.abs(player.speed - PLAYER.walkSpeed) < 0.02);
    assert.deepEqual(player.position.toArray(), Array.from(player.physics.state.slice(0, 3)));
    assert.ok(events.some(event => event.name === 'step'));
  } finally { player.dispose(); }
});

test('the Wasm bridge preserves double-jump, third-jump rejection and landing events', () => {
  const { player, events, impacts } = fixture();
  try {
    frame(player, { jump: true });
    assert.ok(!player.isGrounded && player.verticalSpeed > 0);
    frame(player, { jump: true });
    const secondJumpSpeed = player.verticalSpeed;
    frame(player, { jump: true });
    assert.ok(player.verticalSpeed < secondJumpSpeed);
    for (let index = 0; index < 180; index += 1) frame(player);
    assert.equal(events.filter(event => event.name === 'jump').length, 1);
    assert.equal(events.filter(event => event.name === 'doubleJump').length, 1);
    assert.ok(events.some(event => event.name === 'land'));
    assert.equal(impacts.length, 1);
    assert.equal(player.isGrounded, true);
    assert.equal(player.jumpsUsed, 0);
    assert.equal(player.verticalSpeed, 0);
  } finally { player.dispose(); }
});

test('Rust resolves the candidate returned by the Three.js collision queries', () => {
  let collisionQueries = 0;
  const { player } = fixture({ landmarks: {
    platformHeight: () => -Infinity,
    resolveCollisions: candidate => { collisionQueries += 1; candidate.set(0, candidate.length(), 0); },
  } });
  try {
    for (let index = 0; index < 60; index += 1) frame(player, { y: 1, run: true });
    assert.equal(collisionQueries, 60);
    assert.ok(player.position.distanceTo(new Vector3(0, 35, 0)) < 1e-9);
    assert.ok(player.speed > 10);
  } finally { player.dispose(); }
});

test('shore queries stop the Rust player and preserve deep-water feedback', () => {
  const { player, events } = fixture({ terrain: { heightAt: direction => direction.z > 0.001 ? 33 : 35 } });
  try {
    for (let index = 0; index < 120; index += 1) frame(player, { y: 1, run: true });
    assert.ok(events.some(event => event.name === 'deepWater'));
    assert.ok(player.up.z <= 0.001);
    assert.ok(player.position.length() >= 35 - 1e-9);
  } finally { player.dispose(); }
});

test('the bridge refreshes state views when Wasm linear memory grows', () => {
  const physics = new RustPlayerPhysics(PLAYER);
  try {
    const expected = Array.from(physics.state);
    const oldBuffer = physics.state.buffer;
    wasm.memory.grow(1);
    assert.notEqual(physics.state.buffer, oldBuffer);
    assert.deepEqual(Array.from(physics.state), expected);
  } finally { physics.dispose(); }
  assert.throws(() => physics.state, /disposed/);
});

test('missing or invalid Wasm fails explicitly, with no JS simulation fallback', async () => {
  const fresh = await import('../src/core/RustPhysics.js?failure-test');
  assert.throws(() => new fresh.RustPlayerPhysics(PLAYER), /initRustPhysics/);
  await assert.rejects(fresh.initRustPhysics({ bytes: new Uint8Array([0, 1, 2]) }));
  assert.throws(() => new fresh.RustPlayerPhysics(PLAYER), /initRustPhysics/);
});
