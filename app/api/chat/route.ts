import type { NextRequest } from 'next/server'
import { knowledgeText, rulesText, visitorText } from '@/lib/chat/knowledge'
import { CHAT_LIMITS } from '@/lib/chat/limits'
import { parseChatRequest } from '@/lib/chat/validate'
import { askBot, isChatConfigured } from '@/lib/server/ai'
import { isEmailConfigured } from '@/lib/server/email'
import { clientIp, isAllowedOrigin, json, readJson } from '@/lib/server/guard'
import { rateLimiter } from '@/lib/server/rateLimit'
import { getContent } from '@/sanity/lib/content'

/* POST /api/chat — the chatbot. The visitor's conversation goes in, one
   answer comes out. Nothing is stored: the conversation only lives in the
   visitor's browser tab. */

const perMinute = rateLimiter({ limit: 8, windowMs: 60_000 })
const perHour = rateLimiter({ limit: 60, windowMs: 60 * 60_000 })
const MAX_BODY = CHAT_LIMITS.history * (CHAT_LIMITS.reply + 100) // bytes, roughly

export async function POST(req: NextRequest) {
  if (!isAllowedOrigin(req)) return json({ error: 'forbidden' }, 403)

  const ip = clientIp(req)
  const limited = [perMinute(ip), perHour(ip)].find((r) => !r.ok)
  if (limited) return json({ error: 'busy', retryAfter: limited.retryAfter }, 429)

  const parsed = parseChatRequest(await readJson(req, MAX_BODY))
  if (!parsed.ok) return json({ error: 'invalid' }, 400)

  const content = await getContent()
  if (!content.chatbot.enabled || !isChatConfigured()) return json({ error: 'unavailable' }, 503)

  try {
    const answer = await askBot({
      rules: rulesText(new Date().toISOString().slice(0, 10), isEmailConfigured()),
      knowledge: knowledgeText(content, req.nextUrl.origin),
      visitor: visitorText(parsed.value.persona),
      messages: parsed.value.messages,
      contactForm: isEmailConfigured(),
    })
    const text = answer.text.slice(0, CHAT_LIMITS.reply)
    if (!text && !answer.openContactForm) return json({ error: 'unavailable' }, 502)
    return json({ reply: text, contactForm: answer.openContactForm && isEmailConfigured() })
  } catch {
    return json({ error: 'unavailable' }, 502)
  }
}
