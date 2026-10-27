import { PROFILE } from '../content/profile.js';
import { UI } from '../content/ui-strings.js';
import { t } from '../i18n.js';
import { createElement, escapeHtml, externalLink, trapFocus } from './dom.js';
import { icon } from './icons.js';

const GROUPS = [
  { title: UI.projectsGroup, filter: place => place.beacon },
  { title: UI.journeyGroup, filter: place => !place.beacon && place.id !== 'poste' },
];

// The logbook: every place in a plain list, for visitors who want the facts fast.
export class Journal {
  constructor(root, { places, onRead, onTravel, onClose }) {
    this.places = places;
    this.onRead = onRead;
    this.onTravel = onTravel;
    this.onClose = onClose;
    this.element = createElement('div', { className: 'journal', attributes: { role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'journal-title', hidden: '' } });
    root.append(this.element);
    this.element.addEventListener('click', event => this.#handleClick(event));
    this.element.addEventListener('keydown', event => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopPropagation();
      this.close();
    });
  }

  get isOpen() {
    return !this.element.hidden;
  }

  open(progress) {
    this.progress = progress;
    this.#render();
    this.element.hidden = false;
    this.releaseFocus = trapFocus(this.element);
    this.element.querySelector('.journal-close').focus({ preventScroll: true });
  }

  close({ silent = false } = {}) {
    if (!this.isOpen) return;
    this.element.hidden = true;
    this.releaseFocus?.();
    if (!silent) this.onClose();
  }

  refresh() {
    if (this.isOpen) this.#render();
  }

  #render() {
    const groups = GROUPS.map(group => `
      <section>
        <h3>${escapeHtml(t(group.title))}</h3>
        <ul class="journal-list">${this.places.filter(group.filter).map(place => this.#placeRow(place)).join('')}</ul>
      </section>`).join('');
    this.element.innerHTML = `
      <div class="journal-sheet">
        <header class="journal-header">
          <div>
            <p class="panel-kicker">${escapeHtml(PROFILE.name)} · ${escapeHtml(t(PROFILE.role))}</p>
            <h2 id="journal-title">${escapeHtml(t(UI.journalTitle))}</h2>
            <p>${escapeHtml(t(UI.journalIntro))}</p>
          </div>
          <button class="icon-button journal-close" type="button" aria-label="${escapeHtml(t(UI.close))}">${icon('close')}</button>
        </header>
        ${groups}
        <section>
          <h3>${escapeHtml(t(UI.contactGroup))}</h3>
          <ul class="journal-list">${this.#placeRow(this.places.find(place => place.id === 'poste'))}</ul>
          <p class="panel-actions">
            <a class="button button-primary" href="mailto:${PROFILE.email}">${icon('mail', { size: 18 })}<span>${PROFILE.email}</span></a>
            ${externalLink(PROFILE.links.linkedin, `${icon('linkedin', { size: 18 })}<span>LinkedIn</span>`, 'button button-ghost')}
            ${externalLink(PROFILE.links.github, `${icon('github', { size: 18 })}<span>GitHub</span>`, 'button button-ghost')}
          </p>
        </section>
      </div>`;
  }

  #placeRow(place) {
    const isVisited = this.progress.visited.has(place.id);
    const status = place.beacon && isVisited ? t(UI.beaconLit) : isVisited ? t(UI.visited) : '';
    return `<li style="--accent:${place.accent}">
      <span class="journal-icon">${icon(place.icon)}</span>
      <span class="journal-text"><strong>${escapeHtml(t(place.name))}</strong><small>${escapeHtml(t(place.kicker))}${status ? ` · <em>${escapeHtml(status)}</em>` : ''}</small></span>
      <span class="journal-actions">
        <button class="button button-small button-primary" type="button" data-read="${place.id}">${escapeHtml(t(UI.read))}</button>
        <button class="button button-small button-ghost" type="button" data-travel="${place.id}">${escapeHtml(t(UI.travel))}</button>
      </span>
    </li>`;
  }

  #handleClick(event) {
    if (event.target.closest('.journal-close') || event.target === this.element) {
      this.close();
      return;
    }
    const read = event.target.closest('[data-read]');
    if (read) {
      this.close({ silent: true });
      this.onRead(read.dataset.read);
      return;
    }
    const travel = event.target.closest('[data-travel]');
    if (travel) {
      this.close({ silent: true });
      this.onTravel(travel.dataset.travel);
    }
  }
}
