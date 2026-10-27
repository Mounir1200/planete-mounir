import { BRANDS } from '../../content/brands.js';
import { brandPlaque } from './brandPlaque.js';
import { bench, plaza, roundTree } from './common.js';
import { plantingStrip } from './townDetails.js';

// Angers / Saint-Barthélemy-d'Anjou, modern teaching building.
// The white stepped blocks, recessed dark windows, glazed connector and Y-shaped
// porch support come from ESAIP's own campus photographs (see qa notes).
// Distances are compressed to fit the globe; the facade is not a survey model.
export function buildEsaip(kit, { loadTexture } = {}) {
  const brand = BRANDS.esaip;
  const white = '#eeeae1';
  const reveal = '#d4d4cc';
  const frame = '#424c52';
  const sill = '#6f787b';
  const glass = '#344d56';
  const reflection = '#63838b';
  plaza(kit, 6.35, '#c7c3b6');

  // A thin plinth meets the ground and carries the actual footprint, not a disc.
  kit.box(7.02, 0.23, 3.72, '#a6a7a0', { x: -0.45, z: -0.75, y: -0.14 });
  kit.box(4.5, 0.2, 1.56, '#a6a7a0', { x: -1.7, z: -3.2, y: -0.12 });

  // Three storeys; the right-hand corner overhangs the recessed entrance.
  kit.box(4.6, 1.45, 3.5, white, { x: -1.55, z: -0.75, y: 0.04 });
  kit.box(2.2, 1.45, 2.75, white, { x: 1.85, z: -1.125, y: 0.04 });
  kit.box(6.8, 2.85, 3.5, white, { x: -0.45, z: -0.75, y: 1.45 });
  kit.box(6.84, 0.07, 3.54, frame, { x: -0.45, z: -0.75, y: 4.3 });
  kit.box(6.53, 0.025, 3.23, '#9ea5a1', { x: -0.45, z: -0.75, y: 4.372 });
  kit.collideBox(-1.55, -0.75, 4.6, 3.5);
  kit.collideBox(1.85, -1.125, 2.2, 2.75);

  // Front bays are dark, tall and genuinely recessed between projecting reveals.
  const bay = (x, y, z, width, height, rotation = 0, divisions = 1) => {
    const root = kit.group({ x, y, z, ry: rotation });
    kit.box(width, height, 0.035, frame, { parent: root });
    const inset = 0.065;
    kit.box(width - inset * 2, height - inset * 2, 0.035, glass, { parent: root, y: inset, z: 0.022 });
    // Narrow low-contrast reflected sky strips, not emissive yellow windows.
    kit.box((width - inset * 2) * 0.2, height - 0.16, 0.008, reflection, {
      parent: root, x: -width * 0.23, y: 0.08, z: 0.043, shadow: false,
    });
    for (let divider = 1; divider <= divisions; divider++) {
      kit.box(0.035, height, 0.07, frame, {
        parent: root, x: -width / 2 + width * divider / (divisions + 1), z: 0.05,
      });
    }
    kit.box(width, 0.035, 0.07, frame, { parent: root, y: height * 0.27, z: 0.05 });
    kit.box(0.095, height + 0.11, 0.22, reveal, { parent: root, x: -width / 2 - 0.045, y: -0.055, z: 0.08 });
    kit.box(0.095, height + 0.11, 0.22, white, { parent: root, x: width / 2 + 0.045, y: -0.055, z: 0.08 });
    kit.box(width + 0.18, 0.06, 0.23, reveal, { parent: root, y: height, z: 0.08 });
    kit.box(width + 0.15, 0.045, 0.23, sill, { parent: root, y: -0.045, z: 0.08 });
  };
  for (const x of [-3.1, -1.9, -0.7]) {
    bay(x, 0.16, 1.015, 0.89, 1.13);
    bay(x, 1.68, 1.015, 0.89, 1.1);
    bay(x, 3.0, 1.015, 0.89, 1.1);
  }
  for (const z of [-0.1, -1.15, -2.05]) {
    bay(2.965, 1.68, z, 0.65, 1.1, Math.PI / 2);
    bay(2.965, 3.0, z, 0.65, 1.1, Math.PI / 2);
  }
  for (const z of [-0.1, -1.5]) {
    for (const y of [0.16, 1.68, 3.0]) bay(-3.865, y, z, 0.72, 1.1, -Math.PI / 2);
  }

  // Entrance set behind the floating corner, with the distinctive concrete Y.
  kit.box(2.15, 1.31, 0.05, glass, { x: 1.82, y: 0.07, z: 0.27 });
  for (const x of [0.78, 1.38, 2.02, 2.88]) kit.box(0.045, 1.34, 0.08, frame, { x, y: 0.07, z: 0.32 });
  kit.box(2.15, 0.055, 0.08, frame, { x: 1.82, y: 1.36, z: 0.32 });
  for (const x of [1.57, 1.83]) kit.box(0.025, 0.23, 0.06, '#d3d6cf', { x, y: 0.57, z: 0.35 });
  kit.cylinder(0.13, 0.15, 0.76, reveal, { x: 2.06, z: 0.78, y: 0.04, segments: 10 });
  kit.bar([2.06, 0.73, 0.78], [1.63, 1.45, 0.78], 0.19, reveal);
  kit.bar([2.06, 0.73, 0.78], [2.49, 1.45, 0.78], 0.19, white);
  kit.collideCircle(2.06, 0.78, 0.2);

  // The original 2026 artwork is a generous, unlit plaque on the blank corner.
  brandPlaque(kit, brand, loadTexture, { width: 2.6, height: 1.1, x: 1.57, y: 3.48, z: 1.03 });

  // Full-height glazed entrance connector; narrow mullions continue around it.
  kit.box(1.32, 3.2, 2.65, glass, { x: 3.64, z: -0.88, y: 0.06 });
  kit.box(1.42, 0.1, 2.75, frame, { x: 3.64, z: -0.88, y: 3.26 });
  for (const x of [2.98, 3.42, 3.86, 4.3]) kit.box(0.045, 3.2, 0.08, frame, { x, y: 0.06, z: 0.48 });
  for (const z of [-2.19, -1.52, -0.85, -0.18, 0.48]) kit.box(0.08, 3.2, 0.045, frame, { x: 4.33, y: 0.06, z });
  for (const y of [0.08, 1.05, 2.16, 2.85, 3.21]) {
    kit.box(1.36, 0.045, 0.08, frame, { x: 3.64, y, z: 0.48 });
    kit.box(0.08, 0.045, 2.7, frame, { x: 4.33, y, z: -0.88 });
  }
  for (const x of [3.19, 3.63, 4.07]) kit.box(0.35, 0.32, 0.025, '#c1cdcd', { x, y: 2.87, z: 0.51 });
  kit.collideBox(3.64, -0.88, 1.32, 2.65);

  // Lower rear wing and stepped terrace, visible in the pond-side photograph.
  kit.box(4.3, 2.56, 1.4, white, { x: -1.7, z: -3.2, y: 0.04 });
  kit.box(4.34, 0.07, 1.44, frame, { x: -1.7, z: -3.2, y: 2.6 });
  for (const x of [-3.3, -2.26, -1.22, -0.18]) {
    bay(x, 0.22, -3.91, 0.67, 0.96, Math.PI);
    bay(x, 1.42, -3.91, 0.67, 0.96, Math.PI);
  }
  for (const x of [-2.95, -1.15, 0.65, 2.0]) bay(x, 3.0, -2.515, 0.82, 1.1, Math.PI);
  kit.collideBox(-1.7, -3.2, 4.3, 1.4);

  // Park setting: modest planted beds leave the approach and perimeter walkable.
  plantingStrip(kit, -4.46, -0.55, 0.5, 3.0);
  plantingStrip(kit, 4.2, 2.35, 1.65, 0.6);
  roundTree(kit, -4.25, -3.52, 0.8);
  bench(kit, -3.1, 3.15, 0.12);

  // A low wayfinding tablet uses the same identity, without obscuring the facade.
  kit.box(2.72, 0.18, 0.3, brand.secondary, { x: -0.15, z: 3.5, y: 0.04 });
  kit.box(2.72, 0.75, 0.16, brand.primary, { x: -0.15, z: 3.5, y: 0.22 });
  brandPlaque(kit, brand, loadTexture, { width: 2.6, height: 0.76, x: -0.15, y: 0.62, z: 3.59 });
  kit.collideBox(-0.15, 3.5, 2.72, 0.3);

  return { interactAt: [1.7, 2.0], labelHeight: 5.6, beaconAt: [3.3, 1.55] };
}
