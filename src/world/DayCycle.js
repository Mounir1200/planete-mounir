import { Vector3 } from 'three';
import { DAY_CYCLE } from '../config.js';
import { easeInOutCubic, smoothstep } from '../utils/math.js';

const SUN_TILT = 0.32;
const DAY_OFFSET = 0.45;
const TWO_PI = Math.PI * 2;

// The sun orbits the planet; whichever side faces it has daytime.
// A time-lapse can jump the visitor's location to day or night.
export class DayCycle {
  constructor(initialUp) {
    this.angle = this.#angleFacing(initialUp) + DAY_CYCLE.startOffsetRadians;
    this.sunDirection = new Vector3();
    this.timeLapse = null;
    this.#updateDirection();
  }

  update(deltaSeconds) {
    if (this.timeLapse) {
      this.timeLapse.elapsed += deltaSeconds;
      const progress = Math.min(1, this.timeLapse.elapsed / DAY_CYCLE.timeLapseSeconds);
      this.angle = this.timeLapse.from + (this.timeLapse.to - this.timeLapse.from) * easeInOutCubic(progress);
      if (progress >= 1) this.timeLapse = null;
    } else {
      this.angle += (TWO_PI * deltaSeconds) / DAY_CYCLE.secondsPerTurn;
    }
    this.#updateDirection();
  }

  elevation(up) {
    return up.dot(this.sunDirection);
  }

  // 0 in full daylight, 1 deep in the night, for a given local up.
  nightFactor(up) {
    return 1 - smoothstep(-0.14, 0.2, this.elevation(up));
  }

  isNight(up) {
    return this.elevation(up) < 0;
  }

  toggleAt(up) {
    const target = this.#angleFacing(up) + (this.isNight(up) ? DAY_OFFSET : Math.PI);
    let delta = (target - this.angle) % TWO_PI;
    if (delta < 0) delta += TWO_PI;
    this.timeLapse = { from: this.angle, to: this.angle + delta, elapsed: 0 };
  }

  #angleFacing(up) {
    return Math.atan2(up.x, up.z);
  }

  #updateDirection() {
    this.sunDirection.set(Math.sin(this.angle), SUN_TILT, Math.cos(this.angle)).normalize();
  }
}
