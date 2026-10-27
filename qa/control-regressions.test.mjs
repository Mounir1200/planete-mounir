import assert from 'node:assert/strict';
import test from 'node:test';
import { PerspectiveCamera, Vector3 } from 'three';
import { CameraRig } from '../src/camera/CameraRig.js';
import { Input } from '../src/core/Input.js';

function cameraFixture(options) {
  const camera = new PerspectiveCamera(55, 1, 0.1, 500);
  const rig = new CameraRig(camera, { heightAt: () => 35.25 }, options);
  const player = {
    position: new Vector3(0, 35.25, 0), up: new Vector3(0, 1, 0),
    facing: new Vector3(0, 0, 1), speed: 0,
  };
  return { camera, rig, player };
}

test('idle pointer frames preserve the introductory orbital movement', () => {
  const { rig, player } = cameraFixture();
  const initial = rig.orbitRotation.clone();
  rig.look(0, 0);
  rig.update(0.5, player);
  assert.equal(rig.autoRotate, true);
  assert.ok(initial.angleTo(rig.orbitRotation) > 0.01);
  rig.look(10, 0);
  assert.equal(rig.autoRotate, false);
});

test('the follow camera realigns while walking without mouse input', () => {
  const { rig, player } = cameraFixture();
  rig.mode = 'follow';
  rig.heading.set(1, 0, 0);
  player.speed = 6;
  for (let frame = 0; frame < 180; frame += 1) {
    rig.look(0, 0);
    rig.update(1 / 60, player);
  }
  assert.ok(rig.heading.angleTo(player.facing) < 0.01);
});

test('travelling across the planet does not snap the follow camera back into the terrain', () => {
  const { rig, camera, player } = cameraFixture();
  rig.mode = 'follow';
  rig.update(1 / 60, player);
  for (const destination of [new Vector3(1, 0, 0), new Vector3(-1, 0, 0)]) {
    player.up.copy(destination);
    player.position.copy(destination).multiplyScalar(35.25);
    rig.heading.copy(player.facing);
    rig.flyTo(() => rig.followPose(player), { duration: 1, onDone: () => { rig.mode = 'follow'; } });
    rig.update(1, player);
    const arrival = camera.position.clone();
    rig.update(1 / 60, player);
    assert.ok(arrival.distanceTo(camera.position) < 1e-8, 'arrival pose stays continuous');
    assert.ok(camera.position.length() >= 35.95, 'camera stays above terrain');
    assert.ok(camera.up.distanceTo(player.up) < 1e-8, 'local gravity matches the new continent');
  }
});

test('reduced motion completes travel immediately and suppresses automatic orbiting', () => {
  const { rig, camera, player } = cameraFixture({ reducedMotion: true });
  const expected = rig.followPose(player);
  let completed = 0;
  rig.flyTo(() => expected, { onDone: () => { completed += 1; } });
  assert.equal(completed, 1);
  assert.equal(rig.isFlying, false);
  assert.ok(camera.position.distanceTo(expected.position) < 1e-8);
  const initial = rig.orbitRotation.clone();
  rig.autoRotate = true;
  rig.update(1, player);
  assert.ok(initial.angleTo(rig.orbitRotation) < 1e-8);
});

function inputFixture() {
  class Surface {
    constructor() { this.listeners = new Map(); }
    addEventListener(type, listener) {
      const listeners = this.listeners.get(type) ?? [];
      listeners.push(listener);
      this.listeners.set(type, listeners);
    }
    fire(type, event) { this.listeners.get(type)?.forEach(listener => listener(event)); }
  }
  globalThis.HTMLInputElement = class {};
  globalThis.HTMLTextAreaElement = class {};
  globalThis.window = new Surface();
  const canvas = new Surface();
  const actions = [];
  const input = new Input(canvas, { emit: (type, value) => actions.push({ type, value }) });
  const key = (code, target = {}, extras = {}) => {
    const event = { code, target, repeat: false, defaultPrevented: false, preventDefault() { this.defaultPrevented = true; }, ...extras };
    window.fire('keydown', event);
    return event;
  };
  return { input, actions, key };
}

test('Enter and Space keep their native button, link and disclosure behavior', () => {
  const { actions, key } = inputFixture();
  for (const tagName of ['BUTTON', 'A', 'SUMMARY']) {
    const control = { tagName, closest: () => control };
    assert.equal(key('Enter', control).defaultPrevented, false);
    assert.equal(key('Space', control).defaultPrevented, false);
  }
  assert.deepEqual(actions, []);
  assert.equal(key('Enter').defaultPrevented, true);
  assert.deepEqual(actions, [{ type: 'action', value: 'interact' }]);
});

test('opening a modal clears held movement and queued jumps; browser shortcuts remain native', () => {
  const { input, actions, key } = inputFixture();
  key('KeyW');
  key('Space');
  input.setTouchMove(1, 0);
  input.enabled = false;
  input.enabled = true;
  assert.deepEqual(input.movement(), { x: 0, y: 0, run: false });
  assert.equal(input.consumeJump(), false);
  assert.equal(key('KeyJ', {}, { ctrlKey: true }).defaultPrevented, false);
  assert.deepEqual(actions, []);
});

test('Escape can close a dialog while its form control has focus', () => {
  const { actions, key } = inputFixture();
  const select = { tagName: 'SELECT' };
  assert.equal(key('KeyM', select).defaultPrevented, false);
  assert.deepEqual(actions, []);
  key('Escape', select);
  assert.deepEqual(actions, [{ type: 'action', value: 'back' }]);
});
