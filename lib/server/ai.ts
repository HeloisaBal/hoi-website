import 'server-only'
import type { ChatMessage } from '@/lib/chat/validate'
import { askClaude, isAnthropicConfigured } from './anthropic'
import { askOpenAI, isOpenAIConfigured } from './openai'

/* Which AI answers the chat. Set CHAT_PROVIDER to "openai" or "anthropic";
   without it, OpenAI is used when OPENAI_API_KEY is set, otherwise Claude. */

export type BotRequest = {
  rules: string
  /** same for every visitor, so the provider can cache it */
  knowledge: string
  visitor: string
  messages: ChatMessage[]
  /** offer the contact form (only when email sending is set up) */
  contactForm: boolean
  contactTool: { name: string; description: string }
}
export type BotAnswer = { text: string; openContactForm: boolean }

const CONTACT_TOOL = {
  name: 'open_contact_form',
  description: 'Shows the visitor a short form (name, email, message) to send a message to the hoi team. Use it when they want to get in touch, or when the team should answer instead of you.',
}

function provider(): 'openai' | 'anthropic' | null {
  const chosen = process.env.CHAT_PROVIDER?.toLowerCase()
  if (chosen === 'openai') return isOpenAIConfigured() ? 'openai' : null
  if (chosen === 'anthropic') return isAnthropicConfigured() ? 'anthropic' : null
  return isOpenAIConfigured() ? 'openai' : isAnthropicConfigured() ? 'anthropic' : null
}

export const isChatConfigured = () => provider() !== null

export function askBot(req: Omit<BotRequest, 'contactTool'>): Promise<BotAnswer> {
  const full = { ...req, contactTool: CONTACT_TOOL }
  return provider() === 'openai' ? askOpenAI(full) : askClaude(full)
}
