'use client'

import { DEFAULT_THEME } from './data'
import { useContent } from './ContentContext'
import { Header } from './Header'
import { Footer } from './Footer'
import { PointerEffects } from './PointerEffects'
import { AnnouncementBar } from './AnnouncementBar'
import { EventRow } from './EventsList'
import { Arrow, themeVars } from './shared'

/* ------------------------------------------------------------
   Events page, clean direction: big title, every hoi event as a
   row (with "Ask about this"), and a dark block to follow hoi or
   host an event. Content: Sanity → Events and Events page.
   ------------------------------------------------------------ */

export function EventsPage() {
  const { events, home, eventsPage: t, settings, highlight } = useContent()

  return (
    <div className="themed clean" style={themeVars(DEFAULT_THEME)}>
      <PointerEffects />
      <AnnouncementBar highlight={highlight} />
      <Header active="events" />

      <main>
        <section className="wrap pb-12 pt-14 sm:pb-20 sm:pt-24" aria-labelledby="events-title">
          <p className="mono text-accent">{t.pill}</p>
          <h1 id="events-title" className="disp c-hero-title mt-6">
            {t.titleLine1} <span className="text-accent">{t.titleLine2}</span>
          </h1>
          <div className="mt-10 grid gap-8 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] md:items-end">
            <p className="c-lede max-w-xl">{t.intro}</p>
            {settings.eventAppUrl && (
              <a href={settings.eventAppUrl} target="_blank" rel="noopener noreferrer" className="mono slide-link c-under w-full max-w-xs md:justify-self-end">
                {settings.eventAppLabel} <span className="slide-arrow"><Arrow /></span>
              </a>
            )}
          </div>
        </section>

        <section className="wrap pb-28 sm:pb-40" aria-label="Events">
          {events.length > 0 ? (
            <ul className="c-rows">
              {events.map((ev) => <EventRow key={ev.id} ev={ev} ask={home.askLabel} />)}
            </ul>
          ) : (
            <div className="c-rows py-16">
              <p className="disp text-4xl">Nothing here right now.</p>
              <p className="mt-3 text-lg text-muted">New hoi events are added all the time.</p>
            </div>
          )}
        </section>

        <section className="c-dark" data-no-highlight aria-labelledby="loop-title">
          <div className="wrap grid gap-12 pb-20 pt-24 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:items-end">
            <div>
              <h2 id="loop-title" className="disp text-[clamp(3rem,7vw,6.5rem)]">{t.ctaTitle}</h2>
              <p className="c-lede mt-6 max-w-lg text-white/80">{t.ctaText}</p>
            </div>
            <div className="grid gap-8 sm:grid-cols-2">
              <a href={settings.instagram} target="_blank" rel="noopener noreferrer" className="slide-link c-under text-xl hover:!text-teal-400">
                Follow on Instagram <span className="slide-arrow"><Arrow /></span>
              </a>
              <a href={`mailto:${settings.email}?subject=Hosting%20an%20event%20with%20hoi`} className="slide-link c-under text-xl hover:!text-teal-400">
                Host an event <span className="slide-arrow"><Arrow /></span>
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
