import { stegaClean } from 'next-sanity'
import { defaultContent, type Photo, type SiteContent } from '@/components/site/content'
import { CITIES, EVENT_COLOURS, demoHighlight, personas, type CityId, type EventColour, type PersonaId } from '@/components/site/data'

/* Turns what Sanity returns into the site's content, with the built-in
   defaults for whatever is still empty. Pure function, no fetching.

   - Texts: an empty field shows the built-in text.
   - Lists (events, partners, …): Sanity's list as soon as the type has any
     document at all; until then the built-in list, so the site is never
     empty while the Studio is being filled.
   - Everything is checked again here: plain text only, length-capped,
     safe links only, images only from Sanity's image server. */

const IMG = `{ "url": asset->url, alt }`
export const QUERY = `{
  "settings": *[_id == "siteSettings"][0]{ email, address, instagram, linkedin },
  "home": *[_id == "homePage"][0]{ ..., "heroPhoto": heroPhoto${IMG}, "aboutPhoto1": aboutPhoto1${IMG}, "aboutPhoto2": aboutPhoto2${IMG} },
  "eventsPage": *[_id == "eventsPage"][0],
  "personas": *[_type == "persona"]{ "key": _id, chip, plural, word, headline, line, cta },
  "eventCount": count(*[_type == "event"]),
  "events": *[_type == "event" && (!defined(hideAfter) || hideAfter > now())]
    | order(coalesce(date, "9999-12-31") asc, _createdAt asc){ "id": _id, title, partner, label, details, colour, for, city, link },
  "journeyCount": count(*[_type == "journeyStage"]),
  "journey": *[_type == "journeyStage"] | order(order asc, _createdAt asc){ "id": _id, title, text, programme, for },
  "partnerCount": count(*[_type == "partner"]),
  "partners": *[_type == "partner"] | order(order asc, _createdAt asc){ name, href, "logoUrl": logo.asset->url },
  "teamCount": count(*[_type == "teamMember"]),
  "team": *[_type == "teamMember"] | order(order asc, _createdAt asc){ name, role, "photoUrl": photo.asset->url, "photoAlt": photo.alt },
  "highlightCount": count(*[_type == "highlight"]),
  "highlight": *[_type == "highlight" && startAt <= now() && (!defined(endAt) || endAt > now())]
    | order(priority desc, startAt desc)[0]{ "id": _id, title, label, text, link, linkText, "logoUrl": logo.asset->url, "logoAlt": logo.alt }
}`

type Raw = Record<string, unknown>
const obj = (v: unknown): Raw => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Raw) : {})
const list = (v: unknown): Raw[] => (Array.isArray(v) ? v.filter((x) => x && typeof x === 'object') as Raw[] : [])

/** Plain text, trimmed, at most `max` visible characters (preview markers kept when it fits). */
function str(v: unknown, max: number): string | undefined {
  if (typeof v !== 'string') return undefined
  const visible = stegaClean(v).trim()
  if (!visible) return undefined
  return visible.length <= max ? v.trim() : visible.slice(0, max)
}
const strs = (v: unknown, max: number, count: number) =>
  (Array.isArray(v) ? v : []).map((x) => str(x, max)).filter((x): x is string => !!x).slice(0, count)

function safeLink(v: unknown): string | undefined {
  const s = typeof v === 'string' ? stegaClean(v).trim() : ''
  if (!s || s.length > 500) return undefined
  return /^\/(?!\/)/.test(s) || /^https?:\/\//i.test(s) || /^mailto:[^\s<>"]+$/i.test(s) ? s : undefined
}
const safeImage = (v: unknown) => {
  const s = typeof v === 'string' ? v : ''
  return s.startsWith('https://cdn.sanity.io/') ? s : undefined
}
function photo(v: unknown): Photo | null {
  const p = obj(v)
  const url = safeImage(p.url)
  return url ? { url, alt: str(p.alt, 120) ?? '' } : null
}
const isPersona = (v: unknown): v is PersonaId => personas.some((p) => p.id === stegaClean(v))
const personaKeys = (v: unknown) => (Array.isArray(v) ? v.map((x) => stegaClean(x)).filter(isPersona) : [])
const cleanId = (v: unknown) => String(stegaClean(v) ?? '').replace(/^drafts\./, '')

/** Fill text fields of `fallback` from `raw`, each capped at the given length. */
function texts<T extends Record<string, unknown>>(raw: Raw, fallback: T, limits: Partial<Record<keyof T, number>>): T {
  const out = { ...fallback }
  for (const key of Object.keys(limits) as (keyof T)[]) {
    const v = str(raw[key as string], limits[key]!)
    if (v) out[key] = v as T[keyof T]
  }
  return out
}

