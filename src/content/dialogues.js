// What Pixel, Mounir's AI guide, says along the way.
export const PIXEL_NAME = 'Pixel';

export const DIALOGUES = {
  intro: [
    { fr: 'Bienvenue sur la planète de Mounir ! Moi, c’est Pixel, son assistant IA.', en: 'Welcome to Mounir’s planet! I’m Pixel, his AI assistant.' },
    { fr: 'Mounir est ingénieur IA et développeur, à Angers. Il conçoit des agents IA — et les systèmes qui les rendent utiles.', en: 'Mounir is an AI engineer and developer based in Angers. He designs AI agents — and the systems that make them useful.' },
    { fr: 'Chaque lieu raconte une partie de son parcours. Ta mission : allumer les 5 balises de ses projets.', en: 'Each place tells part of his story. Your mission: light up the 5 beacons of his projects.' },
    {
      fr: 'ZQSD ou flèches pour marcher, Maj pour courir, Espace pour sauter (deux fois !), E pour entrer. M ouvre la carte.',
      en: 'WASD or arrows to walk, Shift to run, Space to jump (twice!), E to enter. M opens the map.',
      touch: { fr: 'Le joystick pour marcher, glisse pour tourner la vue. Le bouton ✦ pour entrer, la carte pour voyager.', en: 'Use the joystick to walk, drag to turn the view. The ✦ button enters, the map lets you travel.' },
    },
    { fr: 'Huit compétences de Mounir flottent aussi quelque part. Bonne exploration !', en: 'Eight of Mounir’s skills are floating around too. Enjoy exploring!' },
  ],
  welcomeBack: [
    { fr: 'Re-bonjour ! Content de te revoir sur la planète.', en: 'Hi again! Good to see you back on the planet.' },
  ],
  beaconLit: [
    { fr: 'Balise allumée ! Encore {left} à trouver.', en: 'Beacon lit! {left} more to find.' },
  ],
  lastBeacon: [
    { fr: 'Plus qu’une balise ! Regarde la carte (M) pour la repérer.', en: 'Just one beacon left! Check the map (M) to spot it.' },
  ],
  allBeacons: [
    { fr: 'Les cinq balises brillent. Des idées au réel : voilà ce que Mounir construit.', en: 'All five beacons are shining. From ideas to reality: that’s what Mounir builds.' },
    { fr: 'Un projet, une question, une rencontre ? La Poste est juste à côté de la Maison.', en: 'A project, a question, a conversation? The Post Office is right next to the House.' },
  ],
  skillFound: [
    { fr: '{skill} ! {count}/8 compétences.', en: '{skill}! {count}/8 skills.' },
  ],
  allSkills: [
    { fr: 'Tu as rassemblé toute la stack : Python, FastAPI, React, RAG, MCP, Azure, AWS et Big Data !', en: 'You’ve collected the whole stack: Python, FastAPI, React, RAG, MCP, Azure, AWS and Big Data!' },
  ],
  nightfall: [
    { fr: 'La nuit tombe… j’allume ma lampe.', en: 'Night is falling… switching my light on.' },
  ],
  hint: [
    { fr: 'Psst… la prochaine balise, {place}, est à {distance}. Je regarde dans sa direction.', en: 'Psst… the next beacon, {place}, is {distance} away. I’m looking its way.' },
  ],
  water: [
    { fr: 'Trop profond pour moi ! Le port a un ponton, par contre.', en: 'Too deep for me! The harbour has a pier, though.' },
  ],
};
