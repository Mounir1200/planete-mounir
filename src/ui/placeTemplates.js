import { EXPERIENCES, ESSCABOT, experiencesOf } from '../content/experiences.js';
import { ERASMUS_KTU, ERASMUS_RWU, GAMES, MOMENTS, PHOTOGRAPHY, PORTRAIT } from '../content/photos.js';
import { ABOUT, EDUCATION, ERASMUS, HOBBIES, PROFILE, SKILLS } from '../content/profile.js';
import { FEATURED_PROJECTS, OTHER_PROJECTS } from '../content/projects.js';
import { UI } from '../content/ui-strings.js';
import { currentLanguage, format, t } from '../i18n.js';
import { escapeHtml, externalLink } from './dom.js';
import { icon } from './icons.js';

// Turns each place's content into panel HTML. Photo grids carry a
// `data-gallery` key so the panel can open them in the lightbox.
export const PHOTO_SETS = { photography: PHOTOGRAPHY, moments: MOMENTS, games: GAMES, ktu: ERASMUS_KTU, rwu: ERASMUS_RWU };

const text = value => escapeHtml(t(value));
const paragraphs = list => list.map(item => `<p>${text(item)}</p>`).join('');
const chips = items => `<ul class="chips">${items.map(item => `<li>${text(item)}</li>`).join('')}</ul>`;
const section = (title, body) => `<section class="panel-section"><h3>${text(title)}</h3>${body}</section>`;
const repositoryLink = url => (url ? `<p class="panel-actions">${externalLink(url, `${icon('github', { size: 18 })}<span>${text(UI.viewCode)}</span>`, 'button button-primary')}</p>` : '');

function photoGrid(setKey, photos = PHOTO_SETS[setKey]) {
  const items = photos.map((photo, index) => `
    <li><button class="photo-tile" type="button" data-gallery="${setKey}" data-index="${index}" style="aspect-ratio:${photo.width}/${photo.height}">
      <img src="${photo.thumb}" alt="${text(photo.alt)}" loading="lazy" width="${photo.width}" height="${photo.height}">
      <span>${text(photo.title)}</span>
    </button></li>`).join('');
  return `<ul class="photo-grid">${items}</ul>`;
}

function cvButtons() {
  const language = currentLanguage();
  const order = language === 'fr' ? ['fr', 'en'] : ['en', 'fr'];
  return order.map((code, index) => {
    const cv = PROFILE.cv[code];
    return `<a class="button ${index === 0 ? 'button-primary' : 'button-ghost'}" href="${cv.href}" download="${cv.filename}">${icon('download', { size: 18 })}<span>CV ${code.toUpperCase()}</span></a>`;
  }).join('');
}

function experienceCard(experience, { open = false } = {}) {
  return `<details class="experience" ${open ? 'open' : ''}>
    <summary>
      <span class="experience-period">${text(experience.period)}</span>
      <strong>${text(experience.role)}</strong>
      <span class="experience-org">${text(experience.organisation)}</span>
    </summary>
    <p class="experience-headline">${text(experience.headline)}</p>
    <p>${text(experience.summary)}</p>
    <ul class="missions">${experience.missions.map(mission => `<li>${text(mission)}</li>`).join('')}</ul>
    <p class="experience-stack"><span>${text(experience.stackLabel)}</span> ${escapeHtml(experience.stack)}</p>
  </details>`;
}

function featuredProject(project) {
  const test = project.testCase;
  const steps = test.steps.map(step => `<li><strong>${text(step.label)}</strong><span>${text(step.text)}</span></li>`).join('');
  const figures = test.figures.length
    ? `<dl class="figures">${test.figures.map(figure => `<div><dt>${text(figure.label)}</dt><dd>${text(figure.value)}</dd></div>`).join('')}</dl>`
    : '';
  return [
    section(UI.problem, `<p>${text(project.problem)}</p>`),
    section(UI.idea, `<p>${text(project.idea)}</p>`),
    section(UI.choice, `<p>${text(project.choice)}</p>${chips(project.stack)}`),
    `<section class="panel-section test-case">
      <h3>${text(test.title)}</h3>
      ${test.intro ? `<p>${text(test.intro)}</p>` : ''}
      <ol class="steps">${steps}</ol>
      ${figures}
      ${test.highlight ? `<p class="highlight">${text(test.highlight)}</p>` : ''}
      <p>${text(test.checks)}</p>
      <p class="note">${text(test.note)} ${externalLink(test.source, text(UI.viewTest))}</p>
    </section>`,
    repositoryLink(project.repository),
  ].join('');
}

function otherProject(project) {
  return `${paragraphs(project.paragraphs)}${project.stack ? chips(project.stack) : ''}${repositoryLink(project.repository)}`;
}