export function mapContent(raw: Raw): SiteContent {
  const d = defaultContent
  const home = obj(raw.home)
  const sci = strs(home.scienceWords, 22, 8)
  const biz = strs(home.businessWords, 22, 8)

  return {
    settings: {
      ...texts(obj(raw.settings), d.settings, { address: 80 }),
      email: (() => {
        const e = typeof obj(raw.settings).email === 'string' ? stegaClean(obj(raw.settings).email as string).trim() : ''
        return /^[^\s@<>"]+@[^\s@<>"]+\.[a-z]{2,}$/i.test(e) ? e : d.settings.email
      })(),
      instagram: safeLink(obj(raw.settings).instagram) ?? d.settings.instagram,
      linkedin: safeLink(obj(raw.settings).linkedin) ?? d.settings.linkedin,
    },
    home: {
      ...texts(home, d.home, {
        introTitle: 40, introSub: 60, heroPill: 45, namePrompt: 40, eventsEyebrow: 25, eventsTitle: 40, eventsMarquee: 90,
        journeyEyebrow: 25, journeyTitle: 40, mapEyebrow: 25, mapTitle: 40, mapText: 140, sbEyebrow: 25, sbTitle: 40,
        aboutEyebrow: 25, quote: 160, quoteBy: 70, aboutLinkText: 30, partnersTitle: 70, contactTitle: 40, contactText: 140, contactButton: 24,
      }),
      heroPhoto: photo(home.heroPhoto) ?? d.home.heroPhoto,
      scienceWords: sci.length ? sci : d.home.scienceWords,
      businessWords: biz.length ? biz : d.home.businessWords,
      aboutPhotos: [photo(home.aboutPhoto1), photo(home.aboutPhoto2)],
    },
    eventsPage: texts(obj(raw.eventsPage), d.eventsPage, { pill: 30, titleLine1: 20, titleLine2: 20, intro: 160, ctaTitle: 40, ctaText: 160 }),

    personas: d.personas.map((p) => {
      const r = list(raw.personas).find((x) => cleanId(x.key) === `persona-${p.id}`)
      return r ? { ...p, ...texts(r, p, { chip: 30, plural: 20, word: 12, headline: 50, line: 160, cta: 28 }) } : p
    }),

    events: Number(raw.eventCount) > 0
      ? list(raw.events).flatMap((e) => {
        const title = str(e.title, 50)
        if (!title) return []
        const colour = stegaClean(e.colour) as EventColour
        const city = stegaClean(e.city) as CityId
        return [{
          id: cleanId(e.id), title,
          partner: str(e.partner, 30) ?? 'hoi',
          label: str(e.label, 30) ?? 'Event',
          meta: strs(e.details, 45, 3),
          gradient: (EVENT_COLOURS[colour] ?? EVENT_COLOURS['teal-blue']).gradient,
          for: personaKeys(e.for),
          city: city in CITIES ? city : undefined,
          link: safeLink(e.link),
        }]
      })
      : d.events,

    journey: Number(raw.journeyCount) > 0
      ? list(raw.journey).flatMap((s) => {
        const title = str(s.title, 20)
        return title ? [{ id: cleanId(s.id), title, text: str(s.text, 140) ?? '', programme: str(s.programme, 40) ?? '', for: personaKeys(s.for) }] : []
      })
      : d.journey,

    partners: Number(raw.partnerCount) > 0
      ? list(raw.partners).flatMap((p) => {
        const name = str(p.name, 50)
        return name ? [{ name, href: safeLink(p.href), logoUrl: safeImage(p.logoUrl) }] : []
      })
      : d.partners,

    team: Number(raw.teamCount) > 0
      ? list(raw.team).flatMap((t) => {
        const name = str(t.name, 40)
        return name ? [{ name, role: str(t.role, 40) ?? '', photoUrl: safeImage(t.photoUrl), photoAlt: str(t.photoAlt, 120) }] : []
      })
      : d.team,

    highlight: (() => {
      if (!(Number(raw.highlightCount) > 0)) return demoHighlight
      const h = obj(raw.highlight)
      const title = str(h.title, 70)
      if (!title) return null
      const logoUrl = safeImage(h.logoUrl)
      return {
        id: cleanId(h.id), title,
        label: str(h.label, 20), text: str(h.text, 90),
        link: safeLink(h.link), linkText: str(h.linkText, 24) ?? 'Find out more',
        logoUrl, logoAlt: logoUrl ? str(h.logoAlt, 80) ?? '' : undefined,
      }
    })(),
  }
}
