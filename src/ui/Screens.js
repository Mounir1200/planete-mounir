import { PROFILE } from '../content/profile.js';
import { UI } from '../content/ui-strings.js';
import { currentLanguage, t } from '../i18n.js';
import { createElement, escapeHtml, isTouchDevice, trapFocus } from './dom.js';
import { icon } from './icons.js';

// Loading, title and finale screens layered over the 3D view.

export class LoadingScreen {
  constructor(root) {
    this.element = createElement('div', { className: 'loading', attributes: { role: 'status', 'aria-live': 'polite' } });
    this.element.innerHTML = `
      <div class="loading-planet" aria-hidden="true"><span></span></div>
      <p class="loading-title">${escapeHtml(t(UI.loading))}</p>
      <div class="loading-bar"><i></i></div>
      <p class="loading-step"></p>`;
    root.append(this.element);
  }

  progress(step, ratio) {
    this.element.querySelector('.loading-bar i').style.width = `${Math.round(ratio * 100)}%`;
    this.element.querySelector('.loading-step').textContent = t(UI.loadingSteps[step]);
  }

  hide() {
    this.element.classList.add('is-done');
    setTimeout(() => this.element.remove(), 900);
  }
}

export class IntroScreen {
  constructor(root, { onLand, onJournal, onSound, onLanguage }) {
    this.element = createElement('section', { className: 'intro', attributes: { 'aria-labelledby': 'intro-title', hidden: '' } });
    root.append(this.element);
    this.element.addEventListener('click', event => {
      const action = event.target.closest('[data-intro]')?.dataset.intro;
      if (action === 'land') onLand();
      if (action === 'journal') onJournal();
      if (action === 'sound') onSound();
      if (action === 'language') onLanguage();
    });
    this.soundOn = false;
  }

  render() {
    const [firstName, lastName] = PROFILE.name.split(' ');
    this.element.innerHTML = `
      <div class="intro-content">
        <p class="intro-kicker">${escapeHtml(t(UI.kicker))}</p>
        <h1 id="intro-title"><span>${escapeHtml(firstName)}</span><span>${escapeHtml(lastName)}</span></h1>
        <p class="intro-role">${escapeHtml(t(PROFILE.role))} · ${escapeHtml(PROFILE.city)}</p>
        <p class="intro-motto">${escapeHtml(t(PROFILE.motto))}</p>
        <p class="intro-welcome">${escapeHtml(t(UI.welcome))}</p>
        <div class="intro-actions">
          <button class="button button-hero" type="button" data-intro="land">${icon('sparkle', { size: 20 })}<span>${escapeHtml(t(UI.land))}</span></button>
          <button class="button button-glass" type="button" data-intro="journal">${icon('book', { size: 18 })}<span>${escapeHtml(t(UI.quickAccess))}</span></button>
        </div>
        <p class="intro-hint">${escapeHtml(t(isTouchDevice() ? UI.touchHint : UI.controlsHint))}</p>
        <div class="intro-toggles">
          <button class="tool" type="button" data-intro="language" aria-label="${escapeHtml(t(UI.language))}"><span class="tool-text">${currentLanguage() === 'fr' ? 'EN' : 'FR'}</span></button>
          <button class="tool" type="button" data-intro="sound" aria-pressed="${this.soundOn}" aria-label="${escapeHtml(t(this.soundOn ? UI.soundOff : UI.soundOn))}">${icon(this.soundOn ? 'soundOn' : 'soundOff')}</button>
        </div>
      </div>`;
  }

  setSound(isOn) {
    this.soundOn = isOn;
    if (!this.element.hidden) this.render();
  }

  show() {
    this.render();
    this.element.hidden = false;
    this.element.inert = false;
    requestAnimationFrame(() => this.element.classList.add('is-visible'));
    this.element.querySelector('[data-intro="land"]').focus({ preventScroll: true });
  }

  hide() {
    this.element.inert = true;
    this.element.classList.remove('is-visible');
    setTimeout(() => { this.element.hidden = true; }, 600);
  }

  get isVisible() {
    return !this.element.hidden;
  }
}

export class FinaleScreen {
  constructor(root, { onContact, onClose }) {
    this.element = createElement('div', { className: 'finale', attributes: { role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'finale-title', hidden: '' } });
    root.append(this.element);
    this.opened = false;
    this.element.addEventListener('click', event => {
      const action = event.target.closest('[data-finale]')?.dataset.finale;
      if (action === 'contact') onContact();
      if (action === 'close') onClose();
    });
  }

  get isOpen() {
    return this.opened;
  }

  show() {
    if (this.opened) return;
    clearTimeout(this.hideTimer);
    this.element.innerHTML = `
      <div class="finale-card">
        <p class="intro-kicker">5/5 ✦</p>
        <h2 id="finale-title">${escapeHtml(t(UI.finaleTitle))}</h2>
        <p>${escapeHtml(t(UI.finaleText))}</p>
        <div class="intro-actions">
          <button class="button button-hero" type="button" data-finale="contact">${icon('mail', { size: 18 })}<span>${escapeHtml(t(UI.finaleContact))}</span></button>
          <button class="button button-glass" type="button" data-finale="close">${escapeHtml(t(UI.keepExploring))}</button>
        </div>
      </div>`;
    this.opened = true;
    this.element.hidden = false;
    this.element.inert = false;
    this.releaseFocus = trapFocus(this.element);
    requestAnimationFrame(() => this.element.classList.add('is-visible'));
    this.element.querySelector('[data-finale="contact"]').focus({ preventScroll: true });
  }

  hide() {
    if (!this.opened) return;
    this.opened = false;
    this.element.inert = true;
    this.releaseFocus?.();
    this.releaseFocus = null;
    this.element.classList.remove('is-visible');
    this.hideTimer = setTimeout(() => { if (!this.opened) this.element.hidden = true; }, 500);
  }
}

export class TouchControls {
  constructor(root, input, { onInteract }) {
    this.element = createElement('div', { className: 'touch-controls', attributes: { hidden: '' } });
    this.element.innerHTML = `
      <div class="joystick" aria-hidden="true"><span class="joystick-knob"></span></div>
      <div class="touch-buttons">
        <button class="touch-button touch-action" type="button" aria-label="${escapeHtml(t(UI.enter))}" hidden>${icon('sparkle', { size: 26 })}</button>
        <button class="touch-button touch-jump" type="button" aria-label="${escapeHtml(t(UI.jump))}">${icon('arrow', { size: 26 })}</button>
      </div>`;
    root.append(this.element);
    input.attachJoystick(this.element.querySelector('.joystick'), this.element.querySelector('.joystick-knob'));
    this.element.querySelector('.touch-jump').addEventListener('pointerdown', event => {
      event.preventDefault();
      input.queueJump();
    });
    this.element.querySelector('.touch-action').addEventListener('click', onInteract);
  }

  setVisible(isVisible) {
    this.element.hidden = !isVisible || !isTouchDevice();
  }

  setActionAvailable(isAvailable) {
    this.element.querySelector('.touch-action').hidden = !isAvailable;
  }
}
