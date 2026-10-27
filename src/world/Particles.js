import { AdditiveBlending, BufferAttribute, BufferGeometry, Color, NormalBlending, Points, ShaderMaterial, Vector3 } from 'three';

const vertexShader = /* glsl */ `
  uniform float uScale;
  attribute float aSize;
  attribute float aAlpha;
  attribute vec3 aColor;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * uScale / max(0.1, -viewPosition.z);
    gl_Position = projectionMatrix * viewPosition;
    vColor = aColor;
    vAlpha = aAlpha;
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uBoost;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float distanceToCentre = length(gl_PointCoord - 0.5);
    if (distanceToCentre > 0.5) discard;
    float alpha = smoothstep(0.5, 0.05, distanceToCentre) * vAlpha;
    gl_FragColor = vec4(vColor * uBoost, alpha);
  }
`;

const gravityDirection = new Vector3();

// Pooled point particles (dust, sparkles, fireworks) attracted to the planet centre.
export class ParticlePool {
  constructor({ capacity, additive = false, boost = 1 }) {
    this.capacity = capacity;
    this.positions = new Float32Array(capacity * 3);
    this.colors = new Float32Array(capacity * 3);
    this.sizes = new Float32Array(capacity);
    this.alphas = new Float32Array(capacity);
    this.particles = Array.from({ length: capacity }, () => ({ life: 0, maxLife: 1, velocity: new Vector3(), position: new Vector3(), size: 1, gravity: 0, drag: 0 }));
    this.cursor = 0;

    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(this.positions, 3));
    geometry.setAttribute('aColor', new BufferAttribute(this.colors, 3));
    geometry.setAttribute('aSize', new BufferAttribute(this.sizes, 1));
    geometry.setAttribute('aAlpha', new BufferAttribute(this.alphas, 1));
    this.uniforms = { uScale: { value: 400 }, uBoost: { value: boost } };
    this.points = new Points(geometry, new ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      blending: additive ? AdditiveBlending : NormalBlending,
    }));
    this.points.frustumCulled = false;
  }

  setViewportHeight(height) {
    this.uniforms.uScale.value = height * 0.9;
  }

  emit(origin, { count = 10, color = '#ffffff', speed = 2, spread = 1, direction, life = 1, size = 0.3, gravity = 6, drag = 1.5 }) {
    const tint = new Color(color);
    for (let index = 0; index < count; index++) {
      const particle = this.particles[this.cursor];
      const slot = this.cursor;
      this.cursor = (this.cursor + 1) % this.capacity;
      particle.position.copy(origin);
      particle.velocity.set(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1).normalize().multiplyScalar(spread * speed * Math.random());
      if (direction) particle.velocity.addScaledVector(direction, speed);
      particle.life = particle.maxLife = life * (0.6 + Math.random() * 0.6);
      particle.size = size * (0.6 + Math.random() * 0.8);
      particle.gravity = gravity;
      particle.drag = drag;
      this.colors.set([tint.r, tint.g, tint.b], slot * 3);
    }
  }

  update(deltaSeconds) {
    for (let index = 0; index < this.capacity; index++) {
      const particle = this.particles[index];
      if (particle.life <= 0) {
        this.alphas[index] = 0;
        continue;
      }
      particle.life -= deltaSeconds;
      gravityDirection.copy(particle.position).normalize();
      particle.velocity.addScaledVector(gravityDirection, -particle.gravity * deltaSeconds);
      particle.velocity.multiplyScalar(Math.max(0, 1 - particle.drag * deltaSeconds));
      particle.position.addScaledVector(particle.velocity, deltaSeconds);
      const remaining = Math.max(0, particle.life / particle.maxLife);
      this.positions.set([particle.position.x, particle.position.y, particle.position.z], index * 3);
      this.alphas[index] = Math.min(1, remaining * 2);
      this.sizes[index] = particle.size * (0.4 + remaining * 0.6);
    }
    const attributes = this.points.geometry.attributes;
    attributes.position.needsUpdate = true;
    attributes.aColor.needsUpdate = true;
    attributes.aSize.needsUpdate = true;
    attributes.aAlpha.needsUpdate = true;
  }
}

// Long-lived glowing specks drifting above the meadows at night.
export class Fireflies {
  constructor({ terrain, anchors, count = 90 }) {
    this.pool = new ParticlePool({ capacity: count, additive: true, boost: 1.6 });
    this.seeds = Array.from({ length: count }, (_, index) => {
      const anchor = anchors[index % anchors.length];
      const direction = anchor.clone().add(new Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).multiplyScalar(0.5)).normalize();
      return { base: direction.multiplyScalar(terrain.heightAt(direction) + 0.6 + Math.random() * 1.6), phase: Math.random() * 100 };
    });
    const tint = new Color('#d9ff8a');
    this.seeds.forEach((_, index) => {
      this.pool.colors.set([tint.r, tint.g, tint.b], index * 3);
      this.pool.sizes[index] = 0.16;
    });
    this.pool.points.geometry.attributes.aColor.needsUpdate = true;
  }

  get object() {
    return this.pool.points;
  }

  update(time, nightFactor) {
    this.seeds.forEach((seed, index) => {
      const wobble = seed.phase + time * 0.6;
      this.pool.positions.set([
        seed.base.x + Math.sin(wobble) * 0.8,
        seed.base.y + Math.sin(wobble * 1.3) * 0.5,
        seed.base.z + Math.cos(wobble * 0.9) * 0.8,
      ], index * 3);
      this.pool.alphas[index] = nightFactor * (0.4 + 0.6 * Math.max(0, Math.sin(time * 3 + seed.phase * 7)));
      this.pool.sizes[index] = 0.18;
    });
    const attributes = this.pool.points.geometry.attributes;
    attributes.position.needsUpdate = true;
    attributes.aAlpha.needsUpdate = true;
    attributes.aSize.needsUpdate = true;
    this.pool.points.visible = nightFactor > 0.02;
  }
}
