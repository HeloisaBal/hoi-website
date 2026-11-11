import 'server-only'
import { defaultContent, type SiteContent } from '@/components/site/content'
import { demoHighlight } from '@/components/site/data'
import { sanityFetch } from './live'
import { QUERY, mapContent } from './mapContent'

/* Everything the site shows, from Sanity (server only, see client.ts).
   The rules for empty fields and the safety checks are in mapContent.ts. */

export async function getContent(): Promise<SiteContent> {
  if (!sanityFetch) return { ...defaultContent, highlight: demoHighlight }
  try {
    const { data } = await sanityFetch({ query: QUERY })
    return mapContent(data && typeof data === 'object' ? (data as Record<string, unknown>) : {})
  } catch {
    return defaultContent // Sanity unreachable: built-in content, no highlight
  }
}
