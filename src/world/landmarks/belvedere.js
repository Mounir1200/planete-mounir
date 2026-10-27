import { DoubleSide, MeshBasicMaterial, PlaneGeometry } from 'three';
import { archFrame, architecturalGlass, atelierMaterials, bevelBox, curveRail, quad, turnedColumn } from './atelierGeometry.js';
import { plaza } from './common.js';

// An open photographic belvedere, inspired by Angevin stone-and-glass galleries.
// The horseshoe arcade is original; none of the museum's sculpture is copied.
export function buildGalerie(kit, { photos = [], loadTexture } = {}) {
  const m = atelierMaterials({ stone: '#e1d6c2', trim: '#f1e7d5', shade: '#b1a999', floor: '#d2c6b3', slate: '#626971', iron: '#30484b', brass: '#b99455', oak: '#806445', mat: '#f5f0e7', leaf: '#527b5e', flower: '#bfa0b0' });
  const glass = architecturalGlass('#c0e0df', 0.13);
  const top = 0.24;
  plaza(kit, 6.95, '#bfb8a9');

  // Broad, low terrace, supported all the way down to the plaza, with rounded rim.
  kit.cylinder(6.32, 6.4, 0.28, m.shade, { y: -0.07, segments: 80, shadow: false });
  kit.cylinder(6.22, 6.32, 0.06, m.floor, { y: 0.2, segments: 80, shadow: false });
  kit.platformCircle(6.26, 0.26);
  kit.torus(6.24, 0.045, m.trim, { y: 0.27, rx: Math.PI / 2, tubularSegments: 80, radialSegments: 6, shadow: false });
  // Narrow radial and concentric joints make the terrace a designed stone floor.
  for (let i = 0; i < 20; i++) {
    const theta = i * Math.PI / 10;
    kit.bar([Math.sin(theta) * 1.0, 0.269, Math.cos(theta) * 1.0], [Math.sin(theta) * 6.15, 0.269, Math.cos(theta) * 6.15], 0.012, m.shade, { shadow: false });
  }
  for (const radius of [1, 2.6, 4.1, 5.25]) kit.torus(radius, 0.009, m.shade, { y: 0.269, rx: Math.PI / 2, radialSegments: 4, tubularSegments: 64, shadow: false });
  kit.torus(0.86, 0.022, m.brass, { y: 0.28, rx: Math.PI / 2, tubularSegments: 40, radialSegments: 6, shadow: false });
  for (let i=0;i<8;i++) {
    const a = i * Math.PI / 4;
    quad(kit, [[0,.28,0], [Math.sin(a-.12)*.2,.28,Math.cos(a-.12)*.2], [Math.sin(a)*.76,.28,Math.cos(a)*.76], [Math.sin(a+.12)*.2,.28,Math.cos(a+.12)*.2]], m.brass, { shadow:false });
  }

  // Five true arches, open below the spring line and bevelled along their edges.
  const bayAngles = [-68, -34, 0, 34, 68].map(degrees => degrees * Math.PI / 180);
  const radius = 4.35;
  bayAngles.forEach(angle => {
    const x = Math.sin(angle) * radius;
    const z = -Math.cos(angle) * radius;
    const arcade = kit.group({ x, z, y: top, ry: -angle });
    archFrame(kit, 2.8, 3.55, 0.22, 0.34, m.stone, { parent: arcade });
    archFrame(kit, 2.98, 3.69, 0.075, 0.08, m.trim, { parent: arcade, y: -0.015, z: 0.2 });
    bevelBox(kit, 0.3, 0.4, 0.46, m.trim, { parent: arcade, y: 3.27, z: 0.03 });
    // Voussoir seams follow the semicircle instead of square decorations.
    const spring = 3.55 - 1.4;
    for(let key=1;key<8;key++) {
      const a = key * Math.PI / 8;
      kit.bar([Math.cos(a)*1.2,spring+Math.sin(a)*1.2,.2],[Math.cos(a)*1.39,spring+Math.sin(a)*1.39,.2],.013,m.shade,{parent:arcade,shadow:false});
    }
  });
  for(const degrees of [-85,-51,-17,17,51,85]) {
    const a = degrees * Math.PI / 180;
    const x = Math.sin(a) * radius;
    const z = -Math.cos(a) * radius;
    bevelBox(kit,.58,.18,.58,m.shade,{x,z,y:top});
    turnedColumn(kit,3.22,.18,m.trim,{x,z,y:top+.18});
    bevelBox(kit,.64,.15,.62,m.trim,{x,z,y:3.64});
    kit.collideCircle(x,z,.34);
  }

  // A translucent hipped glass canopy, modelled as individual curved-plan bays.
  // The central court and front panorama remain entirely open to the sky.
  const roofPoint = (angle, radius, y) => [Math.sin(angle) * radius, y, -Math.cos(angle) * radius];
  const roofAngles = Array.from({ length: 13 }, (_, i) => (-101 + i * (202 / 12)) * Math.PI / 180);
  for(let i=0;i<roofAngles.length-1;i++) {
    const a=roofAngles[i], b=roofAngles[i+1];
    quad(kit,[roofPoint(a,2.82,3.87),roofPoint(b,2.82,3.87),roofPoint(b,4.06,4.78),roofPoint(a,4.06,4.78)],glass,{shadow:false});
    quad(kit,[roofPoint(a,4.06,4.78),roofPoint(b,4.06,4.78),roofPoint(b,5.32,3.91),roofPoint(a,5.32,3.91)],glass,{shadow:false});
    const mid = (a+b)/2;
    kit.bar(roofPoint(a,2.82,3.87),roofPoint(a,4.06,4.78),.055,m.iron);
    kit.bar(roofPoint(a,4.06,4.78),roofPoint(a,5.32,3.91),.055,m.iron);
    kit.bar(roofPoint(mid,2.82,3.87),roofPoint(mid,4.06,4.78),.025,m.iron);
    kit.bar(roofPoint(mid,4.06,4.78),roofPoint(mid,5.32,3.91),.025,m.iron);
    // A fine triangulated brace beneath each larger roof bay.
    if(i%2===0) kit.bar(roofPoint(a,3.0,3.92),roofPoint(b,4.8,4.1),.025,m.brass);
  }
  const last=roofAngles.at(-1);
  kit.bar(roofPoint(last,2.82,3.87),roofPoint(last,4.06,4.78),.055,m.iron);
  kit.bar(roofPoint(last,4.06,4.78),roofPoint(last,5.32,3.91),.055,m.iron);
  for(const [r,y,thickness] of [[2.82,3.87,.06],[4.06,4.78,.07],[5.32,3.91,.085],[3.45,4.33,.028],[4.7,4.34,.028]]) {
    curveRail(kit,roofAngles.map(a=>roofPoint(a,r,y)),thickness,m.iron,{},56);
  }
  for(const degrees of [-101,101]) {
    const a=degrees*Math.PI/180;
    turnedColumn(kit,3.58,.14,m.iron,{x:Math.sin(a)*5.28,z:-Math.cos(a)*5.28,y:top});
    kit.collideCircle(Math.sin(a)*5.28,-Math.cos(a)*5.28,.22);
  }

  // Photographs are the user's actual files, presented as museum prints. Their
  // aspect ratios stay intact; unlit materials protect them from bloom/sun washout.
  photos.slice(0,5).forEach((photo,index)=>{
    const angle=bayAngles[index];
    const x=Math.sin(angle)*4.02;
    const z=-Math.cos(angle)*4.02;
    const display=kit.group({x,z,ry:-angle});
    const portrait=photo.height>photo.width;
    const height=portrait?1.82:2.04*photo.height/photo.width;
    const width=portrait?height*photo.width/photo.height:2.04;
    const y=1.76;
    // Solid backboard, distinct oak frame, recessed warm-white mount.
    bevelBox(kit,width+.31,height+.31,.1,m.oak,{parent:display,y:y-(height+.31)/2,z:-.015},.025);
    bevelBox(kit,width+.17,height+.17,.035,m.mat,{parent:display,y:y-(height+.17)/2,z:.045},.018);
    if(loadTexture) {
      const texture=loadTexture(photo.thumb);
      const material=new MeshBasicMaterial({map:texture,toneMapped:false,side:DoubleSide});
      kit.mesh(new PlaneGeometry(width,height),material,{parent:display,y,z:.068,shadow:false});
    }
    for(const sx of [-.42,.42]) kit.box(.045,1.08,.045,m.iron,{parent:display,x:sx,y:top,z:-.08});
    bevelBox(kit,1.04,.12,.46,m.shade,{parent:display,y:top,z:-.1});
    kit.bar([-.45,2.95,-.1],[.45,2.95,-.1],.045,m.iron,{parent:display});
    kit.box(.65,.025,.08,kit.materials.glow('#ffe1ad',{day:.15,night:1.1}),{parent:display,y:2.91,z:-.05,shadow:false});
    const label=String(index+1).padStart(2,'0');
    kit.sign(label,{parent:display,width:.3,height:.16,y:.58,z:.12,background:'#e1d6c2',color:'#30484b'});
    kit.collideBox(x,z,.7,.45);
    for(const direction of [-1,1]) kit.collideCircle(
      x+Math.cos(angle)*width*.4*direction,
      z+Math.sin(angle)*width*.4*direction,
      .25,
    );
  });

  // Stone balusters frame the panorama, with a generous opening toward the path.
  for(const side of [-1,1]) {
    const angles=Array.from({length:24},(_,i)=>side*(24+i*(156/23))*Math.PI/180);
    const point=(a,y)=>[Math.sin(a)*5.94,y,Math.cos(a)*5.94];
    curveRail(kit,angles.map(a=>point(a,.42)),.075,m.shade,{},44);
    curveRail(kit,angles.map(a=>point(a,1.18)),.095,m.trim,{},44);
    angles.forEach((a,index)=>{
      const x=Math.sin(a)*5.94,z=Math.cos(a)*5.94;
      if(index%4===0||index===angles.length-1) {
        bevelBox(kit,.29,.82,.29,m.stone,{x,z,y:.36});
        bevelBox(kit,.41,.1,.41,m.trim,{x,z,y:1.13});
      } else turnedColumn(kit,.7,.11,m.trim,{x,z,y:.44},true);
      kit.collideCircle(x,z,.23);
    });
  }

  // Two shallow approach steps, both included in the walkable height field.
  for(const [z,width,depth,topY] of [[6.25,3.2,.74,.1],[5.92,2.9,.72,.19]]) {
    bevelBox(kit,width,topY+.06,depth,m.shade,{z,y:-.06});
    kit.platform(0,z,width,depth,topY);
  }
  // Benches face the prints; the centre stays clear for walking and looking.
  for(const side of [-1,1]) {
    const seat=kit.group({x:side*3.7,z:2.65,ry:-side*.45});
    for(const offset of [-.58,.58]) turnedColumn(kit,.48,.12,m.iron,{parent:seat,x:offset,y:top});
    bevelBox(kit,1.6,.12,.48,m.oak,{parent:seat,y:.7});
    for(const y of [.9,1.08]) kit.box(1.6,.1,.06,m.oak,{parent:seat,y,z:.2});
    kit.collideCircle(side*3.7,2.65,.78);
  }
  // A brass panoramic telescope on a splayed tripod, beyond the visitor's route.
  const scope=kit.group({x:3.3,z:4.25,ry:-.65});
  for(const a of [0,Math.PI*2/3,Math.PI*4/3]) kit.bar([Math.sin(a)*.36,top,Math.cos(a)*.36],[0,1.35,0],.055,m.iron,{parent:scope});
  const tube=kit.group({parent:scope,y:1.43,rx:Math.PI/2-.15});
  kit.cylinder(.15,.12,.68,m.brass,{parent:tube,y:-.34,segments:16});
  kit.cylinder(.17,.17,.045,m.iron,{parent:tube,y:.34,segments:16});
  kit.cylinder(.115,.115,.01,m.slate,{parent:tube,y:.39,segments:16});
  kit.collideCircle(3.3,4.25,.45);
  return { interactAt: [0,1.45], labelHeight: 6.1 };
}
