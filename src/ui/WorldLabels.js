import { Vector3 } from 'three';
import { PLANET } from '../config.js';
import { UI } from '../content/ui-strings.js';
import { t } from '../i18n.js';
import { createElement, escapeHtml } from './dom.js';
import { icon } from './icons.js';

const OCCLUDER_RADIUS = PLANET.radius * 0.985;
const GROUND_LABEL_RANGE = 18;
const projected = new Vector3();
const segment = new Vector3();

// HTML markers that follow places on screen. On the ground they only inform;
// in the orbital view they become buttons for travelling.
export class WorldLabels {
  constructor(root, { entries, onSelect }) {
    this.container = createElement('div', { className: 'world-labels', attributes: { hidden: '' } });
    root.append(this.container);
    this.onSelect = onSelect;
    this.items = entries.map(entry => {
      const element = createElement('button', { className: 'world-label', attributes: { type: 'button', tabindex: '-1', hidden: '' } });
      element.style.setProperty('--accent', entry.place.accent);
      element.addEventListener('click', () => this.onSelect(entry.place.id));
      this.container.append(element);
      return { entry, element };
    });
    this.playerMarker = createElement('div', { className: 'player-marker', attributes: { hidden: '' } });
    this.container.append(this.playerMarker);
    this.isInteractive = false;
    this.isVisible = false;
  }

  render(visited) {
    this.items.forEach(({ entry, element }) => {
      const isDone = visited.has(entry.place.id);
      element.classList.toggle('is-beacon', Boolean(entry.place.beacon));
      element.classList.toggle('is-done', isDone);
      element.innerHTML = `<span class="world-label-icon">${icon(entry.place.icon, { size: 16 })}</span><span class="world-label-name">${escapeHtml(t(entry.place.name))}</span>`;
      element.setAttribute('aria-label', `${t(UI.travel)} : ${t(entry.place.name)}`);
    });
    this.playerMarker.textContent = t(UI.youAreHere);
  }

  setInteractive(isInteractive) {
    this.isInteractive = isInteractive;
    this.container.classList.toggle('is-interactive', isInteractive);
    this.items.forEach(({ element }) => { element.tabIndex = isInteractive && this.isVisible && !element.hidden ? 0 : -1; });
  }

  setVisible(isVisible) {
    if (this.isVisible === isVisible) return;
    this.isVisible = isVisible;
    this.container.hidden = !isVisible;
    this.container.inert = !isVisible;
    this.items.forEach(({ element }) => { element.tabIndex = isVisible && this.isInteractive && !element.hidden ? 0 : -1; });
    if (!isVisible) this.playerMarker.hidden = true;
  }

  update(camera, viewport, playerPosition, hiddenId) {
    if (!this.isVisible) return;
    const cameraPosition = camera.position;
    this.items.forEach(({ entry, element }) => {
      const anchor = entry.labelAnchor;
      const distance = anchor.distanceTo(cameraPosition);
      const tooFar = !this.isInteractive && (!playerPosition || entry.interactPoint.distanceTo(playerPosition) > GROUND_LABEL_RANGE);
      const visible = !tooFar && entry.place.id !== hiddenId && this.#isVisible(anchor, cameraPosition, camera);
      element.classList.toggle('is-hidden', !visible);
      element.hidden = !visible;
      element.tabIndex = visible && this.isInteractive ? 0 : -1;
      element.setAttribute('aria-hidden', String(!visible));
      if (!visible) return;
      projected.copy(anchor).project(camera);
      const x = (projected.x * 0.5 + 0.5) * viewport.width;
      const y = (-projected.y * 0.5 + 0.5) * viewport.height;
      const scale = this.isInteractive ? 1 : Math.max(0.7, Math.min(1, 30 / distance));
      element.style.transform = `translate(${x}px, ${y}px) translate(-50%, -100%) scale(${scale})`;
    });
    this.#updatePlayerMarker(camera, viewport, playerPosition);
  }

  #updatePlayerMarker(camera, viewport, playerPosition) {
    this.playerMarker.hidden = !this.isInteractive || !playerPosition;
    if (this.playerMarker.hidden) return;
    const anchor = playerPosition.clone().multiplyScalar(1.02);
    if (!this.#isVisible(anchor, camera.position, camera)) {
      this.playerMarker.hidden = true;
      return;
    }
    projected.copy(anchor).project(camera);
    const x = (projected.x * 0.5 + 0.5) * viewport.width;
    const y = (-projected.y * 0.5 + 0.5) * viewport.height;
    this.playerMarker.style.transform = `translate(${x}px, ${y}px) translate(-50%, -100%)`;
  }

  // A point is hidden when the planet sits between it and the camera, or it is behind the camera.
  #isVisible(point, cameraPosition, camera) {
    projected.copy(point).project(camera);
    if (projected.z > 1 || Math.abs(projected.x) > 1.1 || Math.abs(projected.y) > 1.1) return false;
    segment.copy(point).sub(cameraPosition);
    const along = -cameraPosition.dot(segment) / segment.lengthSq();
    if (along <= 0 || along >= 1) return true;
    const closest = cameraPosition.clone().addScaledVector(segment, along);
    return closest.length() > OCCLUDER_RADIUS;
  }
}
