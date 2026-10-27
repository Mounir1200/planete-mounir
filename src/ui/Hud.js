import { PORTRAIT } from '../content/photos.js';
import { PROFILE } from '../content/profile.js';
import { UI } from '../content/ui-strings.js';
import { currentLanguage, format, t } from '../i18n.js';
import { formatDistance } from '../utils/math.js';
import { createElement, escapeHtml, isTouchDevice } from './dom.js';
import { icon } from './icons.js';

const TOAST_SECONDS = 3.2;

// Heads-up display: identity, quest progress, toolbar, interaction prompt and toasts.
export class Hud {
  constructor(root, { beacons, onAction }) {
    this.beacons = beacons;
    this.onAction = onAction;
    this.element = createElement('div', { className: 'hud', attributes: { hidden: '' } });
    root.append(this.element);
    this.toasts = createElement('div', { className: 'toasts', attributes: { 'aria-live': 'polite' } });
    root.append(this.toasts);
    this.element.addEventListener('click', event => {
      const button = event.target.closest('[data-action]');
      if (button) this.onAction(button.dataset.action);
    });
    this.state = { lit: new Set(), skills: 0, visited: 0, soundOn: false, objective: null, prompt: null, isNight: false };
  }

  show() {
    this.element.hidden = false;
  }

  hide() {
    this.element.hidden = true;
  }

  setMode(mode) {
    this.element.dataset.mode = mode;
  }

  render() {
    const touch = isTouchDevice();
    this.element.innerHTML = `
      <div class="hud-corner hud-left">
        <button class="identity" type="button" data-action="profile" aria-label="${escapeHtml(PROFILE.name)} — ${escapeHtml(t(PROFILE.role))}">
          <img src="${PORTRAIT}" alt="" width="44" height="44">
          <span><strong>${escapeHtml(PROFILE.name)}</strong><small>${escapeHtml(t(PROFILE.role))}</small></span>
        </button>
        <div class="quest">
          <div class="quest-row" aria-live="polite" aria-atomic="true">
            <span class="quest-label">${escapeHtml(t(UI.beacons))}</span>
            <span class="beacon-dots">${this.beacons.map(place => `<i data-beacon="${place.id}" style="--accent:${place.accent}" title="${escapeHtml(t(place.name))}"></i>`).join('')}</span>
            <span class="quest-count" data-count="beacons"></span>
          </div>
          <div class="quest-row" aria-live="polite" aria-atomic="true">
            <span class="quest-label">${escapeHtml(t(UI.skills))}</span>
            <span class="skill-bar"><i data-bar="skills"></i></span>
            <span class="quest-count" data-count="skills"></span>
          </div>
          <p class="objective" data-objective></p>
        </div>
      </div>
      <nav class="hud-corner hud-right" aria-label="${escapeHtml(t(UI.journal))}">
        ${this.#toolButton('map', 'map', t(UI.map), 'M')}
        ${this.#toolButton('journal', 'book', t(UI.journal), 'J')}
        ${this.#toolButton('daynight', 'moon', t(UI.dayNight), 'N')}
        ${this.#toolButton('sound', 'soundOff', t(UI.soundOn))}
        ${this.#toolButton('language', 'globe', t(UI.language), null, currentLanguage() === 'fr' ? 'EN' : 'FR')}
        ${this.#toolButton('cv', 'download', t(UI.downloadCv), null, 'CV')}
        ${this.#toolButton('settings', 'settings', t({ fr: 'Réglages', en: 'Settings' }))}
      </nav>
      <button class="prompt" type="button" data-action="interact" hidden></button>
      <div class="map-bar" hidden>
        <p><strong>${escapeHtml(t(UI.mapTitle))}</strong><span>${escapeHtml(t(UI.mapHint))}</span></p>
        <button class="button button-primary" type="button" data-action="map">${escapeHtml(t(UI.backToGround))}</button>
      </div>
      <p class="controls-hint">${escapeHtml(t(touch ? UI.touchHint : UI.controlsHint))}</p>`;
    this.applied = {};
    this.objectiveKey = null;
    this.#apply();
    const prompt = this.state.prompt;
    this.state.prompt = null;
    this.setPrompt(prompt);
    this.setObjective(this.state.objective);
    if (this.controlsHintHidden) this.hideControlsHint();
  }

  update(changes) {
    Object.assign(this.state, changes);
    this.#apply();
  }

  setPrompt(place) {
    if (this.state.prompt === place) return;
    this.state.prompt = place;
    const prompt = this.element.querySelector('.prompt');
    if (!prompt) return;
    prompt.hidden = !place;
    if (!place) return;
    prompt.style.setProperty('--accent', place.accent);
    const key = isTouchDevice() ? icon('sparkle', { size: 16 }) : '<kbd>E</kbd>';
    prompt.innerHTML = `${key}<span>${escapeHtml(t(UI.enter))} · <strong>${escapeHtml(t(place.name))}</strong></span>`;
  }

