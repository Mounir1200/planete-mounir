import './settings.css';
import { t } from '../i18n.js';
import { createElement, escapeHtml, trapFocus } from './dom.js';
import { icon } from './icons.js';

const COPY = {
  title: { fr: 'Une pause sur la planète.', en: 'A pause on the planet.' },
  kicker: { fr: 'COMMANDES & RÉGLAGES', en: 'CONTROLS & SETTINGS' },
  resume: { fr: 'Reprendre l’exploration', en: 'Resume exploring' },
  quality: { fr: 'Qualité d’affichage', en: 'Display quality' },
  qualityHint: { fr: 'Le mode léger réduit la résolution et les effets lumineux.', en: 'Light mode reduces resolution and lighting effects.' },
  high: { fr: 'Détaillée', en: 'Detailed' }, low: { fr: 'Légère', en: 'Light' },
  quiet: { fr: 'Interface discrète', en: 'Minimal interface' },
  quietHint: { fr: 'Garde la vue dégagée. La carte et le carnet restent accessibles.', en: 'Keep the view clear. The map and logbook remain available.' },
  motion: { fr: 'Réduire les mouvements', en: 'Reduce motion' },
  motionHint: { fr: 'Supprime les vols de caméra et la rotation automatique.', en: 'Skip camera flights and automatic rotation.' },
  sound: { fr: 'Ambiance sonore', en: 'Soundscape' },
  soundHint: { fr: 'Musique et bruitages du monde.', en: 'World music and sound effects.' },
  walk: { fr: 'Marcher', en: 'Walk' }, run: { fr: 'Courir', en: 'Run' },
  jump: { fr: 'Sauter · deux fois pour un double saut', en: 'Jump · twice to double jump' },
  interact: { fr: 'Entrer dans un lieu', en: 'Enter a place' },
  map: { fr: 'Carte de la planète', en: 'Planet map' }, journal: { fr: 'Lire le portfolio', en: 'Read the portfolio' },
  camera: { fr: 'Glisser pour regarder · molette pour zoomer', en: 'Drag to look · scroll to zoom' },
  touch: { fr: 'Sur mobile : joystick à gauche, saut à droite. Glisse ailleurs pour regarder.', en: 'On mobile: joystick on the left, jump on the right. Drag elsewhere to look.' },
};

export class Settings {
  constructor(root, { onClose, onChange }) {
    this.onClose = onClose;
    this.onChange = onChange;
    this.element = createElement('div', {className:'settings',attributes:{role:'dialog','aria-modal':'true','aria-labelledby':'settings-title',hidden:''}});
    root.append(this.element);
    this.element.addEventListener('keydown', event => {
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); this.close(); }
    });
    this.element.addEventListener('click', event => {
      if (event.target === this.element || event.target.closest('[data-resume]')) this.close();
    });
    this.element.addEventListener('change', event => {
      const field = event.target.dataset.setting;
      if (!field) return;
      this.onChange(field, event.target.type === 'checkbox' ? event.target.checked : event.target.value);
    });
  }

  get isOpen() { return !this.element.hidden; }

  open(state) {
    if (this.isOpen) return;
    this.state = state;
    this.#render();
    this.element.hidden = false;
    this.releaseFocus = trapFocus(this.element);
    this.element.querySelector('[data-resume]').focus({preventScroll:true});
  }

  close() {
    if (!this.isOpen) return;
    this.element.hidden = true;
    this.releaseFocus?.();
    this.onClose();
  }

  sync(state) {
    this.state = state;
    this.element.querySelectorAll('[data-setting]').forEach(field => {
      const value = state[field.dataset.setting];
      if (field.type === 'checkbox') field.checked = Boolean(value);
      else field.value = value;
    });
  }

  #render() {
    const row = (id, label, hint) => `<label class="settings-field"><span><strong>${escapeHtml(t(label))}</strong><small>${escapeHtml(t(hint))}</small></span><input type="checkbox" data-setting="${id}" ${this.state[id]?'checked':''}><span class="settings-switch" aria-hidden="true"></span></label>`;
    this.element.innerHTML = `<section class="settings-sheet"><header><div><p class="panel-kicker">${escapeHtml(t(COPY.kicker))}</p><h2 id="settings-title">${escapeHtml(t(COPY.title))}</h2></div><button class="icon-button" data-resume aria-label="${escapeHtml(t(COPY.resume))}">${icon('close')}</button></header>
      <div class="settings-fields"><label class="settings-field"><span><strong>${escapeHtml(t(COPY.quality))}</strong><small>${escapeHtml(t(COPY.qualityHint))}</small></span><select data-setting="quality"><option value="high" ${this.state.quality==='high'?'selected':''}>${t(COPY.high)}</option><option value="low" ${this.state.quality==='low'?'selected':''}>${t(COPY.low)}</option></select></label>
      ${row('quietHud',COPY.quiet,COPY.quietHint)}${row('reducedMotion',COPY.motion,COPY.motionHint)}${row('soundOn',COPY.sound,COPY.soundHint)}</div>
      <dl class="settings-keys"><div><dt><kbd>ZQSD</kbd> / <kbd>WASD</kbd> / <kbd>↑↓←→</kbd></dt><dd>${t(COPY.walk)}</dd></div><div><dt><kbd>Shift</kbd></dt><dd>${t(COPY.run)}</dd></div><div><dt><kbd>Space</kbd></dt><dd>${t(COPY.jump)}</dd></div><div><dt><kbd>E</kbd></dt><dd>${t(COPY.interact)}</dd></div><div><dt><kbd>M</kbd> · <kbd>J</kbd></dt><dd>${t(COPY.map)} · ${t(COPY.journal)}</dd></div></dl>
      <p class="settings-note">${escapeHtml(t(COPY.camera))}<br>${escapeHtml(t(COPY.touch))}</p><button class="button button-primary settings-resume" data-resume>${escapeHtml(t(COPY.resume))}</button></section>`;
  }
}
