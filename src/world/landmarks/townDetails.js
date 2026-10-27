import { PALETTE } from '../materials.js';
import { windowPane } from './common.js';

// Architectural details stay inside the existing building footprints. Their
// footings continue below the paving instead of leaving a bare wall edge.
export function footing(kit, width, depth, { x = 0, z = 0, stone = PALETTE.stone, trim = PALETTE.cream } = {}) {
  kit.box(width, 0.42, depth, stone, { x, z, y: -0.18 });
  kit.box(width, 0.08, depth, trim, { x, z, y: 0.24 });
}

export function detailedWindow(kit, x, y, z, width, height, options = {}) {
  const pane = windowPane(kit, x, y, z, width, height, options);
  kit.box(width + 0.2, 0.09, 0.14, options.frame ?? PALETTE.cream, { parent: pane, y: -0.16, z: 0.01 });
  return pane;
}

// Low planting, without fences or new collision obstacles, softens the join
// between a facade and its paving while keeping the visitor's routes open.
export function plantingStrip(kit, x, z, width, depth, { color = '#79a856', flowers = false } = {}) {
  kit.box(width, 0.06, depth, '#a5a28b', { x, z, y: 0.04 });
  kit.box(Math.max(0.1, width - 0.12), 0.025, Math.max(0.1, depth - 0.12), '#6b6349', { x, z, y: 0.1 });
  const alongX = width > depth;
  const length = Math.max(width, depth);
  const count = Math.max(2, Math.round(length / 0.55));
  for (let index = 0; index < count; index++) {
    const offset = (index / (count - 1) - 0.5) * (length - 0.4);
    const px = x + (alongX ? offset : 0);
    const pz = z + (alongX ? 0 : offset);
    kit.ico(0.21, index % 2 ? '#63964c' : color, { x: px, z: pz, y: 0.23, scale: [1, 0.68, 1], shadow: false });
    if (flowers && index % 2 === 0) kit.ico(0.065, PALETTE.peach, { x: px, z: pz, y: 0.37, shadow: false });
  }
}
