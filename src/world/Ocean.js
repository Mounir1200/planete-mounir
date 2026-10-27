import { IcosahedronGeometry, Mesh, MeshStandardMaterial } from 'three';
import { PLANET } from '../config.js';

// A faceted sea sphere whose vertices ripple in the vertex shader.
export class Ocean {
  constructor(detail = 40) {
    this.uniforms = { uTime: { value: 0 } };
    const material = new MeshStandardMaterial({
      color: '#286e89',
      roughness: 0.34,
      metalness: 0.08,
      // An opaque sea hides the far side of the planet and submerged scenery.
      // A translucent globe made trees behind the horizon appear underwater.
      transparent: false,
      flatShading: false,
    });
    material.onBeforeCompile = shader => {
      shader.uniforms.uTime = this.uniforms.uTime;
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nuniform float uTime;')
        .replace('#include <begin_vertex>', /* glsl */ `
          #include <begin_vertex>
          float wave = sin(position.x * 0.9 + uTime * 1.3) + sin(position.y * 1.1 + uTime * 1.05) + sin(position.z * 0.8 + uTime * 1.6);
          transformed += normalize(position) * wave * 0.025;
        `);
    };
    this.mesh = new Mesh(new IcosahedronGeometry(PLANET.seaLevel, detail), material);
    this.mesh.receiveShadow = true;
    this.mesh.name = 'ocean';
  }

  update(time) {
    this.uniforms.uTime.value = time;
  }
}
