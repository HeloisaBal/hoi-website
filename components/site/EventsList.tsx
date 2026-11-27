'use client'

import Link from 'next/link'
import { useContent } from './ContentContext'
import type { HoiEvent, PersonaId } from './data'
import { Arrow } from './shared'
import { askHoi } from './chat/ask'

/* ------------------------------------------------------------
   Events on the homepage (clean direction): a plain table of rows,
   date · title · partner · type. Takes the events marked "Show on
   the homepage" (Sanity → Events) and the texts from Homepage →
   Events. A row with a link opens it.
   ------------------------------------------------------------ */

/** One event as a row. `ask` adds a button that asks the chatbot about it (events page). */
export function EventRow({ ev, ask }: { ev: HoiEvent; ask?: string }) {
  const cells = (
    <>
      <span className="mono text-[.8rem]">{ev.meta.join(' · ')}</span>
      <span lang="de" className="disp text-[clamp(1.7rem,2.6vw,2.3rem)] font-semibold">{ev.title}</span>
      <span className="text-lg italic text-muted">{ev.partner}</span>
      <span className="mono text-accent">{ev.label}</span>
    </>
  )
  const external = !!ev.link?.startsWith('http')
  return (
    <li className="c-row">
      {ev.link
        ? <a href={ev.link} className="c-event c-hover" {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{cells}</a>
        : <div className="c-event c-hover">{cells}</div>}
      {ask && (
        <button type="button" onClick={() => askHoi(`Tell me more about ${ev.title}`)}
          className="mono slide-link mb-5 ml-1 inline-flex gap-2 text-muted">
          {ask} <span className="slide-arrow"><Arrow /></span>
        </button>
      )}
    </li>
  )
}

/** Homepage: the events marked "Show on the homepage". Persona pages: every event for that persona. */
export function EventsList({ persona }: { persona?: PersonaId }) {
  const { events, home, settings } = useContent()
  const shown = persona ? events.filter((e) => e.for.includes(persona)) : events.filter((e) => e.onHomepage !== false)
  if (!shown.length) return null
  return (
    <section id="events" className="wrap scroll-mt-24 pt-28 sm:pt-40" aria-labelledby="events-title">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="mono text-accent">{home.eventsEyebrow}</p>
          <h2 id="events-title" className="disp mt-4 text-[clamp(3.4rem,7.5vw,7.5rem)]">{home.eventsTitle}</h2>
        </div>
        {settings.eventAppUrl ? (
          <a href={settings.eventAppUrl} target="_blank" rel="noopener noreferrer" className="mono slide-link c-under min-w-[16rem]">
            {settings.eventAppLabel} <span className="slide-arrow"><Arrow /></span>
          </a>
        ) : (
          <Link href="/events" className="mono slide-link c-under min-w-[16rem]">
            {settings.eventAppLabel} <span className="slide-arrow"><Arrow /></span>
          </Link>
        )}
      </div>
      <ul className="c-rows mt-12">
        {shown.map((ev) => <EventRow key={ev.id} ev={ev} />)}
      </ul>
    </section>
  )
}
