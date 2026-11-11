/* ------------------------------------------------------------
   Sanity connection settings, read from environment variables
   (.env.local locally, Vercel project settings in production).
   Nothing secret lives here: the project id and dataset are public.

   When they are missing the site still works: it shows the built-in
   demo content from components/site/data.ts instead.
   ------------------------------------------------------------ */

export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? ''
export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production'
export const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2026-08-07'

/** True once a Sanity project is connected. */
export const sanityConfigured = /^[a-z0-9-]+$/.test(projectId)
