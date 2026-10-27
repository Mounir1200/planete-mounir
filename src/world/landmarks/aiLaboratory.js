import {
  BufferAttribute, BufferGeometry, CapsuleGeometry, CatmullRomCurve3, DoubleSide,
  MeshStandardMaterial, PlaneGeometry, TubeGeometry, Vector3,
} from 'three';
import { plaza } from './common.js';

// Built architecture reference: Cyber Valley I, Heinle Wischer, Tübingen.
// This compact, playable interpretation has an original visible robotics lab.
// Photographs actually inspected and adaptation limits: qa/labo-architecture-notes.md.
const UP = new Vector3(0, 1, 0);

function tube(kit, points, radius, material, parent, segments = 12) {
  return kit.mesh(new TubeGeometry(new CatmullRomCurve3(points.map(p => new Vector3(...p))), segments, radius, 6, false), material, { parent });
}

function link(kit, from, to, radius, material, parent) {
  const a = new Vector3(...from), b = new Vector3(...to);
  const vector = b.clone().sub(a);
  const mesh = kit.mesh(new CapsuleGeometry(radius, Math.max(0.01, vector.length() - radius * 2), 4, 10), material, { parent });
  mesh.position.copy(a).addScaledVector(vector, 0.5);
  mesh.quaternion.setFromUnitVectors(UP, vector.normalize());
  return mesh;
}

function quad(kit, points, material, parent) {
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(points.flat()), 3));
  geometry.setIndex([0, 1, 2, 0, 2, 3]);
  geometry.computeVertexNormals();
  return kit.mesh(geometry, material, { parent, shadow: false });
}

function succulent(kit, x, z, materials, phase) {
  // Folded, tapering blades emerge from one crown; no exposed rods or poles.
  for (let leaf = 0; leaf < 10; leaf += 1) {
    const geometry = new BufferGeometry();
    const inner = leaf >= 7;
    const reach = inner ? 0.14 : 0.29;
    const height = inner ? 0.4 : 0.28;
    geometry.setAttribute('position', new BufferAttribute(new Float32Array([
      0,0,0, -0.06,height*0.55,reach*0.5, 0,height*0.7,reach*0.5,
      0.06,height*0.55,reach*0.5, 0,height,reach,
    ]),3));
    geometry.setIndex([0,1,2,1,4,2,4,3,2,3,0,2]);
    geometry.computeVertexNormals();
    kit.mesh(geometry,materials[leaf%2],{x,y:0.43,z,ry:leaf*Math.PI*2/7+phase});
  }
}

// The folded outer screen has real depth: an inclined photovoltaic spandrel,
// thin metal supports and occasionally lowered textile shades, as photographed.
function facade(kit, m, { x = 0, z = 0, y = 2.72, width = 9.6, rotation = 0, floors = 3, parent }) {
  const face = kit.group({ x, z, y, ry: rotation, parent });
  const count = Math.round(width / 0.6), step = width / count;
  for (let floor = 0; floor < floors; floor += 1) {
    const fy = floor * 1.15;
    kit.box(width, 0.1, 0.12, m.silver, { parent: face, y: fy, z: 0.04 });
    for (let bay = 0; bay < count; bay += 1) {
      const fx = -width / 2 + (bay + 0.5) * step;
      const glass = (bay + floor * 2) % 5 === 0 ? m.windowWarm : m.window;
      kit.box(step - 0.055, 0.98, 0.035, glass, { parent: face, x: fx, y: fy + 0.08 });
      kit.box(0.026, 1.0, 0.06, m.silver, { parent: face, x: fx, y: fy + 0.06, z: 0.035 });
      // A tilted dark band and the triangular side profile give the reference
      // its characteristic prismatic facade rather than an ordinary glass box.
      quad(kit, [[fx-step/2,fy+0.03,0.08],[fx+step/2,fy+0.03,0.08],
        [fx+step/2,fy+0.29,0.31],[fx-step/2,fy+0.29,0.31]], m.pv, face);
      [-step / 2 + 0.02, step / 2 - 0.02].forEach(offset => {
        kit.bar([fx+offset-Math.sign(offset)*0.06,fy+0.28,0.31], [fx+offset,fy+1.11,0.08], 0.035, m.silver, { parent: face });
        kit.bar([fx+offset,fy+0.29,0.03], [fx+offset,fy+0.29,0.31], 0.026, m.silver, { parent: face });
      });
      if ((bay + floor * 3) % 7 < 2) {
        quad(kit, [[fx-step*.44,fy+0.32,0.3],[fx+step*.44,fy+0.32,0.3],
          [fx+step*.44,fy+1.03,0.1],[fx-step*.44,fy+1.03,0.1]], m.shade, face);
      }
      kit.box(step - 0.03, 0.022, 0.035, m.silver, { parent: face, x: fx, y: fy + 0.55, z: 0.25 });
    }
  }
  return face;
}

