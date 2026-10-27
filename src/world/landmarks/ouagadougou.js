import { BufferGeometry, Float32BufferAttribute, MeshStandardMaterial } from 'three';
import { atelierMaterials, bevelBox, curveRail, quad } from './atelierGeometry.js';
import { plaza } from './common.js';

// Maison du Peuple, Ouagadougou — interpreted from the WMF exterior photographs.
// The ellipse, brick relief, projecting stairs and forty roof lanterns belong to
// this building. Dimensions are compressed for the globe, not a measured survey.
const RX = 4.55, RZ = 3.12, CZ = -1.18;

function drum(kit, rx, rz, height, material, options = {}) {
  return kit.cylinder(1, 1, height, material, { segments: 96, scale: [rx, 1, rz], z: CZ, ...options });
}

function triangleLoft(kit, rings, material, options = {}) {
  const positions = [];
  const triangle = (a,b,c) => positions.push(...a,...b,...c);
  const point = (r,y,i) => [Math.sin(i*Math.PI*2/3)*r, y, Math.cos(i*Math.PI*2/3)*r];
  for(let level=0;level<rings.length-1;level++) {
    const [r,y]=rings[level], [nr,ny]=rings[level+1];
    for(let side=0;side<3;side++) {
      const a=point(r,y,side), b=point(r,y,(side+1)%3), c=point(nr,ny,(side+1)%3), d=point(nr,ny,side);
      triangle(a,b,c);triangle(a,c,d);
    }
  }
  const [r,y]=rings[0], [tr,ty]=rings.at(-1);
  triangle(point(r,y,0),point(r,y,2),point(r,y,1));
  triangle(point(tr,ty,0),point(tr,ty,1),point(tr,ty,2));
  const geometry=new BufferGeometry();
  geometry.setAttribute('position',new Float32BufferAttribute(positions,3));
  geometry.computeVertexNormals();
  return kit.mesh(geometry,material,options);
}

function lantern(kit, m, x, z, rotation, index) {
  const parent=kit.group({x,z,y:4.45,ry:rotation});
  parent.name=`ouaga-lantern-${index+1}`;
  // A battered masonry base and sloping glazed/persienned throat beneath a
  // separate, very broad triangular hat: the gaps and braces are intentional.
  triangleLoft(kit,[[.47,0],[.34,.19]],m.brick,{parent});
  triangleLoft(kit,[[.34,.19],[.23,.6]],m.glass,{parent});
  triangleLoft(kit,[[.58,.61],[.58,.65],[.09,.98]],m.roof,{parent});
  for(let side=0;side<3;side++) {
    const a=side*Math.PI*2/3,b=(side+1)*Math.PI*2/3;
    const point=(angle,r,y)=>[Math.sin(angle)*r,y,Math.cos(angle)*r];
    kit.bar(point(a,.34,.19),point(a,.23,.6),.022,m.iron,{parent});
    kit.bar(point(a,.34,.19),point(a,.57,.61),.018,m.iron,{parent});
    kit.bar(point(a,.58,.65),point(a,.09,.98),.014,m.roofEdge,{parent});
    // Horizontal slats and thin mullions give the actual throat a visible scale.
    for(const height of [.29,.4,.51]) {
      const radius=.34-(height-.19)/.41*.11;
      kit.bar(point(a,radius,height),point(b,radius,height),.012,m.frame,{parent,shadow:false});
    }
    const p=point(a,.34,.19), q=point(b,.34,.19), pt=point(a,.23,.6), qt=point(b,.23,.6);
    kit.bar(p.map((v,i)=>(v+q[i])/2),pt.map((v,i)=>(v+qt[i])/2),.012,m.frame,{parent,shadow:false});
    // Three fluted concrete fins at the apex, seen in the WMF close-up.
    kit.box(.043,.22,.17,m.finial,{parent,x:Math.sin(a)*.055,z:Math.cos(a)*.055,y:.965,ry:a});
  }
}

