import { BufferAttribute, BufferGeometry, CatmullRomCurve3, DoubleSide, ExtrudeGeometry, Group, MeshStandardMaterial, Shape, ShapeGeometry, TubeGeometry, Vector3 } from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { Kit } from '../Kit.js';
import { PLANET } from '../../config.js';

const UP = new Vector3(0, 1, 0);
const wood = '#ab8359', trim = '#e7d6ae', iron = '#344b52';
const smoothMaterials = new Map();
function smooth(color, options = {}) {
  const key = color + JSON.stringify(options);
  if (!smoothMaterials.has(key)) smoothMaterials.set(key, new MeshStandardMaterial({ color, roughness: 0.66, ...options }));
  return smoothMaterials.get(key);
}
function rounded(kit, w, h, d, color, options = {}) {
  return kit.mesh(new RoundedBoxGeometry(w, h, d, 2, Math.min(w, h, d) * 0.14), smooth(color), { ...options, y: (options.y ?? 0) + h / 2 });
}
function cable(kit, points, radius = 0.015, color = trim, options = {}) {
  const curve = new CatmullRomCurve3(points.map(p => new Vector3(...p)));
  return kit.mesh(new TubeGeometry(curve, Math.max(10, points.length * 5), radius, 5, false), smooth(color), options);
}

// The waterline follows a continuous shipwright's outline, with a narrow keel,
// a flared bow and a transom. Each profile has its own height and breadth.
function hull(width, length) {
  const controls = [[-0.39,-0.44],[-0.48,-0.2],[-0.49,0.02],[-0.39,0.29],[0,0.56],[0.39,0.29],[0.49,0.02],[0.48,-0.2],[0.39,-0.44],[0,-0.46]];
  const curve = new CatmullRomCurve3(controls.map(([x,z]) => new Vector3(x,0,z)), true, 'centripetal');
  const outline = curve.getPoints(56).slice(0,-1);
  const positions = [], indices = [];
  const profiles = [[0.14,-0.48],[0.46,-0.36],[0.79,-0.15],[0.95,0.06],[1,0.28]];
  for (const [scale,y] of profiles) for (const p of outline) {
    positions.push(p.x * width * scale, y + Math.max(0,p.z-0.17)*0.36, p.z * length * (0.87+scale*0.13));
  }
  const n = outline.length;
  for (let row=0;row<profiles.length-1;row++) for(let i=0;i<n;i++) {
    const j=(i+1)%n, a=row*n+i,b=row*n+j;
    indices.push(a,b,a+n,b,b+n,a+n);
  }
  for(let i=1;i<n-1;i++) indices.push(0,i+1,i);
  const geometry = new BufferGeometry();
  geometry.setAttribute('position',new BufferAttribute(new Float32Array(positions),3));
  geometry.setIndex(indices); geometry.computeVertexNormals();
  return {geometry,outline};
}
function hullStripe(kit, outline, width, length, y, scale, color, depth=0.055) {
  const p=[],idx=[];
  outline.forEach(v=>{
    for(const dy of [-depth/2,depth/2]) p.push(v.x*width*scale, y+dy+Math.max(0,v.z-0.17)*0.36, v.z*length*(0.87+scale*0.13));
  });
  outline.forEach((_,i)=>{ const a=i*2,b=((i+1)%outline.length)*2;idx.push(a,b,a+1,b,b+1,a+1); });
  const g=new BufferGeometry();g.setAttribute('position',new BufferAttribute(new Float32Array(p),3));g.setIndex(idx);g.computeVertexNormals();
  kit.mesh(g,smooth(color,{side:DoubleSide}));
}
function sailCloth(kit, a,b,c,color) {
  const positions=[],indices=[],n=16;
  // A gridded triangle with a shallow camber catches highlights like cloth.
  for(let row=0;row<=n;row++) for(let col=0;col<=n;col++) {
    const v=row/n,u=col/n*(1-v),w=1-v-u;
    positions.push(a[0]*w+b[0]*u+c[0]*v+Math.sin(u*Math.PI)*Math.sin(v*Math.PI)*0.23,
      a[1]*w+b[1]*u+c[1]*v,a[2]*w+b[2]*u+c[2]*v);
  }
  for(let row=0;row<n;row++)for(let col=0;col<n;col++){
    const k=row*(n+1)+col;indices.push(k,k+1,k+n+1,k+1,k+n+2,k+n+1);
  }
  const geometry=new BufferGeometry();geometry.setAttribute('position',new BufferAttribute(new Float32Array(positions),3));geometry.setIndex(indices);geometry.computeVertexNormals();
  kit.mesh(geometry,smooth(color,{side:DoubleSide,roughness:0.96}));
  cable(kit,[a,b,c,a],0.014,'#c8b78e');
  for(let s=1;s<5;s++) {
    const t=s/5;
    cable(kit,[[a[0]*(1-t)+c[0]*t,a[1]*(1-t)+c[1]*t,a[2]*(1-t)+c[2]*t],
      [b[0]*(1-t)+c[0]*t,b[1]*(1-t)+c[1]*t,b[2]*(1-t)+c[2]*t]],0.005,'#d2c19a');
  }
}
function porthole(kit,x,y,z,side=0) {
  kit.disc(0.105,0.027,smooth('#adc8ca',{roughness:0.24}),{x,y,z,ry:side*Math.PI/2,segments:20});
  kit.torus(0.115,0.02,smooth('#bd9d5f',{metalness:0.5}),{x,y,z,ry:side*Math.PI/2,tubularSegments:20});
}
function fender(kit,x,z) {
  kit.sphere(0.12,smooth('#e9e4d2'),{x,y:0.06,z,scale:[0.7,1.9,0.7],widthSegments:12,heightSegments:8});
  cable(kit,[[x,0.3,z],[x*1.05,0.14,z]],0.011);
}