function workstation(kit, m, x, z) {
  const desk = kit.group({ x, z });
  kit.box(1.25, 0.065, 0.65, m.oak, { parent: desk, y: 0.77 });
  [-0.52, 0.52].forEach(dx => {
    kit.box(0.045, 0.75, 0.52, m.silver, { parent: desk, x: dx, y: 0.08 });
    kit.box(0.28, 0.57, 0.45, m.paper, { parent: desk, x: dx, y: 0.17, z: -0.04 });
  });
  kit.box(0.26, 0.025, 0.2, m.dark, { parent: desk, y: 0.84, z: -0.1 });
  kit.box(0.035, 0.18, 0.035, m.dark, { parent: desk, y: 0.86, z: -0.16 });
  kit.box(0.77, 0.48, 0.06, m.dark, { parent: desk, y: 1.01, z: -0.16 });
  kit.box(0.69, 0.39, 0.012, m.screen, { parent: desk, y: 1.055, z: -0.12, shadow: false });
  // A small chart is physically on the display, not a floating hologram.
  for (let bar = 0; bar < 5; bar += 1) {
    const h = 0.055 + bar * 0.04;
    kit.box(0.055, h, 0.008, m.chart, { parent: desk, x: -0.22 + bar * 0.11, y: 1.09, z: -0.11, shadow: false });
  }
  kit.box(0.46, 0.022, 0.15, m.dark, { parent: desk, y: 0.84, z: 0.14 });
  for (let key = 0; key < 7; key += 1) kit.box(0.035, 0.006, 0.08, m.silver, { parent: desk, x: -0.18 + key * 0.06, y: 0.863, z: 0.14 });
  kit.sphere(0.047, m.dark, { parent: desk, x: 0.38, y: 0.865, z: 0.16, scale: [0.8, 0.35, 1], widthSegments: 8, heightSegments: 4 });
  kit.box(0.12, 0.32, 0.25, m.dark, { parent: desk, x: 0.44, y: 0.84, z: -0.13 });
  // Tucked chair and five-star castor base.
  kit.cylinder(0.035, 0.035, 0.43, m.silver, { parent: desk, y: 0.13, z: 0.53, segments: 8 });
  kit.box(0.46, 0.08, 0.43, m.fabric, { parent: desk, y: 0.52, z: 0.53 });
  kit.box(0.44, 0.43, 0.065, m.fabric, { parent: desk, y: 0.65, z: 0.74 });
  for (let leg = 0; leg < 5; leg += 1) {
    const a = leg / 5 * Math.PI * 2;
    kit.bar([0,0.15,0.53], [Math.cos(a)*0.3,0.12,0.53+Math.sin(a)*0.3], 0.035, m.silver, { parent: desk });
  }
}

function rack(kit, m, x, z) {
  const group = kit.group({ x, z });
  group.name = 'labo-server-rack';
  kit.box(0.63, 1.92, 0.62, m.dark, { parent: group, y: 0.12 });
  [-0.3, 0.3].forEach(dx => kit.box(0.038, 1.95, 0.05, m.silver, { parent: group, x: dx, y: 0.11, z: 0.33 }));
  for (let unit = 0; unit < 8; unit += 1) {
    const y = 0.23 + unit * 0.215;
    kit.box(0.52, 0.16, 0.03, m.server, { parent: group, y, z: 0.33 });
    for (let vent = 0; vent < 5; vent += 1) kit.box(0.17, 0.009, 0.006, m.dark, { parent: group, x: -0.1, y: y + 0.03 + vent * 0.023, z: 0.35 });
    kit.box(0.022, 0.025, 0.015, unit % 3 ? m.chart : m.status, { parent: group, x: 0.16, y: y + 0.07, z: 0.35, shadow: false });
    kit.box(0.022, 0.025, 0.015, m.chart, { parent: group, x: 0.22, y: y + 0.07, z: 0.35, shadow: false });
  }
}

