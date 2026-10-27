// Professional facts reused from Mounir Town (github.com/Mounir1200/mounir-town, src/content).
import { assetUrl } from './photos.js';

export const PROFILE = {
  name: 'Mounir DABIRE',
  firstName: 'Mounir',
  role: { fr: 'Ingénieur IA & développeur', en: 'AI Engineer & Developer' },
  city: 'Angers, France',
  pitch: {
    fr: 'Je conçois des agents IA. Et les systèmes qui les rendent utiles.',
    en: 'I design AI agents. And the systems that make them useful.',
  },
  motto: { fr: 'Des idées au réel.', en: 'From ideas to reality.' },
  email: 'mounirdabire47@gmail.com',
  links: {
    linkedin: 'https://www.linkedin.com/in/mounir-dabire/',
    github: 'https://github.com/Mounir1200',
    town: 'https://mounir1200.github.io/mounir-town/',
  },
  cv: {
    fr: { href: assetUrl('cv/DABIRE_Mounir_CV_FR.pdf'), filename: 'DABIRE_Mounir_CV_FR.pdf' },
    en: { href: assetUrl('cv/DABIRE_Mounir_CV_EN.pdf'), filename: 'DABIRE_Mounir_CV_EN.pdf' },
  },
};

export const ABOUT = {
  title: { fr: 'Partir des données.', en: 'Starting with data.' },
  paragraphs: [
    {
      fr: 'En entreprise, je développe pour des besoins concrets. Mon parcours, de Ouagadougou à Angers, nourrit cette façon de relier les données, le développement et les usages.',
      en: 'At work, I build for concrete needs. My journey from Ouagadougou to Angers shapes how I connect data, development and real-world uses.',
    },
    {
      fr: 'Comprendre un besoin, construire la solution, puis la faire vivre.',
      en: 'Understand a need, build the solution, then keep it running.',
    },
  ],
};

// The eight skills hidden around the planet, as in Mounir Town.
export const SKILLS = [
  { id: 'python', name: 'Python' },
  { id: 'fastapi', name: 'FastAPI' },
  { id: 'react', name: 'React' },
  { id: 'rag', name: 'RAG' },
  { id: 'mcp', name: 'MCP' },
  { id: 'azure', name: 'Azure' },
  { id: 'aws', name: 'AWS' },
  { id: 'big-data', name: 'Big Data' },
];

export const EDUCATION = {
  title: { fr: 'De Ouagadougou à Angers.', en: 'From Ouagadougou to Angers.' },
  paragraphs: [
    {
      fr: 'Après deux années de classes préparatoires à La Salle, à Ouagadougou, j’ai rejoint l’ESAIP à Angers pour me spécialiser en Big Data.',
      en: 'After two years of preparatory classes at La Salle in Ouagadougou, I joined ESAIP in Angers to specialise in Big Data.',
    },
    {
      fr: 'Deux échanges Erasmus, à KTU en Lituanie puis à RWU en Allemagne, ont aussi jalonné cette formation. En 2026, j’obtiens mon diplôme d’ingénieur.',
      en: 'Two Erasmus exchanges, at KTU in Lithuania and then RWU in Germany, also shaped this education. I graduated with an engineering degree in 2026.',
    },
    {
      fr: 'La suite se joue sur le terrain : des systèmes de données chez Moov Africa aux assistants IA à l’ESSCA.',
      en: 'The story continues in practice: from data systems at Moov Africa to AI assistants at ESSCA.',
    },
  ],
  milestones: [
    {
      name: 'ESAIP',
      detail: {
        fr: '2022–2026 · Diplôme d’ingénieur, spécialisation Big Data, parcours anglophone.',
        en: '2022–2026 · Engineering degree, specialising in Big Data, taught in English.',
      },
    },
    {
      name: { fr: 'Deux échanges Erasmus', en: 'Two Erasmus exchanges' },
      detail: {
        fr: 'RWU, Allemagne · 2024–2025 — KTU, Lituanie · 2023',
        en: 'RWU, Germany · 2024–2025 — KTU, Lithuania · 2023',
      },
    },
    {
      name: 'CPGE La Salle',
      detail: {
        fr: '2020–2022 · Classes préparatoires à Ouagadougou, Burkina Faso.',
        en: '2020–2022 · Preparatory classes in Ouagadougou, Burkina Faso.',
      },
    },
  ],
};

export const ERASMUS = {
  ktu: {
    label: { fr: 'Erasmus · KTU · 2023 · Lituanie', en: 'Erasmus · KTU · 2023 · Lithuania' },
    title: { fr: 'Un premier échange à Kaunas.', en: 'A first exchange in Kaunas.' },
  },
  rwu: {
    label: { fr: 'Erasmus · RWU · 2024–2025 · Allemagne', en: 'Erasmus · RWU · 2024–2025 · Germany' },
    title: { fr: 'Puis Ravensburg-Weingarten, avec RWU.', en: 'Then Ravensburg-Weingarten, with RWU.' },
  },
  text: {
    fr: 'Deux échanges Erasmus, et des souvenirs qui débordent des salles de cours.',
    en: 'Two Erasmus exchanges, with memories that go beyond the classroom.',
  },
};

export const HOBBIES = {
  title: { fr: 'Ce qui m’anime, en dehors du code.', en: 'What inspires me, beyond the code.' },
  text: {
    fr: 'Le parcours ne tient pas qu’à un CV. Il y a aussi les images que je garde, les univers que j’explore et les moments que je prends pour moi.',
    en: 'A journey is more than a CV. There are also the images I keep, the worlds I explore and the time I take for myself.',
  },
  gaming: {
    title: { fr: 'Jeux vidéo & mangas', en: 'Video games & manga' },
    text: {
      fr: 'FC 25, PGR × Devil May Cry, les mangas… D’autres univers dans lesquels j’aime passer du temps. Côté console : la ROG Xbox Ally X.',
      en: 'FC 25, PGR × Devil May Cry, manga… Other worlds I enjoy spending time in. My console: the ROG Xbox Ally X.',
    },
  },
  photography: {
    title: { fr: 'Juste un instant.', en: 'Just a moment.' },
    text: {
      fr: 'Mon Pixel, et ce qui attire mon regard. Des moments pris au hasard, d’autres que je veux garder précisément. Un ciel, une lumière, un détail dans une journée ordinaire.',
      en: 'My Pixel, and whatever catches my eye. Some moments captured by chance, others I want to remember precisely. A sky, a certain light, a detail in an ordinary day.',
    },
  },
  moments: {
    title: { fr: 'Le parcours, en images.', en: 'The journey, in pictures.' },
    text: {
      fr: 'Derrière les expériences et les projets, il y a aussi ces moments : un diplôme, une échappée, un trajet.',
      en: 'Behind the experiences and projects, there are also these moments: a graduation, a getaway, a journey.',
    },
  },
  reading: {
    title: { fr: 'Quelques lignes qui restent.', en: 'A few lines that stay with me.' },
    quote: {
      fr: '« Le rêveur, s’il faut le définir en détail, n’est pas un homme, mais, savez-vous ? une espèce de créature du genre neutre. »',
      en: '“The dreamer, if we must define him in detail, is not a man but, you know, a sort of creature somewhere in between.”',
    },
    source: { fr: 'Fiodor Dostoïevski, Les Nuits blanches', en: 'Fiodor Dostoïevski, White Nights' },
  },
  more: {
    fr: 'La musique fait aussi partie de mon quotidien. Et du temps pour moi, à la salle de musculation.',
    en: 'Music is part of my everyday life too. And time for myself, at the gym.',
  },
};
