// Tuning values shared by the world, the player and the camera.
// Distances are in world units (roughly metres at the avatar's scale).

export const PLANET = {
  radius: 34,
  seaLevel: 34,
  terrainDetail: { high: 64, low: 40 },
  baseElevation: 1.25,
};

export const PLAYER = {
  walkSpeed: 6.2,
  runSpeed: 11,
  wadingSpeedFactor: 0.55,
  groundResponse: 12,
  airResponse: 3,
  turnResponse: 14,
  jumpSpeed: 8.6,
  gravity: 26,
  maxJumps: 2,
  collisionRadius: 0.45,
  maxWadingDepth: 0.6,
  groundSnapDistance: 0.45,
};

export const CAMERA = {
  fov: 55,
  distance: 8.5,
  minDistance: 4,
  maxDistance: 16,
  pitch: 0.32,
  minPitch: -0.15,
  maxPitch: 1.2,
  targetHeight: 1.45,
  orbitDistance: 108,
  minOrbitDistance: 62,
  maxOrbitDistance: 150,
  lookSensitivity: 0.0045,
  autoAlignDelay: 1.4,
  autoAlignSpeed: 1.6,
  terrainClearance: 0.7,
};

export const DAY_CYCLE = {
  secondsPerTurn: 420,
  timeLapseSeconds: 3,
  startOffsetRadians: 0.55,
};

export const INTERACTION = {
  radius: 3.4,
  collectRadius: 1.5,
};

export const QUALITY = {
  high: { pixelRatioCap: 2, shadowMapSize: 2048, bloom: true, scatterDensity: 1 },
  low: { pixelRatioCap: 1.25, shadowMapSize: 1024, bloom: false, scatterDensity: 0.6 },
};

export const STORAGE_KEY = 'planete-mounir:v1';
