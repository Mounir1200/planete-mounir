// Projects, from Mounir Town (src/content/projects.js).
const PERSONAL_PROJECT = { fr: 'Projet personnel · Architecture & développement', en: 'Personal project · Architecture & development' };

export const FEATURED_PROJECTS = {
  urdwell: {
    name: 'UrdWell',
    meta: PERSONAL_PROJECT,
    tagline: { fr: 'Une mémoire qui survit à la conversation.', en: 'Memory that outlasts the conversation.' },
    repository: 'https://github.com/Mounir1200/urdwell-mcp',
    stack: ['MCP', { fr: 'Recherche sémantique', en: 'Semantic search' }, { fr: 'Mots-clés', en: 'Keyword search' }, { fr: 'Mémoire locale', en: 'Local memory' }],
    problem: {
      fr: 'Un assistant IA peut oublier une préférence entre deux conversations, ou continuer à utiliser une information devenue fausse.',
      en: 'An AI assistant can forget a preference between conversations, or keep using information that is no longer correct.',
    },
    idea: {
      fr: 'Lui donner une mémoire durable : retrouver les informations utiles, les corriger et garder la trace de ce qui a changé.',
      en: 'Give it a lasting memory: retrieve useful information, update it and keep a record of what changed.',
    },
    choice: {
      fr: 'MCP permet de relier cette mémoire aux assistants compatibles. Les souvenirs restent dans des fichiers locaux. La recherche combine le sens des phrases et les mots-clés pour retrouver aussi bien une idée qu’un nom précis.',
      en: 'MCP connects this memory to compatible assistants. Memories stay in local files. Search combines meaning and keywords to find both an idea and an exact name.',
    },
    testCase: {
      title: { fr: 'Cas de test : corriger un souvenir', en: 'Test case: correcting a memory' },
      intro: {
        fr: 'Le test enregistre une affirmation mathématique, puis fournit une correction qui doit la remplacer.',
        en: 'The test stores a mathematical statement, then supplies a correction to replace it.',
      },
      steps: [
        {
          label: { fr: '1. L’information enregistrée', en: '1. The stored information' },
          text: { fr: '« L’équation x² + 1 = 0 n’a pas de solution. »', en: '“The equation x² + 1 = 0 has no solutions.”' },
        },
        {
          label: { fr: '2. La correction fournie', en: '2. The supplied correction' },
          text: { fr: '« Elle a des solutions dans les nombres complexes. »', en: '“It has solutions in the complex numbers.”' },
        },
      ],
      highlight: { fr: 'Corriger le souvenir, garder son histoire.', en: 'Correct the memory, keep its history.' },
      figures: [],
      checks: {
        fr: 'L’ancienne version devient inactive sans être supprimée. La nouvelle lui est reliée, avec la date du changement.',
        en: 'The old version becomes inactive without being deleted. The new version links to it, with the date of the change.',
      },
      note: {
        fr: 'Le choix de remplacer l’information est fourni par le test.',
        en: 'The decision to replace the information is supplied by the test.',
      },
      source: 'https://github.com/Mounir1200/urdwell-mcp/blob/main/test_pipeline.py#L89-L130',
    },
  },
  hindsight: {
    name: 'HindSight',
    meta: PERSONAL_PROJECT,
    tagline: { fr: 'Comprendre une décision avant de la juger.', en: 'Understand a decision before judging it.' },
    repository: 'https://github.com/Mounir1200/HindSight',
    stack: ['CockroachDB', 'AWS Bedrock', { fr: 'Données bitemporelles', en: 'Bitemporal data' }, 'Audit'],
    problem: {
      fr: 'Une facture est trop élevée. Le système a-t-il utilisé une mauvaise information, ou le bon tarif n’était-il pas encore disponible ?',
      en: 'A bill is too high. Did the system use the wrong information, or was the correct rate not yet available?',
    },
    idea: {
      fr: 'Reconstituer les informations disponibles et celles utilisées par l’agent IA au moment de décider, pour comprendre d’où vient l’erreur.',
      en: 'Reconstruct the information available and what the AI agent used when making the decision, to understand where the error came from.',
    },
    choice: {
      fr: 'La base CockroachDB conserve deux dates : quand un tarif s’applique et quand le système l’a reçu. Des règles de calcul déterminent les montants et le verdict. L’IA, via Bedrock, sert à expliquer ce résultat.',
      en: 'The CockroachDB database keeps two dates: when a rate applies and when the system received it. Calculation rules determine the amounts and verdict. AI, through Bedrock, explains the result.',
    },
    testCase: {
      title: { fr: 'Cas de test : un tarif reçu trop tard', en: 'Test case: a rate received too late' },
      intro: null,
      steps: [
        {
          label: { fr: '2 juillet — La facture est calculée', en: 'July 2 — The bill is calculated' },
          text: {
            fr: 'Un appel de 10 minutes est facturé au tarif connu : 0,25 € par minute.',
            en: 'A 10-minute call is billed at the known rate: €0.25 per minute.',
          },
        },
        {
          label: { fr: '3 juillet — Un tarif corrigé arrive', en: 'July 3 — A corrected rate arrives' },
          text: {
            fr: 'Le tarif est de 0,15 € par minute, mais il s’applique depuis le 1er juillet. Il concerne donc aussi cet appel.',
            en: 'The rate is €0.15 per minute, effective from July 1. It therefore applies to this call too.',
          },
        },
      ],
      highlight: null,
      figures: [
        { label: { fr: 'Montant facturé', en: 'Amount billed' }, value: { fr: '2,50 €', en: '€2.50' } },
        { label: { fr: 'Après correction', en: 'After correction' }, value: { fr: '1,50 €', en: '€1.50' } },
        { label: { fr: 'Facturé en trop', en: 'Overcharged' }, value: { fr: '1,00 €', en: '€1.00' } },
      ],
      checks: {
        fr: 'La facture est incorrecte de 1 €. Mais l’agent ne pouvait pas connaître le tarif corrigé au moment de la calculer.',
        en: 'The bill is €1 too high. But the agent could not have known the corrected rate when it calculated the bill.',
      },
      note: {
        fr: 'Scénario fictif. Le test vérifie les règles de calcul et le verdict.',
        en: 'Fictional scenario. The test checks the calculation rules and verdict.',
      },
      source: 'https://github.com/Mounir1200/HindSight/blob/main/tests/test_retroactive_rate.py#L37-L45',
    },
  },
};

