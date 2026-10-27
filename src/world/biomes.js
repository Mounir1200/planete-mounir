// Six regions retrace Mounir's journey: Angers, the Alps (RWU), the North (KTU),
// the Sahel (Ouagadougou), the coast and a landscaped research campus.
export const BIOMES = {
  loire: {
    center: [18, 4],
    ground: ['#7cc35a', '#68b24f', '#8fd16a'],
    path: '#ecd9b0',
    shore: '#f1dcae',
    mountains: 0.15,
  },
  alpes: {
    center: [42, -82],
    ground: ['#5c9f52', '#4c8d4b', '#6aac5b'],
    path: '#d8c49a',
    shore: '#e6d4a8',
    mountains: 1,
  },
  nord: {
    center: [62, 112],
    ground: ['#eef4fb', '#e2ecf7', '#f6f9fd'],
    path: '#c5d3e4',
    shore: '#d6e4f2',
    mountains: 0.55,
  },
  savane: {
    center: [-24, 108],
    ground: ['#d9a35a', '#cc8b45', '#e2b768'],
    path: '#e9c48e',
    shore: '#e8cc95',
    mountains: 0.1,
  },
  cote: {
    center: [-26, -42],
    ground: ['#93cf6a', '#7fc35f', '#a6d978'],
    path: '#f0dfb8',
    shore: '#f5e3b8',
    mountains: 0.05,
  },
  labo: {
    center: [6, 172],
    ground: ['#81917d', '#738470', '#95a08c'],
    path: '#d4d0c4',
    shore: '#c5c3ad',
    mountains: 0.16,
  },
};

export const ROCK_COLOR = '#8e8a87';
export const SNOW_COLOR = '#f4f7fc';
export const SEABED_COLOR = '#3b7fa6';
export const DEEP_SEABED_COLOR = '#21507a';
