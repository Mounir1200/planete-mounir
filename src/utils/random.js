// Seeded generator so the planet looks the same on every visit.
export function createRandom(seed) {
  let state = seed >>> 0;
  return function random() {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function randomBetween(random, min, max) {
  return min + random() * (max - min);
}

export function pickOne(random, items) {
  return items[Math.floor(random() * items.length)];
}
