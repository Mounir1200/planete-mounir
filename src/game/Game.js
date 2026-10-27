import { Vector3 } from 'three';
import { AudioEngine } from '../audio/AudioEngine.js';
import { CameraRig } from '../camera/CameraRig.js';
import { CAMERA, PLAYER } from '../config.js';
import { DIALOGUES } from '../content/dialogues.js';
import { BEACON_IDS, SPAWN_PLACE } from '../content/places.js';
import { PROFILE, SKILLS } from '../content/profile.js';
import { UI } from '../content/ui-strings.js';
import { EventBus } from '../core/EventBus.js';
import { Input } from '../core/Input.js';
import { Renderer } from '../core/Renderer.js';
import { initRustPhysics } from '../core/RustPhysics.js';
import { currentLanguage, format, initLanguage, onLanguageChange, setLanguage, t } from '../i18n.js';
import { Avatar } from '../player/Avatar.js';
import { Companion } from '../player/Companion.js';
import { PlayerController } from '../player/PlayerController.js';
import { Hud } from '../ui/Hud.js';
import { Journal } from '../ui/Journal.js';
import { PlacePanel } from '../ui/PlacePanel.js';
import { FinaleScreen, IntroScreen, LoadingScreen, TouchControls } from '../ui/Screens.js';
import { Speech } from '../ui/Speech.js';
import { Settings } from '../ui/Settings.js';
import { WorldLabels } from '../ui/WorldLabels.js';
import { createElement, escapeHtml, prefersReducedMotion } from '../ui/dom.js';
import { formatDistance } from '../utils/math.js';
import { World } from '../world/World.js';
import { Navigator } from './Navigator.js';
import { Progress } from './Progress.js';

const MAX_FRAME_SECONDS = 1 / 20;
const HINT_DELAY_SECONDS = 55;
const WATER_LINE_COOLDOWN = 40;
const FIREWORK_SECONDS = 7;

// Orchestrates the visit: loading, title, landing, exploration, map, travel and finale.
export class Game {
  constructor({ root, quality }) {
    this.root = root;
    this.quality = quality;
    this.mode = 'loading';
    this.time = 0;
    this.timeSinceDiscovery = 0;
    this.timeSinceWaterLine = WATER_LINE_COOLDOWN;
    this.hasAnnouncedNight = false;
    this.fireworkTimer = 0;
    this.viewport = { width: window.innerWidth, height: window.innerHeight };
  }

  async start() {
    this.progress = new Progress();
    initLanguage(this.progress.language);
    document.title = t(UI.documentTitle);
    this.events = new EventBus();
    await initRustPhysics();
    this.renderer = new Renderer(this.root, this.quality);
    this.ui = createElement('div', { className: 'ui' });
    this.root.append(this.ui);
    const loading = new LoadingScreen(this.ui);

    await Promise.all([
      document.fonts.load('700 32px "Space Grotesk Variable"'),
      document.fonts.load('400 32px "Instrument Serif"'),
    ]).catch(() => {});

    this.world = new World({
      scene: this.renderer.scene,
      quality: this.quality,
      collectedSkills: this.progress.skills,
      onProgress: (step, ratio) => loading.progress(step, ratio),
    });
    await this.world.build();
    this.#createActors();
    this.rig.reducedMotion = this.progress.reducedMotion ?? prefersReducedMotion();
    this.ui.classList.toggle('is-reduced-motion', this.rig.reducedMotion);
    this.ui.classList.toggle('is-quiet', this.progress.quietHud);
    this.#createInterface();
    this.#bindEvents();
    this.#restoreProgress();

    this.renderer.onResize((width, height) => {
      this.viewport = { width: window.innerWidth, height: window.innerHeight };
      this.world.setViewportHeight(height);
    });
    this.renderer.resize();
    this.lastFrame = performance.now();
    this.renderer.renderer.setAnimationLoop(() => this.#frame());
    loading.hide();
    this.mode = 'intro';
    this.intro.show();
    if (new URLSearchParams(location.search).has('debug')) window.planet = this;
  }

  #createActors() {
    const spawn = this.world.landmarks.entry(SPAWN_PLACE);
    this.avatar = new Avatar();
    this.player = new PlayerController({
      terrain: this.world.terrain, landmarks: this.world.landmarks, scatter: this.world.scatter, avatar: this.avatar, events: this.events,
    });
    this.player.placeAt(spawn.spawnPoint, spawn.spawnPoint.clone().multiplyScalar(2).sub(spawn.interactPoint));
    this.companion = new Companion();
    this.renderer.scene.add(this.avatar.object, this.companion.object);

    this.camera = this.renderer.camera;
    this.rig = new CameraRig(this.camera, this.world.terrain, { reducedMotion: prefersReducedMotion() });
    this.rig.heading.copy(this.player.facing);
    const introView = spawn.place.direction.clone().applyAxisAngle(new Vector3(0, 1, 0), -0.5).normalize();
    this.rig.setOrbitAbove(introView.add(new Vector3(0, 0.25, 0)).normalize(), new Vector3(0, 1, 0));
    this.navigator = new Navigator(this.world.landmarks);
    this.audio = new AudioEngine();
    this.input = new Input(this.renderer.canvas, this.events);
  }

