import {
  AdditiveBlending, AmbientLight, BackSide, BufferAttribute, BufferGeometry, Color, DirectionalLight, Fog, Group,
  HemisphereLight, IcosahedronGeometry, Mesh, MeshStandardMaterial, Points, PointsMaterial, Quaternion, ShaderMaterial,
  SphereGeometry, Vector3,
} from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { PLANET } from '../config.js';
import { lerp, smoothstep, orientationFromUpForward, anyTangent } from '../utils/math.js';
import { createRandom, randomBetween } from '../utils/random.js';

const SKY_RADIUS = 900;
const STAR_RADIUS = 820;
const SHADOW_EXTENT = 24;

const SKY_COLORS = {
  dayZenith: new Color('#3b7de6'),
  dayHorizon: new Color('#c4e4ff'),
  goldenZenith: new Color('#4656b8'),
  goldenHorizon: new Color('#ffb27a'),
  nightZenith: new Color('#050a24'),
  nightHorizon: new Color('#1b2a66'),
};
const SUN_DAY = new Color('#fff1dc');
const SUN_GOLDEN = new Color('#ffad6b');

const skyVertexShader = /* glsl */ `
  varying vec3 vDirection;
  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vDirection = worldPosition.xyz - cameraPosition;
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
    gl_Position.z = gl_Position.w;
  }
`;

const skyFragmentShader = /* glsl */ `
  uniform vec3 uUp;
  uniform vec3 uSunDirection;
  uniform vec3 uZenith;
  uniform vec3 uHorizon;
  uniform vec3 uSunColor;
  uniform float uSpace;
  varying vec3 vDirection;
  void main() {
    vec3 direction = normalize(vDirection);
    float height = dot(direction, uUp);
    vec3 sky = mix(uHorizon, uZenith, smoothstep(-0.05, 0.7, height));
    sky = mix(sky, uHorizon * 0.55, smoothstep(0.0, -0.5, height));
    vec3 space = mix(vec3(0.003, 0.005, 0.025), vec3(0.018, 0.02, 0.075), 0.5 + 0.5 * direction.y);
    float sunAmount = max(dot(direction, uSunDirection), 0.0);
    vec3 sun = uSunColor * (pow(sunAmount, 1400.0) * 9.0 + pow(sunAmount, 14.0) * 0.3 * (1.0 - uSpace));
    gl_FragColor = vec4(mix(sky, space, uSpace) + sun, 1.0);
  }
`;

const haloVertexShader = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    vNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

const haloFragmentShader = /* glsl */ `
  uniform vec3 uSunDirection;
  uniform float uOpacity;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  void main() {
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    float rim = pow(max(0.0, -dot(vNormal, viewDirection)), 2.4);
    float lit = smoothstep(-0.35, 0.45, dot(normalize(vWorldPosition), uSunDirection));
    vec3 color = mix(vec3(0.12, 0.2, 0.75), vec3(0.45, 0.75, 1.0), lit);
    gl_FragColor = vec4(color * rim * 1.9, rim * uOpacity);
  }
`;

// Sky dome, stars, clouds, the orbital halo and every light of the scene.
export class Sky {
  constructor(scene, shadowMapSize) {
    this.group = new Group();
    this.skyUniforms = {
      uUp: { value: new Vector3(0, 1, 0) },
      uSunDirection: { value: new Vector3(0, 1, 0) },
      uZenith: { value: new Color() },
      uHorizon: { value: new Color() },
      uSunColor: { value: new Color() },
      uSpace: { value: 1 },
    };
    this.dome = new Mesh(new SphereGeometry(SKY_RADIUS, 32, 16), new ShaderMaterial({
      uniforms: this.skyUniforms, vertexShader: skyVertexShader, fragmentShader: skyFragmentShader,
      side: BackSide, depthWrite: false, depthTest: false,
    }));
    this.dome.renderOrder = -10;
    this.dome.frustumCulled = false;

    this.stars = this.#createStars();
    this.haloUniforms = { uSunDirection: this.skyUniforms.uSunDirection, uOpacity: { value: 1 } };
    this.halo = new Mesh(new IcosahedronGeometry(PLANET.radius * 1.24, 6), new ShaderMaterial({
      uniforms: this.haloUniforms, vertexShader: haloVertexShader, fragmentShader: haloFragmentShader,
      side: BackSide, transparent: true, depthWrite: false, blending: AdditiveBlending,
    }));
    this.clouds = this.#createClouds();
    this.group.add(this.dome, this.stars, this.halo, this.clouds);

    this.sun = new DirectionalLight(SUN_DAY, 2.6);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(shadowMapSize, shadowMapSize);
    Object.assign(this.sun.shadow.camera, { left: -SHADOW_EXTENT, right: SHADOW_EXTENT, top: SHADOW_EXTENT, bottom: -SHADOW_EXTENT, near: 1, far: 140 });
    this.sun.shadow.bias = -0.0004;
    this.sun.shadow.normalBias = 0.035;
    this.moon = new DirectionalLight('#9fb6ff', 0);
    this.hemisphere = new HemisphereLight('#cfe6ff', '#5c4a3a', 1);
    this.ambient = new AmbientLight('#8fa4ff', 0.15);
    this.group.add(this.sun, this.sun.target, this.moon, this.moon.target, this.hemisphere, this.ambient);

    this.fog = new Fog('#c4e4ff', 40, 150);
    scene.fog = this.fog;
    this.nightFactor = 0;
  }

