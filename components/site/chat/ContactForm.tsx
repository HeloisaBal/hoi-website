'use client'

import { useId, useState } from 'react'
import type { ChatbotTexts } from '../content'
import { CONTACT_LIMITS } from '@/lib/chat/limits'
import { parseContact } from '@/lib/chat/validate'

/* The contact form inside the chat. Sends to /api/contact, which emails the
   hoi team. The visitor's last question is prefilled as the message. */

type Status = 'idle' | 'sending' | 'sent' | 'error' | 'busy'

export function ContactForm({ texts, email, prefill, onDone }: {
  texts: ChatbotTexts
  /** hoi's address, shown when sending fails */
  email: string
  prefill: string
  onDone: (sent: boolean) => void
}) {
  const id = useId()
  const [status, setStatus] = useState<Status>('idle')
  const [invalid, setInvalid] = useState<string | null>(null)

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const body = Object.fromEntries(form.entries())
    const checked = parseContact(body)
    if (!checked.ok) { setInvalid(checked.error); return }
    setInvalid(null)
    setStatus('sending')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...checked.value, website: body.website ?? '' }),
      })
      if (res.ok) { setStatus('sent'); onDone(true); return }
      setStatus(res.status === 429 ? 'busy' : 'error')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'sent') return null // the thank-you appears as a chat message

  const field = 'chat-field'
  const err = (name: string) => (invalid === name ? { 'aria-invalid': true, 'aria-describedby': `${id}-err` } : {})

  return (
    <form onSubmit={submit} noValidate className="chat-form" aria-labelledby={`${id}-intro`}>
      <p id={`${id}-intro`} className="text-sm text-muted">{texts.contactIntro}</p>

      <label htmlFor={`${id}-name`} className="chat-label">{texts.nameLabel}</label>
      <input id={`${id}-name`} name="name" required autoComplete="name" maxLength={CONTACT_LIMITS.name} className={field} {...err('name')} />

      <label htmlFor={`${id}-email`} className="chat-label">{texts.emailLabel}</label>
      <input id={`${id}-email`} name="email" type="email" required autoComplete="email" maxLength={CONTACT_LIMITS.email} className={field} {...err('email')} />

      <label htmlFor={`${id}-msg`} className="chat-label">{texts.messageLabel}</label>
      <textarea id={`${id}-msg`} name="message" required rows={2} defaultValue={prefill}
        minLength={CONTACT_LIMITS.minMessage} maxLength={CONTACT_LIMITS.message} className={`${field} resize-y`} {...err('message')} />

      {/* honeypot: hidden from people and screen readers, bots fill it in */}
      <div className="chat-hp" aria-hidden="true">
        <label htmlFor={`${id}-web`}>Website</label>
        <input id={`${id}-web`} name="website" tabIndex={-1} autoComplete="off" />
      </div>

      {invalid && (
        <p id={`${id}-err`} role="alert" className="text-sm font-semibold text-red-700">
          {texts.checkText} {invalid === 'email' ? texts.emailLabel : invalid === 'name' ? texts.nameLabel : texts.messageLabel}
        </p>
      )}
      {(status === 'error' || status === 'busy') && (
        <p role="alert" className="text-sm text-red-700">
          {status === 'busy' ? texts.busyText : <>{texts.errorText} <a className="chat-link" href={`mailto:${email}`}>{email}</a></>}
        </p>
      )}

      <p className="text-xs leading-snug text-muted">{texts.contactPrivacy}</p>
      <div className="flex justify-end gap-2">
        <button type="button" className="chat-ghost" onClick={() => onDone(false)} aria-label="Close the contact form">✕</button>
        <button type="submit" className="chat-send" disabled={status === 'sending'} aria-busy={status === 'sending'}>
          {texts.sendLabel}
        </button>
      </div>
    </form>
  )
}