function robot(kit, m, x, z) {
  const group = kit.group({ x, z });
  group.name = 'labo-articulated-robot';
  kit.cylinder(0.36, 0.41, 0.18, m.dark, { parent: group, y: 0.12, segments: 24 });
  kit.cylinder(0.29, 0.34, 0.24, m.machine, { parent: group, y: 0.3, segments: 20 });
  kit.cylinder(0.26, 0.26, 0.08, m.orange, { parent: group, y: 0.54, segments: 20 });
  const joints = [[0,0.65,0],[-0.18,1.55,0.02],[0.6,2.14,0.08],[1.04,1.77,0.18],[1.04,1.5,0.21]];
  joints.slice(1).forEach((p, i) => link(kit, joints[i], p, i < 2 ? 0.15 : 0.1, m.machine, group));
  joints.forEach((p, i) => {
    const joint = kit.cylinder(i < 3 ? 0.19 : 0.12, i < 3 ? 0.19 : 0.12, 0.29, m.dark,
      { parent: group, x: p[0], y: p[1] - 0.145, z: p[2], segments: 20 });
    joint.rotation.z = Math.PI / 2;
    kit.disc(i < 3 ? 0.13 : 0.075, 0.025, m.orange, { parent: group, x: p[0]+0.16, y: p[1], z: p[2], ry: Math.PI / 2, segments: 16 });
  });
  tube(kit, [[-0.18,0.6,-0.15],[-0.42,1.5,-0.13],[0.1,1.98,-0.15],[0.65,2.28,-0.08],[1.12,1.85,0.08]], 0.033, m.dark, group, 20);
  [-1, 1].forEach(side => {
    kit.box(0.045, 0.22, 0.055, m.silver, { parent: group, x: 1.04 + side * 0.12, y: 1.27, z: 0.21 });
    kit.box(0.09, 0.045, 0.055, m.dark, { parent: group, x: 1.04 + side * 0.095, y: 1.25, z: 0.21 });
  });
  // Work jig directly beneath the end effector; grounded equipment, real scale.
  kit.box(0.75, 0.08, 0.7, m.silver, { parent: group, x: 1.04, y: 0.95, z: 0.21 });
  [-0.27, 0.27].forEach(dx => kit.box(0.06, 0.85, 0.55, m.dark, { parent: group, x: 1.04+dx, y: 0.1, z: 0.21 }));
  kit.box(0.2, 0.19, 0.2, m.orange, { parent: group, x: 1.04, y: 1.03, z: 0.21 });
}

