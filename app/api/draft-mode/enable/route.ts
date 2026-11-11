import { defineEnableDraftMode } from 'next-sanity/draft-mode'
import { client } from '@/sanity/lib/client'

/* The Studio's preview ("Presentation") calls this to show drafts.
   It only switches preview on after Sanity confirms the request came from
   a logged-in Studio user (a one-time secret checked with the read token). */

const token = process.env.SANITY_API_READ_TOKEN

export const GET = client && token
  ? defineEnableDraftMode({ client: client.withConfig({ token }) }).GET
  : () => new Response('Preview needs Sanity and SANITY_API_READ_TOKEN to be set up.', { status: 404 })
