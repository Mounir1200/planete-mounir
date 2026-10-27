import assert from 'node:assert/strict';
import { Matrix4, Texture, Vector3 } from 'three';
import { Kit } from '../src/world/Kit.js';
import { MaterialLibrary } from '../src/world/materials.js';
import { buildMaison } from '../src/world/landmarks/home.js';
import { buildGalerie } from '../src/world/landmarks/belvedere.js';
import { Landmarks } from '../src/world/Landmarks.js';
import { PLAYER } from '../src/config.js';

const photos = Array.from({length:5},(_,index)=>({thumb:`photo-${index}`,width:index%2?506:900,height:index%2?900:507}));
for(const [id,build] of [['maison',buildMaison],['galerie',buildGalerie]]) {
  const kit=new Kit(new MaterialLibrary(),{id});
  let textDraws=0;
  kit.sign=()=>{textDraws++;};
  const spec=build(kit,{photos,loadTexture:()=>new Texture()});
  kit.bake();
  let triangles=2*textDraws,draws=textDraws,invalid=0;
  kit.root.traverse(object=>{
    if(!object.isMesh)return;
    draws++;
    triangles+=(object.geometry.index?.count??object.geometry.attributes.position.count)/3;
    for(const attribute of ['position','normal']) for(const n of object.geometry.attributes[attribute]?.array??[]) if(!Number.isFinite(n))invalid++;
  });
  assert.equal(invalid,0,`${id}: finite positions and normals`);
  assert.ok(triangles<45000,`${id}: triangle budget (${triangles})`);
  assert.ok(draws<60,`${id}: draw budget (${draws})`);
  const spawn={x:spec.interactAt[0],z:spec.interactAt[1]+1.6};
  const hit=kit.colliders.some(c=>c.type==='circle'?Math.hypot(spawn.x-c.x,spawn.z-c.z)<c.radius+PLAYER.collisionRadius:Math.abs(spawn.x-c.x)<c.halfWidth+PLAYER.collisionRadius&&Math.abs(spawn.z-c.z)<c.halfDepth+PLAYER.collisionRadius);
  assert.equal(hit,false,`${id}: spawn remains outside solid obstacles`);

  // Exercise the actual game's collision resolver through each visitor route.
  // Identity matrices isolate local architecture from the globe orientation.
  const resolver=Object.create(Landmarks.prototype);
  resolver.nearby=()=>[{colliders:kit.colliders,toLocal:new Matrix4(),toWorld:new Matrix4()}];
  const walk=(from,to)=>{
    const point=new Vector3(from[0],0,from[1]);
    const step=new Vector3(to[0]-from[0],0,to[1]-from[1]).divideScalar(240);
    for(let frame=0;frame<240;frame++) resolver.resolveCollisions(point.add(step),PLAYER.collisionRadius);
    return point;
  };
  const approach=id==='maison'?[0,1.2]:[0,-2.9];
  assert.ok(walk([0,7],approach).distanceTo(new Vector3(approach[0],0,approach[1]))<.001,`${id}: entrance and centre route remain walkable`);
  if(id==='maison') {
    assert.ok(walk([0,2], [0,-2]).z>=1.109, 'maison: front masonry prevents walking through the house');
    assert.ok(walk([5.5,-1.17], [3.76,-1.17]).x>=5.134, 'maison: glass atelier is solid');
  } else {
    assert.ok(walk([0,0], [0,-5]).z>=-3.346, 'galerie: photographic display prevents clipping through the print');
    assert.ok(walk([5.2,0], [7,0]).x<5.5, 'galerie: perimeter balustrade prevents walking through the rail');
  }
  console.log(JSON.stringify({id,triangles,draws,colliders:kit.colliders.length,platforms:kit.platforms.length,approachClear:true,solidObstacles:true,spec}));
}
