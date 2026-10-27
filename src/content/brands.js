// Official web identities checked on 2026-10-27. See public/brands/SOURCES.md.
// Neutral stone, glass and vegetation in the world keep their own materials.
const asset = file => `${import.meta.env?.BASE_URL ?? '/'}brands/${file}`;

export const BRANDS = {
  rwu: {
    name: 'RWU Hochschule Ravensburg-Weingarten',
    logo: asset('rwu.png'), width: 1920, height: 643,
    website: 'https://www.rwu.de/',
    primary: '#6638b6', secondary: '#00a9ce', surface: '#ffffff',
  },
  ktu: {
    name: 'Kaunas University of Technology',
    logo: asset('ktu.svg'), width: 1909.2, height: 1057.6,
    website: 'https://en.ktu.edu/',
    primary: '#000000', secondary: '#000000', surface: '#e9eaea',
  },
  basicfit: {
    name: 'Basic-Fit',
    logo: asset('basic-fit-orange.svg'), width: 1056, height: 312,
    website: 'https://www.basic-fit.com/fr-fr/home',
    primary: '#eb6800',
  },
  essca: {
    name: 'ESSCA School of Management',
    logo: asset('essca.svg'), width: 204, height: 61,
    website: 'https://www.essca.eu/',
    primary: '#d60020', secondary: '#262626', surface: '#eeece2',
  },
  esaip: {
    name: 'ESAIP Engineering School',
    logo: asset('esaip-header.png'), width: 1024, height: 372,
    website: 'https://www.esaip.org/',
    primary: '#3878bd', secondary: '#242756', surface: '#ffffff',
  },
  moov: {
    name: 'Moov Africa Burkina Faso',
    logo: asset('moov-africa-burkina.png'), width: 325, height: 150,
    website: 'https://moov-africa.bf/',
    primary: '#fa8100', secondary: '#0059a1', surface: '#f6f6f6',
  },
};
