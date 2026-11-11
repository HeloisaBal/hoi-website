/* ------------------------------------------------------------
   Everything editable on the site, in one object. The server
   fills it from Sanity (sanity/lib/content.ts) and falls back to
   the built-in defaults below for anything that is still empty.
   Components read it with useContent() (ContentContext.tsx).
   ------------------------------------------------------------ */

import {
  events, journey, partners, personas, team,
  type HoiEvent, type Highlight, type JourneyStage, type Partner, type Persona, type TeamMember,
} from './data'

export type Photo = { url: string; alt: string }

export type HomeTexts = {
  introTitle: string
  introSub: string
  heroPill: string
  namePrompt: string
  heroPhoto: Photo
  eventsEyebrow: string
  eventsTitle: string
  eventsMarquee: string
  journeyEyebrow: string
  journeyTitle: string
  mapEyebrow: string
  mapTitle: string
  mapText: string
  sbEyebrow: string
  sbTitle: string
  scienceWords: string[]
  businessWords: string[]
  aboutEyebrow: string
  quote: string
  quoteBy: string
  aboutPhotos: (Photo | null)[]
  aboutLinkText: string
  partnersTitle: string
  contactTitle: string
  contactText: string
  contactButton: string
}

export type EventsPageTexts = {
  pill: string
  titleLine1: string
  titleLine2: string
  intro: string
  ctaTitle: string
  ctaText: string
}

export type SiteSettings = {
  email: string
  address: string
  instagram: string
  linkedin: string
}

export type SiteContent = {
  settings: SiteSettings
  home: HomeTexts
  eventsPage: EventsPageTexts
  personas: Persona[]
  events: HoiEvent[]
  journey: JourneyStage[]
  partners: Partner[]
  team: TeamMember[]
  highlight: Highlight | null
}

export const defaultContent: SiteContent = {
  settings: {
    email: 'team@hoi-startup-factory.de',
    address: 'Arberger Hafendamm 1 · 28309 Bremen',
    instagram: 'https://www.instagram.com/hoi_startup_factory/',
    linkedin: 'https://www.linkedin.com/company/hoi-startup-factory/',
  },
  home: {
    introTitle: 'Welcome to the\nharbour of ideas',
    introSub: 'Im Norden gründen – mit Rückenwind.',
    heroPill: 'Im Norden gründen – mit Rückenwind!',
    namePrompt: 'What should we call you?',
    heroPhoto: { url: '/photos/hoi-team.jpg', alt: 'The hoi startup factory team in front of a hoi flag' },
    eventsEyebrow: 'What’s on',
    eventsTitle: 'Next up at hoi',
    eventsMarquee: 'WHAT’S ON · IM NORDEN GRÜNDEN · WHAT’S ON · MIT RÜCKENWIND ·',
    journeyEyebrow: 'What we do',
    journeyTitle: 'From lab idea to company',
    mapEyebrow: 'On the map',
    mapTitle: 'Find hoi across the Northwest',
    mapText: 'Events and programmes from the coast to Bremen. Drag the map in any direction and tap a pin.',
    sbEyebrow: 'Why hoi',
    sbTitle: 'Where science meets business',
    scienceWords: ['Research', 'Lab results', 'PhD projects', 'Patents', 'Prototypes', 'Data'],
    businessWords: ['Customers', 'Capital', 'Markets', 'Corporate partners', 'Teams', 'Growth'],
    aboutEyebrow: 'Founders at hoi',
    quote: 'A quote from one of the founders hoi supports goes here.',
    quoteBy: 'Name · Startup · Programme',
    aboutPhotos: [null, null],
    aboutLinkText: 'Meet our startups',
    partnersTitle: 'Backed by science and business in the Northwest',
    contactTitle: 'Hoi cares. Say hoi.',
    contactText: 'Got an idea, a question or a startup? We’d love to hear from you.',
    contactButton: 'Get in touch',
  },
  eventsPage: {
    pill: 'Events & programmes',
    titleLine1: 'What’s on',
    titleLine2: 'at hoi.',
    intro: 'Meetups, programmes, funding calls and learning formats across Bremen, Oldenburg and the whole Northwest.',
    ctaTitle: 'Never miss an event.',
    ctaText: 'New events and calls go up on Instagram first. Want to host something with hoi? Let’s talk.',
  },
  personas,
  events,
  journey,
  partners,
  team,
  highlight: null,
}
