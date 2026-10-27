// Minimal bilingual layer: content objects carry { fr, en } and `t` picks the active one.
const SUPPORTED = ['fr', 'en'];
const listeners = new Set();
let language = 'fr';

export function initLanguage(saved) {
  const preferred = saved ?? (navigator.language?.toLowerCase().startsWith('fr') ? 'fr' : 'en');
  language = SUPPORTED.includes(preferred) ? preferred : 'fr';
  document.documentElement.lang = language;
  return language;
}

export function currentLanguage() {
  return language;
}

export function setLanguage(next) {
  if (!SUPPORTED.includes(next) || next === language) return;
  language = next;
  document.documentElement.lang = language;
  listeners.forEach(listener => listener(language));
}

export function onLanguageChange(listener) {
  listeners.add(listener);
}

export function t(value) {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  return value[language] ?? value.fr ?? '';
}

// Template helper: t(UI.key) with {placeholders} replaced.
export function format(value, params) {
  return t(value).replace(/\{(\w+)\}/g, (_, key) => params[key] ?? '');
}
