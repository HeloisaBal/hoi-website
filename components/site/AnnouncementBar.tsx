'use client'

import type { Highlight } from './data'
import { Arrow } from './shared'

/* The current announcement (Sanity → Highlights) as one thin dark bar
   above the header. Clean-direction replacement for the floating card. */
export function AnnouncementBar({ highlight }: { highlight: Highlight | null }) {
  if (!highlight) return null
  const inner = (
    <>
      {highlight.label && <span className="announce-label">{highlight.label}</span>}
      <span>{highlight.title}{highlight.text ? ` · ${highlight.text}` : ''}</span>
      {highlight.link && <span className="slide-arrow" aria-hidden="true"><Arrow /></span>}
    </>
  )
  if (!highlight.link) return <p className="announce mono">{inner}</p>
  const external = highlight.link.startsWith('http')
  return (
    <a href={highlight.link} className="announce mono slide-link hover:!text-white"
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
      {inner}
    </a>
  )
}
