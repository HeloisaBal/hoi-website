/* ------------------------------------------------------------
   Built-in content: what the site shows before anything is
   edited in Sanity (and the seed for the Sanity dataset, see
   sanity/seed). Colours and personas' ids stay in code.
   ------------------------------------------------------------ */

export type PersonaId = 'researcher' | 'founder' | 'student' | 'company' | 'investor'

/** Colours the whole page takes on for a persona. All from the brand palette. */
export type Theme = {
  /** hero gradient stops */
  c1: string
  c2: string
  c3: string
  /** buttons, labels, highlights (white text sits on it, so keep it dark enough) */
  accent: string
  /** soft page background */
  tint: string
}

export const DEFAULT_THEME: Theme = {
  c1: '#00d7b8', c2: '#003efe', c3: '#9a00ff', accent: '#8a00e6', tint: '#f8f0ff', // soft hoi purple before a persona is picked
}

export type Persona = {
  id: PersonaId
  theme: Theme
  /** one-word label shown in the theme change moment */
  word: string
  chip: string
  /** how Hoi greets this person in the hero */
  headline: string
  line: string
  cta: string
  /** short form used in sentences: "for researchers" */
  plural: string
}

export const personas: Persona[] = [
  {
    id: 'researcher',
    theme: { c1: '#2ceccd', c2: '#06b6d4', c3: '#003efe', accent: '#0e7490', tint: '#ecfbfd' },
    word: 'Research',
    chip: 'a researcher with an idea',
    headline: 'Your research could be a company.',
    line: 'We help you take an idea out of the lab: first conversations, funding calls and a team around you.',
    cta: 'Start with your research',
    plural: 'researchers',
  },
  {
    id: 'founder',
    theme: { c1: '#c261ff', c2: '#9a00ff', c3: '#003efe', accent: '#8a00e6', tint: '#f8f0ff' },
    word: 'Build',
    chip: 'a founder',
    headline: 'Build it here. With a tailwind.',
    line: 'Programmes, capital and a network across Bremen, Oldenburg and the whole Northwest.',
    cta: 'See founder programmes',
    plural: 'founders',
  },
  {
    id: 'student',
    theme: { c1: '#2ceccd', c2: '#7089ff', c3: '#9a00ff', accent: '#5a3bd6', tint: '#f2f1ff' },
    word: 'Learn',
    chip: 'a student',
    headline: 'Curious about founding? Start here.',
    line: 'Learn the basics, meet founders at our events and find a team for your idea.',
    cta: 'Explore what’s on',
    plural: 'students',
  },
  {
    id: 'company',
    theme: { c1: '#3f5cff', c2: '#003efe', c3: '#091a52', accent: '#0032d9', tint: '#eff3ff' },
    word: 'Partner',
    chip: 'a company',
    headline: 'Meet the ideas that shape your industry.',
    line: 'Work with startups from the region and get early access to new ideas and technologies.',
    cta: 'Partner with hoi',
    plural: 'companies',
  },
  {
    id: 'investor',
    theme: { c1: '#34d399', c2: '#059669', c3: '#064e3b', accent: '#047857', tint: '#eefcf5' },
    word: 'Invest',
    chip: 'an investor',
    headline: 'Science-based startups from the Northwest.',
    line: 'Meet the teams coming out of our universities and research institutes, early.',
    cta: 'Meet our startups',
    plural: 'investors',
  },
]

/** Places on the harbour map (components/site/HarbourMap.tsx). */
export const CITIES = {
  emden: { name: 'Emden', x: 240, y: 520 },
  wilhelmshaven: { name: 'Wilhelmshaven', x: 720, y: 500 },
  bremerhaven: { name: 'Bremerhaven', x: 1010, y: 420 },
  oldenburg: { name: 'Oldenburg', x: 800, y: 720 },
  bremen: { name: 'Bremen', x: 1150, y: 840 },
} as const
export type CityId = keyof typeof CITIES

/** Card colours editors can pick from (brand gradients). */
export const EVENT_COLOURS = {
  'teal-blue': { title: 'Teal → blue', gradient: 'linear-gradient(150deg, #00d7b8 0%, #003efe 100%)' },
  'blue-purple': { title: 'Blue → purple', gradient: 'linear-gradient(150deg, #003efe 0%, #9a00ff 100%)' },
  purple: { title: 'Purple', gradient: 'linear-gradient(150deg, #9a00ff 0%, #7400c2 100%)' },
  'purple-teal': { title: 'Purple → teal', gradient: 'linear-gradient(150deg, #9a00ff 0%, #00d7b8 100%)' },
  green: { title: 'Green', gradient: 'linear-gradient(150deg, #34d399 0%, #047857 100%)' },
  navy: { title: 'Navy', gradient: 'linear-gradient(150deg, #3f5cff 0%, #091a52 100%)' },
} as const
export type EventColour = keyof typeof EVENT_COLOURS