  #createInterface() {
    const places = this.world.layout.places;
    const beacons = places.filter(place => place.beacon);
    this.hud = new Hud(this.ui, { beacons, onAction: action => this.#handleAction(action) });
    this.labels = new WorldLabels(this.ui, { entries: this.world.landmarks.entries, onSelect: id => this.#travelTo(id) });
    this.speech = new Speech(this.ui, { onLine: () => this.audio.play('speak') });
    this.panel = new PlacePanel(this.ui, { onClose: () => this.#afterPanelClosed(), onCopy: value => this.#copy(value) });
    this.journal = new Journal(this.ui, {
      places,
      onRead: id => this.#openPlace(id),
      onTravel: id => this.#travelTo(id),
      onClose: () => this.audio.play('close'),
    });
    this.intro = new IntroScreen(this.ui, {
      onLand: () => this.#land(),
      onJournal: () => this.#openJournal(),
      onSound: () => this.#toggleSound(),
      onLanguage: () => this.#toggleLanguage(),
    });
    this.finale = new FinaleScreen(this.ui, {
      onContact: () => { this.finale.hide(); this.#openPlace('poste'); },
      onClose: () => { this.finale.hide(); this.#returnToGround(); },
    });
    this.touch = new TouchControls(this.ui, this.input, { onInteract: () => this.#handleAction('interact') });
    this.settings = new Settings(this.ui, {
      onClose: () => { this.input.releaseAll(); },
      onChange: (field, value) => this.#changeSetting(field, value),
    });
    this.hud.render();
    this.labels.render(this.progress.visited);
    onLanguageChange(() => this.#renderTexts());
  }

  #bindEvents() {
    this.events.on('action', action => this.#handleAction(action));
    this.events.on('step', position => {
      this.audio.play('step');
      if (this.player.speed > PLAYER.walkSpeed + 0.5) this.world.dust.emit(this.#feet(position), { count: 2, color: '#efe3cc', speed: 1, spread: 1, life: 0.6, size: 0.4, gravity: 0.5 });
    });
    this.events.on('splash', position => {
      this.audio.play('splash');
      this.world.dust.emit(this.#feet(position), { count: 8, color: '#d8f0ff', speed: 2.5, spread: 1, direction: this.player.up, life: 0.6, size: 0.3, gravity: 9 });
    });
    this.events.on('jump', position => {
      this.audio.play('jump');
      this.world.dust.emit(this.#feet(position), { count: 8, color: '#efe3cc', speed: 1.6, spread: 1, life: 0.6, size: 0.45, gravity: 0.5 });
    });
    this.events.on('doubleJump', position => {
      this.audio.play('doubleJump');
      this.world.sparkles.emit(this.#feet(position), { count: 22, color: '#ffb47e', speed: 3, spread: 1, life: 0.7, size: 0.25, gravity: 0 });
    });
    this.events.on('land', position => {
      this.audio.play('land');
      this.world.dust.emit(this.#feet(position), { count: 14, color: '#efe3cc', speed: 2.4, spread: 1, life: 0.7, size: 0.5, gravity: 0.5 });
    });
    this.events.on('deepWater', () => {
      if (this.timeSinceWaterLine < WATER_LINE_COOLDOWN || this.speech.isSpeaking) return;
      this.timeSinceWaterLine = 0;
      this.speech.say(DIALOGUES.water);
    });
  }

  #restoreProgress() {
    for (const id of this.progress.visited) this.world.landmarks.entry(id)?.beacon?.light();
    this.#refreshHud();
  }

  #frame() {
    const now = performance.now();
    const deltaSeconds = Math.min(MAX_FRAME_SECONDS, (now - this.lastFrame) / 1000);
    this.lastFrame = now;
    if (document.hidden) return;
    if (this.settings.isOpen) {
      this.input.enabled = false;
      this.renderer.render();
      return;
    }
    this.time += deltaSeconds;
    this.timeSinceWaterLine += deltaSeconds;

    const isBlocked = this.panel.isOpen || this.journal.isOpen || this.finale.isOpen || this.settings.isOpen;
    const canPlay = this.mode === 'play' && !isBlocked;
    this.input.enabled = canPlay;
    const look = this.input.consumeLook();
    if (!isBlocked && (look.x || look.y)) this.rig.look(look.x, look.y);
    const zoom = this.input.consumeZoom();
    if (!isBlocked && zoom) this.rig.zoom(zoom);

    const movement = canPlay ? this.input.movement() : { x: 0, y: 0, run: false };
    const jump = this.input.consumeJump() && canPlay;
    this.camera.getWorldDirection(this.cameraDirection ??= new Vector3());
    this.player.update(deltaSeconds, { ...movement, jump }, this.cameraDirection);
    if (this.input.hasMoved) this.hud.hideControlsHint();

    this.rig.update(deltaSeconds, this.player);
    const nightFactor = this.world.update({
      time: this.time, deltaSeconds, camera: this.camera, up: this.player.up, focus: this.player.position, spaceFactor: this.rig.spaceFactor,
    });
    this.companion.update(deltaSeconds, this.time, this.player, nightFactor);
    this.audio.setNight(nightFactor);

    if (this.mode === 'play') this.#updateExploration(deltaSeconds, nightFactor, canPlay);
    this.#updateSkills();
    this.#updateFireworks(deltaSeconds);
    this.labels.setVisible(!isBlocked && (this.mode === 'play' || this.mode === 'map'));
    this.labels.update(this.camera, this.viewport, this.player.position, this.promptEntry?.place.id);
    this.speech.setVisible(canPlay);
    this.speech.update(deltaSeconds, this.companion.position.clone().addScaledVector(this.player.up, 0.45), this.camera, this.viewport);
    this.renderer.render();
  }

  #updateExploration(deltaSeconds, nightFactor, canPlay) {
    this.promptEntry = canPlay ? this.navigator.placeInReach(this.player.position) : null;
    this.hud.setPrompt(this.promptEntry?.place ?? null);
    this.touch.setActionAvailable(Boolean(this.promptEntry));

    const objective = this.navigator.nextBeacon(this.player, this.camera, this.progress.visited);
    this.hud.setObjective(objective);
    this.companion.lookAt(objective ? objective.entry.beaconPoint : null);
    this.hud.update({ isNight: nightFactor > 0.5 });

    if (!canPlay) return;
    this.timeSinceDiscovery += deltaSeconds;
    if (objective && this.timeSinceDiscovery > HINT_DELAY_SECONDS && !this.speech.isSpeaking) {
      this.timeSinceDiscovery = 0;
      this.speech.say([format(DIALOGUES.hint[0], { place: t(objective.place.name), distance: formatDistance(objective.distance) })]);
    }
    if (nightFactor > 0.75 && !this.hasAnnouncedNight && !this.speech.isSpeaking) {
      this.hasAnnouncedNight = true;
      this.speech.say(DIALOGUES.nightfall);
    }
  }

  #updateSkills() {
    const playerPosition = this.mode === 'play' ? this.player.position : null;
    for (const token of this.world.skillTokens.update(this.time, playerPosition)) {
      if (!this.progress.collectSkill(token.skill.id)) continue;
      const count = this.progress.skills.size;
      this.world.sparkles.emit(token.worldPosition, { count: 60, color: '#ffb47e', speed: 4, spread: 1, life: 1, size: 0.3, gravity: 1 });
      this.audio.play('collect');
      this.hud.skillToast(token.skill, count);
      this.#refreshHud();
      if (count === SKILLS.length) this.speech.say(DIALOGUES.allSkills);
      else this.speech.say([format(DIALOGUES.skillFound[0], { skill: token.skill.name, count })]);
    }
  }

  #updateFireworks(deltaSeconds) {
    if (this.fireworkTimer <= 0) return;
    this.fireworkTimer -= deltaSeconds;
    this.nextBurst = (this.nextBurst ?? 0) - deltaSeconds;
    if (this.nextBurst > 0) return;
    this.nextBurst = 0.28;
    const entries = this.world.landmarks.entries.filter(entry => entry.beacon);
    const entry = entries[Math.floor(Math.random() * entries.length)];
    const origin = entry.beaconPoint.clone().addScaledVector(entry.place.direction, 8 + Math.random() * 14);
    this.world.sparkles.emit(origin, { count: 70, color: entry.place.accent, speed: 7, spread: 1, life: 1.6, size: 0.9, gravity: 1.5, drag: 1.2 });
    this.audio.play('firework');
  }

  #handleAction(action) {
    // A dialog owns keyboard input until it closes; shortcuts cannot stack another view over it.
    if (this.panel.isOpen || this.journal.isOpen || this.finale.isOpen || this.settings.isOpen) {
      if (action === 'back') this.#back();
      else if (action === 'journal' && this.journal.isOpen) this.journal.close();
      return;
    }
    if (this.mode === 'loading' || this.rig.isFlying) return;
    switch (action) {
      case 'settings':
        this.#openSettings();
        break;
      case 'interact':
        if (this.mode === 'play' && this.promptEntry && !this.panel.isOpen) this.#openPlace(this.promptEntry.place.id);
        else if (this.speech.isSpeaking) this.speech.next();
        break;
      case 'map':
        if (this.mode === 'play' && !this.panel.isOpen && !this.journal.isOpen) this.#openMap();
        else if (this.mode === 'map') this.#returnToGround();
        break;
      case 'journal':
        if (this.journal.isOpen) this.journal.close();
        else this.#openJournal();
        break;
      case 'daynight':
        if (this.mode === 'play' || this.mode === 'map') {
          this.world.dayCycle.toggleAt(this.player.up);
          this.audio.play('whoosh');
        }
        break;
      case 'profile':
        this.#openPlace('maison');
        break;
      case 'sound':
        this.#toggleSound();
        break;
      case 'language':
        this.#toggleLanguage();
        break;
      case 'cv':
        this.#downloadCv();
        break;
      case 'back':
        this.#back();
        break;
      default:
        break;
    }
  }

  #back() {
    if (this.settings.isOpen) this.settings.close();
    else if (this.panel.isOpen) this.panel.close();
    else if (this.journal.isOpen) this.journal.close();
    else if (this.finale.isOpen) { this.finale.hide(); this.#returnToGround(); }
    else if (this.mode === 'map') this.#returnToGround();
    else if (this.mode === 'play') this.#openSettings();
  }

  #settingsState() {
    return {
      quality: this.renderer.quality.bloom ? 'high' : 'low',
      quietHud: this.progress.quietHud,
      reducedMotion: this.rig.reducedMotion,
      soundOn: this.audio.isEnabled,
    };
  }

  #openSettings() {
    this.input.releaseAll();
    this.speech.setVisible(false);
    this.settings.open(this.#settingsState());
  }

  async #changeSetting(field, value) {
    if (field === 'quality' && ['high', 'low'].includes(value)) {
      this.renderer.setQuality(value);
      this.progress.update({ quality: value });
    } else if (field === 'quietHud') {
      this.progress.update({ quietHud: value });
      this.ui.classList.toggle('is-quiet', value);
    } else if (field === 'reducedMotion') {
      this.rig.reducedMotion = value;
      this.progress.update({ reducedMotion: value });
      this.ui.classList.toggle('is-reduced-motion', value);
    } else if (field === 'soundOn') {
      if (value !== this.audio.isEnabled) await this.#toggleSound();
    }
    this.settings.sync(this.#settingsState());
  }

  #land({ facePlayer = true } = {}) {
    if (this.mode !== 'intro') return;
    this.mode = 'flight';
    this.intro.hide();
    this.journal.close({ silent: true });
    this.audio.play('whoosh');
    // Land facing Mounir so the visitor sees him wave; the camera swings behind once he walks.
    this.rig.heading.copy(this.player.facing);
    if (facePlayer) this.rig.heading.negate();
    this.rig.flyTo(() => this.rig.followPose(this.player), {
      duration: this.rig.reducedMotion ? 0 : 3.8,
      arc: 6,
      onDone: () => {
        this.rig.mode = 'follow';
        this.mode = 'play';
        this.hud.show();
        this.hud.setMode('play');
        this.touch.setVisible(true);
        this.avatar.startWave();
        this.speech.say(this.progress.isReturning ? DIALOGUES.welcomeBack : DIALOGUES.intro);
        this.renderer.canvas.focus?.();
      },
    });
  }

  #openMap() {
    this.input.releaseAll();
    this.mode = 'map';
    this.audio.play('whoosh');
    this.hud.setPrompt(null);
    this.hud.setMode('map');
    this.hud.showMapBar(true);
    this.touch.setVisible(false);
    this.rig.setOrbitAbove(this.player.up, this.rig.heading);
    this.rig.flyTo(() => this.rig.orbitPose(), {
      duration: this.rig.reducedMotion ? 0 : 2,
      arc: 10,
      onDone: () => {
        this.rig.mode = 'orbit';
        this.rig.autoRotate = false;
        this.labels.setInteractive(true);
      },
    });
  }

  #returnToGround() {
    this.input.releaseAll();
    this.labels.setInteractive(false);
    this.hud.showMapBar(false);
    this.mode = 'flight';
    this.rig.flyTo(() => this.rig.followPose(this.player), {
      duration: this.rig.reducedMotion ? 0 : 2.2,
      arc: 8,
      onDone: () => {
        this.rig.mode = 'follow';
        this.mode = 'play';
        this.hud.setMode('play');
        this.touch.setVisible(true);
      },
    });
  }

  #travelTo(id) {
    const entry = this.world.landmarks.entry(id);
    if (!entry || this.panel.isOpen || this.finale.isOpen || this.rig.isFlying) return;
    this.speech.say([], { replace: true });
    if (this.mode === 'intro') {
      this.#placePlayerAt(entry);
      this.#land({ facePlayer: false });
      return;
    }
    if (this.mode !== 'play' && this.mode !== 'map') return;
    this.#placePlayerAt(entry);
    this.audio.play('whoosh');
    this.#returnToGround();
  }

  #placePlayerAt(entry) {
    this.player.placeAt(entry.spawnPoint, entry.interactPoint);
    this.rig.heading.copy(this.player.facing);
    this.rig.pitch = CAMERA.pitch;
  }

  #openPlace(id) {
    const entry = this.world.landmarks.entry(id);
    if (!entry || this.panel.isOpen || this.rig.isFlying) return;
    this.journal.close({ silent: true });
    this.panel.open(entry.place, { collectedSkills: this.progress.skills });
    this.audio.play('open');
    this.input.releaseAll();
    if (this.progress.markVisited(id)) this.#onFirstVisit(entry);
  }

  #onFirstVisit(entry) {
    this.labels.render(this.progress.visited);
    this.timeSinceDiscovery = 0;
    if (!entry.place.beacon) return;
    entry.beacon.light();
    this.world.sparkles.emit(entry.beaconPoint, { count: 90, color: entry.place.accent, speed: 5, spread: 1, life: 1.4, size: 0.4, gravity: 0.5 });
    this.audio.play('beacon');
    this.#refreshHud();
    const left = BEACON_IDS.filter(beaconId => !this.progress.visited.has(beaconId)).length;
    if (left === 0) return;
    this.speech.say(left === 1 ? DIALOGUES.lastBeacon : [format(DIALOGUES.beaconLit[0], { left })], { replace: true });
  }

  #afterPanelClosed() {
    this.audio.play('close');
    const allLit = BEACON_IDS.every(id => this.progress.visited.has(id));
    if (allLit && !this.progress.finaleSeen && this.mode !== 'intro') this.#playFinale();
  }

