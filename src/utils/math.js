import { Matrix4, Quaternion, Vector3 } from 'three';

const DEGREES = Math.PI / 180;
const WORLD_UP = new Vector3(0, 1, 0);
const WORLD_FORWARD = new Vector3(0, 0, 1);
const basisMatrix = new Matrix4();
const scratchRight = new Vector3();
const scratchForward = new Vector3();

export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
export const lerp = (from, to, amount) => from + (to - from) * amount;
export const smoothstep = (edge0, edge1, value) => {
  const t = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
};
export const easeInOutCubic = t => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
export const easeOutBack = t => 1 + 2.4 * (t - 1) ** 3 + 1.4 * (t - 1) ** 2;
// Frame-rate independent smoothing factor for exponential damping.
export const damp = (response, deltaSeconds) => 1 - Math.exp(-response * deltaSeconds);

// Latitude 90 is the +Y pole, longitude 0 faces +Z.
export function directionFromLatLon(latitude, longitude, target = new Vector3()) {
  const phi = latitude * DEGREES;
  const theta = longitude * DEGREES;
  return target.set(Math.cos(phi) * Math.sin(theta), Math.sin(phi), Math.cos(phi) * Math.cos(theta));
}

export function angleBetween(a, b) {
  return Math.acos(clamp(a.dot(b), -1, 1));
}

export function projectOnTangentPlane(vector, up, target = new Vector3()) {
  return target.copy(vector).addScaledVector(up, -vector.dot(up));
}

// Unit tangent at `from` pointing along the great circle toward `to`.
export function tangentToward(from, to, target = new Vector3()) {
  projectOnTangentPlane(to, from, target);
  if (target.lengthSq() < 1e-8) return anyTangent(from, target);
  return target.normalize();
}

export function anyTangent(up, target = new Vector3()) {
  const reference = Math.abs(up.y) < 0.95 ? WORLD_UP : WORLD_FORWARD;
  return projectOnTangentPlane(reference, up, target).normalize();
}

// Orientation whose +Y is `up` and +Z looks along `forward`.
export function orientationFromUpForward(up, forward, target = new Quaternion()) {
  scratchRight.crossVectors(up, forward);
  if (scratchRight.lengthSq() < 1e-8) scratchRight.crossVectors(up, anyTangent(up, scratchForward));
  scratchRight.normalize();
  scratchForward.crossVectors(scratchRight, up).normalize();
  basisMatrix.makeBasis(scratchRight, up, scratchForward);
  return target.setFromRotationMatrix(basisMatrix);
}

// Rotates a tangent vector toward another by at most `maxAngle`, around `up`.
export function rotateTangentToward(current, desired, up, maxAngle) {
  const angle = angleBetween(current, desired);
  if (angle < 1e-4) return current.copy(desired);
  const sign = Math.sign(scratchRight.crossVectors(current, desired).dot(up)) || 1;
  return current.applyAxisAngle(up, sign * Math.min(angle, maxAngle)).normalize();
}

export function formatDistance(units) {
  return `${Math.max(1, Math.round(units))} m`;
}
