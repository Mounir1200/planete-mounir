import test from 'node:test';
import assert from 'node:assert/strict';
import { AudioEngine } from '../src/audio/AudioEngine.js';

const deferred = () => {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
};

function environment(t) {
  const listeners = new Set();
  const intervals = new Set();
  const contexts = [];
  const param = () => ({
    value: 0,
    cancelScheduledValues() {},
    setValueAtTime(value) { this.value = value; },
    setTargetAtTime(value) { this.value = value; },
  });
  const node = () => ({ gain: param(), frequency: param(), delayTime: param(), connect() { return this; } });
  class Context {
    constructor() { this.state = 'suspended'; this.currentTime = 0; this.sampleRate = 8; contexts.push(this); }
    createGain = node;
    createDynamicsCompressor = node;
    createBiquadFilter = node;
    createDelay = node;
    createBuffer() { return { getChannelData: () => new Float32Array(8) }; }
    async resume() { await this.resumeGate?.(); this.state = 'running'; }
    async suspend() { await this.suspendGate?.(); this.state = 'suspended'; }
    async close() { this.state = 'closed'; }
  }
  const document = {
    hidden: false,
    addEventListener(name, listener) { if (name === 'visibilitychange') listeners.add(listener); },
    setHidden(hidden) { this.hidden = hidden; listeners.forEach(listener => listener()); },
  };
  const replacements = {
    AudioContext: Context,
    webkitAudioContext: undefined,
    document,
    setInterval(callback) { const handle = {}; intervals.add(handle); return handle; },
    clearInterval(handle) { intervals.delete(handle); },
  };
  for (const [key, value] of Object.entries(replacements)) {
    const original = Object.getOwnPropertyDescriptor(globalThis, key);
    Object.defineProperty(globalThis, key, { value, configurable: true, writable: true });
    t.after(() => original ? Object.defineProperty(globalThis, key, original) : delete globalThis[key]);
  }
  return { document, intervals, contexts, Context };
}

test('sound starts only after an explicit enable and disable clears its scheduler', async t => {
  const env = environment(t);
  const audio = new AudioEngine();
  assert.equal(env.contexts.length, 0);
  assert.equal(audio.isEnabled, false);
  assert.equal(await audio.enable(), true);
  assert.equal(audio.isEnabled, true);
  assert.equal(env.intervals.size, 1);
  audio.disable();
  assert.equal(audio.master.gain.value, 0);
  assert.equal(env.intervals.size, 0);
  await audio.playbackUpdate;
  assert.equal(audio.context.state, 'suspended');
  assert.equal(audio.isEnabled, false);
});

test('backgrounding pauses audio while preserving the explicit sound preference', async t => {
  const env = environment(t);
  const audio = new AudioEngine();
  await audio.enable();
  env.document.setHidden(true);
  assert.equal(audio.master.gain.value, 0);
  assert.equal(env.intervals.size, 0);
  await audio.playbackUpdate;
  assert.equal(audio.context.state, 'suspended');
  assert.equal(audio.isEnabled, true);
  env.document.setHidden(false);
  await audio.playbackUpdate;
  assert.equal(audio.context.state, 'running');
  assert.equal(env.intervals.size, 1);
  env.document.setHidden(true);
  audio.disable();
  env.document.setHidden(false);
  await audio.playbackUpdate;
  assert.equal(audio.isEnabled, false);
  assert.equal(audio.context.state, 'suspended');
  assert.equal(env.intervals.size, 0);
});

test('unsupported Web Audio, constructor failures and rejected resumes return false', async t => {
  const env = environment(t);
  globalThis.AudioContext = undefined;
  const unsupported = new AudioEngine();
  assert.equal(await unsupported.enable(), false);
  assert.equal(unsupported.isEnabled, false);
  globalThis.AudioContext = class { constructor() { throw new Error('unavailable'); } };
  assert.equal(await new AudioEngine().enable(), false);
  globalThis.AudioContext = env.Context;
  const audio = new AudioEngine();
  const enabling = audio.enable();
  audio.context.resumeGate = () => Promise.reject(new Error('NotAllowedError'));
  assert.equal(await enabling, false);
  assert.equal(audio.isEnabled, false);
  assert.equal(env.intervals.size, 0);
  audio.context.resumeGate = undefined;
  assert.equal(await audio.enable(), true);
  audio.disable();
  await audio.playbackUpdate;
});

test('a pending resume cannot reactivate audio after the user disables it', async t => {
  const env = environment(t);
  const audio = new AudioEngine();
  const gate = deferred();
  const enabling = audio.enable();
  audio.context.resumeGate = () => gate.promise;
  await Promise.resolve();
  audio.disable();
  gate.resolve();
  assert.equal(await enabling, false);
  await audio.playbackUpdate;
  assert.equal(audio.isEnabled, false);
  assert.equal(audio.context.state, 'suspended');
  assert.equal(audio.master.gain.value, 0);
  assert.equal(env.intervals.size, 0);
});

test('a pending suspension cannot override a subsequent enable', async t => {
  const env = environment(t);
  const audio = new AudioEngine();
  await audio.enable();
  const gate = deferred();
  audio.context.suspendGate = () => gate.promise;
  audio.disable();
  await Promise.resolve();
  const enabling = audio.enable();
  gate.resolve();
  assert.equal(await enabling, true);
  assert.equal(audio.isEnabled, true);
  assert.equal(audio.context.state, 'running');
  assert.equal(env.intervals.size, 1);
  audio.disable();
  await audio.playbackUpdate;
});

test('a rejected stale resume does not cancel a newer enable request', async t => {
  const env = environment(t);
  const audio = new AudioEngine();
  const gate = deferred();
  const first = audio.enable();
  audio.context.resumeGate = async () => { await gate.promise; throw new Error('interrupted'); };
  await Promise.resolve();
  audio.disable();
  audio.context.resumeGate = undefined;
  const latest = audio.enable();
  gate.resolve();
  assert.equal(await first, false);
  assert.equal(await latest, true);
  assert.equal(audio.isEnabled, true);
  assert.equal(env.intervals.size, 1);
  audio.disable();
  await audio.playbackUpdate;
});
