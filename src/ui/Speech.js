import { Vector3 } from 'three';
import { PIXEL_NAME } from '../content/dialogues.js';
import { UI } from '../content/ui-strings.js';
import { t } from '../i18n.js';
import { createElement, escapeHtml, isTouchDevice } from './dom.js';

const SECONDS_PER_CHARACTER = 0.055;
const MINIMUM_SECONDS = 3.2;
const projected = new Vector3();

// Pixel's speech bubble, anchored above the drone and fed by a queue of lines.
export class Speech {
  constructor(root, { onLine }) {
    this.onLine = onLine;
    this.element = createElement('div', { className: 'speech', attributes: { role: 'status', 'aria-live': 'polite', hidden: '' } });
    root.append(this.element);
    this.queue = [];
    this.current = null;
    this.isVisible = false;
    this.element.addEventListener('click', () => this.next());
  }

  get isSpeaking() {
    return this.current !== null;
  }

  setVisible(isVisible) {
    this.isVisible = isVisible;
    this.element.hidden = !isVisible || !this.current;
  }

  say(lines, { replace = false } = {}) {
    if (replace) {
      this.queue = [];
      this.current = null;
    }
    this.queue.push(...lines);
    if (!this.current) this.next();
  }

  next() {
    const line = this.queue.shift();
    if (!line) {
      this.current = null;
      this.element.hidden = true;
      return;
    }
    const content = isTouchDevice() && line.touch ? line.touch : line;
    const message = typeof content === 'string' ? content : t(content);
    this.current = { message, remaining: Math.max(MINIMUM_SECONDS, message.length * SECONDS_PER_CHARACTER) };
    this.element.hidden = !this.isVisible;
    this.element.innerHTML = `<span class="speech-name">${escapeHtml(PIXEL_NAME)} <small>${escapeHtml(t(UI.pixel))}</small></span><p>${escapeHtml(message)}</p>
      <span class="speech-next" aria-hidden="true">${this.queue.length ? '▸' : ''}</span>`;
    this.element.classList.remove('is-popping');
    void this.element.offsetWidth;
    this.element.classList.add('is-popping');
    this.onLine();
  }

  update(deltaSeconds, anchor, camera, viewport) {
    if (!this.current || !this.isVisible) return;
    this.current.remaining -= deltaSeconds;
    if (this.current.remaining <= 0) {
      this.next();
      if (!this.current) return;
    }
    projected.copy(anchor).project(camera);
    const onScreen = projected.z < 1 && Math.abs(projected.x) < 1 && Math.abs(projected.y) < 1;
    const width = this.element.offsetWidth;
    const x = onScreen ? (projected.x * 0.5 + 0.5) * viewport.width : viewport.width / 2;
    const y = onScreen ? (-projected.y * 0.5 + 0.5) * viewport.height : viewport.height * 0.3;
    const clampedX = Math.min(viewport.width - width / 2 - 12, Math.max(width / 2 + 12, x));
    const clampedY = Math.max(this.element.offsetHeight + 90, y - 26);
    this.element.style.transform = `translate(${clampedX}px, ${clampedY}px) translate(-50%, -100%)`;
  }
}