  #playFinale() {
    this.progress.update({ finaleSeen: true });
    this.mode = 'flight';
    this.hud.setPrompt(null);
    this.touch.setVisible(false);
    this.speech.say(DIALOGUES.allBeacons, { replace: true });
    this.rig.setOrbitAbove(this.player.up, this.rig.heading);
    this.rig.orbitDistance = 118;
    this.rig.flyTo(() => this.rig.orbitPose(), {
      duration: this.rig.reducedMotion ? 0 : 3,
      arc: 12,
      onDone: () => {
        this.rig.mode = 'orbit';
        this.rig.autoRotate = !this.rig.reducedMotion;
        this.mode = 'map';
        this.fireworkTimer = this.rig.reducedMotion ? 0 : FIREWORK_SECONDS;
        this.finale.show();
      },
    });
  }

  #openJournal() {
    if (this.panel.isOpen || this.journal.isOpen || this.finale.isOpen || this.rig.isFlying) return;
    this.input.releaseAll();
    this.journal.open(this.progress);
    this.audio.play('open');
  }

  async #toggleSound() {
    if (this.audio.isEnabled) this.audio.disable();
    else await this.audio.enable();
    this.progress.update({ soundOn: this.audio.isEnabled });
    this.hud.update({ soundOn: this.audio.isEnabled });
    this.intro.setSound(this.audio.isEnabled);
  }

  #toggleLanguage() {
    setLanguage(currentLanguage() === 'fr' ? 'en' : 'fr');
    this.progress.update({ language: currentLanguage() });
  }

  #renderTexts() {
    document.title = t(UI.documentTitle);
    this.hud.render();
    this.#refreshHud();
    this.hud.showMapBar(this.mode === 'map');
    this.labels.render(this.progress.visited);
    this.panel.refresh();
    this.journal.refresh();
    if (this.intro.isVisible) this.intro.render();
  }

  #refreshHud() {
    this.hud.update({
      lit: new Set(BEACON_IDS.filter(id => this.progress.visited.has(id))),
      skills: this.progress.skills.size,
      soundOn: this.audio?.isEnabled ?? false,
    });
  }

  #downloadCv() {
    const cv = PROFILE.cv[currentLanguage()];
    const link = createElement('a', { attributes: { href: cv.href, download: cv.filename } });
    document.body.append(link);
    link.click();
    link.remove();
  }

  async #copy(value) {
    try {
      await navigator.clipboard.writeText(value);
      this.hud.toast(`<span>${escapeHtml(t(UI.copied))}</span>`);
    } catch {
      window.location.href = `mailto:${value}`;
    }
  }

  #feet(position) {
    return position.clone().addScaledVector(this.player.up, 0.1);
  }
}