const TEMPLATES = {
  gym: () => ({
    title: { fr: 'La Salle de sport', en: 'The Gym' },
    tagline: { fr: 'Une pause, côté musculation.', en: 'Time for a workout.' },
    body: `${section(HOBBIES.title, `<p>${text(HOBBIES.more)}</p>`)}
      <p class="note">${text({ fr: 'Le bâtiment reprend le club Basic-Fit d’Angers, rue Clément Ader, comme référence architecturale. Il illustre mon goût pour la musculation, sans désigner ma salle habituelle.', en: 'The building uses Basic-Fit on rue Clément Ader in Angers as an architectural reference. It represents my interest in strength training, rather than identifying my regular gym.' })}</p>`,
  }),
  maison: ({ collectedSkills }) => ({
    title: PROFILE.name,
    tagline: PROFILE.pitch,
    body: `
      <div class="profile-head">
        <img class="portrait" src="${PORTRAIT}" alt="${escapeHtml(t({ fr: 'Portrait de Mounir DABIRE, chemise cobalt et tee-shirt pêche', en: 'Portrait of Mounir DABIRE wearing a cobalt shirt and peach T-shirt' }))}" width="560" height="700">
        <div>
          <p class="role">${text(PROFILE.role)}</p>
          <p class="city">${escapeHtml(PROFILE.city)}</p>
          <p class="motto">${text(PROFILE.motto)}</p>
        </div>
      </div>
      ${section(ABOUT.title, paragraphs(ABOUT.paragraphs))}
      ${section(UI.skillsTitle, `<ul class="chips skills">${SKILLS.map(skill => `<li class="${collectedSkills.has(skill.id) ? 'is-found' : ''}">${escapeHtml(skill.name)}</li>`).join('')}</ul>
        <p class="note">${escapeHtml(format(UI.skillsHint, { count: collectedSkills.size }))}</p>`)}
      ${section(UI.experienceTitle, `<ul class="timeline">${EXPERIENCES.map(experience => `<li><span>${text(experience.period)}</span><strong>${text(experience.role)}</strong> · ${text(experience.organisation)}</li>`).join('')}</ul>`)}
      ${section(UI.educationTitle, `<ul class="timeline">${EDUCATION.milestones.map(milestone => `<li><strong>${text(milestone.name)}</strong> ${text(milestone.detail)}</li>`).join('')}</ul>`)}
      ${section(HOBBIES.title, `<p>${text(HOBBIES.text)}</p>
        <h4>${text(HOBBIES.gaming.title)}</h4><p>${text(HOBBIES.gaming.text)}</p>${photoGrid('games')}
        <h4>${text(HOBBIES.reading.title)}</h4><blockquote>${text(HOBBIES.reading.quote)}<cite>${text(HOBBIES.reading.source)}</cite></blockquote>
        <p>${text(HOBBIES.more)}</p>`)}
      <p class="panel-actions">${cvButtons()}</p>`,
  }),
  essca: () => ({
    title: ESSCABOT.name,
    tagline: ESSCABOT.tagline,
    body: `<p class="lead">${text(ESSCABOT.description)}</p>${chips(ESSCABOT.stack)}
      ${section({ fr: 'Trois missions à l’ESSCA', en: 'Three roles at ESSCA' }, experiencesOf('essca').map((experience, index) => experienceCard(experience, { open: index === 0 })).join(''))}`,
  }),
  esaip: () => ({
    title: EDUCATION.title,
    tagline: EDUCATION.milestones[0].detail,
    body: `${paragraphs(EDUCATION.paragraphs)}
      ${section(UI.educationTitle, `<ul class="timeline">${EDUCATION.milestones.map(milestone => `<li><strong>${text(milestone.name)}</strong> ${text(milestone.detail)}</li>`).join('')}</ul>`)}
      ${section(HOBBIES.moments.title, `<p>${text(HOBBIES.moments.text)}</p>${photoGrid('moments')}`)}`,
  }),
  poste: () => ({
    title: { fr: 'Écrivez-moi', en: 'Write to me' },
    tagline: UI.contactLead,
    body: `
      <div class="contact-card">
        <a class="contact-email" href="mailto:${PROFILE.email}">${icon('mail', { size: 22 })}<span>${PROFILE.email}</span></a>
        <button class="button button-ghost" type="button" data-copy="${PROFILE.email}">${icon('copy', { size: 18 })}<span>${text(UI.copyEmail)}</span></button>
      </div>
      <p class="panel-actions">
        ${externalLink(PROFILE.links.linkedin, `${icon('linkedin', { size: 18 })}<span>LinkedIn</span>`, 'button button-primary')}
        ${externalLink(PROFILE.links.github, `${icon('github', { size: 18 })}<span>GitHub</span>`, 'button button-primary')}
      </p>
      ${section(UI.downloadCv, `<p class="panel-actions">${cvButtons()}</p>`)}
      <p class="note">${externalLink(PROFILE.links.town, text(UI.previousPortfolio))}</p>`,
  }),
  galerie: () => ({
    title: HOBBIES.photography.title,
    tagline: { fr: 'Photos prises au Pixel, entre Angers, Kaunas et Ravensburg.', en: 'Photos shot on Pixel, between Angers, Kaunas and Ravensburg.' },
    body: `<p>${text(HOBBIES.photography.text)}</p>${photoGrid('photography')}
      ${section(HOBBIES.moments.title, `<p>${text(HOBBIES.moments.text)}</p>${photoGrid('moments')}`)}`,
  }),
  urdwell: () => ({ title: FEATURED_PROJECTS.urdwell.name, tagline: FEATURED_PROJECTS.urdwell.tagline, meta: FEATURED_PROJECTS.urdwell.meta, body: featuredProject(FEATURED_PROJECTS.urdwell) }),
  hindsight: () => ({ title: FEATURED_PROJECTS.hindsight.name, tagline: FEATURED_PROJECTS.hindsight.tagline, meta: FEATURED_PROJECTS.hindsight.meta, body: featuredProject(FEATURED_PROJECTS.hindsight) }),
  phare: () => ({ title: OTHER_PROJECTS.grantCopilot.name, tagline: OTHER_PROJECTS.grantCopilot.tagline, meta: OTHER_PROJECTS.grantCopilot.domain, body: otherProject(OTHER_PROJECTS.grantCopilot) }),
  port: () => ({ title: OTHER_PROJECTS.adqua.name, tagline: OTHER_PROJECTS.adqua.tagline, meta: OTHER_PROJECTS.adqua.domain, body: otherProject(OTHER_PROJECTS.adqua) }),
  labo: () => ({
    title: { fr: 'D’autres façons de rendre l’IA utile.', en: 'More ways to make AI useful.' },
    tagline: { fr: 'ChartMind et les projets menés à l’ESAIP.', en: 'ChartMind and the projects built at ESAIP.' },
    body: `${section({ fr: `${OTHER_PROJECTS.chartmind.name} · ${t(OTHER_PROJECTS.chartmind.domain)}`, en: `${OTHER_PROJECTS.chartmind.name} · ${t(OTHER_PROJECTS.chartmind.domain)}` }, paragraphs(OTHER_PROJECTS.chartmind.paragraphs))}
      ${section({ fr: `${t(OTHER_PROJECTS.academic.name)} · ${t(OTHER_PROJECTS.academic.domain)}`, en: `${t(OTHER_PROJECTS.academic.name)} · ${t(OTHER_PROJECTS.academic.domain)}` }, `<ul class="missions">${OTHER_PROJECTS.academic.paragraphs.map(item => `<li>${text(item)}</li>`).join('')}</ul>`)}`,
  }),
  ouaga: () => ({
    title: EDUCATION.title,
    tagline: EDUCATION.milestones[2].detail,
    body: `<p class="lead">${text(EDUCATION.paragraphs[0])}</p>
      ${section({ fr: 'Le point de départ', en: 'Where it started' }, `<ul class="timeline"><li><strong>CPGE La Salle</strong> ${text(EDUCATION.milestones[2].detail)}</li><li><strong>Moov Africa Burkina</strong> ${text({ fr: '2024 · Data engineering, une première expérience en entreprise sur les données télécoms.', en: '2024 · Data engineering, a first industry experience with telecom data.' })}</li></ul>`)}
      <p>${text(EDUCATION.paragraphs[2])}</p>`,
  }),
  moov: () => {
    const experience = experiencesOf('moov')[0];
    return {
      title: experience.organisation,
      tagline: experience.headline,
      body: `<p class="lead">${text(experience.summary)}</p><ul class="missions">${experience.missions.map(mission => `<li>${text(mission)}</li>`).join('')}</ul>
        <p class="experience-stack"><span>${text(experience.stackLabel)}</span> ${escapeHtml(experience.stack)}</p>`,
      meta: { fr: `${t(experience.role)} · ${t(experience.period)}`, en: `${t(experience.role)} · ${t(experience.period)}` },
    };
  },
  ktu: () => ({ title: ERASMUS.ktu.title, tagline: ERASMUS.text, meta: ERASMUS.ktu.label, body: photoGrid('ktu') }),
  rwu: () => ({ title: ERASMUS.rwu.title, tagline: ERASMUS.text, meta: ERASMUS.rwu.label, body: photoGrid('rwu') }),
};

export function renderPlace(place, context) {
  const content = TEMPLATES[place.id](context);
  return {
    kicker: t(content.meta ?? place.kicker),
    title: t(content.title),
    tagline: t(content.tagline),
    body: content.body,
  };
}
