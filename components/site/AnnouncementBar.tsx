'use client'

import { useEffect, useState } from 'react'
import type { Highlight } from './data'

/* ------------------------------------------------------------
   The current announcement (Sanity → Highlights) as a moving band
   at the very top of the page: label · title · text, running to the
   left on a loop. Pauses on hover and keyboard focus; still with
   reduced motion. Visitors can close it with ×; it stays closed for
   the rest of the visit (sessionStorage) and comes back when hoi
   publishes a new one. The whole band is a link when the
   announcement has one.
   ------------------------------------------------------------ */

const KEY_CLOSED = 'hoi.ticker.closed'
/** copies in one half of the loop, so the band is always wider than the screen */
const COPIES = 4

export function AnnouncementBar({ highlight }: { highlight: Highlight | null }) {
  const [closed, setClosed] = useState(false)

  useEffect(() => {
    if (!highlight) return
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reads browser storage once
      if (sessionStorage.getItem(KEY_CLOSED) === highlight.id) setClosed(true)
    } catch { /* storage blocked: just show it */ }
  }, [highlight])

  if (!highlight || closed) return null
  const { id, label, title, text, link } = highlight
  const parts = [label, title, text].filter(Boolean) as string[]
  const sentence = parts.join(' · ')

  const close = () => {
    setClosed(true)
    try { sessionStorage.setItem(KEY_CLOSED, id) } catch { /* fine */ }
  }

  /* the visible, moving copies (hidden from screen readers, who get the sentence once) */
  const half = (key: string) => (
    <span className="ticker-half" key={key}>
      {Array.from({ length: COPIES }, (_, i) => (
        <span key={i} className="ticker-item">
          {label && <span className="ticker-label">{label}</span>}
          {[title, text].filter(Boolean).join(' · ')}
          <span className="ticker-dot">·</span>
        </span>
      ))}
    </span>
  )
  const band = (
    <>
      <span className="sr-only">{sentence}</span>
      <span className="ticker-track" aria-hidden="true">{half('a')}{half('b')}</span>
    </>
  )
  const external = !!link?.startsWith('http')

  return (
    <aside className="ticker" aria-label="Announcement">
      {link
        ? <a href={link} className="ticker-band" {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{band}</a>
        : <p className="ticker-band">{band}</p>}
      <button type="button" className="ticker-close" onClick={close} aria-label="Close this announcement">
        <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <path d="M5 5l10 10M15 5L5 15" />
        </svg>
      </button>
    </aside>
  )
}
