/* Writes sanity/seed/seed.ndjson: the site's current built-in content as
   Sanity documents, so the Studio starts filled in instead of empty.
   Run: npx tsx sanity/seed/make-seed.ts
   Import: npx sanity dataset import sanity/seed/seed.ndjson production */

import { writeFileSync } from 'node:fs'
import { defaultContent } from '../../components/site/content'
import { EVENT_COLOURS, demoHighlight } from '../../components/site/data'

const { home, eventsPage, settings, chatbot, impressum, privacy } = defaultContent
const sections = (list: { heading: string; text: string }[]) =>
  list.map((x, i) => ({ _key: `s${i + 1}`, _type: 'legalSection', ...x }))
const colourOf = (gradient: string) =>
  Object.entries(EVENT_COLOURS).find(([, c]) => c.gradient === gradient)?.[0] ?? 'teal-blue'
const omit = <T extends object>(o: T, keys: string[]) =>
  Object.fromEntries(Object.entries(o).filter(([k]) => !keys.includes(k)))

const docs: Record<string, unknown>[] = [
  { _id: 'siteSettings', _type: 'siteSettings', ...settings, eventAppUrl: settings.eventAppUrl || undefined },
  { _id: 'homePage', _type: 'homePage', ...omit(home, ['heroPhoto', 'aboutPhotos']) },
  { _id: 'eventsPage', _type: 'eventsPage', ...eventsPage },
  ...defaultContent.personas.map((p) => ({
    _id: `persona-${p.id}`, _type: 'persona',
    chip: p.chip, plural: p.plural, word: p.word, headline: p.headline, line: p.line, cta: p.cta,
    pathLabel: p.pathLabel, pathText: p.pathText,
  })),
  ...defaultContent.events.map((e, i) => ({
    _id: `event-${e.id}`, _type: 'event',
    title: e.title.replace(/­/g, ''), partner: e.partner, label: e.label, details: e.meta,
    colour: colourOf(e.gradient), for: e.for, city: e.city, date: i === 0 ? '2026-11-12' : undefined,
  })),
  ...defaultContent.offers.map((o, i) => ({
    _id: `offer-${o.id}`, _type: 'offer',
    name: o.name, tagline: o.tagline, text: o.text, points: o.points, for: o.for, order: (i + 1) * 10,
  })),
  ...defaultContent.journey.map((s, i) => ({
    _id: `journey-${s.id}`, _type: 'journeyStage',
    title: s.title, text: s.text, programme: s.programme, for: s.for, order: (i + 1) * 10,
  })),
  ...defaultContent.partners.map((p, i) => ({ _id: `partner-${i + 1}`, _type: 'partner', name: p.name, order: (i + 1) * 10 })),
  ...defaultContent.team.map((t, i) => ({ _id: `team-${i + 1}`, _type: 'teamMember', name: t.name, role: t.role, order: (i + 1) * 10 })),
  { _id: 'chatbot', _type: 'chatbot', ...chatbot, faq: [] },
  { _id: 'impressum', _type: 'impressum', ...impressum, sections: sections(impressum.sections) },
  { _id: 'privacyPolicy', _type: 'privacyPolicy', ...privacy, sections: sections(privacy.sections) },
  {
    _id: 'highlight-tedx', _type: 'highlight', title: demoHighlight.title, label: demoHighlight.label,
    text: demoHighlight.text, link: demoHighlight.link, linkText: demoHighlight.linkText,
    startAt: '2026-11-01T00:00:00.000Z', priority: 0,
  },
]

const clean = (d: Record<string, unknown>) => JSON.stringify(d, (_, v) => (v === undefined ? undefined : v))
writeFileSync(new URL('./seed.ndjson', import.meta.url), docs.map(clean).join('\n') + '\n')
console.log(`Wrote ${docs.length} documents`)
