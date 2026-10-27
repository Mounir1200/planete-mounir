// Personal photos provided by Mounir (same captions as Mounir Town).
// `width`/`height` describe the thumbnail so layouts can reserve space before loading.
export const assetUrl = path => `${import.meta.env.BASE_URL}${path}`;

function photo(file, width, height, { title, caption, alt }, { hasThumbnail = true } = {}) {
  const thumbnail = hasThumbnail ? file.replace(/\.(\w+)$/, '-small.$1') : file;
  return { full: assetUrl(`photos/${file}`), thumb: assetUrl(`photos/${thumbnail}`), width, height, title, caption, alt };
}

export const PORTRAIT = assetUrl('img/portrait.webp');

export const PHOTOGRAPHY = [
  photo('photo-ciel-rose.webp', 900, 507, {
    title: { fr: 'Le ciel en rose', en: 'A sky in pink' },
    caption: { fr: 'Au Pixel · 19 décembre 2025', en: 'Shot on Pixel · 19 December 2025' },
    alt: { fr: 'Un ciel rose et violet au-dessus d’une rue, d’arbres et d’un arrêt de bus.', en: 'A pink and purple sky above a street, trees and a bus stop.' },
  }),
  photo('photo-20240920-124754470.webp', 900, 506, {
    title: { fr: 'Face à l’eau', en: 'Facing the water' },
    caption: { fr: 'Au Pixel · 20 septembre 2024', en: 'Shot on Pixel · 20 September 2024' },
    alt: { fr: 'Une personne de dos devant une vaste étendue d’eau, sous un ciel bleu dégagé.', en: 'A person seen from behind, facing a wide expanse of water under a clear blue sky.' },
  }),
  photo('photo-printemps.webp', 506, 900, {
    title: { fr: 'Arbres en fleurs', en: 'Trees in bloom' },
    caption: { fr: 'Au Pixel · 8 avril 2026', en: 'Shot on Pixel · 8 April 2026' },
    alt: { fr: 'Des arbres couverts de fleurs roses au-dessus d’une pelouse verte, sous un ciel bleu.', en: 'Trees covered in pink blossom above a green lawn under a blue sky.' },
  }),
  photo('photo-musee.webp', 506, 900, {
    title: { fr: 'Au musée', en: 'At the museum' },
    caption: { fr: 'Au Pixel · 8 juin 2025', en: 'Shot on Pixel · 8 June 2025' },
    alt: { fr: 'Une sculpture claire représentant un personnage assis, un bras levé, dans une salle éclairée par de hautes fenêtres.', en: 'A pale sculpture of a seated figure with one arm raised, in a room lit by tall windows.' },
  }),
  photo('lituanie-panorama.webp', 900, 678, {
    title: { fr: 'Lignes de quartier', en: 'Neighbourhood lines' },
    caption: { fr: 'Au Pixel · 21 avril 2023', en: 'Shot on Pixel · 21 April 2023' },
    alt: { fr: 'Un quartier résidentiel vu en hauteur, avec des rues bordées d’arbres sous un ciel bleu nuageux.', en: 'A residential neighbourhood seen from above, with tree-lined streets under a cloudy blue sky.' },
  }),
  photo('photo-20250113-055733022.webp', 900, 506, {
    title: { fr: 'Sous la lune', en: 'Under the moon' },
    caption: { fr: 'Au Pixel · 13 janvier 2025', en: 'Shot on Pixel · 13 January 2025' },
    alt: { fr: 'Une lune brillante au-dessus d’arbres dénudés et d’un terrain éclairé, de nuit.', en: 'A bright moon above bare trees and an illuminated field at night.' },
  }),
  photo('photo-20241208-125814361.webp', 900, 506, {
    title: { fr: 'La ville en contrebas', en: 'The city below' },
    caption: { fr: 'Au Pixel · 8 décembre 2024', en: 'Shot on Pixel · 8 December 2024' },
    alt: { fr: 'Une vue plongeante sur une ville, avec des branches dénudées au premier plan et un ciel couvert.', en: 'A view down over a city, with bare branches in the foreground and an overcast sky.' },
  }),
  photo('photo-20250608-160054811.webp', 506, 900, {
    title: { fr: 'Au bout des marches', en: 'At the top of the steps' },
    caption: { fr: 'Au Pixel · 8 juin 2025', en: 'Shot on Pixel · 8 June 2025' },
    alt: { fr: 'La façade d’une église à deux flèches, au sommet d’un escalier encadré par des arbres.', en: 'The façade of a church with two spires, at the top of a staircase framed by trees.' },
  }),
  photo('photo-20260310-174206694.webp', 506, 900, {
    title: { fr: 'Dernière lumière', en: 'Last light' },
    caption: { fr: 'Au Pixel · 10 mars 2026', en: 'Shot on Pixel · 10 March 2026' },
    alt: { fr: 'Un soleil orange à l’horizon au-dessus d’une rue, entre les arbres et les bâtiments.', en: 'An orange sun on the horizon above a street, between trees and buildings.' },
  }),
  photo('lituanie-matin.webp', 900, 678, {
    title: { fr: 'Entre routes et arbres', en: 'Between roads and trees' },
    caption: { fr: 'Au Pixel · 25 juin 2023', en: 'Shot on Pixel · 25 June 2023' },
    alt: { fr: 'Des routes, des immeubles et des arbres vus en hauteur, sous un ciel aux teintes douces.', en: 'Roads, buildings and trees seen from above, under a softly coloured sky.' },
  }),
  photo('photo-20250104-215654412.webp', 506, 900, {
    title: { fr: 'Architecture de nuit', en: 'Architecture at night' },
    caption: { fr: 'Au Pixel · 4 janvier 2025', en: 'Shot on Pixel · 4 January 2025' },
    alt: { fr: 'Une façade monumentale à deux tours éclairée de nuit, au-dessus de bâtiments et d’enseignes lumineuses.', en: 'A monumental façade with two towers illuminated at night, above buildings and glowing signs.' },
  }),
  photo('photo-20250608-134744582.webp', 506, 900, {
    title: { fr: 'Pierre et lumière', en: 'Stone and light' },
    caption: { fr: 'Au Pixel · 8 juin 2025', en: 'Shot on Pixel · 8 June 2025' },
    alt: { fr: 'La statue d’un homme barbu tenant une feuille, devant de hautes fenêtres, avec un bas-relief exposé au pied du socle.', en: 'A statue of a bearded man holding a sheet of paper in front of tall windows, with a bas-relief displayed at the foot of the plinth.' },
  }),
  photo('allemagne-coucher-soleil.webp', 900, 507, {
    title: { fr: 'Au-dessus des toits', en: 'Above the rooftops' },
    caption: { fr: 'Au Pixel · 23 janvier 2025', en: 'Shot on Pixel · 23 January 2025' },
    alt: { fr: 'Une terrasse pavée dominant des toits, devant un coucher de soleil orange et bleu.', en: 'A paved terrace overlooking rooftops, with an orange and blue sunset beyond.' },
  }),
  photo('photo-20251219-162721842.webp', 900, 506, {
    title: { fr: 'Le ciel, un instant après', en: 'The sky, a moment later' },
    caption: { fr: 'Au Pixel · 19 décembre 2025', en: 'Shot on Pixel · 19 December 2025' },
    alt: { fr: 'Des nuages roses et violets au-dessus d’arbres sombres, d’une rue et d’un arrêt de bus.', en: 'Pink and purple clouds above dark trees, a street and a bus stop.' },
  }),
  photo('photo-20250123-155132032.webp', 900, 506, {
    title: { fr: 'Traverser la terrasse', en: 'Crossing the terrace' },
    caption: { fr: 'Au Pixel · 23 janvier 2025', en: 'Shot on Pixel · 23 January 2025' },
    alt: { fr: 'Une personne traverse une terrasse pavée surplombant les toits, avec le soleil couchant à l’horizon.', en: 'A person crossing a paved terrace above the rooftops, with the setting sun on the horizon.' },
  }),
  photo('photo-20250608-160057885.webp', 506, 900, {
    title: { fr: 'La façade entre les arbres', en: 'The façade through the trees' },
    caption: { fr: 'Au Pixel · 8 juin 2025', en: 'Shot on Pixel · 8 June 2025' },
    alt: { fr: 'Une façade d’église à deux flèches encadrée de feuillages, avec un escalier au premier plan.', en: 'A church façade with two spires framed by foliage, with a staircase in the foreground.' },
  }),
];

