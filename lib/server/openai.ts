import 'server-only'
import type { BotAnswer, BotRequest } from './ai'

/* Calls OpenAI's Chat Completions API directly with fetch (no extra package).
   Settings (Vercel project settings, or .env.local):
   - OPENAI_API_KEY  required
   - OPENAI_MODEL    optional, defaults to DEFAULT_MODEL */

const API_URL = 'https://api.openai.com/v1/chat/completions'
const DEFAULT_MODEL = 'gpt-4o-mini'
const MAX_OUTPUT_TOKENS = 450
const TIMEOUT_MS = 25_000

export const isOpenAIConfigured = () => !!process.env.OPENAI_API_KEY

export async function askOpenAI({ rules, knowledge, visitor, messages, contactForm, contactTool }: BotRequest): Promise<BotAnswer> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY is not set')

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
    signal: AbortSignal.timeout(TIMEOUT_MS),
    cache: 'no-store',
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || DEFAULT_MODEL,
      max_completion_tokens: MAX_OUTPUT_TOKENS,
      temperature: 0.3,
      // knowledge first and unchanged between visitors, so OpenAI's automatic prompt caching can reuse it
      messages: [
        { role: 'system', content: `<knowledge>\n${knowledge}\n</knowledge>\n\n${rules}${visitor ? `\n\n${visitor}` : ''}` },
        ...messages,
      ],
      ...(contactForm ? {
        tools: [{ type: 'function', function: { name: contactTool.name, description: contactTool.description, parameters: { type: 'object', properties: {}, additionalProperties: false } } }],
        tool_choice: 'auto',
      } : {}),
    }),
  })

  if (!res.ok) {
    // log OpenAI's reason (type + short message), never the request
    const err = (await res.json().catch(() => null)) as { error?: { type?: string; code?: string; message?: string } } | null
    console.error(`[chat] OpenAI API error ${res.status}: ${err?.error?.code ?? err?.error?.type ?? ''} ${(err?.error?.message ?? '').slice(0, 200)}`)
    throw new Error(`OpenAI API ${res.status}`)
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string | null; tool_calls?: { function?: { name?: string } }[] } }[]
  }
  const msg = data.choices?.[0]?.message
  return {
    text: (msg?.content ?? '').trim(),
    openContactForm: (msg?.tool_calls ?? []).some((c) => c.function?.name === contactTool.name),
  }
}