export const OTHER_PROJECTS = {
  grantCopilot: {
    name: 'Grant Copilot',
    domain: { fr: 'Recherche de financements', en: 'Finding funding' },
    tagline: { fr: 'Donner de l’élan aux bonnes idées.', en: 'Giving good ideas momentum.' },
    repository: 'https://github.com/Mounir1200/Grant-Copilot',
    stack: ['Slack', 'Grants.gov', { fr: 'IA générative', en: 'Generative AI' }],
    paragraphs: [
      {
        fr: 'Pour une petite association, trouver une subvention adaptée peut prendre beaucoup de temps. Grant Copilot aide à repérer les financements fédéraux américains qui correspondent à son profil et à préparer une candidature.',
        en: 'For a small nonprofit, finding a suitable grant can take a lot of time. Grant Copilot helps identify US federal funding that matches its profile and prepare an application.',
      },
      {
        fr: 'Depuis Slack, l’association retrouve des offres de Grants.gov filtrées selon ses critères. L’IA explique pourquoi elles peuvent convenir et prépare un premier brouillon de dossier. L’équipe garde la main pour le vérifier, le compléter et l’envoyer.',
        en: 'In Slack, the nonprofit finds Grants.gov opportunities filtered by its criteria. AI explains why they may be suitable and prepares an initial application draft. The team stays in control of reviewing, completing and submitting it.',
      },
    ],
  },
  adqua: {
    name: 'ADQUA',
    domain: { fr: 'Recherche d’emploi', en: 'Job search' },
    tagline: { fr: 'Trouver où ses compétences font la différence.', en: 'Find where your skills make a difference.' },
    repository: 'https://github.com/Mounir1200/Ad-qua',
    stack: [{ fr: 'Matching de CV', en: 'CV matching' }, { fr: 'Recherche sémantique', en: 'Semantic search' }, 'PDF'],
    paragraphs: [
      {
        fr: 'Quand on cherche un emploi, il est difficile de repérer les annonces qui correspondent vraiment à ses compétences parmi toutes celles disponibles. ADQUA aide à faire ce tri et à suivre ses candidatures.',
        en: 'When looking for a job, it can be difficult to spot the listings that really match your skills among all those available. ADQUA helps sort through them and track applications.',
      },
      {
        fr: 'On fournit son CV en PDF et une page carrière d’entreprise. L’outil récupère les offres et les classe selon leur proximité avec le profil, même lorsque le CV et l’annonce n’utilisent pas exactement les mêmes mots.',
        en: 'You provide a PDF CV and a company careers page. The tool collects the listings and ranks them by relevance to your profile, even when the CV and job listing do not use exactly the same words.',
      },
    ],
  },
  chartmind: {
    name: 'ChartMind',
    domain: { fr: 'Analyse de graphiques', en: 'Chart analysis' },
    repository: null,
    paragraphs: [
      {
        fr: 'Un graphique financier rassemble des courbes et des indicateurs qui ne sont pas toujours faciles à interpréter. ChartMind cherche à aider les personnes qui analysent un marché à mieux comprendre ce qu’elles observent.',
        en: 'A financial chart brings together lines and indicators that are not always easy to interpret. ChartMind aims to help people analysing a market better understand what they see.',
      },
      {
        fr: 'Le projet prend la forme d’une application web et mobile qui utilise l’IA pour accompagner la lecture des graphiques. L’objectif est de rendre leur analyse plus accessible et d’aider à comprendre les mouvements de prix et les indicateurs affichés.',
        en: 'The project is a web and mobile app that uses AI to help read charts. Its goal is to make chart analysis more accessible and help explain price movements and the indicators shown.',
      },
    ],
  },
  academic: {
    name: { fr: 'Projets académiques', en: 'Academic projects' },
    domain: { fr: 'Vision · UX · Accessibilité', en: 'Vision · UX · Accessibility' },
    repository: null,
    paragraphs: [
      {
        fr: 'Visages synthétiques. Comment distinguer un vrai visage d’une image modifiée ? Préparation des images, entraînement d’un modèle et évaluation de ses prédictions.',
        en: 'Synthetic faces. How can we distinguish a real face from an altered image? Preparing images, training a model and evaluating its predictions.',
      },
      {
        fr: 'Activ’ESAIP. Comment faciliter l’estimation du coût d’un réseau de chauffage urbain ? Conception du parcours permettant de saisir les données nécessaires au calcul.',
        en: 'Activ’ESAIP. How can we make it easier to estimate the cost of a district heating network? Designing the flow for entering the data needed for the calculation.',
      },
      {
        fr: 'Design4Green. Comment repérer les obstacles qui rendent un site difficile à utiliser pour les personnes en situation de handicap ? Conception d’une expérience web écoresponsable pour évaluer les sites selon le référentiel d’accessibilité RGAA.',
        en: 'Design4Green. How can we identify barriers that make a website difficult for people with disabilities to use? Designing a resource-conscious web experience to assess sites against the RGAA accessibility framework.',
      },
    ],
  },
};