export const ERASMUS_KTU = [
  photo('lituanie-panorama.webp', 900, 678, {
    title: { fr: 'Prendre de la hauteur.', en: 'A different perspective.' },
    caption: { fr: 'Lituanie · Échange à KTU, 2023', en: 'Lithuania · Exchange at KTU, 2023' },
    alt: { fr: 'Panorama de la ville, entre toits rouges, arbres et ciel bleu', en: 'City panorama with red roofs, trees and blue sky' },
  }),
  photo('lituanie-basket.webp', 900, 678, {
    title: { fr: 'Un soir de basket.', en: 'An evening of basketball.' },
    caption: { fr: 'Souvenir de Lituanie · 2023', en: 'A memory from Lithuania · 2023' },
    alt: { fr: 'Match de basket dans une arène entourée de tribunes remplies', en: 'A basketball game in an arena surrounded by packed stands' },
  }),
  photo('lituanie-matin.webp', 900, 678, {
    title: { fr: 'La ville au petit matin.', en: 'The city at dawn.' },
    caption: { fr: 'Souvenir de Lituanie · 2023', en: 'A memory from Lithuania · 2023' },
    alt: { fr: 'Rue et arbres dans la lumière claire du petit matin', en: 'A street and trees in the clear early-morning light' },
  }),
];

