'use client'

import Link from 'next/link'
import { useContent } from './ContentContext'
import type { HoiEvent, PersonaId } from './data'
import { EventCard } from './EventCard'
import { Arrow, fit } from './shared'

/* ------------------------------------------------------------
   hoi's own next events on the homepage: a compact row of up to
   three cards. All regional events live in hoi's event app
   (Sanity → Contact & links → Event app link); the button to it
   only appears once that link is filled in.
   ------------------------------------------------------------ */

const SHOWN = 3

export function NextEvents({ events, persona, plural }: { events: HoiEvent[]; persona: PersonaId | null; plural?: string }) {
  const { home, settings } = useContent()
  if (!events.length) return null
  const title = plural ? `Next up for ${plural}` : home.eventsTitle

  return (
    <section id="events" className="container-x pt-28" aria-labelledby="events-title">
      <div className="reveal flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="eyebrow">{home.eventsEyebrow}</p>
          <h2 id="events-title" className="mt-2 font-black uppercase leading-none" style={fit(title, 'clamp(2.1rem, 5vw, 3.75rem)', '2.75rem')}>
            {title}
          </h2>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/events" className="btn-secondary group h-12 gap-2 px-6">
            See all hoi events <Arrow />
          </Link>
          {settings.eventAppUrl && (
            <a href={settings.eventAppUrl} target="_blank" rel="noopener noreferrer" className="btn-primary group h-12 gap-2 px-6">
              {settings.eventAppLabel} <Arrow />
            </a>
          )}
        </div>
      </div>
      <div className="no-scrollbar -mx-5 mt-10 flex snap-x gap-4 overflow-x-auto px-5 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:px-0 lg:grid-cols-3">
        {events.slice(0, SHOWN).map((ev) => (
          <EventCard key={ev.id} ev={ev} compact picked={!!persona && ev.for.includes(persona)} />
        ))}
      </div>
    </section>
  )
}
