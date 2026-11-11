import { NextStudio } from 'next-sanity/studio'
import config from '../../../sanity.config'
import { sanityConfigured } from '../../../sanity/env'

/* The Sanity Studio lives at /studio. Logging in happens through Sanity,
   so only people invited to the Sanity project can edit anything. */

export const dynamic = 'force-static'

export { metadata, viewport } from 'next-sanity/studio'

export default function StudioPage() {
  if (!sanityConfigured) {
    return (
      <main className="container-x py-32">
        <h1 className="text-3xl font-black">Sanity isn’t connected yet</h1>
        <p className="mt-4 max-w-xl text-muted">
          Add NEXT_PUBLIC_SANITY_PROJECT_ID and NEXT_PUBLIC_SANITY_DATASET to .env.local (and to the Vercel
          project settings), then restart the site.
        </p>
      </main>
    )
  }
  return <NextStudio config={config} />
}
