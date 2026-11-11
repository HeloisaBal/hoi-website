import 'server-only'
import { draftMode } from 'next/headers'
import { defaultContent, type SiteContent } from '@/components/site/content'
import { demoHighlight } from '@/components/site/data'
import { client } from './client'
import { sanityFetch } from './live'
import { QUERY, mapContent } from './mapContent'

/* Everything the site shows, from Sanity (server only, see client.ts).
   The rules for empty fields and the safety checks are in mapContent.ts.

   - Visitors: published content, cached and refreshed at least every 60
     seconds, and straight away when Sanity calls /api/revalidate (webhook).
   - Studio preview: drafts, live as the editor types (sanityFetch). */

/** Cache tag for everything that comes from Sanity (see app/api/revalidate). */
export const SANITY_TAG = 'sanity'

export async function getContent(): Promise<SiteContent> {
  if (!client) return { ...defaultContent, highlight: demoHighlight }
  try {
    const preview = (await draftMode()).isEnabled
    const data = preview && sanityFetch
      ? (await sanityFetch({ query: QUERY })).data
      : await client.fetch(QUERY, {}, { next: { revalidate: 60, tags: [SANITY_TAG] } })
    return mapContent(data && typeof data === 'object' ? (data as Record<string, unknown>) : {})
  } catch {
    return defaultContent // Sanity unreachable: built-in content, no highlight
  }
}