  setObjective(objective) {
    this.state.objective = objective;
    const element = this.element.querySelector('[data-objective]');
    if (!element) return;
    if (!objective) {
      const message = this.state.lit.size === this.beacons.length ? t(UI.allLit) : '';
      const key = `${currentLanguage()}:${message}`;
      if (this.objectiveKey !== key) {
        element.textContent = message;
        this.objectiveKey = key;
      }
      return;
    }
    const key = `${currentLanguage()}:${objective.place.id}`;
    if (this.objectiveKey !== key) {
      element.innerHTML = `<span class="objective-arrow" aria-hidden="true">${icon('arrow', { size: 16 })}</span>
        <span>${escapeHtml(t(UI.nextBeacon))} : <strong>${escapeHtml(t(objective.place.name))}</strong> · <span data-objective-distance></span></span>`;
      this.objectiveArrow = element.querySelector('.objective-arrow');
      this.objectiveDistance = element.querySelector('[data-objective-distance]');
      this.objectiveKey = key;
    }
    this.objectiveArrow.style.transform = `rotate(${objective.screenAngle}rad)`;
    const distance = formatDistance(objective.distance);
    if (this.objectiveDistance.textContent !== distance) this.objectiveDistance.textContent = distance;
  }

  hideControlsHint() {
    this.controlsHintHidden = true;
    this.element.querySelector('.controls-hint')?.classList.add('is-faded');
  }

  toast(html, { accent = '#ffb47e' } = {}) {
    const toast = createElement('div', { className: 'toast', html });
    toast.style.setProperty('--accent', accent);
    this.toasts.append(toast);
    requestAnimationFrame(() => toast.classList.add('is-visible'));
    setTimeout(() => {
      toast.classList.remove('is-visible');
      setTimeout(() => toast.remove(), 400);
    }, TOAST_SECONDS * 1000);
  }

  #toolButton(action, iconName, label, shortcut, text) {
    const hint = shortcut ? ` (${shortcut})` : '';
    return `<button class="tool" type="button" data-action="${action}" aria-label="${escapeHtml(label + hint)}" title="${escapeHtml(label + hint)}">
      ${text ? `<span class="tool-text">${text}</span>` : icon(iconName)}
    </button>`;
  }

  #apply() {
    const { lit, skills, soundOn, isNight } = this.state;
    const applied = this.applied ??= {};
    const beaconKey = [...lit].sort().join(',');
    if (applied.beacons !== beaconKey) {
      this.element.querySelectorAll('[data-beacon]').forEach(dot => dot.classList.toggle('is-lit', lit.has(dot.dataset.beacon)));
      applied.beacons = beaconKey;
    }
    const beaconCount = this.element.querySelector('[data-count="beacons"]');
    const beaconText = `${lit.size}/${this.beacons.length}`;
    if (beaconCount && beaconCount.textContent !== beaconText) beaconCount.textContent = beaconText;
    const skillCount = this.element.querySelector('[data-count="skills"]');
    const skillText = `${skills}/8`;
    if (skillCount && skillCount.textContent !== skillText) skillCount.textContent = skillText;
    const bar = this.element.querySelector('[data-bar="skills"]');
    if (bar && applied.skills !== skills) {
      bar.style.width = `${(skills / 8) * 100}%`;
      applied.skills = skills;
    }
    const sound = this.element.querySelector('[data-action="sound"]');
    if (sound && applied.soundOn !== soundOn) {
      sound.innerHTML = icon(soundOn ? 'soundOn' : 'soundOff');
      const label = t(soundOn ? UI.soundOff : UI.soundOn);
      sound.setAttribute('aria-label', label);
      sound.title = label;
      sound.setAttribute('aria-pressed', String(soundOn));
      applied.soundOn = soundOn;
    }
    const dayNight = this.element.querySelector('[data-action="daynight"]');
    if (dayNight && applied.isNight !== isNight) {
      dayNight.innerHTML = icon(isNight ? 'sun' : 'moon');
      dayNight.setAttribute('aria-pressed', String(isNight));
      applied.isNight = isNight;
    }
  }

  showMapBar(isVisible) {
    const bar = this.element.querySelector('.map-bar');
    if (bar) bar.hidden = !isVisible;
  }

  skillToast(skill, count) {
    this.toast(`${icon('sparkle', { size: 18 })}<span>${escapeHtml(t(UI.skillToast))} · <strong>${escapeHtml(skill.name)}</strong> <em>${escapeHtml(format({ fr: '{count}/8', en: '{count}/8' }, { count }))}</em></span>`);
  }
}
