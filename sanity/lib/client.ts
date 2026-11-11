import 'server-only' // build fails if this file ever ends up in browser code
import { createClient } from 'next-sanity'
import { apiVersion, dataset, projectId, sanityConfigured } from '../env'

/* Read-only client for published content, used on the server only.

   SANITY_API_READ_TOKEN (a "Viewer" token from sanity.io/manage → API → Tokens)
   is optional: without it the dataset must be Public; with it the dataset can
   be Private. It has no NEXT_PUBLIC_ prefix, so Next.js never sends it to the
   browser. Never add that prefix. */

const token = process.env.SANITY_API_READ_TOKEN || undefined

/** `null` until Sanity is connected. */
export const client = sanityConfigured
  ? createClient({ projectId, dataset, apiVersion, useCdn: true, perspective: 'published', token })
  : null
