import test from 'node:test';
import assert from 'node:assert/strict';
import { Box3, Vector3 } from 'three';
import { Kit } from '../src/world/Kit.js';
import { MaterialLibrary } from '../src/world/materials.js';
import { buildRwu, buildKtu } from '../src/world/landmarks/erasmusCampuses.js';

for (const [id, builder, minHeight, maxHeight] of [['rwu', buildRwu, 4, 5.3], ['ktu', buildKtu, 5.4, 5.7]]) {
  const campus = () => {
    const kit = new Kit(new MaterialLibrary(), { id, padRadius: 6 });
    const spec = builder(kit);
    return { kit, spec };
  };
  test(`${id} preserves the referenced silhouette within its playable pad`, () => {
    const { kit } = campus();
    kit.root.updateMatrixWorld(true);
    const bounds = new Box3().setFromObject(kit.root);
    assert.ok(bounds.max.y >= minHeight && bounds.max.y <= maxHeight, `height ${bounds.max.y}`);
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
    assert.ok(furthest <= 6, `footprint radius ${furthest}`);
  });
  test(`${id} interaction and travel spawn stay reachable on foot`, () => {
    const { kit, spec } = campus();
    const [x, z] = spec.interactAt;
    for (let approach = z; approach <= z + 2; approach += 0.05) {
      assert.ok(kit.colliders.every(collider => {
        if (collider.type === 'circle') return Math.hypot(x - collider.x, approach - collider.z) >= collider.radius + 0.45;
        return Math.abs(x - collider.x) >= collider.halfWidth + 0.45 || Math.abs(approach - collider.z) >= collider.halfDepth + 0.45;
      }), `blocked approach at ${approach}`);
    }
    assert.ok(Math.hypot(x, z + 1.6) < 5.78, 'arrival lies on plaza');
    kit.bake();
    const bounds = new Box3().setFromObject(kit.root);
    assert.ok(Number.isFinite(bounds.min.y) && bounds.max.y < maxHeight, 'baking produces finite supported geometry');
  });
}

test('KTU offset entrance stairs have four individually supported treads', () => {
  const kit = new Kit(new MaterialLibrary(), { id: 'ktu', padRadius: 6 });
  buildKtu(kit);
  const steps = kit.platforms.filter(platform => platform.type !== 'circle');
  assert.deepEqual(steps.map(step => Number(step.top.toFixed(3))), [0.115, 0.195, 0.275, 0.355]);
  assert.ok(steps.every(step => step.x > 2), 'portico remains offset to the right as photographed');
});
