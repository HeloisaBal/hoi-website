import 'server-only'
import type { ContactRequest } from '@/lib/chat/validate'

/* Sends contact messages from the chatbot with Resend (resend.com), as
   plain text. Settings (Vercel project settings, or .env.local):
   - RESEND_API_KEY  required
   - CONTACT_FROM    required: a sender on a domain verified in Resend,
                     e.g. "hoi website <website@hoi-startup-factory.de>"
   - CONTACT_TO      optional: overrides the address from Sanity
                     ("Contact & links"), e.g. while testing */

const API_URL = 'https://api.resend.com/emails'

export class EmailUnavailableError extends Error {}

/** The contact form only shows once both settings are in place. */
export function isEmailConfigured() {
  return !!process.env.RESEND_API_KEY && !!process.env.CONTACT_FROM
}

export async function sendContactEmail(msg: ContactRequest, to: string, page: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.CONTACT_FROM
  if (!isEmailConfigured() || !apiKey || !from) throw new EmailUnavailableError('RESEND_API_KEY or CONTACT_FROM is not set')

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
    signal: AbortSignal.timeout(15_000),
    cache: 'no-store',
    body: JSON.stringify({
      from,
      to: [process.env.CONTACT_TO || to],
      reply_to: msg.email, // "Reply" in the inbox goes straight to the visitor
      subject: `Website message from ${msg.name}`,
      text: [
        `${msg.name} <${msg.email}> sent a message through the chatbot on ${page}:`,
        '',
        msg.message,
        '',
        '—',
        'Reply to this email to answer them directly.',
      ].join('\n'),
    }),
  })
  if (!res.ok) {
    console.error(`[contact] Resend API error ${res.status}`)
    throw new EmailUnavailableError(`Resend ${res.status}`)
  }
}
