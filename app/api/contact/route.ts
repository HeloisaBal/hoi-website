import type { NextRequest } from 'next/server'
import { CONTACT_LIMITS } from '@/lib/chat/limits'
import { parseContact } from '@/lib/chat/validate'
import { isEmailConfigured, sendContactEmail } from '@/lib/server/email'
import { clientIp, isAllowedOrigin, json, readJson } from '@/lib/server/guard'
import { rateLimiter } from '@/lib/server/rateLimit'
import { getContent } from '@/sanity/lib/content'

/* POST /api/contact — a message from the chatbot's contact form, emailed to
   hoi (Sanity → "Contact & links" → Contact email). Nothing is stored here. */

const perHour = rateLimiter({ limit: 5, windowMs: 60 * 60_000 })
const MAX_BODY = CONTACT_LIMITS.message * 4 + 1000

export async function POST(req: NextRequest) {
  if (!isAllowedOrigin(req)) return json({ error: 'forbidden' }, 403)
  if (!isEmailConfigured()) return json({ error: 'unavailable' }, 503)

  const body = await readJson(req, MAX_BODY)
  // Honeypot: a hidden field people never fill in. Bots that do get a
  // normal-looking answer, and nothing is sent.
  if (body && typeof body === 'object' && (body as Record<string, unknown>).website) return json({ ok: true })

  const limited = perHour(clientIp(req))
  if (!limited.ok) return json({ error: 'busy', retryAfter: limited.retryAfter }, 429)

  const parsed = parseContact(body)
  if (!parsed.ok) return json({ error: 'invalid', field: parsed.error }, 400)

  const page = (() => {
    const ref = req.headers.get('referer') ?? ''
    return ref.startsWith(req.nextUrl.origin) ? ref.slice(0, 300) : req.nextUrl.origin
  })()

  try {
    const { settings } = await getContent()
    await sendContactEmail(parsed.value, settings.email, page)
    return json({ ok: true })
  } catch {
    return json({ error: 'unavailable' }, 502)
  }
}
