import { CylinderGeometry, DoubleSide, Group, TorusGeometry } from 'three';
import { damp, lerp } from '../utils/math.js';
import { buildHead, createHeadMaterials } from './AvatarHead.js';
import { addMesh, bakeNode, characterMaterial, ellipsoid, loft, panel, tube } from './avatarParts.js';

const TAU = Math.PI * 2;
const HIP_HEIGHT = 0.94;
const THIGH_LENGTH = 0.42;
const SHIN_LENGTH = 0.4;
const UPPER_ARM_LENGTH = 0.3;
const FOREARM_LENGTH = 0.25;
const SHIRT_OPENING = 0.42;

// Mounir as a faceless stylised game character: athletic build, short hair and
// rectangular glasses, cobalt overshirt over a peach tee, khaki cargo joggers and
// chunky white trainers. Feet rest on y = 0; the crown is about 2 units high.
export class Avatar {
  constructor() {
    this.object = new Group();
    this.object.name = 'Mounir';
    this.body = new Group();
    this.object.add(this.body);
    this.walkPhase = 0;
    this.clock = 0;
    this.squash = 0;
    this.wave = 0;
    this.motion = 0;
    this.lookTimer = 3.5;
    this.headTurn = 0;
    this.headTurnTarget = 0;
    this.materials = this.#createMaterials();
    this.#buildLegs();
    this.#buildTorso();
    this.#buildArms();
    this.#buildHead();
    bakeNode(this.body);
  }

