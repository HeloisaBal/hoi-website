/* Limits shared by the chatbot's Studio fields, the content checks,
   the chat window and the API routes, so they can never drift apart. */

/** Questions and answers editors add in Sanity → Chatbot. */
export const FAQ_LIMITS = { question: 150, answer: 800, count: 40 } as const

/** What a visitor can send to /api/chat. */
export const CHAT_LIMITS = {
  /** one visitor message */
  message: 500,
  /** one earlier bot reply sent back as context */
  reply: 2000,
  /** messages kept as context (visitor + bot) */
  history: 12,
} as const

/** The contact form inside the chat (/api/contact). */
export const CONTACT_LIMITS = { name: 80, email: 120, message: 2000, minMessage: 10 } as const
