// Every place of the planet: where it stands, how it looks on the map and what it tells.
// `beacon` places are the five project beacons the visitor lights up.
import { BRANDS } from './brands.js';

export const PLACES = [
  {
    id: 'maison', biome: 'loire', latLon: [14, 2], faceTo: [-2, 12], padRadius: 7, icon: 'home', accent: '#ffb47e',
    name: { fr: 'La Maison', en: 'The House' },
    kicker: { fr: 'Profil · Angers', en: 'Profile · Angers' },
  },
  {
    id: 'essca', biome: 'loire', latLon: [38, 24], faceTo: 'maison', padRadius: 7.5, icon: 'chat', accent: BRANDS.essca.primary, beacon: true,
    name: { fr: 'ESSCA · Angers', en: 'ESSCA · Angers' },
    kicker: { fr: 'l’ESSCABOT · Expérience', en: 'l’ESSCABOT · Experience' },
  },
  {
    id: 'esaip', biome: 'loire', latLon: [31, -22], faceTo: 'maison', padRadius: 6.5, icon: 'school', accent: BRANDS.esaip.primary,
    name: { fr: 'Le Campus ESAIP', en: 'The ESAIP Campus' },
    kicker: { fr: 'Formation · Big Data', en: 'Education · Big Data' },
  },
  {
    id: 'poste', biome: 'loire', latLon: [-7, 24], faceTo: 'maison', padRadius: 6, icon: 'mail', accent: '#ff8f6b',
    name: { fr: 'La Poste', en: 'The Post Office' },
    kicker: { fr: 'Contact', en: 'Contact' },
  },
  {
    id: 'galerie', biome: 'loire', latLon: [-2, -20], faceTo: 'maison', padRadius: 7, icon: 'image', accent: '#ffd36b',
    name: { fr: 'Le Belvédère', en: 'The Belvedere' },
    kicker: { fr: 'Galerie photo', en: 'Photo gallery' },
  },
  {
    id: 'gym', biome: 'loire', latLon: [11, 60], faceTo: 'poste', padRadius: 6.5, icon: 'dumbbell', accent: BRANDS.basicfit.primary,
    name: { fr: 'La Salle de sport', en: 'The Gym' },
    kicker: { fr: 'Loisirs · Musculation', en: 'Hobbies · Strength training' },
  },
  {
    id: 'urdwell', biome: 'alpes', latLon: [52, -64], faceTo: 'esaip', padRadius: 8, icon: 'tree', accent: '#b5dc79', beacon: true,
    name: { fr: 'L’Arbre-Mémoire', en: 'The Memory Tree' },
    kicker: { fr: 'UrdWell · Projet', en: 'UrdWell · Project' },
  },
  {
    id: 'rwu', biome: 'alpes', latLon: [26, -98], faceTo: 'urdwell', padRadius: 6, icon: 'mountain', accent: '#ffcf8a',
    name: { fr: 'Ravensburg', en: 'Ravensburg' },
    kicker: { fr: 'Erasmus · RWU', en: 'Erasmus · RWU' },
  },
  {
    id: 'hindsight', biome: 'nord', latLon: [66, 72], faceTo: 'essca', padRadius: 7.5, icon: 'telescope', accent: '#b9a2ff', beacon: true,
    name: { fr: 'L’Observatoire du temps', en: 'The Time Observatory' },
    kicker: { fr: 'HindSight · Projet', en: 'HindSight · Project' },
  },
  {
    id: 'ktu', biome: 'nord', latLon: [44, 128], faceTo: 'hindsight', padRadius: 6, icon: 'snow', accent: '#9fd3ff',
    name: { fr: 'Kaunas', en: 'Kaunas' },
    kicker: { fr: 'Erasmus · KTU', en: 'Erasmus · KTU' },
  },
  {
    id: 'labo', biome: 'labo', latLon: [6, 172], faceTo: 'ktu', padRadius: 7.5, icon: 'flask', accent: '#d58cff',
    name: { fr: 'Le Labo', en: 'The Lab' },
    kicker: { fr: 'ChartMind · Projets académiques', en: 'ChartMind · Academic projects' },
  },
  {
    id: 'moov', biome: 'savane', latLon: [-36, 124], faceTo: 'labo', padRadius: 6, icon: 'antenna', accent: BRANDS.moov.primary,
    name: { fr: 'Moov Africa · Ouagadougou', en: 'Moov Africa · Ouagadougou' },
    kicker: { fr: 'Moov Africa · Data', en: 'Moov Africa · Data' },
  },
  {
    id: 'ouaga', biome: 'savane', latLon: [-16, 86], faceTo: 'poste', padRadius: 7, icon: 'sun', accent: '#ff9f5a',
    name: { fr: 'Ouagadougou', en: 'Ouagadougou' },
    kicker: { fr: 'Origines · CPGE La Salle', en: 'Origins · CPGE La Salle' },
  },
  {
    id: 'phare', biome: 'cote', latLon: [-30, -58], faceTo: [-58, -40], padRadius: 6.5, icon: 'lighthouse', accent: '#ffc479', beacon: true,
    name: { fr: 'Le Phare', en: 'The Lighthouse' },
    kicker: { fr: 'Grant Copilot · Projet', en: 'Grant Copilot · Project' },
  },
  {
    id: 'port', biome: 'cote', latLon: [-27, -20], faceTo: [-58, -40], padRadius: 5.2, icon: 'anchor', accent: '#78c7ff', beacon: true,
    name: { fr: 'Le Port', en: 'The Harbour' },
    kicker: { fr: 'ADQUA · Projet', en: 'ADQUA · Project' },
  },
];

export const PATHS = [
  ['maison', 'essca'], ['maison', 'esaip'], ['maison', 'poste'], ['maison', 'galerie'],
  ['essca', 'hindsight'], ['hindsight', 'ktu'], ['ktu', 'labo'], ['labo', 'moov'],
  ['moov', 'ouaga'], ['ouaga', 'poste'], ['esaip', 'urdwell'], ['urdwell', 'rwu'],
  ['galerie', 'port'], ['port', 'phare'], ['poste', 'gym'],
];

// Areas of the planet lowered below sea level.
export const WATER_BASINS = [
  { latLon: [-58, -40], innerAngle: 27, outerAngle: 36, depth: 4.5 },
  { latLon: [-2, 2], innerAngle: 4.5, outerAngle: 8, depth: 1.6 },
  { latLon: [-10, 110], innerAngle: 3.5, outerAngle: 6.5, depth: 1.2 },
  { latLon: [74, 150], innerAngle: 4, outerAngle: 7.5, depth: 1.4 },
];

export const SPAWN_PLACE = 'maison';
export const BEACON_IDS = PLACES.filter(place => place.beacon).map(place => place.id);
export const placeById = id => PLACES.find(place => place.id === id);
