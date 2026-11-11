import { revalidateTag } from 'next/cache'
import { parseBody } from 'next-sanity/webhook'
import type { NextRequest } from 'next/server'
import { SANITY_TAG } from '@/sanity/lib/content'

/* Sanity calls this (a webhook) whenever something is published, so the
   site shows it straight away instead of within a minute.
   Only requests signed with SANITY_REVALIDATE_SECRET are accepted. */

export async function POST(request: NextRequest) {
  const secret = process.env.SANITY_REVALIDATE_SECRET
  if (!secret) return new Response('Not set up', { status: 404 })
  try {
    // waits a moment so Sanity's API already has the new version
    const { isValidSignature } = await parseBody(request, secret, true)
    if (!isValidSignature) return new Response('Invalid signature', { status: 401 })
    revalidateTag(SANITY_TAG, { expire: 0 })
    return Response.json({ revalidated: true })
  } catch {
    return new Response('Bad request', { status: 400 })
  }
}