function externalStair(kit,m,side) {
  // Twin external flights with a common back landing, like the photographed
  // projecting concrete staircases. The staircase remains a solid boundary;
  // only the visitor's ground-level entry steps are part of the public route.
  const front=.25, back=-2.65, run=front-back, count=12;
  for(let flight=0;flight<2;flight++) {
    const x=side*(4.56+flight*.65), startY=.08+flight*1.31;
    for(let step=0;step<count;step++) {
      const t=(step+.5)/count;
      const z=flight===0?front-t*run:back+t*run;
      kit.box(.66,.12,run/count+.012,m.concrete,{x,z,y:startY+(step+1)*1.31/count-.12});
    }
    const xout=x+side*.34;
    const z0=flight===0?front:back,z1=flight===0?back:front;
    // Continuous inclined stringer and a deep opaque parapet, not floating treads.
    for(const dx of [-.29,.29]) kit.bar([x+dx,startY+.02,z0],[x+dx,startY+1.31,z1],.13,m.shade);
    quad(kit,[[xout,startY+.15,z0],[xout,startY+1.46,z1],[xout,startY+2.03,z1],[xout,startY+.72,z0]],m.doubleConcrete);
    kit.bar([xout,startY+.72,z0],[xout,startY+2.03,z1],.075,m.coping);
    kit.collideBox(x,(front+back)/2,.67,run+.16);
  }
  bevelBox(kit,1.4,.18,.72,m.concrete,{x:side*4.88,z:back-.3,y:1.22});
  kit.box(.2,1.32,.57,m.shade,{x:side*5.43,z:back-.25});
  // Upper landing folds into the building, carrying the side access doorway.
  bevelBox(kit,1.66,.18,.72,m.concrete,{x:side*4.6,z:front+.25,y:2.53});
  kit.box(.065,.68,.73,m.concrete,{x:side*5.44,z:front+.25,y:2.69});
  kit.box(.11,2.7,.2,m.concrete,{x:side*5.4,z:front+.52});
  kit.box(.15,2.55,.3,m.concrete,{x:side*4.18,z:front+.52});
  const doorway=kit.group({x:side*3.99,z:.37,ry:side*1.03});
  kit.box(.6,1.36,.065,m.shade,{parent:doorway,y:2.72});
  kit.box(.46,1.24,.07,m.door,{parent:doorway,y:2.75,z:.04});
  kit.box(.025,1.2,.075,m.frame,{parent:doorway,y:2.77,z:.07});
}

function elephant(kit,m,x,z,side) {
  const pedestal=kit.group({x,z});
  kit.cylinder(.55,.58,.56,m.plinth,{parent:pedestal,y:.04,segments:24});
  kit.cylinder(.59,.59,.07,m.coping,{parent:pedestal,y:.6,segments:24});
  for(let row=0;row<4;row++) for(let col=0;col<12;col++) {
    const a=(col+(row%2)*.5)*Math.PI/6;
    kit.box(.22,.085,.035,m.brick,{parent:pedestal,x:Math.sin(a)*.55,z:Math.cos(a)*.55,y:.08+row*.13,ry:a});
  }
  const sculpture=kit.group({parent:pedestal,y:.65,ry:side*.16});
  kit.sphere(.39,m.sculpture,{parent:sculpture,y:.57,scale:[.82,.8,1.35],widthSegments:16,heightSegments:12});
  for(const sx of [-.21,.21]) for(const sz of [-.29,.28]) kit.cylinder(.085,.095,.4,m.sculpture,{parent:sculpture,x:sx,z:sz,segments:10});
  kit.sphere(.25,m.sculpture,{parent:sculpture,y:.64,z:.45,scale:[.95,1.05,1],widthSegments:14,heightSegments:10});
  for(const sx of [-1,1]) {
    kit.sphere(.25,m.sculpture,{parent:sculpture,x:sx*.24,y:.63,z:.32,scale:[.3,1.12,.84],widthSegments:12,heightSegments:10});
    kit.sphere(.022,m.eye,{parent:sculpture,x:sx*.16,y:.72,z:.62,widthSegments:8,heightSegments:6,shadow:false});
    curveRail(kit,[[sx*.14,.51,.55],[sx*.18,.43,.67],[sx*.17,.5,.8]],.025,m.ivory,{parent:sculpture},10);
  }
  curveRail(kit,[[0,.66,.63],[0,.48,.73],[0,.21,.8],[0,.17,.96],[0,.28,1.02]],.075,m.sculpture,{parent:sculpture},16);
  curveRail(kit,[[0,.63,-.47],[.08,.46,-.58],[.12,.3,-.59]],.022,m.sculpture,{parent:sculpture},10);
  kit.collideCircle(x,z,.61);
}

