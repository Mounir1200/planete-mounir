// 3D simplex noise (after Stefan Gustavson's public-domain reference).
const GRADIENTS = [
  [1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0],
  [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1],
  [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1],
];
const SKEW = 1 / 3;
const UNSKEW = 1 / 6;

function cornerContribution(gradientIndex, x, y, z) {
  let falloff = 0.6 - x * x - y * y - z * z;
  if (falloff < 0) return 0;
  falloff *= falloff;
  const gradient = GRADIENTS[gradientIndex];
  return falloff * falloff * (gradient[0] * x + gradient[1] * y + gradient[2] * z);
}

export function createNoise3D(random) {
  const source = Array.from({ length: 256 }, (_, index) => index);
  for (let index = 255; index > 0; index--) {
    const swap = Math.floor(random() * (index + 1));
    [source[index], source[swap]] = [source[swap], source[index]];
  }
  const perm = new Uint8Array(512);
  for (let index = 0; index < 512; index++) perm[index] = source[index & 255];

  return function noise3D(xin, yin, zin) {
    const skew = (xin + yin + zin) * SKEW;
    const i = Math.floor(xin + skew);
    const j = Math.floor(yin + skew);
    const k = Math.floor(zin + skew);
    const unskew = (i + j + k) * UNSKEW;
    const x0 = xin - (i - unskew);
    const y0 = yin - (j - unskew);
    const z0 = zin - (k - unskew);

    let i1, j1, k1, i2, j2, k2;
    if (x0 >= y0) {
      if (y0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 1; k2 = 0; }
      else if (x0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 0; k2 = 1; }
      else { i1 = 0; j1 = 0; k1 = 1; i2 = 1; j2 = 0; k2 = 1; }
    } else if (y0 < z0) { i1 = 0; j1 = 0; k1 = 1; i2 = 0; j2 = 1; k2 = 1; }
    else if (x0 < z0) { i1 = 0; j1 = 1; k1 = 0; i2 = 0; j2 = 1; k2 = 1; }
    else { i1 = 0; j1 = 1; k1 = 0; i2 = 1; j2 = 1; k2 = 0; }

    const x1 = x0 - i1 + UNSKEW, y1 = y0 - j1 + UNSKEW, z1 = z0 - k1 + UNSKEW;
    const x2 = x0 - i2 + 2 * UNSKEW, y2 = y0 - j2 + 2 * UNSKEW, z2 = z0 - k2 + 2 * UNSKEW;
    const x3 = x0 - 1 + 3 * UNSKEW, y3 = y0 - 1 + 3 * UNSKEW, z3 = z0 - 1 + 3 * UNSKEW;
    const ii = i & 255, jj = j & 255, kk = k & 255;

    return 32 * (
      cornerContribution(perm[ii + perm[jj + perm[kk]]] % 12, x0, y0, z0)
      + cornerContribution(perm[ii + i1 + perm[jj + j1 + perm[kk + k1]]] % 12, x1, y1, z1)
      + cornerContribution(perm[ii + i2 + perm[jj + j2 + perm[kk + k2]]] % 12, x2, y2, z2)
      + cornerContribution(perm[ii + 1 + perm[jj + 1 + perm[kk + 1]]] % 12, x3, y3, z3)
    );
  };
}

export function fractalNoise(noise3D, x, y, z, octaves = 4) {
  let amplitude = 1;
  let frequency = 1;
  let total = 0;
  let normaliser = 0;
  for (let octave = 0; octave < octaves; octave++) {
    total += noise3D(x * frequency, y * frequency, z * frequency) * amplitude;
    normaliser += amplitude;
    amplitude *= 0.5;
    frequency *= 2;
  }
  return total / normaliser;
}

export function ridgedNoise(noise3D, x, y, z, octaves = 3) {
  let amplitude = 1;
  let frequency = 1;
  let total = 0;
  let normaliser = 0;
  for (let octave = 0; octave < octaves; octave++) {
    const ridge = 1 - Math.abs(noise3D(x * frequency, y * frequency, z * frequency));
    total += ridge * ridge * amplitude;
    normaliser += amplitude;
    amplitude *= 0.5;
    frequency *= 2.1;
  }
  return total / normaliser;
}
