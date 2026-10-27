import {
  ACESFilmicToneMapping, HalfFloatType, PCFSoftShadowMap, PerspectiveCamera, Scene, Vector2, WebGLRenderer,
  WebGLRenderTarget,
} from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { CAMERA, QUALITY } from '../config.js';

// WebGL renderer, camera and post-processing (bloom for every glowing light).
export class Renderer {
  constructor(container, quality) {
    this.quality = quality;
    this.renderer = new WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, quality.pixelRatioCap));
    this.renderer.toneMapping = ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = PCFSoftShadowMap;
    this.renderer.domElement.className = 'world-canvas';
    this.renderer.domElement.setAttribute('aria-label', 'Planète Mounir — monde 3D');
    this.renderer.domElement.tabIndex = 0;
    this.renderer.domElement.addEventListener('pointerdown', () => this.canvas.focus({ preventScroll: true }));
    container.append(this.renderer.domElement);

    this.scene = new Scene();
    this.camera = new PerspectiveCamera(CAMERA.fov, 1, 0.1, 2400);

    const size = this.#viewportSize();
    const target = new WebGLRenderTarget(size.x, size.y, { type: HalfFloatType, samples: quality.bloom ? 4 : 0 });
    this.composer = new EffectComposer(this.renderer, target);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    // Bloom belongs to emissive lights, not white logo artwork or sunlit signs.
    this.bloom = new UnrealBloomPass(new Vector2(size.x / 2, size.y / 2), 0.45, 0.45, 1.08);
    this.bloom.enabled = quality.bloom;
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());

    this.resizeListeners = new Set();
    window.addEventListener('resize', () => this.resize());
    this.resize();
  }

  get canvas() {
    return this.renderer.domElement;
  }

  setQuality(name) {
    const quality = QUALITY[name];
    if (!quality) return;
    this.quality = quality;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, quality.pixelRatioCap));
    this.bloom.enabled = quality.bloom;
    for (const target of [this.composer.renderTarget1, this.composer.renderTarget2]) {
      const samples = quality.bloom ? 4 : 0;
      if (target.samples !== samples) { target.samples = samples; target.dispose(); }
    }
    this.resize();
  }

  onResize(listener) {
    this.resizeListeners.add(listener);
  }

  resize() {
    const { x, y } = this.#viewportSize();
    this.camera.aspect = x / y;
    this.camera.fov = x < y ? CAMERA.fov + 12 : CAMERA.fov;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(x, y);
    this.composer.setPixelRatio(this.renderer.getPixelRatio());
    this.composer.setSize(x, y);
    this.resizeListeners.forEach(listener => listener(x, y * this.renderer.getPixelRatio()));
  }

  render() {
    // The composer has several passes; keep meaningful whole-frame statistics.
    this.renderer.info.autoReset = false;
    this.renderer.info.reset();
    this.composer.render();
  }

  #viewportSize() {
    return new Vector2(window.innerWidth, window.innerHeight);
  }
}
