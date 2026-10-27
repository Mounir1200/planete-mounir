import test from 'node:test';
import assert from 'node:assert/strict';
import { Vector3 } from 'three';
import { Kit } from '../src/world/Kit.js';
import { MaterialLibrary } from '../src/world/materials.js';
import { buildLabo } from '../src/world/landmarks/aiLaboratory.js';

const blocks = (c,x,z,r=.45) => c.type === 'circle'
  ? Math.hypot(x-c.x,z-c.z)<c.radius+r
  : Math.abs(x-c.x)<c.halfWidth+r && Math.abs(z-c.z)<c.halfDepth+r;

test('AI laboratory has finite geometry within its pad and rendering budget', () => {
  const kit = new Kit(new MaterialLibrary(), {id:'labo',padRadius:7.5});
  buildLabo(kit);
  assert.ok(kit.root.getObjectByName('labo-articulated-robot'),'a grounded robot is modelled');
  let racks=0;kit.root.traverse(o=>{if(o.name==='labo-server-rack')racks++;});
  assert.equal(racks,3);
  kit.bake();kit.root.updateMatrixWorld(true);
  let triangles=0,draws=0,furthest=0;
  const p=new Vector3();
  kit.root.traverse(mesh=>{
    if(!mesh.isMesh)return;
    draws++;
    triangles+=(mesh.geometry.index?.count??mesh.geometry.attributes.position.count)/3;
    const positions=mesh.geometry.attributes.position;
    for(let i=0;i<positions.count;i++) {
      p.fromBufferAttribute(positions,i).applyMatrix4(mesh.matrixWorld);
      assert.ok(Number.isFinite(p.x+p.y+p.z));
      furthest=Math.max(furthest,Math.hypot(p.x,p.z));
    }
  });
  assert.ok(triangles<60000,`${triangles} triangles`);
  assert.ok(draws<60,`${draws} draw calls`);
  assert.ok(furthest<=7.5,`radial footprint ${furthest}`);
});

test('laboratory travel arrival, interaction and actual entrance corridor stay clear',()=>{
  const kit=new Kit(new MaterialLibrary(),{id:'labo',padRadius:7.5});
  const spec=buildLabo(kit);
  const [x,z]=spec.interactAt;
  for(let approach=0;approach<=z+1.7;approach+=.05) {
    assert.ok(kit.colliders.every(c=>!blocks(c,x,approach)),`entry blocked at ${approach}`);
  }
  assert.ok(Math.hypot(x,z+1.6)<7,'travel arrival has supported ground');
  const floor=kit.platforms.find(p=>p.type!=='circle'&&p.top===.21);
  assert.ok(floor,'interior floor has a real walkable surface');
});
