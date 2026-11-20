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

import { defaultImpressum, defaultPrivacy, type ImpressumContent, type PrivacyContent } from './legalDefaults'

export type Photo = { url: string; alt: string }

export type HomeTexts = {
  introTitle: string
  introSub: string
  heroPill: string
  namePrompt: string
  pathPrompt: string
  pathMore: string
  pathSkip: string
  generalHeadline: string
  generalLine: string
  generalCta: string
  rememberLabel: string
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
  /** Hoi's event app with all regional events (button hidden while empty) */
  eventAppUrl: string
  eventAppLabel: string
}

export type ChatbotTexts = {
  enabled: boolean
  buttonLabel: string
  title: string
  greeting: string
  suggestions: string[]
  placeholder: string
  disclaimer: string
  privacyLink: string
  contactIntro: string
  contactPrivacy: string
  contactThanks: string
  contactButton: string
  nameLabel: string
  emailLabel: string
  messageLabel: string
  sendLabel: string
  checkText: string
  errorText: string
  busyText: string
}

/** A question and answer the chatbot knows on top of the website (Sanity → Chatbot). */
export type FaqItem = { question: string; answer: string }

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
  chatbot: ChatbotTexts
  /** what the chatbot knows on top of the website (used by app/api/chat) */
  faq: FaqItem[]
  impressum: ImpressumContent
  privacy: PrivacyContent
}

export const defaultContent: SiteContent = {
  settings: {
    email: 'team@hoi-startup-factory.de',
    address: 'Arberger Hafendamm 1 · 28309 Bremen',
    instagram: 'https://www.instagram.com/hoi_startup_factory/',
    linkedin: 'https://www.linkedin.com/company/hoi-startup-factory/',
    eventAppUrl: '',
    eventAppLabel: 'All events in the region',
  },
  home: {
    introTitle: 'Welcome to the\nharbour of ideas',
    introSub: 'Im Norden gründen – mit Rückenwind.',
    heroPill: 'Im Norden gründen – mit Rückenwind!',
    namePrompt: 'What should we call you?',
    pathPrompt: 'Which path brings you here?',
    pathMore: 'Researcher or student? Start here:',
    pathSkip: 'Just looking around',
    generalHeadline: 'Where science meets business in the Northwest.',
    generalLine: 'hoi connects startups with business and science across Bremen, Oldenburg and the whole Northwest.',
    generalCta: 'Choose your path',
    rememberLabel: 'Remember me on this device',
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
  chatbot: {
    enabled: true,
    buttonLabel: 'Ask hoi',
    title: 'Ask hoi',
    greeting: 'Hoi! I can answer questions about our programmes, events and the website, in English or German. Or leave us a message and the team gets back to you.',
    suggestions: ['What programmes do you offer?', 'What’s on next?', 'How can my company work with hoi?', 'I want to get in touch'],
    placeholder: 'Ask a question…',
    disclaimer: 'Answers are generated by AI and can be wrong. Please don’t share sensitive information.',
    privacyLink: 'Privacy',
    contactIntro: 'Leave your details and the hoi team will get back to you by email.',
    contactPrivacy: 'We only use your details to answer your message. They are sent to the hoi team by email and not stored on this website.',
    contactThanks: 'Thank you! Your message is on its way. The hoi team will reply by email.',
    contactButton: 'Send us a message',
    nameLabel: 'Your name',
    emailLabel: 'Your email',
    messageLabel: 'Your message',
    sendLabel: 'Send',
    checkText: 'Please check:',
    errorText: 'Sorry, that didn’t work. Please try again in a moment, or email us directly:',
    busyText: 'That’s a lot of messages at once. Please wait a minute and try again.',
  },
  faq: [],
  impressum: defaultImpressum,
  privacy: defaultPrivacy,
}
