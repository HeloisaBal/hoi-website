'use client'

import { useEffect, useState } from 'react'
import type { Highlight } from './data'
import { Arrow } from './shared'

/* ------------------------------------------------------------
   Announcement bar above the header on every page (a partnership,
   a new programme, news). Content comes from Sanity ("Highlight"),
   or the demo in data.ts until Sanity is connected. Visitors can
   hide it; it comes back when hoi publishes a new one.
   ------------------------------------------------------------ */

const KEY_HIDDEN = 'hoi.highlight.hidden'

export function HighlightBar({ highlight }: { highlight: Highlight | null }) {
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    if (!highlight) return
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reads browser storage once
      if (localStorage.getItem(KEY_HIDDEN) === highlight.id) setHidden(true)
    } catch { /* storage blocked: just show it */ }
  }, [highlight])

  if (!highlight || hidden) return null
  const { id, title, label, text, link, linkText, logoUrl, logoAlt } = highlight
  const external = link?.startsWith('http')

  const hide = () => {
    setHidden(true)
    try { localStorage.setItem(KEY_HIDDEN, id) } catch { /* fine */ }
  }

  return (
    <aside className="hl-bar" aria-label="Announcement">
      <div className="hl-inner">
        {logoUrl && <img src={`${logoUrl}?h=64&fit=max&auto=format`} alt={logoAlt ?? ''} className="hl-logo" />}
        {label && <span className="hl-label">{label}</span>}
        <p className="hl-title">
          <strong>{title}</strong>
          {text && <span className="hl-text"> {text}</span>}
        </p>
        {link && (
          <a href={link} className="hl-link group" {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
            {linkText ?? 'Find out more'} <Arrow />
          </a>
        )}
        <button type="button" className="hl-close" onClick={hide} aria-label="Hide this announcement">×</button>
      </div>
    </aside>
  )
}
