// The Rust module is mandatory: failure is surfaced to Game.start's readable
// portfolio fallback instead of silently replacing the game with JS physics.
let core = null;
let initialization = null;
const ABI_VERSION = 1;
const STATE_LENGTH = 27;

export const PHYSICS_EVENTS = Object.freeze({
  step: 1, splash: 2, jump: 4, doubleJump: 8, land: 16, deepWater: 32,
});

export async function initRustPhysics({ bytes, url } = {}) {
  if (core) return core;
  if (initialization) return initialization;
  initialization = (async () => {
    let source = bytes;
    if (!source) {
      const wasmUrl = url ?? `${import.meta.env?.BASE_URL ?? '/'}wasm/planet_core.wasm`;
      const response = await fetch(wasmUrl);
      if (!response.ok) throw new Error(`Rust physics could not load (${response.status}).`);
      source = await response.arrayBuffer();
    }
    const { instance } = await WebAssembly.instantiate(source, {});
    const exports = instance.exports;
    if (exports.core_abi_version?.() !== ABI_VERSION || exports.player_state_len?.() !== STATE_LENGTH) {
      throw new Error('Incompatible Rust physics module. Rebuild planet_core.wasm.');
    }
    core = exports;
    return core;
  })();
  try {
    return await initialization;
  } catch (error) {
    initialization = null;
    throw error;
  }
}

// One Rust-owned player state. JS only reads this buffer; mutations and event
// decisions are made by Rust. Rebuild the view if Wasm grows its linear memory.
export class RustPlayerPhysics {
  constructor(config) {
    if (!core) throw new Error('initRustPhysics() must finish before creating the player.');
    this.backend = 'rust-wasm';
    this.steps = 0;
    this.handle = core.player_create(
      config.walkSpeed, config.runSpeed, config.wadingSpeedFactor,
      config.groundResponse, config.airResponse, config.turnResponse,
      config.jumpSpeed, config.gravity, config.maxJumps, config.groundSnapDistance,
    );
    if (!this.handle) throw new Error('Rust physics could not allocate the player.');
    this.pointer = core.player_state_ptr(this.handle);
    this.view = null;
  }

  get state() {
    if (!this.handle) throw new Error('Rust player has already been disposed.');
    if (this.view?.buffer !== core.memory.buffer) {
      this.view = new Float64Array(core.memory.buffer, this.pointer, STATE_LENGTH);
    }
    return this.view;
  }

  place(position, target, ground) {
    core.player_place(this.handle, position.x, position.y, position.z,
      target?.x ?? 0, target?.y ?? 0, target?.z ?? 0, target ? 1 : 0, ground);
  }

  candidate(deltaSeconds, input, cameraDirection, target) {
    core.player_steer(this.handle, deltaSeconds, input.x, input.y, input.run ? 1 : 0,
      cameraDirection.x, cameraDirection.y, cameraDirection.z);
    this.steps += 1;
    return target.fromArray(this.state, 17);
  }

  resolve(deltaSeconds, candidate, ground, { blockedWater, wading, jump }) {
    core.player_resolve(this.handle, deltaSeconds, candidate.x, candidate.y, candidate.z,
      ground, blockedWater ? 1 : 0, wading ? 1 : 0, jump ? 1 : 0);
  }

  readInto(player) {
    const state = this.state;
    player.position.fromArray(state, 0);
    player.up.fromArray(state, 3);
    player.facing.fromArray(state, 6);
    player.velocity.fromArray(state, 9);
    player.verticalSpeed = state[12];
    player.isGrounded = state[13] === 1;
    player.jumpsUsed = state[14];
    player.isWading = state[15] === 1;
    player.distanceSinceStep = state[16];
  }

  dispose() {
    if (!this.handle) return;
    core.player_destroy(this.handle);
    this.handle = 0;
    this.view = null;
  }
}
