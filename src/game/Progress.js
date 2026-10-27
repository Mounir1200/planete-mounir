import { STORAGE_KEY } from '../config.js';
import { PLACES } from '../content/places.js';
import { SKILLS } from '../content/profile.js';

const placeIds = new Set(PLACES.map(place => place.id));
const skillIds = new Set(SKILLS.map(skill => skill.id));
const validIds = (value, allowed) => Array.isArray(value) ? value.filter(id => allowed.has(id)) : [];

// Remembers the visit on this device only. Storage may be unavailable
// (private mode, blocked site data): the game then simply starts fresh.
export class Progress {
  constructor() {
    const saved = this.#read();
    this.visited = new Set(validIds(saved.visited, placeIds));
    this.skills = new Set(validIds(saved.skills, skillIds));
    this.finaleSeen = Boolean(saved.finaleSeen);
    this.language = ['fr', 'en'].includes(saved.language) ? saved.language : null;
    this.soundOn = Boolean(saved.soundOn);
    this.isReturning = this.visited.size > 0 || this.skills.size > 0;
    this.quality = ['high', 'low'].includes(saved.quality) ? saved.quality : null;
    this.reducedMotion = typeof saved.reducedMotion === 'boolean' ? saved.reducedMotion : null;
    this.quietHud = saved.quietHud === true;
  }

  markVisited(id) {
    if (this.visited.has(id)) return false;
    this.visited.add(id);
    this.save();
    return true;
  }

  collectSkill(id) {
    if (this.skills.has(id)) return false;
    this.skills.add(id);
    this.save();
    return true;
  }

  update(changes) {
    Object.assign(this, changes);
    this.save();
  }

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        visited: [...this.visited],
        skills: [...this.skills],
        finaleSeen: this.finaleSeen,
        language: this.language,
        soundOn: this.soundOn,
        quality: this.quality,
        reducedMotion: this.reducedMotion,
        quietHud: this.quietHud,
      }));
    } catch {
      // Progress is a convenience; losing it is acceptable.
    }
  }

  #read() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return saved && typeof saved === 'object' && !Array.isArray(saved) ? saved : {};
    } catch {
      return {};
    }
  }
}