export function buildLabo(kit) {
  const smooth = (color, roughness = 0.65, metalness = 0) => new MeshStandardMaterial({ color, roughness, metalness });
  const m = {
    concrete: smooth('#b9c0ba', 0.95), paper: smooth('#e2e5dc', 0.82), silver: smooth('#9ca7a6', 0.4, 0.55),
    pv: new MeshStandardMaterial({ color: '#37444d', roughness: 0.45, metalness: 0.32, side: DoubleSide }),
    shade: new MeshStandardMaterial({ color: '#b5b6ab', roughness: 0.9, side: DoubleSide }),
    window: kit.materials.glow('#a8c4c5', { base: '#49616b', day: 0.035, night: 0.22 }),
    windowWarm: kit.materials.glow('#e7d9b1', { base: '#778584', day: 0.015, night: 0.27 }),
    clear: new MeshStandardMaterial({ color: '#c3ded9', transparent: true, opacity: 0.075, depthWrite: false, roughness: 0.2, side: DoubleSide }),
    dark: smooth('#273138', 0.7), oak: smooth('#af9873', 0.88), fabric: smooth('#647477', 0.95),
    server: smooth('#526169', 0.55, 0.25), machine: smooth('#dce0d9', 0.42, 0.15), orange: smooth('#c47e3d', 0.58),
    screen: kit.materials.glow('#547c86', { base: '#17313d', day: 0.12, night: 0.5 }),
    chart: kit.materials.glow('#8ab7ad', { base: '#a5cec0', day: 0.12, night: 0.65 }),
    status: kit.materials.glow('#d5aa56', { base: '#dab770', day: 0.05, night: 0.55 }),
    light: kit.materials.glow('#ece7cc', { base: '#e7e8d9', day: 0.08, night: 0.55 }),
  };
  // A little material-level illumination lets equipment remain readable through
  // the windows at night, without adding expensive spotlights or neon halos.
  for (const [material, intensity] of [[m.machine,0.2],[m.paper,0.1],[m.server,0.12],[m.orange,0.13],[m.oak,0.1]]) {
    material.emissive.copy(material.color);
    kit.materials.trackGlow(material, 0, intensity);
  }
  plaza(kit, 7.32, '#a6aea6');
  kit.box(9.65, 0.12, 7.05, m.concrete, { z: -1.38, y: 0.025 });
  kit.platform(0, -1.38, 9.65, 7.05, 0.145);
  // White ribbed ground floor, glazed workshop front and open central doorway.
  kit.box(9.6, 2.55, 0.16, m.paper, { z: -4.85, y: 0.145 });
  for (const x of [-4.72, 4.72]) {
    kit.box(0.16, 2.55, 7, m.paper, { x, z: -1.35, y: 0.145 });
    for (let rib = 0; rib < 33; rib += 1) kit.box(0.12, 2.5, 0.035, m.silver, { x: x + Math.sign(x)*0.1, y: 0.15, z: -4.7 + rib * 0.21 });
  }
  for (let rib = 0; rib < 45; rib += 1) kit.box(0.035, 2.5, 0.12, m.silver, { x: -4.6 + rib * 0.21, z: -4.97, y: 0.15 });
  [-4.7,-1.15,1.15,4.7].forEach(x => kit.box(0.15, 2.57, 0.18, m.paper, { x, z: 2.1, y: 0.145 }));
  [-2.93,2.93].forEach(x => {
    kit.mesh(new PlaneGeometry(3.38, 2.34), m.clear, { x, z: 2.11, y: 1.38, shadow: false });
    kit.box(3.4, 0.06, 0.08, m.silver, { x, z: 2.12, y: 0.17 });
    kit.box(3.4, 0.045, 0.06, m.silver, { x, z: 2.13, y: 1.88 });
    kit.collideBox(x, 2.1, 3.5, 0.18);
  });
  // Retracted glass entrance leaves leave an actual clear path into the lobby.
  [-0.97,0.97].forEach(x => {
    kit.mesh(new PlaneGeometry(0.27,2.21),m.clear,{x,y:1.27,z:2.15,shadow:false});
    kit.box(0.035,2.23,0.055,m.silver,{x:x-Math.sign(x)*0.135,y:0.15,z:2.15});
  });
  kit.box(2.36,0.1,0.4,m.silver,{y:2.54,z:2.12});
  kit.box(2.5,0.12,1.1,m.paper,{y:2.7,z:2.4});
  kit.box(1.9,0.025,0.045,m.light,{y:2.68,z:2.8,shadow:false});
  if (typeof document !== 'undefined') kit.sign('LABO IA', { width: 1.9, height: 0.36, y: 2.36, z: 2.23, color: '#ecf0e7', background: '#33464b' });

  // Three complete upper levels surround a real central atrium; the fourth
  // retreats to the right, following the photographed stepped silhouette.
  for (let floor = 0; floor < 3; floor += 1) {
    const y = 2.7 + floor * 1.15;
    for (const x of [-3.05,3.05]) {
      kit.box(3.5, 0.13, 7.0, m.paper, { x, y, z: -1.35 });
      kit.box(3.4, 1.02, 6.88, m.dark, { x, y: y+0.13, z: -1.35 });
    }
    kit.box(2.6,0.13,1.4,m.paper,{y,z:-4.15});
    kit.box(2.6,1.02,1.3,m.dark,{y:y+0.13,z:-4.15});
    kit.box(2.6,0.13,1.1,m.paper,{y,z:1.6});
    kit.box(2.6,1.02,1.02,m.dark,{y:y+0.13,z:1.6});
    // Atrium-facing glass and continuous white gallery rims remain visible
    // beneath the translucent roof when the globe is viewed from above.
    for (const x of [-1.29,1.29]) {
      kit.box(0.05,0.13,5.05,m.paper,{x,y,z:-1.35});
      kit.box(0.025,0.87,5.05,m.windowWarm,{x,y:y+0.16,z:-1.35});
      for(let post=0;post<8;post++)kit.box(0.07,0.92,0.035,m.paper,{x,y:y+0.14,z:-3.65+post*.65});
    }
  }
  facade(kit,m,{z:2.17});
  facade(kit,m,{z:-4.88,rotation:Math.PI});
  facade(kit,m,{x:4.82,z:-1.35,width:7.0,rotation:Math.PI/2});
  facade(kit,m,{x:-4.82,z:-1.35,width:7.0,rotation:-Math.PI/2});
  // Roof terraces and the raised east volume.
  for(const x of [-3.05,3.05])kit.box(3.6,0.15,7.1,m.concrete,{x,y:6.15,z:-1.35});
  kit.box(4.7,1.05,7.0,m.dark,{x:2.45,y:6.3,z:-1.35});
  facade(kit,m,{x:2.45,z:2.17,y:6.3,width:4.7,floors:1});
  facade(kit,m,{x:2.45,z:-4.88,y:6.3,width:4.7,rotation:Math.PI,floors:1});
  facade(kit,m,{x:4.82,z:-1.35,y:6.3,width:7,rotation:Math.PI/2,floors:1});
  facade(kit,m,{x:0.08,z:-1.35,y:6.3,width:7,rotation:-Math.PI/2,floors:1});
  kit.box(4.8,0.14,7.1,m.silver,{x:2.45,y:7.45,z:-1.35});
  for(let row=0;row<3;row++)for(let col=0;col<4;col++) {
    kit.box(0.83,0.035,0.92,m.pv,{x:1+col*.95,y:7.65,z:-3.8+row*1.7,rx:-0.16});
    kit.box(0.83,0.025,0.025,m.silver,{x:1+col*.95,y:7.78,z:-4.25+row*1.7});
  }
  // Light membrane over the atrium, held by slender cross ribs.
  const membrane = new MeshStandardMaterial({ color:'#d7e4dc', roughness:0.5, transparent:true, opacity:0.24, depthWrite:false, side:DoubleSide });
  for(let bay=0;bay<5;bay++) {
    const z=-3.5+bay*0.95;
    quad(kit,[[-1.2,6.46,z],[-0.55,6.7,z],[-0.55,6.7,z+.9],[-1.2,6.46,z+.9]],membrane);
    quad(kit,[[-0.55,6.7,z],[0.05,6.46,z],[0.05,6.46,z+.9],[-0.55,6.7,z+.9]],membrane);
    kit.bar([-1.2,6.47,z],[-0.55,6.71,z],0.035,m.silver);
    kit.bar([-0.55,6.71,z],[0.05,6.47,z],0.035,m.silver);
  }
  // Interior workshop. Rails, suspended strip luminaires and acoustic panels
  // evoke the real research spaces; equipment is an original arrangement.
  kit.box(9.2,0.06,6.7,m.oak,{y:0.15,z:-1.3});
  kit.platform(0,-1.3,9.2,6.7,0.21);
  kit.box(9.25,2.3,0.13,m.paper,{y:0.21,z:-1.55});
  for(const x of [-3,0,3]) {
    kit.box(0.1,0.16,3.2,m.silver,{x,y:2.45,z:0.15});
    kit.box(0.045,0.028,2.6,m.light,{x,y:2.43,z:0.1,shadow:false});
  }
  robot(kit,m,-3.15,0.65);
  [-3.7,-2.7,-1.7].forEach(x=>kit.box(0.65,0.025,0.5,m.paper,{x,y:2.53,z:0.6,rz:0.02}));
  [2.0,2.8,3.6].forEach(x=>rack(kit,m,x,-0.93));
  workstation(kit,m,2.1,1.12);
  workstation(kit,m,3.65,1.12);
  // Lab safety line and a workbench at the left window are real floor objects.
  kit.box(3.0,0.008,0.035,m.orange,{x:-2.8,y:0.22,z:1.85,shadow:false});
  kit.box(0.035,0.008,2.5,m.orange,{x:-1.28,y:0.22,z:0.6,shadow:false});
  kit.box(0.64,0.78,0.6,m.paper,{x:-4.1,y:0.21,z:0.3});
  kit.box(0.68,0.06,0.64,m.dark,{x:-4.1,y:0.99,z:0.3});
  kit.box(0.25,0.24,0.25,m.silver,{x:-4.1,y:1.05,z:0.3});
  // The central entry stays traversable to the lobby; equipment bays are solid.
  kit.collideBox(0,-3.2,9.7,3.4);
  kit.collideBox(-3.0,0.15,3.7,3.3);
  kit.collideBox(3.0,0.15,3.7,3.3);
  for(const x of [-4.8,4.8])kit.collideBox(x,-1.3,0.22,7.1);
  // Practical campus furniture, with generous room on the forecourt.
  const succulentMaterials = ['#53775a','#78956a'].map(color =>
    new MeshStandardMaterial({color,roughness:0.92,side:DoubleSide}));
  for(const x of [-3.55,3.55]) {
    kit.box(1.45,0.36,0.63,m.concrete,{x,y:0.06,z:3.55});
    kit.box(1.32,0.06,0.51,m.dark,{x,y:0.37,z:3.55});
    [-0.42,0,0.42].forEach((offset,index)=>succulent(kit,x+offset,3.55,succulentMaterials,index*.6));
    kit.collideBox(x,3.55,1.5,.7);
  }
  return { interactAt: [0,3.55], labelHeight: 9.3 };
}
