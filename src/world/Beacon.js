import {
  AdditiveBlending, Color, CylinderGeometry, DoubleSide, Group, Mesh, MeshStandardMaterial, OctahedronGeometry,
  RingGeometry, ShaderMaterial,
} from 'three';
import { damp } from '../utils/math.js';

const BEAM_HEIGHT = 80;

const beamVertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const beamFragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uTime;
  uniform float uStrength;
  varying vec2 vUv;
  void main() {
    // Interpolation can overshoot the UV edge slightly; a negative fractional pow
    // creates NaNs that bloom spreads into large black rectangles.
    float fade = pow(clamp(1.0 - vUv.y, 0.0, 1.0), 1.6);
    float bands = 0.75 + 0.25 * sin(vUv.y * 90.0 - uTime * 4.0);
    float base = smoothstep(0.0, 0.02, vUv.y);
    gl_FragColor = vec4(uColor * 1.25, fade * bands * base * 0.2 * uStrength);
  }
`;

// The crystal standing at each project. Lighting it sends a beam into the sky,
// visible from anywhere on the planet and from orbit.
export class Beacon {
  constructor(accent, materials) {
    this.object = new Group();
    this.object.userData.dynamic = true;
    this.isLit = false;
    this.glow = 0;
    this.accent = new Color(accent);

    const pedestal = new Mesh(new CylinderGeometry(0.38, 0.52, 0.82, 12), materials.solid('#bcb5a4'));
    pedestal.position.y = 0.45;
    pedestal.castShadow = true;
    pedestal.receiveShadow = true;

    this.crystalMaterial = new MeshStandardMaterial({
      color: this.accent, emissive: this.accent, emissiveIntensity: 0.4, roughness: 0.25, metalness: 0.1, flatShading: true,
    });
    this.crystal = new Mesh(new OctahedronGeometry(0.42, 0), this.crystalMaterial);
    this.crystal.scale.set(1, 1.6, 1);
    this.crystal.position.y = 1.75;
    this.crystal.castShadow = true;

    this.ringMaterial = new MeshStandardMaterial({
      color: this.accent, emissive: this.accent, emissiveIntensity: 1.2, transparent: true, opacity: 0.7, side: DoubleSide, depthWrite: false,
    });
    this.ring = new Mesh(new RingGeometry(0.75, 0.95, 32), this.ringMaterial);
    this.ring.rotation.x = -Math.PI / 2;
    this.ring.position.y = 0.04;

    this.beamUniforms = { uColor: { value: this.accent }, uTime: { value: 0 }, uStrength: { value: 0 } };
    const beamGeometry = new CylinderGeometry(0.055, 0.1, BEAM_HEIGHT, 12, 1, true);
    beamGeometry.translate(0, BEAM_HEIGHT / 2 + 1.75, 0);
    this.beam = new Mesh(beamGeometry, new ShaderMaterial({
      uniforms: this.beamUniforms,
      vertexShader: beamVertexShader,
      fragmentShader: beamFragmentShader,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      side: DoubleSide,
    }));
    this.beam.visible = false;
    this.beam.frustumCulled = false;

    this.object.add(pedestal, this.crystal, this.ring, this.beam);
  }

  light() {
    this.isLit = true;
    this.beam.visible = true;
  }

  update(time, deltaSeconds, { spaceFactor = 0 } = {}) {
    this.glow += ((this.isLit ? 1 : 0) - this.glow) * damp(2.2, deltaSeconds);
    this.crystal.rotation.y = time * (0.8 + this.glow * 1.6);
    this.crystal.position.y = 1.75 + Math.sin(time * 2) * 0.12;
    this.crystalMaterial.emissiveIntensity = 0.3 + this.glow * 0.85 + (this.isLit ? 0 : Math.sin(time * 3) * 0.1 + 0.1);
    const pulse = (time * 0.8) % 1;
    this.ring.scale.setScalar(this.isLit ? 1.15 : 0.8 + pulse * 0.9);
    this.ringMaterial.opacity = this.isLit ? 0.55 : 0.75 * (1 - pulse);
    this.beamUniforms.uTime.value = time;
    this.beamUniforms.uStrength.value = this.glow * (0.18 + spaceFactor * 0.82);
  }
}
