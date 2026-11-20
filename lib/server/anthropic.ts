import 'server-only'
import type { BotAnswer, BotRequest } from './ai'

/* Calls Claude (Anthropic's API) directly with fetch, so the site needs no
   extra package. Settings (Vercel project settings, or .env.local):
   - ANTHROPIC_API_KEY  required
   - ANTHROPIC_MODEL    optional, defaults to DEFAULT_MODEL */

const API_URL = 'https://api.anthropic.com/v1/messages'
const DEFAULT_MODEL = 'claude-haiku-5-5'
const MAX_OUTPUT_TOKENS = 450
const TIMEOUT_MS = 25_000

export const isAnthropicConfigured = () => !!process.env.ANTHROPIC_API_KEY

export async function askClaude({ rules, knowledge, visitor, messages, contactForm, contactTool }: BotRequest): Promise<BotAnswer> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set')

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    signal: AbortSignal.timeout(TIMEOUT_MS),
    cache: 'no-store',
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || DEFAULT_MODEL,
      max_tokens: MAX_OUTPUT_TOKENS,
      system: [
        { type: 'text', text: rules },
        { type: 'text', text: `<knowledge>\n${knowledge}\n</knowledge>`, cache_control: { type: 'ephemeral' } },
        ...(visitor ? [{ type: 'text', text: visitor }] : []),
      ],
      tools: contactForm ? [{
        name: contactTool.name,
        description: contactTool.description,
        input_schema: { type: 'object', properties: {}, additionalProperties: false },
      }] : undefined,
      messages,
    }),
  })

  if (!res.ok) {
    // log Anthropic's reason (type + short message), never the request
    const err = (await res.json().catch(() => null)) as { error?: { type?: string; message?: string } } | null
    console.error(`[chat] Anthropic API error ${res.status}: ${err?.error?.type ?? ''} ${(err?.error?.message ?? '').slice(0, 200)}`)
    throw new Error(`Anthropic API ${res.status}`)
  }

  const data = (await res.json()) as { content?: { type: string; text?: string; name?: string }[] }
  const blocks = Array.isArray(data.content) ? data.content : []
  const text = blocks.filter((b) => b.type === 'text' && typeof b.text === 'string').map((b) => b.text).join('\n').trim()
  const openContactForm = blocks.some((b) => b.type === 'tool_use' && b.name === contactTool.name)
  return { text, openContactForm }
}
