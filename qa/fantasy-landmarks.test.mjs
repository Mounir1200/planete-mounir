import test from 'node:test';
import assert from 'node:assert/strict';
import { Vector3 } from 'three';
import { Kit } from '../src/world/Kit.js';
import { MaterialLibrary } from '../src/world/materials.js';
import { buildUrdwell } from '../src/world/landmarks/worldTree.js';
import { buildHindsight } from '../src/world/landmarks/observatory.js';

const BUILDERS = [['urdwell', buildUrdwell, 8], ['hindsight', buildHindsight, 7.5]];
const collision = (c, x, z, radius = 0.45) => c.type === 'circle'
  ? Math.hypot(x - c.x, z - c.z) < c.radius + radius
  : Math.abs(x - c.x) < c.halfWidth + radius && Math.abs(z - c.z) < c.halfDepth + radius;

for (const [id, build, padRadius] of BUILDERS) {
  test(`${id} geometry fits the clearing and the rendering budget`, () => {
    const kit = new Kit(new MaterialLibrary(), { id, padRadius });
    build(kit);
    kit.bake();
    kit.root.updateMatrixWorld(true);
    let triangles = 0, draws = 0, furthest = 0;
    const vertex = new Vector3();
    kit.root.traverse(mesh => {
      if (!mesh.isMesh) return;
      draws += 1;
      triangles += (mesh.geometry.index?.count ?? mesh.geometry.attributes.position.count) / 3;
      const positions = mesh.geometry.attributes.position;
      for (let index = 0; index < positions.count; index += 1) {
        vertex.fromBufferAttribute(positions, index).applyMatrix4(mesh.matrixWorld);
        assert.ok(Number.isFinite(vertex.x + vertex.y + vertex.z), 'all vertices remain finite');
        furthest = Math.max(furthest, Math.hypot(vertex.x, vertex.z));
      }
    });
    assert.ok(draws < 70, `${draws} mesh draw calls`);
    assert.ok(triangles < 45000, `${triangles} triangles`);
    assert.ok(furthest <= padRadius, `radius ${furthest}`);
  });
  test(`${id} has a clear arrival, interaction approach and beacon standing area`, () => {
    const kit = new Kit(new MaterialLibrary(), { id, padRadius });
    const spec = build(kit);
    const [x, z] = spec.interactAt;
    for (let approach = z; approach <= z + 2; approach += 0.05) {
      assert.ok(kit.colliders.every(c => !collision(c, x, approach)), `blocked at z=${approach}`);
    }
    assert.ok(kit.colliders.every(c => !collision(c, ...spec.beaconAt, 0.65)), 'beacon standing area remains free');
    assert.ok(Math.hypot(x, z + 1.6) < padRadius - 0.5, 'travel arrival is supported by the clearing');
  });
}

test('observatory copper roof has an actual open slit across the zenith', () => {
  const kit = new Kit(new MaterialLibrary(), { id: 'hindsight', padRadius: 7.5 });
  buildHindsight(kit);
  const dome = kit.root.getObjectByName('hindsight-main-dome');
  let vertices = 0;
  dome.traverse(mesh => {
    if (mesh.name !== 'copper-dome-panel') return;
    const positions = mesh.geometry.attributes.position;
    for (let index = 0; index < positions.count; index += 1) {
      assert.ok(Math.abs(positions.getX(index)) >= dome.userData.slitWidth / 2 - 1e-5, 'roof must not bridge over the opening');
      vertices += 1;
    }
  });
  assert.ok(vertices > 500, 'both roof shells are present');
  assert.equal(kit.platforms.filter(surface => surface.type !== 'circle').length, 5, 'four entry steps and landing have collision support');
});