export function craftedBoat(kit, place, waterAt, { x,z,width,length,color,kind,yaw }) {
  const boatKit=new Kit(kit.materials);
  const {geometry,outline}=hull(width,length);
  boatKit.mesh(geometry,smooth(color,{side:DoubleSide}));
  hullStripe(boatKit,outline,width,length,0.08,0.96,'#d9cba7',0.065);
  hullStripe(boatKit,outline,width,length,-0.15,0.8,'#284c55',0.045);
  const shape=new Shape();outline.forEach((p,i)=> i?shape.lineTo(p.x*width*0.94,-p.z*length*0.98):shape.moveTo(p.x*width*0.94,-p.z*length*0.98));shape.closePath();
  boatKit.mesh(new ShapeGeometry(shape),wood,{y:0.24,rx:-Math.PI/2});
  const gunwale=outline.map(p=>[p.x*width,0.29+Math.max(0,p.z-0.17)*0.36,p.z*length]);gunwale.push(gunwale[0]);
  cable(boatKit,gunwale,0.035,trim);
  for(let row=0;row<11;row++) {
    const pz=-length*0.36+row*length*0.07;
    const span=width*(pz>length*0.2?0.52:0.84);
    boatKit.box(span,0.006,0.009,'#7c6245',{y:0.244,z:pz,shadow:false});
  }
  if(kind==='sail') {
    rounded(boatKit,width*0.6,0.34,1.48,'#f1e8ce',{y:0.25,z:-0.25});
    rounded(boatKit,width*0.5,0.075,0.8,'#244751',{y:0.57,z:-0.24});
    [-0.45,0.08].forEach(z=>[-1,1].forEach(side=>porthole(boatKit,side*width*0.31,0.44,z,side)));
    boatKit.cylinder(0.027,0.05,4.1,smooth('#b3976b'),{z:0.55,y:0.25,segments:14});
    cable(boatKit,[[0,1.13,0.55],[0,1.13,-1.55]],0.04,'#b3976b');
    sailCloth(boatKit,[0,1.18,0.52],[0,1.18,-1.55],[0,4.27,0.52],'#f7eed6');
    sailCloth(boatKit,[0.03,0.5,length*0.51],[0.03,0.65,0.75],[0.03,3.85,0.62],'#ded9c5');
    cable(boatKit,[[0,4.3,0.55],[width*0.46,0.32,-0.35]],0.013,'#78878a');
    cable(boatKit,[[0,4.3,0.55],[-width*0.46,0.32,-0.35]],0.013,'#78878a');
    cable(boatKit,[[0,4.3,0.55],[0,0.34,-length*0.44]],0.013,'#78878a');
    // Stern cockpit, bench and wheel in a recognisable little cruising yacht.
    rounded(boatKit,0.62,0.16,0.6,'#4f747a',{y:0.25,z:-1.28});
    boatKit.torus(0.16,0.018,iron,{y:0.59,z:-1.1,tubularSegments:20});
    for(let i=0;i<6;i++) {const a=i*Math.PI/3;boatKit.bar([0,0.59,-1.1],[Math.cos(a)*0.16,0.59+Math.sin(a)*0.16,-1.1],0.012,iron);}
  } else if(kind==='fishing') {
    rounded(boatKit,width*0.69,0.86,1.25,'#e8e1c9',{y:0.25,z:-0.32});
    rounded(boatKit,width*0.81,0.11,1.42,'#467578',{y:1.11,z:-0.32});
    for(const dx of [-0.22,0.22]) rounded(boatKit,0.36,0.31,0.025,'#284951',{x:dx,y:0.73,z:0.315});
    for(const side of [-1,1]) {
      rounded(boatKit,0.025,0.32,0.72,'#284951',{x:side*width*0.35,y:0.73,z:-0.25});
      boatKit.box(0.026,0.34,0.045,trim,{x:side*width*0.357,y:0.72,z:-0.25});
    }
    boatKit.cylinder(0.035,0.05,2.1,wood,{y:0.25,z:0.8,segments:12});
    cable(boatKit,[[-0.5,2.18,0.8],[0.5,2.18,0.8]],0.035,wood);
    cable(boatKit,[[0,2.35,0.8],[0,0.34,-length*0.43]],0.016,iron);
    for(const x of [-0.4,0.4]) cable(boatKit,[[x,2.18,0.8],[x*1.3,0.37,1.2]],0.014);
    for(let i=0;i<4;i++) {
      const z=0.65+i*0.18;
      boatKit.torus(0.19,0.016,wood,{x:-0.33,y:0.48,z,rx:Math.PI/2,tubularSegments:12});
    }
    rounded(boatKit,0.51,0.26,0.55,'#52878a',{x:0.2,y:0.26,z:1.18});
    for(let i=0;i<5;i++)boatKit.box(0.48,0.017,0.018,'#32606a',{x:0.2,y:0.29+i*0.045,z:1.465});
    boatKit.torus(0.2,0.055,'#d96c42',{x:width*0.365,y:0.65,z:-0.58,ry:Math.PI/2,tubularSegments:24});
    boatKit.cylinder(0.045,0.045,0.21,iron,{x:-0.33,y:1.22,z:-0.63,segments:12});
  } else {
    for(const pz of [-0.55,0.1,0.55])rounded(boatKit,width*0.8,0.055,0.19,trim,{y:0.3,z:pz});
    for(const side of [-1,1]){
      cable(boatKit,[[side*0.6,0.42,-0.6],[-side*0.25,0.38,0.8]],0.024,wood);
      rounded(boatKit,0.14,0.03,0.4,trim,{x:-side*0.25,y:0.37,z:0.8,ry:side*0.45});
    }
  }
  [-0.7,0.55].forEach(z=>[-1,1].forEach(side=>fender(boatKit,side*width*0.48,z)));
  const vessel=boatKit.bake();vessel.rotation.y=yaw;
  const waterline=waterAt(x,z),group=new Group();group.name=`harbour-boat-${kind}`;group.userData.dynamic=true;
  group.position.set(x,waterline,z);group.quaternion.setFromUnitVectors(UP,new Vector3(x,place.padHeight+waterline,z).normalize());
  const resting=group.quaternion.clone();group.add(vessel);kit.root.add(group);
  kit.onUpdate(time=>{group.position.y=waterline+Math.sin(time*1.1+x)*0.035;group.quaternion.copy(resting);group.rotateZ(Math.sin(time*0.7+x)*0.018);});
}

