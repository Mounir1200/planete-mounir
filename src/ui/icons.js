// Line icons (24×24, currentColor) for places and interface buttons.
const PATHS = {
  dumbbell: '<path d="M8 12h8M4 8v8M7 6v12M17 6v12M20 8v8M4 12H2M22 12h-2"/>',
  home: '<path d="M4 11.5 12 5l8 6.5"/><path d="M6 10v9h12v-9"/><path d="M10 19v-5h4v5"/>',
  chat: '<path d="M5 6h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-7l-4 3v-3H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Z"/><path d="M9 11h.01M12 11h.01M15 11h.01"/>',
  school: '<path d="m3 9 9-4 9 4-9 4-9-4Z"/><path d="M7 11v4c0 1.5 2.2 3 5 3s5-1.5 5-3v-4"/><path d="M21 9v5"/>',
  mail: '<rect x="4" y="6" width="16" height="12" rx="2"/><path d="m4.5 7 7.5 6 7.5-6"/>',
  image: '<rect x="4" y="5" width="16" height="14" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="m5 17 5-4 3 2 3-3 3 3"/>',
  tree: '<path d="M12 21v-6"/><path d="M12 15c-4 0-6-2-6-5 0-2.5 2-5 6-7 4 2 6 4.5 6 7 0 3-2 5-6 5Z"/><path d="m9 18 3-3 3 3"/>',
  mountain: '<path d="m3 19 6-10 4 6 2-3 6 7H3Z"/><path d="m7.5 11.5 1.5 1 1.5-1"/>',
  telescope: '<path d="m4 14 12-6 2 4-12 6-2-4Z"/><path d="m16 8 2-1 2 4-2 1"/><path d="m10 15 2 6M12 15l-2 6"/>',
  snow: '<path d="M12 3v18M4.2 7.5l15.6 9M19.8 7.5l-15.6 9"/><path d="m9.5 4.5 2.5 2 2.5-2M9.5 19.5l2.5-2 2.5 2"/>',
  flask: '<path d="M10 3h4M10.5 3v6L5 18a2 2 0 0 0 1.7 3h10.6a2 2 0 0 0 1.7-3l-5.5-9V3"/><path d="M7.5 15h9"/>',
  antenna: '<path d="M12 9v12M8 21l4-12 4 12"/><path d="M8.5 5.5a5 5 0 0 0 0 7M15.5 5.5a5 5 0 0 1 0 7"/><circle cx="12" cy="9" r="1.2"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4"/>',
  lighthouse: '<path d="M10 21 11 9h2l1 12"/><path d="M9.5 9h5L14 6h-4l-.5 3Z"/><path d="M12 6V4"/><path d="M4 7l5 1M20 7l-5 1"/><path d="M6 21h12"/>',
  anchor: '<circle cx="12" cy="5" r="2"/><path d="M12 7v14M8 10h8"/><path d="M5 14a7 7 0 0 0 14 0"/>',
  map: '<path d="m9 4-5 2v14l5-2 6 2 5-2V4l-5 2-6-2Z"/><path d="M9 4v14M15 6v14"/>',
  book: '<path d="M5 4h10a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3V4Z"/><path d="M5 17a3 3 0 0 1 3-3h10"/>',
  moon: '<path d="M19 14.5A7.5 7.5 0 0 1 9.5 5a7.5 7.5 0 1 0 9.5 9.5Z"/>',
  soundOn: '<path d="M5 10h3l4-3v10l-4-3H5v-4Z"/><path d="M15.5 9.5a3.5 3.5 0 0 1 0 5M18 7a7 7 0 0 1 0 10"/>',
  soundOff: '<path d="M5 10h3l4-3v10l-4-3H5v-4Z"/><path d="m16 10 4 4M20 10l-4 4"/>',
  download: '<path d="M12 4v11M7.5 10.5 12 15l4.5-4.5"/><path d="M5 19h14"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  arrow: '<path d="M12 4v16M6 10l6-6 6 6"/>',
  external: '<path d="M14 5h5v5M19 5l-8 8"/><path d="M18 14v4a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h4"/>',
  github: '<path d="M9 19c-4 1.3-4-2-6-2.5M15 21v-3.5a3 3 0 0 0-.9-2.4c3-.3 6-1.4 6-6.4a5 5 0 0 0-1.4-3.5 4.6 4.6 0 0 0-.1-3.5s-1.1-.3-3.6 1.4a12.4 12.4 0 0 0-6.5 0C6 1.4 4.9 1.7 4.9 1.7a4.6 4.6 0 0 0-.1 3.5A5 5 0 0 0 3.4 8.7c0 5 3 6.1 6 6.4a3 3 0 0 0-.9 2.4V21"/>',
  linkedin: '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8 10v6M8 7.5v.01M12 16v-6M12 13a2.5 2.5 0 0 1 5 0v3"/>',
  copy: '<rect x="8" y="8" width="11" height="11" rx="2"/><path d="M5 15V6a1 1 0 0 1 1-1h9"/>',
  sparkle: '<path d="M12 3c.8 4.2 2.8 6.2 7 7-4.2.8-6.2 2.8-7 7-.8-4.2-2.8-6.2-7-7 4.2-.8 6.2-2.8 7-7Z"/>',
  globe: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.5 2.6 3.5 5.4 3.5 8.5s-1 5.9-3.5 8.5c-2.5-2.6-3.5-5.4-3.5-8.5s1-5.9 3.5-8.5Z"/>',
  settings: '<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="3" fill="currentColor" stroke="none"/><circle cx="15" cy="17" r="3" fill="currentColor" stroke="none"/>',
};

export function icon(name, { size = 20, label } = {}) {
  const accessibility = label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"';
  return `<svg class="icon" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" ${accessibility}>${PATHS[name] ?? PATHS.sparkle}</svg>`;
}
