'use client'

import { useContent } from './ContentContext'
import type { HoiEvent } from './data'
import { Arrow, fit, stegaClean } from './shared'

/* ------------------------------------------------------------
   hoi's events as an endless banner (inspired by Web Bae's
   "Greatest Infinite Marquee"): a ribbon of moving text and, under
   it, a row of event cards that keeps scrolling to the left. Hover
   or tab into it and it pauses. Pure CSS animation; the list is
   shown twice so the loop has no seam (the copy is hidden from
   screen readers and keyboards).

   Everything comes from Sanity: the events (Events → "Show on the
   homepage"), the texts (Homepage → Events), the event app link
   (Contact & links) and the current announcement (Highlights), which
   also pops up in the hero. Reduced motion: a still row you can swipe.
   ------------------------------------------------------------ */

function Card({ ev, copy }: { ev: HoiEvent; copy?: boolean }) {
  const inner = (
    <>
      <span className="em-partner">{ev.partner}</span>
      <span className="em-label">{ev.label}</span>
      <span lang="de" className="em-title">{ev.title}</span>
      {ev.meta.length > 0 && <span className="em-meta">{ev.meta.join(' · ')}</span>}
      {ev.link && <span className="em-go" aria-hidden="true"><Arrow /></span>}
    </>
  )
  const style = { background: ev.gradient }
  return (
    <li className="em-item" aria-hidden={copy || undefined}>
      {ev.link ? (
        <a href={ev.link} className="em-card" style={style} tabIndex={copy ? -1 : undefined}
          {...(ev.link.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
          {inner}
        </a>
      ) : (
        <div className="em-card" style={style}>{inner}</div>
      )}
    </li>
  )
}

export function EventsMarquee() {
  const { events, home, settings, highlight } = useContent()
  const shown = events.filter((e) => e.onHomepage !== false)
  if (!shown.length) return null
  // short lists are repeated so the row is always wider than the screen
  const base = Array.from({ length: Math.max(1, Math.ceil(6 / shown.length)) }, () => shown).flat()
  const ribbon = stegaClean(home.eventsMarquee)
  // slower for longer rows, so cards always move at the same speed
  const duration = `${Math.max(30, base.length * 7)}s`

  return (
    <section id="events" className="em pt-24 sm:pt-28" aria-labelledby="events-title" data-no-highlight>
      <div className="container-x flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="eyebrow">{home.eventsEyebrow}</p>
          <h2 id="events-title" className="mt-2 font-black uppercase leading-none" style={fit(home.eventsTitle, 'clamp(2.1rem, 5vw, 3.75rem)', '2.75rem')}>
            {home.eventsTitle}
          </h2>
        </div>
        {settings.eventAppUrl && (
          <a href={settings.eventAppUrl} target="_blank" rel="noopener noreferrer" className="btn-primary group h-12 gap-2 px-6">
            {settings.eventAppLabel} <Arrow />
          </a>
        )}
      </div>

      {highlight && (
        <div className="container-x mt-8">
          <div className="em-highlight">
            {highlight.logoUrl && <img src={`${highlight.logoUrl}?h=64&fit=max&auto=format`} alt={highlight.logoAlt ?? ''} className="h-8 w-auto" />}
            {highlight.label && <span className="em-highlight-label">{highlight.label}</span>}
            <p className="em-highlight-title">{highlight.title}</p>
            {highlight.text && <p className="em-highlight-text">{highlight.text}</p>}
            {highlight.link && (
              <a href={highlight.link} className="em-highlight-link group"
                {...(highlight.link.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
                {highlight.linkText ?? 'Find out more'} <Arrow />
              </a>
            )}
          </div>
        </div>
      )}

      {ribbon && (
        <div className="em-ribbon" aria-hidden="true">
          <div className="em-ribbon-track">
            <span>{ribbon}</span><span>{ribbon}</span>
          </div>
        </div>
      )}

      <div className="em-viewport" style={{ ['--em-duration' as string]: duration }}>
        <ul className="em-track" aria-label={home.eventsTitle}>
          {base.map((ev, i) => <Card key={`a-${ev.id}-${i}`} ev={ev} />)}
          {base.map((ev, i) => <Card key={`b-${ev.id}-${i}`} ev={ev} copy />)}
        </ul>
      </div>
    </section>
  )
}