  #createMaterials() {
    const skin = characterMaterial('#7b4c35', { roughness: 0.55, rim: 0.32, rimColor: '#ffcfa8' });
    return {
      skin,
      head: createHeadMaterials(skin),
      tee: characterMaterial('#f5ab7d', { roughness: 0.85, rim: 0.25 }),
      teeEdge: characterMaterial('#e8956a', { roughness: 0.85, rim: 0.2 }),
      shirt: characterMaterial('#2b50d4', { roughness: 0.82, rim: 0.4, rimColor: '#9fc0ff', side: DoubleSide }),
      shirtEdge: characterMaterial('#4a70ea', { roughness: 0.8, rim: 0.3, rimColor: '#9fc0ff' }),
      shirtShade: characterMaterial('#1f3ba6', { roughness: 0.85, rim: 0.2 }),
      button: characterMaterial('#e8e4dc', { roughness: 0.4, rim: 0.2 }),
      trousers: characterMaterial('#6d6447', { roughness: 0.92, rim: 0.3, rimColor: '#e8dcc0' }),
      trousersShade: characterMaterial('#575038', { roughness: 0.92, rim: 0.2 }),
      sock: characterMaterial('#efede8', { roughness: 0.9, rim: 0.2 }),
      shoe: characterMaterial('#f4f2ee', { roughness: 0.6, rim: 0.2 }),
      shoeGrey: characterMaterial('#cfccc6', { roughness: 0.7, rim: 0.15 }),
      sole: characterMaterial('#e6e3dc', { roughness: 0.8, rim: 0.1 }),
      accent: characterMaterial('#ff9a5c', { roughness: 0.6, rim: 0.2 }),
    };
  }

  #buildLegs() {
    const m = this.materials;
    this.hips = new Group();
    this.hips.position.y = HIP_HEIGHT;
    this.body.add(this.hips);
    addMesh(this.hips, loft([[-0.1, 0.17, 0.118], [0, 0.174, 0.121], [0.04, 0.17, 0.117]]), m.trousers);

    this.legs = [];
    this.knees = [];
    this.ankles = [];
    for (const side of [-1, 1]) {
      const hip = new Group();
      hip.position.x = side * 0.104;
      this.hips.add(hip);
      addMesh(hip, loft([[0.04, 0.104, 0.106], [-0.12, 0.101, 0.104], [-0.28, 0.089, 0.091], [-THIGH_LENGTH + 0.005, 0.079, 0.081]], { caps: false }), m.trousers);
      // Cargo pocket on the outer thigh, with its flap.
      ellipsoid(hip, m.trousers, [side * 0.088, -0.24, 0.004], [0.026, 0.062, 0.058]);
      ellipsoid(hip, m.trousersShade, [side * 0.092, -0.19, 0.004], [0.024, 0.016, 0.06]);

      const knee = new Group();
      knee.position.y = -THIGH_LENGTH;
      hip.add(knee);
      ellipsoid(knee, m.trousers, [0, 0, 0], [0.079, 0.045, 0.081]);
      addMesh(knee, loft([[-0.005, 0.077, 0.079], [-0.12, 0.075, 0.077], [-0.29, 0.066, 0.068], [-SHIN_LENGTH + 0.07, 0.057, 0.059]], { caps: false }), m.trousers);
      // Jogger cuff gathered at the ankle, then a white sock.
      addMesh(knee, loft([[-SHIN_LENGTH + 0.072, 0.056, 0.058], [-SHIN_LENGTH + 0.05, 0.05, 0.052], [-SHIN_LENGTH + 0.025, 0.05, 0.052]]), m.trousersShade);
      addMesh(knee, loft([[-SHIN_LENGTH + 0.027, 0.043, 0.045], [-SHIN_LENGTH - 0.03, 0.043, 0.045]]), m.sock);

      const ankle = new Group();
      ankle.position.y = -SHIN_LENGTH;
      knee.add(ankle);
      this.#buildShoe(ankle, side);
      this.legs.push(hip);
      this.knees.push(knee);
      this.ankles.push(ankle);
    }
  }

  // Chunky trainers as in the harbour photo. Ankle-local: the sole sits 0.12
  // below the ankle, toes toward +z.
  #buildShoe(ankle, side) {
    const m = this.materials;
    addMesh(ankle, loft([[-0.12, 0.068, 0.132, 0.032], [-0.104, 0.074, 0.138, 0.032]], { squareness: 0.72 }), m.shoeGrey);
    addMesh(ankle, loft([[-0.104, 0.074, 0.138, 0.032], [-0.08, 0.071, 0.134, 0.03]], { squareness: 0.72 }), m.sole);
    ellipsoid(ankle, m.shoe, [0, -0.07, 0.022], [0.066, 0.052, 0.112]);
    ellipsoid(ankle, m.shoe, [0, -0.08, 0.088], [0.063, 0.037, 0.068]);
    ellipsoid(ankle, m.shoeGrey, [side * 0.035, -0.07, 0.03], [0.038, 0.034, 0.08]);
    ellipsoid(ankle, m.shoeGrey, [0, -0.06, -0.07], [0.058, 0.045, 0.04]);
    ellipsoid(ankle, m.accent, [0, -0.035, -0.085], [0.022, 0.03, 0.012]);
    ellipsoid(ankle, m.shoe, [0, -0.028, 0.025], [0.045, 0.03, 0.05]);
    for (let row = 0; row < 3; row++) {
      const z = 0.035 + row * 0.022;
      const y = -0.034 - row * 0.012;
      tube(ankle, m.sole, [[-0.032, y, z], [0, y + 0.006, z + 0.006], [0.032, y, z]], 0.0035, { segments: 6 });
    }
  }

  #buildTorso() {
    const m = this.materials;
    this.torso = new Group();
    this.torso.position.y = 0.02;
    this.hips.add(this.torso);

    addMesh(this.torso, loft([[-0.12, 0.178, 0.125], [0.06, 0.183, 0.128], [0.2, 0.2, 0.138], [0.34, 0.228, 0.145], [0.44, 0.228, 0.136], [0.5, 0.18, 0.11], [0.55, 0.1, 0.085]]), m.tee);
    tube(this.torso, m.teeEdge, [[-0.08, 0.535, 0.07], [-0.04, 0.515, 0.092], [0, 0.51, 0.098], [0.04, 0.515, 0.092], [0.08, 0.535, 0.07]], 0.009, { segments: 10 });

    const shirt = [[-0.14, 0.196, 0.142], [-0.02, 0.197, 0.144], [0.15, 0.212, 0.151], [0.33, 0.243, 0.159], [0.44, 0.245, 0.149], [0.5, 0.2, 0.123], [0.54, 0.13, 0.1]];
    addMesh(this.torso, loft(shirt, { start: SHIRT_OPENING, arc: TAU - SHIRT_OPENING * 2, caps: false }), m.shirt);
    for (const side of [-1, 1]) {
      const edge = shirt.map(([y, halfWidth, halfDepth]) => [side * Math.sin(SHIRT_OPENING) * halfWidth, y, Math.cos(SHIRT_OPENING) * halfDepth]);
      tube(this.torso, m.shirtEdge, edge, 0.009, { segments: 18 });
      this.#buildCollar(side);
    }
    const [hemY, hemWidth, hemDepth] = shirt[0];
    const hem = Array.from({ length: 13 }, (_, step) => {
      const angle = SHIRT_OPENING + ((TAU - SHIRT_OPENING * 2) * step) / 12;
      return [Math.sin(angle) * hemWidth, hemY, Math.cos(angle) * hemDepth];
    });
    tube(this.torso, m.shirtEdge, hem, 0.007, { segments: 36 });

    const buttonX = Math.sin(SHIRT_OPENING) * 0.2;
    for (const y of [0.0, 0.12, 0.24, 0.36]) ellipsoid(this.torso, m.button, [buttonX + 0.012, y, 0.136], [0.009, 0.009, 0.005]);
    const pocketZ = 0.152;
    panel(this.torso, m.shirtShade, [[-0.17, 0.37], [-0.082, 0.37], [-0.082, 0.28], [-0.126, 0.265], [-0.17, 0.28]], { z: pocketZ - 0.006, depth: 0.008 });
    panel(this.torso, m.shirtEdge, [[-0.173, 0.375], [-0.079, 0.375], [-0.079, 0.345], [-0.125, 0.332], [-0.173, 0.345]], { z: pocketZ, depth: 0.008 });
    tube(this.torso, m.shirtShade, [[-0.22, 0.47, -0.09], [0, 0.45, -0.152], [0.22, 0.47, -0.09]], 0.004, { segments: 12 });

    // A strong neck, as in the portraits.
    addMesh(this.torso, new CylinderGeometry(0.09, 0.1, 0.15, 24), m.skin, { y: 0.59 });
    const collarBand = addMesh(this.torso, new TorusGeometry(0.11, 0.02, 8, 28, Math.PI * 1.25), m.shirt, { y: 0.54, z: -0.008, rx: Math.PI / 2, rz: -Math.PI * 0.125 - Math.PI });
    collarBand.scale.set(1, 1.05, 1.6);
  }

  #buildCollar(side) {
    const m = this.materials;
    const collar = new Group();
    collar.position.set(side * 0.058, 0.51, 0.1);
    collar.rotation.set(-0.35, side * 0.55, 0);
    this.torso.add(collar);
    const outline = [[0, 0.045], [side * 0.08, 0.022], [side * 0.112, -0.065], [side * 0.065, -0.05], [side * 0.02, -0.022]];
    panel(collar, m.shirt, outline, { depth: 0.008 });
  }

  #buildArms() {
    const m = this.materials;
    this.arms = [];
    this.elbows = [];
    this.hands = [];
    for (const side of [-1, 1]) {
      const shoulder = new Group();
      shoulder.position.set(side * 0.238, 0.45, 0);
      shoulder.rotation.z = side * 0.1;
      this.torso.add(shoulder);
      ellipsoid(shoulder, m.shirt, [side * -0.03, 0.005, 0], [0.085, 0.062, 0.084]);
      addMesh(shoulder, loft([[0.01, 0.074, 0.078], [-0.1, 0.073, 0.076], [-0.2, 0.066, 0.069], [-UPPER_ARM_LENGTH - 0.01, 0.06, 0.063]], { caps: false }), m.shirt);
      tube(shoulder, m.shirtShade, [[side * 0.084, -0.02, 0], [side * 0.08, -0.15, 0], [side * 0.066, -0.28, 0]], 0.003, { segments: 8 });

      const elbow = new Group();
      elbow.position.y = -UPPER_ARM_LENGTH;
      shoulder.add(elbow);
      ellipsoid(elbow, m.shirt, [0, 0, 0], [0.062, 0.05, 0.064]);
      addMesh(elbow, loft([[0.01, 0.062, 0.064], [-0.12, 0.059, 0.061], [-FOREARM_LENGTH + 0.04, 0.055, 0.057]], { caps: false }), m.shirt);
      addMesh(elbow, loft([[-FOREARM_LENGTH + 0.045, 0.061, 0.063], [-FOREARM_LENGTH + 0.005, 0.061, 0.063]]), m.shirtEdge);
      ellipsoid(elbow, m.button, [side * 0.058, -FOREARM_LENGTH + 0.025, 0.02], [0.006, 0.006, 0.006]);

      const hand = new Group();
      hand.position.y = -FOREARM_LENGTH;
      elbow.add(hand);
      addMesh(hand, new CylinderGeometry(0.042, 0.046, 0.05, 16), m.skin, { y: 0.005 });
      ellipsoid(hand, m.skin, [0, -0.062, 0.004], [0.046, 0.064, 0.032]);
      ellipsoid(hand, m.skin, [-side * 0.035, -0.048, 0.03], [0.018, 0.038, 0.018], { rz: -side * 0.5, rx: -0.3 });
      ellipsoid(hand, m.skin, [0, -0.118, 0.01], [0.04, 0.026, 0.027]);

      this.arms.push(shoulder);
      this.elbows.push(elbow);
      this.hands.push(hand);
    }
  }

  #buildHead() {
    this.head = new Group();
    this.head.position.set(0, 0.56, 0.012);
    this.torso.add(this.head);
    buildHead(this.head, this.materials.head);
  }

  startWave(duration = 2.2) {
    this.wave = duration;
  }

  land(impact) {
    this.squash = Math.min(0.09, Math.max(0, impact) * 0.01);
  }

  update(deltaSeconds, { speedRatio = 0, airborne = false, verticalSpeed = 0 } = {}) {
    const dt = Math.min(0.1, Math.max(0, deltaSeconds));
    const speed = Math.max(0, Math.min(1, speedRatio));
    this.clock += dt;
    this.motion = lerp(this.motion, speed, damp(10, dt));
    const moving = Math.min(1, this.motion * 3.5);
    const sprint = Math.max(0, (this.motion - 0.5) * 2);
    this.walkPhase += dt * lerp(7.4, 11.6, this.motion) * moving;
    const smooth = damp(14, dt);
    const amplitude = lerp(0.34, 0.7, sprint) * moving;
    const isWaving = this.wave > 0;
    this.wave = Math.max(0, this.wave - dt);
    this.#animateLimbs({ airborne, moving, sprint, smooth, amplitude, isWaving });
    this.#animateBody({ airborne, moving, sprint, smooth, verticalSpeed, dt });
    this.#animateHead({ speed, isWaving, dt });
  }

  #animateLimbs({ airborne, moving, sprint, smooth, amplitude, isWaving }) {
    for (let index = 0; index < 2; index++) {
      const phase = this.walkPhase + index * Math.PI;
      const swing = Math.sin(phase) * amplitude;
      const lifted = Math.max(0, -Math.sin(phase));
      const hipTarget = airborne ? (index ? 0.15 : -0.4) : swing;
      const kneeTarget = airborne ? (index ? 0.5 : 0.7) : lifted * lerp(0.5, 1.15, sprint) * moving;
      this.legs[index].rotation.x = lerp(this.legs[index].rotation.x, hipTarget, smooth);
      this.knees[index].rotation.x = lerp(this.knees[index].rotation.x, kneeTarget, smooth);
      this.ankles[index].rotation.x = lerp(this.ankles[index].rotation.x, airborne ? -0.2 : -swing * 0.42 - kneeTarget * 0.25, smooth);

      const side = index ? 1 : -1;
      let shoulder = airborne ? -0.75 : -swing * 0.8;
      let elbow = airborne ? -0.7 : -0.18 - sprint * 0.55 - lifted * moving * 0.1;
      let spread = side * (0.09 + (airborne ? 0.25 : 0));
      if (index === 1 && isWaving) {
        shoulder = -2.1;
        elbow = -0.55;
        spread = 0.25 + Math.sin(this.clock * 10) * 0.12;
      }
      this.arms[index].rotation.x = lerp(this.arms[index].rotation.x, shoulder, smooth);
      this.arms[index].rotation.z = lerp(this.arms[index].rotation.z, spread, smooth);
      this.elbows[index].rotation.x = lerp(this.elbows[index].rotation.x, elbow, smooth);
      this.hands[index].rotation.z = lerp(this.hands[index].rotation.z, index === 1 && isWaving ? Math.sin(this.clock * 12) * 0.25 : 0, smooth);
    }
  }

  #animateBody({ airborne, moving, sprint, smooth, verticalSpeed, dt }) {
    const bob = airborne ? 0 : Math.abs(Math.sin(this.walkPhase)) * lerp(0.018, 0.036, sprint) * moving;
    this.hips.position.y = HIP_HEIGHT + bob - this.squash * 0.35;
    this.hips.rotation.y = Math.sin(this.walkPhase) * 0.05 * moving;
    this.torso.rotation.y = -Math.sin(this.walkPhase) * 0.07 * moving;
    this.torso.rotation.x = lerp(this.torso.rotation.x, sprint * 0.12 + (airborne ? -0.05 : 0), smooth);
    this.torso.rotation.z = Math.sin(this.walkPhase) * 0.02 * moving;
    this.torso.scale.y = 1 + Math.sin(this.clock * 1.8) * 0.006 * (1 - moving);
    this.squash = Math.max(0, this.squash - dt * 0.35);
    const stretch = airborne ? Math.min(0.03, Math.abs(verticalSpeed) * 0.0025) : 0;
    this.body.scale.set(1 + this.squash * 0.25, 1 - this.squash + stretch, 1 + this.squash * 0.25);
  }

  #animateHead({ speed, isWaving, dt }) {
    this.lookTimer -= dt;
    if (this.lookTimer <= 0) {
      this.lookTimer = 3.2 + Math.random() * 3;
      this.headTurnTarget = speed > 0.1 ? 0 : (Math.random() - 0.5) * 0.5;
    }
    if (speed > 0.1) this.headTurnTarget = 0;
    this.headTurn = lerp(this.headTurn, this.headTurnTarget, damp(3, dt));
    this.head.rotation.y = this.headTurn;
    this.head.rotation.z = isWaving ? -0.06 : 0;
  }
}
