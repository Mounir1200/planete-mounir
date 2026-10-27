import assert from 'node:assert/strict';
import { Matrix4, Vector3 } from 'three';
import { Kit } from '../src/world/Kit.js';
import { MaterialLibrary } from '../src/world/materials.js';
import { Landmarks } from '../src/world/Landmarks.js';
import { PLAYER } from '../src/config.js';
import { buildOuaga } from '../src/world/landmarks/ouagadougou.js';

const kit=new Kit(new MaterialLibrary(),{id:'ouaga'});
let signs=0;
kit.sign=()=>{signs++;};
const spec=buildOuaga(kit);
let lanterns=0;
kit.root.updateMatrixWorld(true);
const roofs=[];
kit.root.traverse(object=>{
  if(!object.name.startsWith('ouaga-lantern-'))return;
  lanterns++;
  const vertices=object.children[2].geometry.attributes.position,points=[];
  for(let index=0;index<vertices.count;index++) {
    if(Math.abs(vertices.getY(index)-.61)>1e-5)continue;
    const point=new Vector3().fromBufferAttribute(vertices,index).applyMatrix4(object.matrixWorld);
    if(!points.some(previous=>previous.distanceTo(point)<1e-5))points.push(point);
  }
  roofs.push(points);
});
assert.equal(lanterns,40,'forty separate roof lanterns');
function overlap(a,b) {
  for(const polygon of [a,b])for(let edge=0;edge<polygon.length;edge++) {
    const start=polygon[edge],end=polygon[(edge+1)%polygon.length],nx=end.z-start.z,nz=start.x-end.x;
    const pa=a.map(p=>p.x*nx+p.z*nz),pb=b.map(p=>p.x*nx+p.z*nz);
    if(Math.max(...pa)<=Math.min(...pb)||Math.max(...pb)<=Math.min(...pa))return false;
  }
  return true;
}
for(let a=0;a<roofs.length;a++)for(let b=a+1;b<roofs.length;b++)assert.equal(overlap(roofs[a],roofs[b]),false,`lantern roofs ${a+1}/${b+1} remain separate`);
kit.bake();
let triangles=signs*2,draws=signs,invalid=0;
kit.root.traverse(object=>{
  if(!object.isMesh)return;
  draws++;
  triangles+=(object.geometry.index?.count??object.geometry.attributes.position.count)/3;
  for(const attribute of ['position','normal'])for(const value of object.geometry.attributes[attribute]?.array??[])if(!Number.isFinite(value))invalid++;
});
assert.equal(invalid,0);
assert.ok(triangles<=60000,`triangle budget (${triangles})`);
assert.ok(draws<=55,`draw budget (${draws})`);
const resolver=Object.create(Landmarks.prototype);
resolver.nearby=()=>[{colliders:kit.colliders,toLocal:new Matrix4(),toWorld:new Matrix4()}];
const walk=(from,to)=>{
  const point=new Vector3(from[0],0,from[1]);
  const step=new Vector3(to[0]-from[0],0,to[1]-from[1]).divideScalar(240);
  for(let frame=0;frame<240;frame++)resolver.resolveCollisions(point.add(step),PLAYER.collisionRadius);
  return point;
};
const approach=walk([0,7],[0,2.6]);
assert.ok(approach.distanceTo(new Vector3(0,0,2.6))<.001,'central entrance approach stays clear');
assert.ok(walk([0,4],[0,-3]).z>=2.38,'solid front facade');
assert.ok(walk([3.25,5],[3.25,3.15]).z>=4.2,'elephant pedestal prevents clipping');
assert.ok(walk([.78,4],[.78,2.61]).z>=3.129,'slender porch column prevents clipping');
const spawn=new Vector3(spec.interactAt[0],0,spec.interactAt[1]+1.6);
assert.ok(resolver.resolveCollisions(spawn.clone(),PLAYER.collisionRadius).distanceTo(spawn)<.001,'spawn outside obstacles');
assert.equal(kit.updaters.length,0,'static monument does not animate when motion is reduced');
console.log(JSON.stringify({triangles,draws,lanterns,colliders:kit.colliders.length,platforms:kit.platforms.length,approachClear:true,obstaclesSolid:true,spec}));