  // `up` is the visitor's local vertical; `spaceFactor` 1 means the camera is in orbit.
  update({ camera, up, focus, sunDirection, spaceFactor, deltaSeconds }) {
    const elevation = up.dot(sunDirection);
    const golden = smoothstep(0.42, 0.05, elevation);
    const night = 1 - smoothstep(-0.14, 0.2, elevation);
    this.nightFactor = night;

    const zenith = this.skyUniforms.uZenith.value.copy(SKY_COLORS.dayZenith).lerp(SKY_COLORS.goldenZenith, golden).lerp(SKY_COLORS.nightZenith, night);
    const horizon = this.skyUniforms.uHorizon.value.copy(SKY_COLORS.dayHorizon).lerp(SKY_COLORS.goldenHorizon, golden).lerp(SKY_COLORS.nightHorizon, night);
    this.skyUniforms.uSunColor.value.copy(SUN_DAY).lerp(SUN_GOLDEN, golden);
    this.skyUniforms.uUp.value.copy(up);
    this.skyUniforms.uSunDirection.value.copy(sunDirection);
    this.skyUniforms.uSpace.value = spaceFactor;

    this.dome.position.copy(camera.position);
    this.stars.position.copy(camera.position);
    this.stars.material.opacity = Math.max(spaceFactor, night) * 0.95;
    this.halo.material.uniforms.uOpacity.value = spaceFactor;
    this.halo.visible = spaceFactor > 0.01;
    this.clouds.rotation.y += deltaSeconds * 0.012;

    const sunStrength = smoothstep(-0.12, 0.12, elevation);
    this.sun.color.copy(this.skyUniforms.uSunColor.value);
    this.sun.intensity = lerp(2.7 * sunStrength, 2.6, spaceFactor);
    this.sun.position.copy(focus).addScaledVector(sunDirection, 70);
    this.sun.target.position.copy(focus);
    this.moon.intensity = lerp(night * 0.7, 0.35, spaceFactor);
    this.moon.position.copy(focus).addScaledVector(sunDirection, -70);
    this.moon.target.position.copy(focus);

    this.hemisphere.position.copy(up);
    this.hemisphere.color.copy(zenith).lerp(WHITE, 0.45);
    this.hemisphere.groundColor.set(night > 0.5 ? '#1a2040' : '#5c4a3a');
    this.hemisphere.intensity = lerp(lerp(1.05, 0.55, night), 0.35, spaceFactor);
    this.ambient.intensity = lerp(0.12, 0.25, spaceFactor);

    this.fog.color.copy(horizon);
    this.fog.near = lerp(38, 4000, spaceFactor);
    this.fog.far = lerp(150, 6000, spaceFactor);
  }

  #createStars() {
    const random = createRandom(77);
    const count = 1800;
    const positions = new Float32Array(count * 3);
    const direction = new Vector3();
    for (let index = 0; index < count; index++) {
      direction.set(random() * 2 - 1, random() * 2 - 1, random() * 2 - 1).normalize().multiplyScalar(STAR_RADIUS);
      positions.set([direction.x, direction.y, direction.z], index * 3);
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(positions, 3));
    const stars = new Points(geometry, new PointsMaterial({
      color: '#fff6e8', size: 1.8, sizeAttenuation: false, transparent: true, opacity: 0, depthWrite: false, fog: false,
    }));
    stars.frustumCulled = false;
    stars.renderOrder = -9;
    return stars;
  }

  #createClouds() {
    const random = createRandom(31);
    const group = new Group();
    const material = new MeshStandardMaterial({ color: '#ffffff', roughness: 1, flatShading: true, emissive: '#ffffff', emissiveIntensity: 0.08 });
    const orientation = new Quaternion();
    const tangent = new Vector3();
    for (let index = 0; index < 18; index++) {
      const puffs = [];
      const puffCount = 3 + Math.floor(random() * 3);
      for (let puff = 0; puff < puffCount; puff++) {
        const geometry = new IcosahedronGeometry(randomBetween(random, 1.1, 2), 0);
        geometry.translate((puff - puffCount / 2) * 1.5, random() * 0.6, randomBetween(random, -0.6, 0.6));
        puffs.push(geometry);
      }
      const cloud = new Mesh(mergeGeometries(puffs), material);
      cloud.scale.set(1, 0.55, 1);
      const direction = new Vector3(random() * 2 - 1, (random() * 2 - 1) * 0.8, random() * 2 - 1).normalize();
      cloud.position.copy(direction).multiplyScalar(PLANET.radius + randomBetween(random, 15, 19));
      orientationFromUpForward(direction, anyTangent(direction, tangent).applyAxisAngle(direction, random() * 6), orientation);
      cloud.quaternion.copy(orientation);
      group.add(cloud);
    }
    return group;
  }
}

const WHITE = new Color('#ffffff');
