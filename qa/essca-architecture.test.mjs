import test from 'node:test';
import assert from 'node:assert/strict';
import { Box3, Vector3 } from 'three';
import { Kit } from '../src/world/Kit.js';
import { MaterialLibrary } from '../src/world/materials.js';
import { buildEssca } from '../src/world/landmarks/esscaCampus.js';

function campus() {
  const kit = new Kit(new MaterialLibrary(), { id: 'essca', padRadius: 7.5 });
  const spec = buildEssca(kit);
  return { kit, spec };
}

function collides(collider, x, z, radius = 0.45) {
  if (collider.type === 'circle') return Math.hypot(x - collider.x, z - collider.z) < collider.radius + radius;
  return Math.abs(x - collider.x) < collider.halfWidth + radius && Math.abs(z - collider.z) < collider.halfDepth + radius;
}

test('ESSCA is a low horizontal campus fitting its playable footprint', () => {
  const { kit } = campus();
  kit.root.updateMatrixWorld(true);
  const bounds = new Box3().setFromObject(kit.root);
  assert.ok(bounds.max.y < 4.6, 'no fictional tower survives');
  assert.ok(bounds.max.x - bounds.min.x > 12, 'horizontal silhouette includes the entrance court');
  const vertex = new Vector3();
  let furthest = 0;
  kit.root.traverse(mesh => {
    if (!mesh.isMesh) return;
    const positions = mesh.geometry.attributes.position;
    for (let index = 0; index < positions.count; index += 1) {
      vertex.fromBufferAttribute(positions, index).applyMatrix4(mesh.matrixWorld);
      furthest = Math.max(furthest, Math.hypot(vertex.x, vertex.z));
    }
  });
  assert.ok(furthest <= 7.5, `footprint overflow: ${furthest}`);
});

test('the approach, spawn and interaction are clear of building and furniture collisions', () => {
  const { kit, spec } = campus();
  const [x, z] = spec.interactAt;
  for (let approach = z; approach <= 6.5; approach += 0.1) {
    assert.ok(kit.colliders.every(collider => !collides(collider, x, approach)), `blocked approach at ${approach}`);
  }
  assert.ok(kit.colliders.every(collider => !collides(collider, x, z + 1.6)), 'spawn clearance');
  assert.ok(kit.colliders.every(collider => !collides(collider, ...spec.beaconAt, 0.65)), 'beacon has its own clear standing area');
});

test('the entrance steps have supported tops and the rear is fully modelled after baking', () => {
  const { kit } = campus();
  const steps = kit.platforms.filter(platform => platform.type !== 'circle');
  assert.equal(steps.length, 3);
  assert.deepEqual(steps.map(step => Number(step.top.toFixed(3))), [0.115, 0.195, 0.275]);
  let before = 0;
  kit.root.traverse(mesh => { if (mesh.isMesh) before += mesh.geometry.index?.count ?? mesh.geometry.attributes.position.count; });
  kit.bake();
  let after = 0;
  let rearVertices = 0;
  kit.root.updateMatrixWorld(true);
  kit.root.traverse(mesh => {
    if (!mesh.isMesh) return;
    after += mesh.geometry.index?.count ?? mesh.geometry.attributes.position.count;
    const vertex = new Vector3();
    for (let index = 0; index < mesh.geometry.attributes.position.count; index += 1) {
      vertex.fromBufferAttribute(mesh.geometry.attributes.position, index).applyMatrix4(mesh.matrixWorld);
      if (vertex.z < -3.9 && vertex.y > 0.5) rearVertices += 1;
    }
  });
  assert.equal(before, after, 'merging must preserve every facade detail');
  assert.ok(rearVertices > 1000, 'rear windows and frames are geometry, not a blank unmodelled wall');
});
