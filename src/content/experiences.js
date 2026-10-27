// Professional experience, from Mounir Town (src/content/experiences.js).
const KEY_TECHNOLOGIES = { fr: 'Technologies clés', en: 'Key technologies' };

export const ESSCABOT = {
  name: 'l’ESSCABOT',
  tagline: { fr: 'Le savoir devient une conversation.', en: 'Knowledge becomes a conversation.' },
  description: {
    fr: 'L’assistant IA de l’ESSCA : étudiants et enseignants retrouvent les informations utiles dans leurs documents de cours, avec des réponses qui citent leurs sources.',
    en: 'ESSCA’s AI assistant: students and faculty find useful information in their course materials, with answers that cite their sources.',
  },
  stack: ['Python', 'FastAPI', 'React', 'RAG', 'Azure', 'LiveKit'],
};

export const EXPERIENCES = [
  {
    id: 'essca-ai-developer',
    employer: 'essca',
    period: { fr: 'Avril — octobre 2026', en: 'April — October 2026' },
    headline: { fr: 'Faire vivre les outils', en: 'Keeping the tools running' },
    role: { fr: 'Développeur IA', en: 'AI Developer' },
    organisation: { fr: 'ESSCA · Angers', en: 'ESSCA · Angers' },
    summary: {
      fr: 'Faire évoluer l’ESSCABOT, l’assistant IA de l’ESSCA, et son outil d’administration, tout en accompagnant les équipes dans leur utilisation.',
      en: 'Improve ESSCABOT, ESSCA’s AI assistant, and its administration tool, while helping teams use them.',
    },
    stackLabel: KEY_TECHNOLOGIES,
    stack: 'Python · RAG · Microsoft Graph',
    missions: [
      {
        fr: 'Recueillir les besoins des directions métiers, développer les évolutions et accompagner les utilisateurs non experts.',
        en: 'Gather requirements from business teams, develop improvements and support non-expert users.',
      },
      {
        fr: 'Maintenir la recherche dans les contenus pédagogiques pour que l’assistant retrouve les passages utiles et cite ses sources (Azure AI Search).',
        en: 'Maintain search across teaching materials so the assistant retrieves useful passages and cites its sources (Azure AI Search).',
      },
      {
        fr: 'Gérer des accès distincts pour les enseignants, les étudiants et les collaborateurs (Azure AD · MSAL · Easy Auth).',
        en: 'Manage separate access rights for faculty, students and staff (Azure AD · MSAL · Easy Auth).',
      },
      {
        fr: 'Déployer les mises à jour, surveiller le fonctionnement et traiter les incidents, les migrations de données et les tests de charge sur Azure.',
        en: 'Deploy updates, monitor operations and handle incidents, data migrations and load tests on Azure.',
      },
    ],
  },
  {
    id: 'essca-final-project',
    employer: 'essca',
    period: { fr: 'Sept. 2025 — fév. 2026', en: 'Sept. 2025 — Feb. 2026' },
    headline: { fr: 'Construire la nouvelle version', en: 'Building the new version' },
    role: { fr: 'Développeur FullStack IA', en: 'Full-stack AI Developer' },
    organisation: { fr: 'ESSCA · Projet de fin d’études', en: 'ESSCA · Final-year project' },
    summary: {
      fr: 'Concevoir et mettre en service une nouvelle version de l’ESSCABOT, avec plusieurs assistants adaptés aux cours et des échanges vocaux en temps réel.',
      en: 'Design and launch a new version of ESSCABOT, with multiple course-specific assistants and real-time voice conversations.',
    },
    stackLabel: KEY_TECHNOLOGIES,
    stack: 'Python · RAG · FastAPI · React',
    missions: [
      {
        fr: 'Concevoir une architecture où chaque assistant dispose de ses documents, de ses consignes et de son modèle IA.',
        en: 'Design an architecture where each assistant has its own documents, instructions and AI model.',
      },
      {
        fr: 'Développer le service côté serveur et l’application d’accès aux assistants. Réaliser l’interface web à partir des maquettes Figma (Python · FastAPI · React · TypeScript).',
        en: 'Develop the server-side service and the app for accessing assistants. Build the web interface from Figma designs (Python · FastAPI · React · TypeScript).',
      },
      {
        fr: 'Intégrer la conversation vocale en temps réel et un avatar (LiveKit · Deepgram · ElevenLabs).',
        en: 'Integrate real-time voice conversations and an avatar (LiveKit · Deepgram · ElevenLabs).',
      },
      {
        fr: 'Déployer la solution sur Azure et intégrer un consentement que l’utilisateur peut retirer.',
        en: 'Deploy the solution on Azure and implement consent that users can withdraw.',
      },
    ],
  },
  {
    id: 'essca-internship',
    employer: 'essca',
    period: { fr: 'Avril — juillet 2025', en: 'April — July 2025' },
    headline: { fr: 'Répondre à un besoin métier', en: 'Meeting a business need' },
    role: { fr: 'Développeur fullstack', en: 'Full-stack Developer' },
    organisation: { fr: 'ESSCA · Stage', en: 'ESSCA · Internship' },
    summary: {
      fr: 'Faciliter la recherche d’informations internes sur les collaborateurs et remettre à jour l’ESSCABOT.',
      en: 'Make it easier to find internal information about staff and update the existing ESSCABOT assistant.',
    },
    stackLabel: { fr: 'Approches et outils', en: 'Approaches and tools' },
    stack: 'Python · RAG · Microsoft Graph',
    missions: [
      {
        fr: 'Développer et déployer un outil RH interne permettant de poser des questions en langage courant.',
        en: 'Develop and deploy an internal HR tool that accepts questions in everyday language.',
      },
      {
        fr: 'RAG : rechercher les informations utiles pour alimenter les réponses de l’IA.',
        en: 'RAG: retrieve useful information to inform AI answers.',
      },
      {
        fr: 'Connecter les informations des collaborateurs avec Microsoft Graph et les utiliser pour alimenter les réponses.',
        en: 'Connect staff information through Microsoft Graph and use it to inform the answers.',
      },
      {
        fr: 'Reprendre, mettre à jour et redéployer la version précédente de l’ESSCABOT.',
        en: 'Take over, update and redeploy the previous version of ESSCABOT.',
      },
    ],
  },
  {
    id: 'moov-africa',
    employer: 'moov',
    period: { fr: '2024', en: '2024' },
    headline: { fr: 'Partir des données', en: 'Starting with data' },
    role: { fr: 'Data engineering', en: 'Data engineering' },
    organisation: { fr: 'Moov Africa Burkina', en: 'Moov Africa Burkina' },
    summary: {
      fr: 'Étudier comment organiser et traiter les données d’un opérateur télécom, y compris lorsqu’elles arrivent en continu.',
      en: 'Study how to organise and process a telecom operator’s data, including continuously arriving data.',
    },
    stackLabel: { fr: 'Sujets abordés', en: 'Topics covered' },
    stack: 'Data Lakehouse · CDR · Streaming',
    missions: [
      {
        fr: 'Étudier une architecture Data Lakehouse, qui réunit le stockage des données brutes et leur analyse.',
        en: 'Study a Data Lakehouse architecture, which brings together raw data storage and analysis.',
      },
      {
        fr: 'Travailler sur les données CDR, les relevés techniques des communications téléphoniques.',
        en: 'Work with CDR data, the technical records of telephone communications.',
      },
      {
        fr: 'Réaliser des simulations de traitement de données en continu.',
        en: 'Simulate continuous data processing.',
      },
    ],
  },
];

export function experiencesOf(employer) {
  return EXPERIENCES.filter(experience => experience.employer === employer);
}
