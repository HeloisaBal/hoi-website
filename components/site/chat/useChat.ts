'use client'

import { useCallback, useRef, useState } from 'react'
import type { PersonaId } from '../data'
import { CHAT_LIMITS } from '@/lib/chat/limits'
import { cleanText, type ChatMessage } from '@/lib/chat/validate'

/* The conversation, kept in memory only (gone when the tab closes). */

export type Bubble = ChatMessage & { id: number; kind?: 'error' | 'note' }

export function useChat({ errorText, busyText, email }: { errorText: string; busyText: string; email: string }) {
  const [bubbles, setBubbles] = useState<Bubble[]>([])
  const [pending, setPending] = useState(false)
  const [contactForm, setContactForm] = useState(false)
  const nextId = useRef(1)

  const add = useCallback((b: Omit<Bubble, 'id'>) => setBubbles((list) => [...list, { ...b, id: nextId.current++ }]), [])

  const send = useCallback(async (raw: string, persona: PersonaId | null) => {
    const content = cleanText(raw, CHAT_LIMITS.message)
    if (!content || pending) return
    const history: ChatMessage[] = [...bubbles.filter((b) => !b.kind), { role: 'user' as const, content }]
      .map(({ role, content: c }): ChatMessage => ({ role, content: c }))
      .slice(-CHAT_LIMITS.history)
    add({ role: 'user', content })
    setPending(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ messages: history, persona }),
      })
      const data = (await res.json().catch(() => ({}))) as { reply?: string; contactForm?: boolean }
      if (!res.ok) {
        add({ role: 'assistant', kind: 'error', content: res.status === 429 ? busyText : `${errorText} ${email}` })
        return
      }
      if (data.reply) add({ role: 'assistant', content: data.reply })
      if (data.contactForm) setContactForm(true)
    } catch {
      add({ role: 'assistant', kind: 'error', content: `${errorText} ${email}` })
    } finally {
      setPending(false)
    }
  }, [add, bubbles, busyText, email, errorText, pending])

  /** last thing the visitor asked, to prefill the contact form */
  const lastQuestion = [...bubbles].reverse().find((b) => b.role === 'user')?.content ?? ''

  return { bubbles, pending, send, add, contactForm, setContactForm, lastQuestion }
}