export const ERASMUS_RWU = [
  photo('allemagne-coucher-soleil.webp', 900, 507, {
    title: { fr: 'La fin du jour.', en: 'At the end of the day.' },
    caption: { fr: 'Allemagne · Échange à RWU, 2024–2025', en: 'Germany · Exchange at RWU, 2024–2025' },
    alt: { fr: 'Soleil couchant au-dessus des toits, vu depuis une terrasse pavée', en: 'Sunset over the rooftops, seen from a paved terrace' },
  }),
  photo('allemagne-nuit.webp', 506, 900, {
    title: { fr: 'Une lumière dans la nuit.', en: 'A light in the night.' },
    caption: { fr: 'Souvenir d’Allemagne · 2024', en: 'A memory from Germany · 2024' },
    alt: { fr: 'Sculpture de cheval illuminée de lumières dorées dans la nuit', en: 'A horse sculpture lit with golden lights at night' },
  }),
  photo('allemagne-cours.webp', 900, 507, {
    title: { fr: 'Retour en cours.', en: 'Back in class.' },
    caption: { fr: 'Échange à RWU · 2025', en: 'Exchange at RWU · 2025' },
    alt: { fr: 'Tableau de salle de cours couvert d’équations mathématiques', en: 'A classroom board covered in mathematical equations' },
  }),
];

export const GAMES = [
  photo('jeu-pgr-dmc.webp', 900, 506, {
    title: { fr: 'PGR × Devil May Cry', en: 'PGR × Devil May Cry' },
    caption: { fr: 'Mes univers de jeu', en: 'My gaming worlds' },
    alt: { fr: 'Personnages de jeu vidéo dans une rue pavée, capture de PGR × Devil May Cry', en: 'Video game characters on a cobbled street, screenshot from PGR × Devil May Cry' },
  }),
  photo('jeu-fc25.webp', 900, 507, {
    title: { fr: 'FC 25', en: 'FC 25' },
    caption: { fr: 'Mon équipe Ultimate Team', en: 'My Ultimate Team squad' },
    alt: { fr: 'Photo de mon écran FC 25 avec les cartes de l’équipe Ultimate Team', en: 'A photo of my FC 25 screen showing Ultimate Team player cards' },
  }),
  photo('jeu-rog-ally.webp', 506, 900, {
    title: { fr: 'ROG Xbox Ally X', en: 'ROG Xbox Ally X' },
    caption: { fr: 'Côté console', en: 'My console' },
    alt: { fr: 'Boîte de la console portable ROG Xbox Ally X', en: 'The box of a ROG Xbox Ally X handheld console' },
  }),
];

export const MOMENTS = [
  photo('diplome.jpeg', 900, 1600, {
    title: { fr: 'Un cap franchi.', en: 'A milestone reached.' },
    caption: { fr: 'Remise de diplôme · ESAIP', en: 'Graduation · ESAIP' },
    alt: { fr: 'Mounir en tenue de diplômé, étole turquoise et diplôme ESAIP dans les mains', en: 'Mounir in graduation attire, wearing a turquoise stole and holding his ESAIP diploma' },
  }, { hasThumbnail: false }),
  photo('au-bord-de-leau.jpeg', 1134, 2016, {
    title: { fr: 'Prendre le large.', en: 'Getting away.' },
    caption: { fr: 'Au bord de l’eau', en: 'By the water' },
    alt: { fr: 'Mounir debout sur un quai, devant l’eau et un bateau', en: 'Mounir standing on a quay, with water and a boat behind him' },
  }, { hasThumbnail: false }),
  photo('quotidien.jpeg', 1152, 2048, {
    title: { fr: 'Entre deux trajets.', en: 'Between journeys.' },
    caption: { fr: 'Un instant du quotidien', en: 'An everyday moment' },
    alt: { fr: 'Selfie de Mounir avec ses lunettes et son sac à dos à un arrêt de transport', en: 'A selfie of Mounir wearing glasses and a backpack at a transit stop' },
  }, { hasThumbnail: false }),
];
