import { DoubleSide } from 'three';
import { plaza } from './common.js';
import { archFrame, archPane, architecturalGlass, atelierMaterials, bevelBox, curveRail, quad } from './atelierGeometry.js';

// An original Angevin maison-atelier, informed by local tuffeau/slate houses.
// It is deliberately not presented as Mounir's real address or a historic replica.
export function buildMaison(kit) {
  const m = atelierMaterials({ stone: '#dfd3bb', trim: '#f3e7d0', shade: '#b6aa94', slate: '#35414d', slateEdge: '#53616a', iron: '#293d48', brass: '#c39a54', cobalt: '#214b8a', glass: '#2d535f', glassLight: '#6f9fa5', oak: '#886d4e', terracotta: '#a95f44', leaf: '#47734c', leafLight: '#6b8e55', lavender: '#977da4', soil: '#63584a' });
  m.slate.side = DoubleSide;
  const glass = architecturalGlass('#a8d2d8', 0.22);
  plaza(kit, 6.9, '#d6cbb7');

  // Foundation and two offsets of the masonry cornice create real shadow lines.
  bevelBox(kit, 6.08, 0.44, 4.52, m.shade, { z: -1.6, y: -0.16 }, 0.045);
  bevelBox(kit, 5.8, 3.05, 4.2, m.stone, { z: -1.6, y: 0.28 }, 0.055);
  bevelBox(kit, 5.96, 0.1, 4.35, m.trim, { z: -1.6, y: 0.29 });
  bevelBox(kit, 6.03, 0.16, 4.42, m.trim, { z: -1.6, y: 3.22 });
  bevelBox(kit, 6.23, 0.12, 4.61, m.shade, { z: -1.6, y: 3.38 });
  bevelBox(kit, 6.34, 0.11, 4.72, m.trim, { z: -1.6, y: 3.5 });
  kit.collideBox(0, -1.6, 6.08, 4.52);

  // Alternating cut-stone quoins and fine coursing; every facade is finished.
  for (const side of [-1, 1]) for (const z of [-3.72, 0.52]) {
    for (let course = 0; course < 8; course++) {
      kit.box(course % 2 ? 0.34 : 0.48, 0.29, 0.11, m.trim, { x: side * 2.73, y: 0.5 + course * 0.34, z });
      kit.box(0.1, 0.29, course % 2 ? 0.48 : 0.34, m.trim, { x: side * 2.94, y: 0.5 + course * 0.34, z: z + (z < 0 ? 0.17 : -0.17) });
    }
  }
  for (const y of [0.65, 1.05, 1.45, 1.85, 2.25, 2.65]) {
    kit.box(5.5, 0.012, 0.012, m.shade, { y, z: -3.706, shadow: false });
  }

  // Slate mansard: steep lower hip and a separate shallow upper roof.
  const lower = [[-3.2, 3.63, 0.82], [3.2, 3.63, 0.82], [3.2, 3.63, -4.02], [-3.2, 3.63, -4.02]];
  const broken = [[-2.57, 5.05, -0.02], [2.57, 5.05, -0.02], [2.57, 5.05, -3.18], [-2.57, 5.05, -3.18]];
  for (let side = 0; side < 4; side++) {
    const next = (side + 1) % 4;
    quad(kit, [lower[side], lower[next], broken[next], broken[side]], m.slate);
    kit.bar(broken[side], broken[next], 0.065, m.slateEdge);
    kit.bar(lower[side], lower[next], 0.075, m.iron);
    // Horizontal slate courses follow the true hip instead of a flat texture.
    for (let row = 1; row < 9; row++) {
      const t = row / 9;
      const a = lower[side].map((value, axis) => value + (broken[side][axis] - value) * t);
      const b = lower[next].map((value, axis) => value + (broken[next][axis] - value) * t);
      a[1] += 0.012; b[1] += 0.012;
      kit.bar(a, b, 0.018, m.slateEdge, { shadow: false });
    }
  }
  const ridgeL = [-1.72, 5.65, -1.6];
  const ridgeR = [1.72, 5.65, -1.6];
  quad(kit, [broken[0], broken[1], ridgeR, ridgeL], m.slate);
  quad(kit, [broken[2], broken[3], ridgeL, ridgeR], m.slate);
  quad(kit, [broken[1], broken[2], ridgeR, ridgeR], m.slate);
  quad(kit, [broken[3], broken[0], ridgeL, ridgeL], m.slate);
  kit.bar(ridgeL, ridgeR, 0.1, m.iron);
  for (const x of [-1.72, 1.72]) {
    kit.sphere(0.085, m.brass, { x, y: 5.74, z: -1.6, widthSegments: 10, heightSegments: 6 });
    kit.cone(0.045, 0.28, m.iron, { x, y: 5.75, z: -1.6, segments: 10 });
  }

  const bay = (x, y, z, width, height, rotation = 0, parent) => {
    const group = kit.group({ x, y, z, ry: rotation, parent });
    archPane(kit, width - 0.16, height - 0.08, m.glass, { parent: group, z: -0.03, y: 0.04 });
    archFrame(kit, width + 0.18, height + 0.12, 0.14, 0.22, m.trim, { parent: group, y: -0.06 });
    kit.box(0.045, height - width / 2 + 0.1, 0.06, m.oak, { parent: group, z: 0.02 });
    for (const by of [height * 0.35, height * 0.65]) kit.box(width - 0.17, 0.04, 0.06, m.oak, { parent: group, y: by, z: 0.02 });
    bevelBox(kit, width + 0.36, 0.13, 0.35, m.trim, { parent: group, y: -0.12, z: 0.06 });
    bevelBox(kit, 0.22, 0.28, 0.27, m.trim, { parent: group, y: height - 0.08, z: 0.06 });
    return group;
  };

  // Arched cobalt door, inset panels, brass knocker and a finely braced canopy.
  archPane(kit, 1.08, 2.3, m.cobalt, { y: 0.3, z: 0.555 });
  archFrame(kit, 1.46, 2.6, 0.18, 0.32, m.trim, { y: 0.25, z: 0.62 });
  for (const y of [0.55, 1.25]) bevelBox(kit, 0.77, 0.5, 0.055, m.iron, { y, z: 0.6 }, 0.02);
  kit.disc(0.055, 0.045, m.brass, { x: 0.32, y: 1.3, z: 0.66, segments: 12 });
  kit.torus(0.075, 0.016, m.brass, { y: 1.91, z: 0.65, tubularSegments: 16 });
  kit.box(0.33, 0.035, 0.035, m.brass, { y: 1.63, z: 0.66 });
  // The approach is a genuine three-step walkable surface.
  for (let step = 0; step < 3; step++) {
    const top = 0.1 + step * 0.09;
    const depth = 1.34 - step * 0.3;
    const z = 1.18 - step * 0.15;
    bevelBox(kit, 1.8 - step * 0.12, top + 0.06, depth, m.shade, { z, y: -0.06 });
    kit.platform(0, z, 1.8 - step * 0.12, depth, top);
  }
  quad(kit, [[-1.0, 2.68, 0.65], [1.0, 2.68, 0.65], [1.0, 2.5, 1.75], [-1.0, 2.5, 1.75]], glass, { shadow: false });
  for (const x of [-1, -0.5, 0, 0.5, 1]) kit.bar([x, 2.68, 0.63], [x, 2.5, 1.77], 0.045, m.iron);
  kit.bar([-1.03, 2.5, 1.78], [1.03, 2.5, 1.78], 0.07, m.iron);
  for (const x of [-0.93, 0.93]) curveRail(kit, [[x, 1.92, 0.7], [x, 2.05, 1.22], [x, 2.47, 1.7]], 0.035, m.iron, {}, 14);
  kit.sign('MOUNIR', { width: 0.95, height: 0.23, y: 2.99, z: 0.69, background: '#293d48', color: '#e9ca8e' });

  // A three-sided bow window gives the living room depth and a unique silhouette.
  const bow = kit.group({ x: -1.95, z: 0.68 });
  for (const [x, z, ry, width] of [[0, 0.65, 0, 1.18], [-0.75, 0.28, -Math.PI / 4, 0.88], [0.75, 0.28, Math.PI / 4, 0.88]]) {
    kit.box(width + 0.12, 0.53, 0.16, m.stone, { parent: bow, x, z, ry, y: 0.3 });
    bay(x, 0.83, z + 0.04, width - 0.14, 1.72, ry, bow);
  }
  bevelBox(kit, 2.05, 0.16, 1.18, m.trim, { parent: bow, y: 2.7, z: 0.22 });
  kit.roof(1.4, 0.33, 2.18, m.slate, { parent: bow, y: 2.85, z: 0.25, ry: Math.PI / 2 });
  kit.collideBox(-1.95, 1.0, 2.2, 1.12);
  bay(1.9, 0.83, 0.57, 1.15, 1.72);

  // Rounded dormers emerge from the steep mansard, with their own slate caps.
  for (const x of [-1.8, 1.8]) {
    bevelBox(kit, 1.22, 1.03, 0.95, m.stone, { x, y: 3.7, z: 0.06 });
    bay(x, 3.72, 0.59, 0.84, 1.17);
    archFrame(kit, 1.3, 1.36, 0.13, 0.16, m.slate, { x, y: 3.7, z: 0.54 });
    kit.box(1.38, 0.07, 1.04, m.slateEdge, { x, y: 4.79, z: 0.03 });
  }
  for (const x of [-1.8, 0, 1.8]) bay(x, 0.85, -3.73, 1.0, 1.65, Math.PI);
  for (const z of [-2.8, -0.85]) bay(-2.94, 0.85, z, 0.95, 1.65, -Math.PI / 2);
  bay(2.94, 0.85, -3.0, 0.95, 1.65, Math.PI / 2);

  // Masonry chimney with visible mortar, cap and twin terracotta pots.
  bevelBox(kit, 0.65, 1.5, 0.65, m.terracotta, { x: -2.0, y: 4.6, z: -2.75 });
  for (let row = 0; row < 7; row++) kit.box(0.67, 0.018, 0.67, m.shade, { x: -2.0, y: 4.69 + row * 0.19, z: -2.75 });
  bevelBox(kit, 0.83, 0.14, 0.83, m.trim, { x: -2.0, y: 6.08, z: -2.75 });
  for (const x of [-2.18, -1.82]) {
    kit.cylinder(0.1, 0.13, 0.3, m.terracotta, { x, y: 6.22, z: -2.75, segments: 14 });
    kit.cylinder(0.07, 0.07, 0.01, m.iron, { x, y: 6.52, z: -2.75, segments: 12 });
  }
  // Gutters turn into proper downpipes, ending over the base.
  for (const x of [-3.04, 3.04]) {
    kit.bar([x, 3.48, -3.85], [x, 3.48, 0.68], 0.07, m.iron);
    kit.bar([x, 3.48, -3.85], [x, 0.45, -3.85], 0.065, m.iron);
    kit.bar([x, 0.45, -3.85], [x, 0.25, -4.03], 0.065, m.iron);
  }

  // Intimate side atelier: projecting glazing, sloping glass roof and oak shelves.
  const atelier = kit.group({ x: 3.76, z: -1.17 });
  bevelBox(kit, 1.85, 0.37, 2.85, m.shade, { parent: atelier, y: -0.08 });
  kit.box(1.62, 0.06, 2.62, m.oak, { parent: atelier, y: 0.3 });
  for (const x of [-0.83, 0.83]) for (const z of [-1.33, 0, 1.33]) kit.box(0.065, 2.1, 0.065, m.iron, { parent: atelier, x, z, y: 0.32 });
  for (const y of [0.48, 1.0, 2.38]) {
    kit.box(1.72, 0.055, 0.055, m.iron, { parent: atelier, y, z: 1.33 });
    kit.box(0.055, 0.055, 2.7, m.iron, { parent: atelier, y, x: 0.83 });
  }
  quad(kit, [[-.81,.35,1.32],[.81,.35,1.32],[.81,2.38,1.32],[-.81,2.38,1.32]], glass, { parent: atelier, shadow:false });
  quad(kit, [[.83,.35,1.32],[.83,.35,-1.32],[.83,2.38,-1.32],[.83,2.38,1.32]], glass, { parent: atelier, shadow:false });
  quad(kit, [[-.87,2.85,1.4],[.9,2.4,1.4],[.9,2.4,-1.4],[-.87,2.85,-1.4]], glass, { parent: atelier, shadow:false });
  for (const z of [-1.4,-.7,0,.7,1.4]) kit.bar([-.9,2.85,z],[.94,2.4,z],.055,m.iron,{parent:atelier});
  kit.bar([.94,2.4,-1.4],[.94,2.4,1.4],.065,m.iron,{parent:atelier});
  for (const y of [.7,1.32]) kit.box(.6,.07,2.3,m.oak,{parent:atelier,x:-.4,y});
  for (let i=0;i<6;i++) kit.box(.12,.22+(i%3)*.05,.22,i%2?m.cobalt:m.terracotta,{parent:atelier,x:-.3,y:1.39,z:-.95+i*.3});
  kit.collideBox(3.76, -1.17, 1.85, 2.85);

  // Installed garden: two clipped parterres, pots and a path through the centre.
  for (const side of [-1, 1]) {
    const x = side * 2.4;
    bevelBox(kit, 2.0, 0.16, 1.1, m.shade, { x, z: 3.0, y: 0.04 });
    bevelBox(kit, 1.84, 0.08, 0.94, m.soil, { x, z: 3.0, y: 0.16 });
    for(let i=0;i<5;i++) {
      kit.sphere(.24,m.leaf,{x:x-.7+i*.35,z:3.0,y:.4,scale:[1,.7,1],widthSegments:10,heightSegments:6});
      for (const dz of [-.22,.22]) kit.sphere(.065,m.lavender,{x:x-.6+i*.3,z:3+dz,y:.59,widthSegments:6,heightSegments:4});
    }
    kit.cylinder(.23,.16,.4,m.terracotta,{x:side*1.16,z:1.8,y:.05,segments:16});
    kit.sphere(.3,m.leafLight,{x:side*1.16,z:1.8,y:.55,widthSegments:12,heightSegments:8});
    kit.collideCircle(side*1.16,1.8,.28);
  }
  for(let step=0;step<4;step++) bevelBox(kit,1.42,.04,.48,m.trim,{y:.045,z:2.3+step*.65},.03);
  // Small boundary walls stop before the entrance; their coping is rounded.
  for(const side of [-1,1]) {
    bevelBox(kit,2.7,.5,.26,m.stone,{x:side*3.1,z:4.12,y:.03});
    bevelBox(kit,2.82,.12,.36,m.trim,{x:side*3.1,z:4.12,y:.53});
    kit.collideBox(side*3.1,4.12,2.82,.36);
  }
  return { interactAt: [0, 2.35], labelHeight: 7.2 };
}
