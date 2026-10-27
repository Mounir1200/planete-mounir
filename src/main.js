import '@fontsource-variable/space-grotesk';
import '@fontsource/instrument-serif/400.css';
import '@fontsource/instrument-serif/400-italic.css';
import './styles/main.css';
import { QUALITY } from './config.js';
import { PLACES } from './content/places.js';
import { UI } from './content/ui-strings.js';
import { Game } from './game/Game.js';
import { Progress } from './game/Progress.js';
import { initLanguage, t } from './i18n.js';
import { Journal } from './ui/Journal.js';
import { PlacePanel } from './ui/PlacePanel.js';
import { createElement } from './ui/dom.js';

const root = document.getElementById('app');

function supportsWebGL2() {
  try {
    return Boolean(document.createElement('canvas').getContext('webgl2'));
  } catch {
    return false;
  }
}

function pickQuality() {
  const requested = new URLSearchParams(location.search).get('quality');
  if (requested && QUALITY[requested]) return QUALITY[requested];
  const savedQuality = new Progress().quality;
  if (savedQuality) return QUALITY[savedQuality];
  const isSmallTouchScreen = matchMedia('(pointer: coarse)').matches && Math.min(screen.width, screen.height) < 820;
  return isSmallTouchScreen ? QUALITY.low : QUALITY.high;
}

// Without WebGL the portfolio stays fully readable: the logbook and its panels are plain HTML.
function startReadableFallback() {
  const progress = new Progress();
  initLanguage(progress.language);
  const ui = createElement('div', { className: 'ui fallback' });
  ui.append(createElement('p', { className: 'fallback-note', html: t(UI.noWebgl) }));
  root.append(ui);
  const panel = new PlacePanel(ui, { onClose: () => journal.open(progress), onCopy: value => navigator.clipboard?.writeText(value) });
  const journal = new Journal(ui, {
    places: PLACES,
    onRead: id => panel.open(PLACES.find(place => place.id === id), { collectedSkills: progress.skills }),
    onTravel: id => panel.open(PLACES.find(place => place.id === id), { collectedSkills: progress.skills }),
    onClose: () => journal.open(progress),
  });
  journal.open(progress);
}

if (supportsWebGL2()) {
  new Game({ root, quality: pickQuality() }).start().catch(error => {
    console.error(error);
    root.replaceChildren();
    startReadableFallback();
  });
} else {
  startReadableFallback();
}
