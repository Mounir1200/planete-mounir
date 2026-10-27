import { UI } from '../content/ui-strings.js';
import { BRANDS } from '../content/brands.js';
import './brands.css';
import { format, t } from '../i18n.js';
import { createElement, escapeHtml, trapFocus } from './dom.js';
import { icon } from './icons.js';
import { PHOTO_SETS, renderPlace } from './placeTemplates.js';

// Side drawer showing a place's story, plus the photo lightbox it opens.
export class PlacePanel {
  constructor(root, { onClose, onCopy }) {
    this.onClose = onClose;
    this.onCopy = onCopy;
    this.element = createElement('aside', { className: 'panel', attributes: { role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'panel-title', hidden: '' } });
    this.lightbox = new Lightbox(root);
    root.append(this.element);
    this.place = null;
    this.element.addEventListener('click', event => this.#handleClick(event));
    this.element.addEventListener('keydown', event => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopPropagation();
      this.close();
    });
  }

  get isOpen() {
    return this.place !== null;
  }

  open(place, context) {
    this.place = place;
    this.context = context;
    this.#render();
    this.element.hidden = false;
    requestAnimationFrame(() => this.element.classList.add('is-open'));
    this.releaseFocus = trapFocus(this.element);
    this.element.querySelector('.panel-close').focus({ preventScroll: true });
  }

  close() {
    if (!this.isOpen) return;
    if (this.lightbox.isOpen) {
      this.lightbox.close();
      return;
    }
    this.element.classList.remove('is-open');
    this.place = null;
    this.releaseFocus?.();
    setTimeout(() => { if (!this.place) this.element.hidden = true; }, 320);
    this.onClose();
  }

  refresh() {
    if (this.isOpen) this.#render();
  }

  #render() {
    const content = renderPlace(this.place, this.context);
    const brandId = this.place.id === 'gym' ? 'basicfit' : this.place.id;
    const brand = BRANDS[brandId];
    this.element.style.setProperty('--accent', this.place.accent);
    this.element.dataset.brand = brand ? brandId : '';
    if (brand) this.element.style.setProperty('--brand-ink', ['essca', 'rwu'].includes(brandId) ? brand.primary : (brand.secondary ?? 'var(--ink)'));
    this.element.innerHTML = `
      <header class="panel-header">
        <div class="panel-badge">${icon(this.place.icon, { size: 22 })}</div>
        <div>
          <p class="panel-kicker">${escapeHtml(content.kicker)}</p>
          <h2 id="panel-title">${escapeHtml(content.title)}</h2>
        </div>
        <button class="icon-button panel-close" type="button" aria-label="${escapeHtml(t(UI.close))}">${icon('close')}</button>
      </header>
      <div class="panel-body">
        ${brand ? `<a class="panel-brand" href="${brand.website}" target="_blank" rel="noopener noreferrer" aria-label="${escapeHtml(brand.name)}"><img src="${brand.logo}" width="${brand.width}" height="${brand.height}" alt="${escapeHtml(brand.name)}">${icon('external', { size: 16 })}</a>` : ''}
        ${content.tagline ? `<p class="panel-tagline">${escapeHtml(content.tagline)}</p>` : ''}
        ${content.body}
      </div>`;
    this.element.querySelector('.panel-body').scrollTop = 0;
  }

  #handleClick(event) {
    if (event.target.closest('.panel-close')) {
      this.close();
      return;
    }
    const tile = event.target.closest('[data-gallery]');
    if (tile) {
      this.lightbox.open(PHOTO_SETS[tile.dataset.gallery], Number(tile.dataset.index));
      return;
    }
    const copy = event.target.closest('[data-copy]');
    if (copy) this.onCopy(copy.dataset.copy);
  }
}

class Lightbox {
  constructor(root) {
    this.element = createElement('div', { className: 'lightbox', attributes: { role: 'dialog', 'aria-modal': 'true', hidden: '' } });
    root.append(this.element);
    this.photos = [];
    this.index = 0;
    this.element.addEventListener('click', event => {
      if (event.target.closest('[data-step]')) this.#step(Number(event.target.closest('[data-step]').dataset.step));
      else if (event.target.closest('.lightbox-close') || event.target === this.element) this.close();
    });
    this.element.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        this.close();
      }
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        event.preventDefault();
        event.stopPropagation();
        this.#step(event.key === 'ArrowRight' ? 1 : -1);
      }
    });
  }

  get isOpen() {
    return !this.element.hidden;
  }

  open(photos, index) {
    this.photos = photos;
    this.index = index;
    this.element.hidden = false;
    this.#render();
    this.releaseFocus = trapFocus(this.element);
    this.element.querySelector('.lightbox-close').focus({ preventScroll: true });
  }

  close() {
    this.element.hidden = true;
    this.releaseFocus?.();
  }

  #step(direction) {
    this.index = (this.index + direction + this.photos.length) % this.photos.length;
    this.#render();
    this.element.querySelector(`[data-step="${direction}"]`)?.focus({ preventScroll: true });
  }

  #render() {
    const photo = this.photos[this.index];
    const counter = format(UI.photoOf, { index: this.index + 1, total: this.photos.length });
    this.element.setAttribute('aria-label', t(photo.title));
    this.element.innerHTML = `
      <figure class="lightbox-figure">
        <img src="${photo.full}" alt="${escapeHtml(t(photo.alt))}">
        <figcaption><strong>${escapeHtml(t(photo.title))}</strong><span>${escapeHtml(t(photo.caption))} · ${escapeHtml(counter)}</span></figcaption>
      </figure>
      <button class="icon-button lightbox-close" type="button" aria-label="${escapeHtml(t(UI.close))}">${icon('close')}</button>
      ${this.photos.length > 1 ? `
        <button class="icon-button lightbox-nav lightbox-prev" type="button" data-step="-1" aria-label="${escapeHtml(t(UI.previous))}">${icon('arrow')}</button>
        <button class="icon-button lightbox-nav lightbox-next" type="button" data-step="1" aria-label="${escapeHtml(t(UI.next))}">${icon('arrow')}</button>` : ''}`;
  }
}
