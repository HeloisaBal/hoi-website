import { personas, type PersonaId } from '@/components/site/data'
import { CHAT_LIMITS, CONTACT_LIMITS } from './limits'

/* Checks for what visitors send to the chatbot. Used twice: by the chat
   window before sending (quick feedback) and by the API routes, which
   never trust the browser and run the same checks again. */

export type ChatRole = 'user' | 'assistant'
export type ChatMessage = { role: ChatRole; content: string }

export type ChatRequest = { messages: ChatMessage[]; persona: PersonaId | null }
export type ContactRequest = { name: string; email: string; message: string }

type Result<T> = { ok: true; value: T } | { ok: false; error: string }

/** Plain text: no control characters (line breaks and tabs are kept), trimmed. */
export function cleanText(v: unknown, max: number): string {
  if (typeof v !== 'string') return ''
  return v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u200B-\u200F\u2028-\u202E\u2060-\u206F\uFEFF]/g, '')
    .replace(/\r\n?/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, max)
}

/** One line (names, subjects): line breaks become spaces. */
export const cleanLine = (v: unknown, max: number) => cleanText(v, max * 2).replace(/\s+/g, ' ').slice(0, max)

const EMAIL = /^[^\s@<>"(),;:\\[\]]+@[^\s@<>"(),;:\\[\]]+\.[a-z]{2,}$/i
export const isEmail = (v: string) => v.length <= CONTACT_LIMITS.email && EMAIL.test(v)

const isPersona = (v: unknown): v is PersonaId => personas.some((p) => p.id === v)

export function parseChatRequest(body: unknown): Result<ChatRequest> {
  const b = body && typeof body === 'object' ? (body as Record<string, unknown>) : {}
  if (!Array.isArray(b.messages) || b.messages.length === 0) return { ok: false, error: 'No message' }

  const messages: ChatMessage[] = []
  for (const m of b.messages.slice(-CHAT_LIMITS.history)) {
    const r = m && typeof m === 'object' ? (m as Record<string, unknown>) : {}
    if (r.role !== 'user' && r.role !== 'assistant') return { ok: false, error: 'Bad message' }
    const content = cleanText(r.content, r.role === 'user' ? CHAT_LIMITS.message : CHAT_LIMITS.reply)
    if (!content) continue
    messages.push({ role: r.role, content })
  }
  // the AI expects: starts with the visitor, alternates, ends with the visitor
  while (messages[0]?.role === 'assistant') messages.shift()
  const alternating = messages.every((m, i) => i === 0 || m.role !== messages[i - 1].role)
  if (!messages.length || !alternating || messages.at(-1)?.role !== 'user') return { ok: false, error: 'Bad conversation' }

  return { ok: true, value: { messages, persona: isPersona(b.persona) ? b.persona : null } }
}

export function parseContact(body: unknown): Result<ContactRequest> {
  const b = body && typeof body === 'object' ? (body as Record<string, unknown>) : {}
  const name = cleanLine(b.name, CONTACT_LIMITS.name)
  const email = cleanLine(b.email, CONTACT_LIMITS.email)
  const message = cleanText(b.message, CONTACT_LIMITS.message)
  if (!name) return { ok: false, error: 'name' }
  if (!isEmail(email)) return { ok: false, error: 'email' }
  if (message.length < CONTACT_LIMITS.minMessage) return { ok: false, error: 'message' }
  return { ok: true, value: { name, email, message } }
}
