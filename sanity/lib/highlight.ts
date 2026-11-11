import 'server-only'
import { demoHighlight, type Highlight } from '@/components/site/data'
import { client } from './client'

/* Server only (see client.ts). The highlight that is live right now (started, not yet ended,
   highest priority first). Built-in demo when Sanity isn't connected,
   nothing when Sanity has no live highlight or can't be reached. */

const QUERY = `*[_type == "highlight" && startAt <= now() && (!defined(endAt) || endAt > now())]
  | order(priority desc, startAt desc)[0]{
    "id": _id, title, label, text, link, linkText,
    "logoUrl": logo.asset->url, "logoAlt": logo.alt
  }`

/** Content from the CMS is checked again here: plain text only, safe links only. */
const str = (v: unknown, max: number) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : undefined)
const safeLink = (v: unknown) => {
  const s = str(v, 500)
  if (!s) return undefined
  return /^\/(?!\/)/.test(s) || /^https?:\/\//i.test(s) ? s : undefined
}
const safeLogo = (v: unknown) => {
  const s = str(v, 500)
  return s?.startsWith('https://cdn.sanity.io/') ? s : undefined
}

export async function getHighlight(): Promise<Highlight | null> {
  if (!client) return demoHighlight
  try {
    const raw = await client.fetch<Record<string, unknown> | null>(QUERY, {}, { next: { revalidate: 60, tags: ['highlight'] } })
    const title = str(raw?.title, 70)
    if (!raw || !title) return null
    const logoUrl = safeLogo(raw.logoUrl)
    return {
      id: String(raw.id),
      title,
      label: str(raw.label, 20),
      text: str(raw.text, 90),
      link: safeLink(raw.link),
      linkText: str(raw.linkText, 24) ?? 'Find out more',
      logoUrl,
      logoAlt: logoUrl ? str(raw.logoAlt, 80) ?? '' : undefined,
    }
  } catch {
    return null // Sanity unreachable: the page still loads, just without the bar
  }
}
