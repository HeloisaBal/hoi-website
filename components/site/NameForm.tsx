'use client'

import { useRef, useState } from 'react'
import { useContent } from './ContentContext'
import { useVisitor } from './VisitorContext'
import { Arrow } from './shared'

/* ------------------------------------------------------------
   "What should we call you?" (Sanity → Homepage → name prompt).
   Once given, it turns into "Hoi Anna!" with a way to change it.
   Used on the homepage and on the persona pages; the name is
   shared through VisitorContext. `onDone` runs after submitting
   (the homepage scrolls to the map).
   ------------------------------------------------------------ */

export function NameForm({ onDone, nextLabel, nextHref }: {
  onDone?: () => void
  /** link shown under the greeting, e.g. to the map */
  nextLabel?: string
  nextHref?: string
}) {
  const { home } = useContent()
  const { name, firstName, setName, remember, setRemember } = useVisitor()
  const [draft, setDraft] = useState(name)
  const [editing, setEditing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setName(draft)
    setEditing(false)
    onDone?.()
  }

  if (firstName && !editing) {
    return (
      <div aria-live="polite">
        <p className="disp text-[clamp(2.4rem,4.4vw,3.6rem)]">Hoi {firstName}!</p>
        <div className="mono mt-4 flex flex-wrap gap-x-6 gap-y-2">
          {nextLabel && nextHref && <a href={nextHref} className="slide-link">{nextLabel} <span className="slide-arrow"><Arrow /></span></a>}
          <button type="button" className="text-muted underline underline-offset-4 hover:text-ink"
            onClick={() => { setDraft(name); setEditing(true); window.setTimeout(() => inputRef.current?.focus(), 30) }}>
            Not {firstName}?
          </button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={submit}>
      <label htmlFor="hoi-name" className="mono block text-accent">{home.namePrompt}</label>
      <div className="mt-3 flex flex-wrap items-end gap-x-4 gap-y-5">
        <input id="hoi-name" ref={inputRef} value={draft} onChange={(e) => setDraft(e.target.value)}
          placeholder="Your first name" autoComplete="given-name" maxLength={40} className="c-name-input min-w-[12rem] flex-1" />
        <button type="submit" className="c-pill mono shrink-0">
          {draft.trim() ? home.cursorGo : home.generalCta} <span className="ml-2"><Arrow /></span>
        </button>
      </div>
      <label className="mt-4 inline-flex cursor-pointer items-center gap-2.5 text-sm text-muted">
        <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="c-check" />
        <span>{home.rememberLabel}</span>
      </label>
    </form>
  )
}
