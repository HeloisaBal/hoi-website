/* ------------------------------------------------------------
   Content for the /preview homepage.
   Hard-coded for now; each of these lists becomes a Sanity
   document type later (persona, event, programme).
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
  c1: '#00d7b8', c2: '#003efe', c3: '#9a00ff', accent: '#8a00e6', tint: '#ffffff',
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
    theme: { c1: '#2ceccd', c2: '#00ad96', c3: '#003efe', accent: '#00796a', tint: '#ecfcf9' },
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
    theme: { c1: '#00d7b8', c2: '#61019e', c3: '#22003d', accent: '#61019e', tint: '#f5effb' },
    word: 'Invest',
    chip: 'an investor',
    headline: 'Science-based startups from the Northwest.',
    line: 'Meet the teams coming out of our universities and research institutes, early.',
    cta: 'Meet our startups',
    plural: 'investors',
  },
]

export type HoiEvent = {
  id: string
  partner: string
  label: string
  title: string
  meta: string[]
  gradient: string
  for: PersonaId[]
}

export const events: HoiEvent[] = [
  {
    id: 'prototypenparty',
    partner: 'hallig hanken',
    label: 'Ecosystem event',
    title: 'Prototypen\u00adparty Oldenburg',
    meta: ['12 November 2026 · 16:00', '@ hallig hanken'],
    gradient: 'linear-gradient(150deg, #00d7b8 0%, #003efe 100%)',
    for: ['founder', 'student', 'researcher', 'investor'],
  },
  {
    id: 'go-batch-19',
    partner: 'GO!',
    label: 'Incubator programme',
    title: 'Call for applications',
    meta: ['Batch #19', 'Start January 2027'],
    gradient: 'linear-gradient(150deg, #003efe 0%, #9a00ff 100%)',
    for: ['founder', 'researcher', 'student'],
  },
  {
    id: 'research-to-business',
    partner: 'matena innovate! center',
    label: 'Funding initiative',
    title: 'Research to business call',
    meta: ['Up to €150,000 funding', 'Continuous call, no deadlines'],
    gradient: 'linear-gradient(150deg, #9a00ff 0%, #7400c2 100%)',
    for: ['researcher', 'founder', 'company'],
  },
  {
    id: 'bmi-microdegree',
    partner: 'hoi',
    label: 'New microdegree',
    title: 'Business model innovation',
    meta: ['Dates coming soon'],
    gradient: 'linear-gradient(150deg, #9a00ff 0%, #00d7b8 100%)',
    for: ['student', 'founder', 'company'],
  },
]

export type Programme = {
  id: string
  title: string
  text: string
  color: string
  for: PersonaId[]
}

export const programmes: Programme[] = [
  {
    id: 'funnel',
    title: 'Science Start-up Funnel',
    text: 'From a research result to a first business idea, with people who have done it before.',
    color: '#00d7b8',
    for: ['researcher', 'student'],
  },
  {
    id: 'venture-studio',
    title: 'Venture Studio',
    text: 'Hands-on support to build the company: team, product and the first customers.',
    color: '#003efe',
    for: ['founder', 'researcher'],
  },
  {
    id: 'corporate',
    title: 'Corporate Cooperations',
    text: 'Regional companies and startups working together on real challenges.',
    color: '#9a00ff',
    for: ['company'],
  },
  {
    id: 'capital',
    title: 'Kapital & Netzwerk',
    text: 'Access to funding, investors and the people who open doors in the Northwest.',
    color: '#00ad96',
    for: ['investor', 'founder'],
  },
]

export const partners = [
  'Universität Bremen',
  'Universität Oldenburg',
  'Handelskammer Bremen',
  'swb AG',
  'Hochschule Bremen',
  'Constructor University',
]
