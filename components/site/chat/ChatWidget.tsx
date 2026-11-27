'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { useContent } from '../ContentContext'
import type { PersonaId } from '../data'
import { KEY_PERSONA, load } from '../shared'
import { CHAT_LIMITS } from '@/lib/chat/limits'
import { ASK_EVENT } from './ask'
import { ContactForm } from './ContactForm'
import { MessageText } from './MessageText'
import { useChat } from './useChat'

/* ------------------------------------------------------------
   "Ask hoi": the chatbot in the bottom-right corner of every page.
   - Answers questions from the website's content and the FAQ in
     Sanity (→ Chatbot), through /api/chat.
   - Visitors can send hoi a message (→ /api/contact), either from
     the button or when the bot offers it. Only when email sending is
     set up (`contactForm`, see lib/server/email.ts); until then the
     bot gives hoi's email address instead.
   - Takes on the persona colours of the page it opens on.
   - Not modal: the page stays usable. Esc closes it and puts focus
     back on the button.
   ------------------------------------------------------------ */

/** The page's current persona accent colour (it lives on the `.themed` root). */
function pageAccent() {
  const root = document.querySelector('.themed')
  return root ? getComputedStyle(root).getPropertyValue('--accent').trim() : ''
}

export function ChatWidget({ contactForm = false }: {
  /** show the contact form (the server knows whether email sending is set up) */
  contactForm?: boolean
}) {
  const { chatbot: t, settings } = useContent()
  const id = useId()
  const [open, setOpen] = useState(false)
  const [accent, setAccent] = useState('')
  const [draft, setDraft] = useState('')
  const [persona, setPersona] = useState<PersonaId | null>(null)
  const launcher = useRef<HTMLButtonElement>(null)
  const input = useRef<HTMLTextAreaElement>(null)
  const log = useRef<HTMLDivElement>(null)
  const chat = useChat({ errorText: t.errorText, busyText: t.busyText, email: settings.email })

  function show() {
    setAccent(pageAccent())
    setPersona(load(KEY_PERSONA) as PersonaId | null)
    setOpen(true)
  }
  function hide() {
    setOpen(false)
    launcher.current?.focus()
  }

  // "Ask about this" anywhere on the page: open the chat and send the question
  const sendRef = useRef(chat.send)
  useEffect(() => { sendRef.current = chat.send }, [chat.send])
  useEffect(() => {
    const onAsk = (e: Event) => {
      const q = (e as CustomEvent<string>).detail
      if (typeof q !== 'string') return
      setAccent(pageAccent())
      const p = load(KEY_PERSONA) as PersonaId | null
      setPersona(p)
      setOpen(true)
      if (q) void sendRef.current(q, p) // an empty question just opens the chat

    }
    window.addEventListener(ASK_EVENT, onAsk)
    return () => window.removeEventListener(ASK_EVENT, onAsk)
  }, [])

  // focus the message box when opening
  useEffect(() => { if (open) input.current?.focus() }, [open])

  // keep the newest message in view; when the contact form opens, keep the
  // bot's last answer at the top so it isn't pushed out of sight
  useEffect(() => {
    const el = log.current
    if (!el) return
    const lastBot = contactForm && chat.contactForm ? [...el.querySelectorAll<HTMLElement>('.chat-bubble.is-bot')].at(-1) : null
    el.scrollTo({ top: lastBot ? lastBot.offsetTop - 12 : el.scrollHeight, behavior: 'smooth' })
  }, [chat.bubbles, chat.pending, chat.contactForm, contactForm])

  function ask(question: string) {
    void chat.send(question, persona)
    input.current?.focus() // the suggestions disappear, so focus moves to the message box
  }

  function submit(e?: React.FormEvent) {
    e?.preventDefault()
    if (!draft.trim()) return
    ask(draft)
    setDraft('')
  }

  if (!t.enabled) return null
  const started = chat.bubbles.some((b) => b.role === 'user')

  return (
    <div className="chat-root" style={accent ? { ['--chat-accent' as string]: accent } : undefined}>
      {open && (
        <section id={`${id}-panel`} role="dialog" aria-labelledby={`${id}-title`} className="chat-panel"
          onKeyDown={(e) => { if (e.key === 'Escape') hide() }}>
          <header className="chat-head">
            <h2 id={`${id}-title`} className="font-display text-lg font-black uppercase">{t.title}</h2>
            <button type="button" onClick={hide} className="chat-icon-btn" aria-label="Close chat">
              <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M5 5l10 10M15 5L5 15" />
              </svg>
            </button>
          </header>

          <div ref={log} className="chat-log" role="log" aria-live="polite" aria-relevant="additions" aria-busy={chat.pending}>
            <div className="chat-bubble is-bot"><MessageText text={t.greeting} /></div>

            {!started && (
              <ul className="flex flex-wrap gap-2" aria-label="Suggested questions">
                {t.suggestions.map((q) => (
                  <li key={q}>
                    <button type="button" className="chat-chip" onClick={() => ask(q)}>{q}</button>
                  </li>
                ))}
              </ul>
            )}

            {chat.bubbles.map((b) => (
              <div key={b.id} className={`chat-bubble ${b.role === 'user' ? 'is-me' : 'is-bot'} ${b.kind === 'error' ? 'is-error' : ''}`}>
                <span className="sr-only">{b.role === 'user' ? 'You:' : `${t.title}:`}</span>
                <MessageText text={b.content} />
              </div>
            ))}

            {chat.pending && (
              <div className="chat-bubble is-bot chat-typing" aria-label="Typing">
                <span /><span /><span />
              </div>
            )}

            {contactForm && chat.contactForm && (
              <ContactForm texts={t} email={settings.email} prefill={chat.lastQuestion}
                onDone={(sent) => {
                  chat.setContactForm(false)
                  if (sent) chat.add({ role: 'assistant', kind: 'note', content: t.contactThanks })
                  input.current?.focus()
                }} />
            )}
          </div>

          <div className="chat-foot">
            {contactForm && !chat.contactForm && (
              <button type="button" className="chat-ghost self-start" onClick={() => chat.setContactForm(true)}>
                {t.contactButton}
              </button>
            )}
            <form onSubmit={submit} className="chat-compose">
              <label htmlFor={`${id}-input`} className="sr-only">{t.placeholder}</label>
              <textarea id={`${id}-input`} ref={input} rows={1} value={draft} maxLength={CHAT_LIMITS.message}
                placeholder={t.placeholder} className="chat-input" enterKeyHint="send"
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) submit(e) }} />
              <button type="submit" className="chat-send" disabled={chat.pending || !draft.trim()} aria-label={t.sendLabel}>
                <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M4 10h12M11 5l5 5-5 5" />
                </svg>
              </button>
            </form>
            <p className="text-[0.7rem] leading-snug text-muted">
              {t.disclaimer} <a href="/datenschutz" className="chat-link font-normal">{t.privacyLink}</a>
            </p>
          </div>
        </section>
      )}

      <button ref={launcher} type="button" className="chat-launcher" aria-expanded={open} aria-controls={open ? `${id}-panel` : undefined}
        onClick={() => (open ? hide() : show())}>
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.9A8 8 0 1 1 21 12z" />
        </svg>
        <span className="chat-launcher-label">{t.buttonLabel}</span>
      </button>
    </div>
  )
}