function arch(kit,x,y,z,w,h,color,depth=0.08) {
  const shape=new Shape();const r=w/2;shape.moveTo(-r,0);shape.lineTo(r,0);shape.lineTo(r,h-r);shape.absarc(0,h-r,r,0,Math.PI,false);shape.closePath();
  const geometry=new ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelSize:0.015,bevelThickness:0.015,bevelSegments:1,steps:1,curveSegments:18});
  kit.mesh(geometry,smooth(color),{x,y,z});
}
export function harbourOffice(kit) {
  const parent=kit.group({x:-3.05,z:-0.9});
  // Separate local kit lets architectural details share only a few draw calls.
  const k=new Kit(kit.materials);
  rounded(k,3.3,0.3,2.75,'#999787',{y:-0.16});
  k.box(3.12,3.1,2.45,'#dfd6bb',{y:0.14});
  for(let row=0;row<10;row++)for(let col=0;col<7;col++){
    const x=-1.4+col*0.46+(row%2)*0.12;if(x>1.48)continue;
    k.box(0.44,0.012,0.012,'#c7bfa7',{x,y:0.3+row*0.285,z:1.231,shadow:false});
  }
  for(const side of [-1,1])for(let row=0;row<8;row++) k.box(0.25,0.19,0.18,row%2?'#eee5cd':'#c8bda2',{x:side*1.5,y:0.2+row*0.37,z:1.23});
  k.box(3.28,0.17,2.6,'#b8aa89',{y:2.15});k.box(3.4,0.18,2.7,'#eae0c3',{y:3.2});
  arch(k,0.65,0.14,1.24,0.92,1.95,'#a39372');arch(k,0.65,0.19,1.33,0.7,1.75,'#285b66');
  for(const x of [-0.92,-0.35]){arch(k,x,0.75,1.24,0.5,1.04,'#f0e3c4');arch(k,x,0.8,1.34,0.37,0.92,'#314c52');k.box(0.026,0.74,0.03,trim,{x,y:0.83,z:1.44});}
  for(const x of [-0.9,0.7]){arch(k,x,2.4,1.25,0.56,0.6,'#ad9f7b');arch(k,x,2.44,1.34,0.42,0.49,'#42646b');}
  k.sign('ADQUA',{width:1.8,height:0.3,y:2.02,z:1.38,background:'#244b56',color:'#f7e5bb'});
  k.roof(3.6,1.45,2.9,'#394c56',{y:3.4});
  // Individual slate courses across both roof slopes, retaining a continuous roof beneath.
  for(let row=0;row<6;row++)for(let col=0;col<8;col++)for(const side of [-1,1]){
    const t=(row+0.5)/6,x=side*1.8*(1-t),y=3.4+1.45*t;
    k.box(0.39,0.035,0.34,row%2?'#465d65':'#394c56',{x,y,z:-1.25+col*0.36,rz:-side*Math.atan(1.45/1.8)});
  }
  k.cylinder(0.035,0.035,3.15,iron,{x:1.62,y:0.18,z:-1.25,segments:8});
  rounded(k,0.43,1.15,0.47,'#b78063',{x:-0.8,y:4.0,z:-0.65});rounded(k,0.59,0.12,0.6,'#c9bba0',{x:-0.8,y:5.15,z:-0.65});
  k.sign('CAPITAINERIE',{width:1.6,height:0.25,y:3.02,z:1.34,background:'#dfd6bb',color:'#304f58'});
  // Side shutters, rear windows and narrow terrace railing finish the whole volume.
  for(const side of [-1,1]) for(const z of [-0.65,0.55]){
    k.box(0.06,0.88,0.54,'#3e6970',{x:side*1.58,y:0.94,z});
    for(let slat=0;slat<7;slat++) k.box(0.065,0.018,0.51,'#6e9090',{x:side*1.62,y:0.99+slat*0.1,z,shadow:false});
  }
  for(const x of [-0.85,0.75]) {k.box(0.6,0.9,0.06,trim,{x,y:1,z:-1.25});k.box(0.48,0.76,0.07,'#385c68',{x,y:1.07,z:-1.28});}
  parent.add(k.bake());kit.collideBox(-3.05,-0.9,3.3,2.75);
}