export type HoiEvent = {
  id: string
  partner: string
  label: string
  title: string
  meta: string[]
  gradient: string
  for: PersonaId[]
  /** where the pin goes on the harbour map */
  city?: CityId
  /** optional page with more info or registration */
  link?: string
}

export const events: HoiEvent[] = [
  {
    id: 'prototypenparty',
    partner: 'hallig hanken',
    label: 'Ecosystem event',
    title: 'Prototypen\u00adparty Oldenburg',
    meta: ['12 November 2026 · 16:00', '@ hallig hanken'],
    gradient: EVENT_COLOURS['teal-blue'].gradient,
    for: ['founder', 'student', 'researcher', 'investor'],
    city: 'oldenburg',
  },
  {
    id: 'go-batch-19',
    partner: 'GO!',
    label: 'Incubator programme',
    title: 'Call for applications',
    meta: ['Batch #19', 'Start January 2027'],
    gradient: EVENT_COLOURS['blue-purple'].gradient,
    for: ['founder', 'researcher', 'student'],
    city: 'oldenburg',
  },
  {
    id: 'research-to-business',
    partner: 'matena innovate! center',
    label: 'Funding initiative',
    title: 'Research to business call',
    meta: ['Up to €150,000 funding', 'Continuous call, no deadlines'],
    gradient: EVENT_COLOURS.purple.gradient,
    for: ['researcher', 'founder', 'company'],
    city: 'bremen',
  },
  {
    id: 'bmi-microdegree',
    partner: 'hoi',
    label: 'New microdegree',
    title: 'Business model innovation',
    meta: ['Dates coming soon'],
    gradient: EVENT_COLOURS['purple-teal'].gradient,
    for: ['student', 'founder', 'company'],
    city: 'bremen',
  },
]

/** One stage of the founder journey (homepage). Each stage names the hoi
 *  offer for it; `for` decides where a persona sees "You are here". */
export type JourneyStage = {
  id: string
  title: string
  text: string
  programme: string
  for: PersonaId[]
}

export const journey: JourneyStage[] = [
  {
    id: 'idea',
    title: 'Idea',
    text: 'Curious about founding? Learn the basics and meet people who have done it.',
    programme: 'Microdegrees & events',
    for: ['student'],
  },
  {
    id: 'lab',
    title: 'Lab',
    text: 'From a research result to a first business idea, with people who have done it before.',
    programme: 'Science Start-up Funnel',
    for: ['researcher'],
  },
  {
    id: 'team',
    title: 'Team',
    text: 'Hands-on support to build the company: team, product and the first customers.',
    programme: 'Venture Studio',
    for: ['founder'],
  },
  {
    id: 'funding',
    title: 'Funding',
    text: 'Access to funding, investors and the people who open doors in the Northwest.',
    programme: 'Kapital & Netzwerk',
    for: ['investor'],
  },
  {
    id: 'company',
    title: 'Company',
    text: 'Regional companies and startups working together on real challenges.',
    programme: 'Corporate Cooperations',
    for: ['company'],
  },
]

export type Partner = { name: string; logoUrl?: string; href?: string }

export const partners: Partner[] = [
  'Universität Bremen',
  'Universität Oldenburg',
  'Handelskammer Bremen',
  'swb AG',
  'Hochschule Bremen',
  'Constructor University',
].map((name) => ({ name }))

export type TeamMember = { name: string; role: string; photoUrl?: string; photoAlt?: string }

/** People shown in the contact card. */
export const team: TeamMember[] = [
  { name: 'Sarah Fraikue', role: 'Co-CEO' },
  { name: 'Arne Stehnken', role: 'Co-CEO' },
]

/** The announcement bar at the top of every page. In Sanity: the
 *  "Highlight" document type (sanity/schemaTypes/highlight.ts). */
export type Highlight = {
  id: string
  title: string
  label?: string
  text?: string
  /** "/events" (this site) or "https://…" (another site) */
  link?: string
  linkText?: string
  logoUrl?: string
  logoAlt?: string
}

/** DEMO: shown until Sanity is connected. TEDx name and logo rules apply
 *  to the real one (use only what the TEDx organisers provide). */
export const demoHighlight: Highlight = {
  id: 'demo-tedx',
  label: 'Partnership',
  title: 'hoi is partnering with TEDx',
  text: 'Ideas from the Northwest on the TEDx stage. Details coming soon.',
  link: '/#contact',
  linkText: 'Stay in the loop',
}
