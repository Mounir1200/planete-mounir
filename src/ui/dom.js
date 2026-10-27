// Small DOM helpers shared by the interface modules.
const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => ESCAPES[character]);
}

export function createElement(tag, { className, html, attributes = {} } = {}) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (html !== undefined) element.innerHTML = html;
  Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, value));
  return element;
}

export function externalLink(href, label, className = 'link') {
  return `<a class="${className}" href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${label}</a>`;
}

const FOCUSABLE = 'a[href], button, input, select, textarea, summary, [tabindex]';

// Keeps keyboard focus inside an open dialog and restores it on close.
export function trapFocus(container) {
  const previouslyFocused = document.activeElement;
  const onKeyDown = event => {
    if (event.key !== 'Tab') return;
    const focusable = [...container.querySelectorAll(FOCUSABLE)].filter(element =>
      element.tabIndex >= 0 && !element.matches(':disabled') && !element.closest('[hidden], [inert]') && element.getClientRects().length > 0,
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  };
  container.addEventListener('keydown', onKeyDown);
  return () => {
    container.removeEventListener('keydown', onKeyDown);
    if (previouslyFocused instanceof HTMLElement && previouslyFocused.isConnected && !previouslyFocused.closest('[hidden], [inert]')) {
      previouslyFocused.focus({ preventScroll: true });
    }
  };
}

export const isTouchDevice = () => window.matchMedia('(pointer: coarse)').matches;
export const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
