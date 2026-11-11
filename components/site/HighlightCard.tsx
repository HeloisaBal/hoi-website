'use client'

import { useEffect, useState } from 'react'
import type { Highlight } from './data'
import { Arrow } from './shared'

/* ------------------------------------------------------------
   Floating announcement card (a partnership, a new programme, news).
   Slides in at the bottom-left once the visitor has scrolled past the
   first screen, so it never covers the hero, and steps aside again near
   sections marked data-no-highlight while they are on screen (the 3D
   map, contact, footer). Content comes from Sanity
   ("Highlight"), or the demo in data.ts until Sanity is connected.
   Visitors can close it; it comes back when hoi publishes a new one.
   ------------------------------------------------------------ */

const KEY_HIDDEN = 'hoi.highlight.hidden'

export function HighlightCard({ highlight, after = 1, afterSection }: {
  highlight: Highlight | null
  /** how many screen heights to scroll before it appears */
  after?: number
  /** or: appear once this section (CSS selector) reaches the middle of the screen */
  afterSection?: string
}) {
  const [closed, setClosed] = useState(false)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    if (!highlight) return
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reads browser storage once
      if (localStorage.getItem(KEY_HIDDEN) === highlight.id) setClosed(true)
    } catch { /* storage blocked: just show it */ }
  }, [highlight])

  useEffect(() => {
    const check = () => {
      const el = afterSection ? document.querySelector(afterSection) : null
      const past = el ? el.getBoundingClientRect().top < window.innerHeight / 2 : window.scrollY > window.innerHeight * after
      // step aside for sections with their own button in that corner (contact, footer)
      const blocked = Array.from(document.querySelectorAll('[data-no-highlight]'))
        .some((b) => { const r = b.getBoundingClientRect(); return r.top < window.innerHeight && r.bottom > 0 })
      setShown(past && !blocked)
    }
    check()
    window.addEventListener('scroll', check, { passive: true })
    window.addEventListener('resize', check)
    return () => {
      window.removeEventListener('scroll', check)
      window.removeEventListener('resize', check)
    }
  }, [after, afterSection])

  if (!highlight || closed) return null
  const { id, title, label, text, link, linkText, logoUrl, logoAlt } = highlight
  const external = link?.startsWith('http')

  const close = () => {
    setClosed(true)
    try { localStorage.setItem(KEY_HIDDEN, id) } catch { /* fine */ }
  }

  return (
    <aside className={`hl-card ${shown ? 'is-shown' : ''}`} aria-label="Announcement" inert={!shown}>
      <div className="hl-card-top">
        {logoUrl && <img src={`${logoUrl}?h=64&fit=max&auto=format`} alt={logoAlt ?? ''} className="hl-logo" />}
        {label && <span className="hl-label">{label}</span>}
        <button type="button" className="hl-close" onClick={close} aria-label="Close this announcement">×</button>
      </div>
      <p className="hl-title">{title}</p>
      {text && <p className="hl-text">{text}</p>}
      {link && (
        <a href={link} className="hl-link group" {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
          <span className="hl-link-text">{linkText ?? 'Find out more'}</span> <Arrow />
        </a>
      )}
    </aside>
  )
}