export function buildOuaga(kit) {
  const m=atelierMaterials({concrete:'#bf9366',shade:'#9e7754',coping:'#d2ad7b',brick:'#a86743',brickLight:'#b9794e',brickDark:'#935f42',roof:'#87694e',roofEdge:'#b79a73',glass:'#75817b',frame:'#b9b39b',iron:'#615e4b',finial:'#d7ccac',door:'#3e645a',recess:'#4e4939',plinth:'#dfd0ad',sculpture:'#706958',eye:'#39382e',ivory:'#c9b98d',path:'#bda27d'});
  m.doubleConcrete=new MeshStandardMaterial({color:'#bc9268',roughness:.9,side:2});
  plaza(kit,6.98,'#be8854');

  drum(kit,RX+.12,RZ+.12,.24,m.shade,{y:-.12});
  drum(kit,RX-.1,RZ-.1,2.02,m.shade,{y:.12});
  drum(kit,RX,RZ,2.07,m.concrete,{y:2.14});
  drum(kit,RX+.05,RZ+.05,.13,m.shade,{y:4.19});
  drum(kit,RX+.12,RZ+.1,.13,m.coping,{y:4.32});
  // Roof deck is matte concrete. The parapet remains a thin continuous datum
  // below the lanterns rather than a cone or an invented vernacular roof.
  drum(kit,RX-.04,RZ-.04,.035,m.roof,{y:4.42});

  // Patchwork of brick rectangles and cast-concrete grid on the curved wall.
  const columns=56, panelHeight=.43;
  for(let col=0;col<columns;col++) {
    const a=col*Math.PI*2/columns;
    const x=Math.sin(a)*(RX+.016),z=CZ+Math.cos(a)*(RZ+.016);
    const ry=Math.atan2(Math.sin(a)/RX,Math.cos(a)/RZ);
    const panel=kit.group({x,z,ry});
    kit.box(.015,2.0,.027,m.coping,{parent:panel,y:2.14,shadow:false});
    for(let row=0;row<5;row++) {
      const y=2.16+row*panelHeight;
      const wide=(col+row*3)%4===0;
      const tint=[m.brick,m.brickLight,m.brickDark][(col+row)%3];
      // Relief alternates a large vertical rectangle and paired smaller blocks.
      if((col+row)%3!==1) {
        const w=wide?.25:.17,h=wide?.31:.2,px=(col%2?1:-1)*.1;
        kit.box(w,h,.035,tint,{parent:panel,x:px,y:y+.045,z:.022});
        for(let joint=1;joint<4;joint++)kit.box(w,.008,.038,m.shade,{parent:panel,x:px,y:y+.045+joint*h/4,z:.026,shadow:false});
      }
      if(row<4)kit.box(.48,.018,.029,m.coping,{parent:panel,y:y+panelHeight-.015,shadow:false});
    }
    // Regular louvers at the ground storey and occasional recessed exit doors.
    if(col%7===0) {
      kit.box(.43,1.8,.035,m.door,{parent:panel,y:.18,z:-.095});
      kit.box(.02,1.77,.04,m.frame,{parent:panel,y:.19,z:-.067});
    } else for(let slat=0;slat<5;slat++) kit.box(.42,.018,.035,m.recess,{parent:panel,y:1.58+slat*.055,z:-.083,shadow:false});
  }

  // Forty triangular lanterns arranged in staggered rows, with the roofline
  // deliberately visible between them. Each has an actual separate cap.
  const counts=[4,7,9,9,7,4];
  const rowOffsets=[-2.4,-1.5,-.6,.6,1.5,2.4];
  let lanternIndex=0;
  counts.forEach((count,row)=>{
    const z=CZ+rowOffsets[row];
    for(let col=0;col<count;col++) {
      const x=(col-(count-1)/2)*.87;
      lantern(kit,m,x,z,(row+col)%2?Math.PI:0,lanternIndex++);
    }
  });

  // Recessed ground-level entrance: tall metal grilles, a shallow concrete
  // canopy and slender columns, as in the photograph of the principal facade.
  kit.box(4.5,2.11,.08,m.recess,{y:.13,z:2.015});
  for(let bay=0;bay<5;bay++) {
    const x=(bay-2)*.84;
    kit.box(.76,2.08,.05,m.door,{x,y:.16,z:2.07});
    for(let vertical=0;vertical<6;vertical++)kit.box(.012,2.06,.016,m.frame,{x:x-.32+vertical*.128,y:.17,z:2.108});
    for(let horizontal=0;horizontal<10;horizontal++)kit.box(.74,.012,.016,m.frame,{x,y:.2+horizontal*.206,z:2.11});
  }
  bevelBox(kit,4.9,.17,.98,m.concrete,{y:2.24,z:2.3});
  for(const x of [-2.23,-.78,.78,2.23]) {
    kit.cylinder(.065,.065,2.18,m.coping,{x,z:2.61,y:.06,segments:16});
    kit.collideCircle(x,2.61,.07);
  }
  kit.sign('MAISON DU PEUPLE',{width:3.7,height:.31,y:2.35,z:2.806,background:'#dfd0ad',color:'#66482e'});
  kit.sign('OUAGADOUGOU',{width:2.4,height:.3,y:4.02,z:2.09,background:'#bf9366',color:'#5e4734'});
  // Shallow, fully supported entry steps and a clear central strip of paving.
  for(const [z,width,depth,top] of [[2.69,4.9,.85,.08],[2.44,4.55,.68,.14]]) {
    bevelBox(kit,width,top+.055,depth,m.path,{z,y:-.055});
    kit.platform(0,z,width,depth,top);
  }
  for(let row=0;row<6;row++) {
    const z=3.12+row*.57;
    kit.box(2.8,.018,.55,m.path,{z,y:.036,shadow:false});
    for(const x of [-.7,.7])kit.box(.012,.004,.55,m.shade,{x,z,y:.055,shadow:false});
  }

  externalStair(kit,m,-1);externalStair(kit,m,1);
  // The historic elephant pair is small enough to preserve the facade, not a
  // generic animal decoration elsewhere in the square.
  elephant(kit,m,-3.25,3.15,-1);elephant(kit,m,3.25,3.15,1);

  // A series of narrow boxes approximates the real elliptical solid footprint
  // while leaving the main entrance approach and lateral apron clear.
  const strips=20;
  for(let strip=0;strip<strips;strip++) {
    const z=-RZ+(strip+.5)*RZ*2/strips;
    const half=RX*Math.sqrt(Math.max(0,1-(z/RZ)**2));
    kit.collideBox(0,CZ+z,half*2,RZ*2/strips+.025);
  }
  return {interactAt:[0,3.35],labelHeight:6.7};
}
