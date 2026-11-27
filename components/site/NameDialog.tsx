'use client'

import { useEffect, useRef, useState } from 'react'
import type { Persona } from './data'
import { useContent } from './ContentContext'
import { useVisitor } from './VisitorContext'
import { Arrow, stegaClean } from './shared'

/* ------------------------------------------------------------
   "What should we call you?" (clean direction), asked right after
   a visitor lands on their persona page. A native <dialog>: focus
   stays inside, Esc closes it ("Not now").
   The effect: a line in the persona's colour draws across the top,
   the question's words rise in one by one, and after "Let's go" the
   greeting in the hero gets a colour sweep (.name-sweep).
   Texts: Sanity → Homepage (name question, skip button,
   "Remember me", "Let's go").
   ------------------------------------------------------------ */

export function NameDialog({ persona }: { persona: Persona }) {
  const { home } = useContent()
  const { name, nameAsk, closeName, setName, remember, setRemember } = useVisitor()
  const ref = useRef<HTMLDialogElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [draft, setDraft] = useState(name)
  const submitted = useRef(false)

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (nameAsk && !d.open) {
      submitted.current = false
      setDraft(name) // start from the name we know
      d.showModal()
      window.setTimeout(() => inputRef.current?.focus(), 60)
    } else if (!nameAsk && d.open) d.close()
  }, [nameAsk, name])

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!draft.trim()) { inputRef.current?.focus(); return }
    submitted.current = true
    setName(draft)
    closeName(false)
  }

  const words = stegaClean(home.namePrompt).split(/\s+/)

  return (
    <dialog ref={ref} className="name-dialog" aria-labelledby="name-dialog-title"
      onClose={() => { if (!submitted.current) closeName(true) }}
      onClick={(e) => { if (e.target === ref.current) ref.current?.close() /* click outside the card */ }}>
      <span className="name-dialog-bar" aria-hidden="true" />
      <form onSubmit={submit} className="p-7 sm:p-10">
        <p className="mono text-accent">{home.ticketRoute} · {persona.pathLabel}</p>
        <h2 id="name-dialog-title" className="disp mt-4 text-[clamp(2.6rem,6vw,4.2rem)]">
          <label htmlFor="name-dialog-input">
            {words.map((w, i) => (
              <span key={i} className="name-word" style={{ ['--i' as string]: i }}>{w}{i < words.length - 1 ? ' ' : ''}</span>
            ))}
          </label>
        </h2>
        <input id="name-dialog-input" ref={inputRef} value={draft} onChange={(e) => setDraft(e.target.value)}
          placeholder="Your first name" autoComplete="given-name" maxLength={40} className="c-name-input mt-8" />
        <label className="mt-5 inline-flex cursor-pointer items-center gap-2.5 text-sm text-muted">
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="c-check" />
          <span>{home.rememberLabel}</span>
        </label>
        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
          <button type="submit" className="c-pill c-pill-accent mono">
            {home.cursorGo} <span className="ml-2"><Arrow /></span>
          </button>
          <button type="button" className="mono text-muted underline underline-offset-4 hover:text-ink" onClick={() => ref.current?.close()}>
            {home.nameSkip}
          </button>
        </div>
      </form>
    </dialog>
  )
}
