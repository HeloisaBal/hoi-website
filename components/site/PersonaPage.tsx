'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'
import type { PersonaId } from './data'
import { useContent } from './ContentContext'
import { useVisitor } from './VisitorContext'
import { Arrow, splitHeadline, themeVars } from './shared'
import { Header } from './Header'
import { Footer } from './Footer'
import { PointerEffects } from './PointerEffects'
import { AnnouncementBar } from './AnnouncementBar'
import { OffersSection } from './OffersSection'
import { EventsList } from './EventsList'
import { NameDialog } from './NameDialog'
import { ContactSection } from './ContactSection'

/* ------------------------------------------------------------
   One page per path (/for/founder, /for/investor, /for/company,
   /for/researcher, /for/student), clean direction.
   The page takes the persona's colour as its one accent (Theme in
   data.ts) and greets the visitor by name:
   1. Hero: "Hoi Anna · Route · Founder", the persona's headline
      and line. Right after landing, the name question opens
      (NameDialog) if we don't know them yet.
   2. Where they are on the way from idea to company.
   3. Their programmes, the first one open.
   4. Their events.
   5. Contact, then the other paths.
   Arriving from the map, the colour that covered the screen opens
   up here with a burst (VisitorContext.arrived).
   Texts: Sanity → Personas, Journey, Offers, Events, Homepage.
   ------------------------------------------------------------ */

export function PersonaPage({ id }: { id: PersonaId }) {
  const { personas, journey, home, highlight } = useContent()
  const visitor = useVisitor()
  const p = personas.find((x) => x.id === id)!
  const others = personas.filter((x) => x.id !== id)
  const [a, b] = splitHeadline(p.headline)
  const { setPersona, arrived, askName } = visitor
  const stepsRef = useRef<HTMLOListElement>(null)

  /* phones: the stages scroll sideways; start with "You are here" in view */
  useEffect(() => {
    const list = stepsRef.current
    const mine = list?.querySelector<HTMLElement>('.is-you')
    if (list && mine && list.scrollWidth > list.clientWidth) list.scrollLeft = mine.offsetLeft - list.offsetLeft - 20
  }, [id])

  /* this page is their path now; open the colour if they came from the map */
  useEffect(() => {
    setPersona(id)
    arrived()
    // once the colour has opened and the burst has played: who are we talking to?
    const t = window.setTimeout(() => askName(true), 1300)
    return () => window.clearTimeout(t)
  }, [id, setPersona, arrived, askName])

  return (
    <div className="clean" style={themeVars(p.theme)}>
      <PointerEffects />
      <AnnouncementBar highlight={highlight} />
      <Header />

      <main>
        {/* ================= hero ================= */}
        <section className="wrap pb-16 pt-14 sm:pb-24 sm:pt-20" aria-labelledby="persona-title">
          <Link href="/#paths" className="mono slide-link inline-flex gap-2 text-muted">
            <span aria-hidden="true">←</span> {home.generalCta}
          </Link>
          <p className="mono mt-10 text-accent">
            {visitor.firstName ? `Hoi ${visitor.firstName} · ` : ''}{home.ticketRoute} · {p.pathLabel}
          </p>
          <h1 id="persona-title" className="disp c-hero-title mt-6">
            {a}{b && <> <span className="text-accent">{b}</span></>}
          </h1>
          <div className="mt-10 grid gap-10 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] md:items-end">
            <p className="c-lede max-w-xl">{p.line}</p>
            <div className="w-full max-w-md md:justify-self-end" aria-live="polite">
              {visitor.firstName ? (
                <>
                  <p className="disp text-[clamp(2.4rem,4.4vw,3.6rem)]">
                    <span key={visitor.name} className="name-sweep">Hoi {visitor.firstName}!</span>
                  </p>
                  <button type="button" onClick={() => askName()} className="mono mt-6 text-muted underline underline-offset-4 hover:text-ink">
                    Not {visitor.firstName}?
                  </button>
                </>
              ) : (
                <button type="button" onClick={() => askName()} className="mono slide-link text-accent">
                  {home.namePrompt} <span className="slide-arrow"><Arrow /></span>
                </button>
              )}
              <a href="#offers" className="mono slide-link c-under mt-8 w-full">{p.cta} <span className="slide-arrow"><Arrow /></span></a>
            </div>
          </div>
        </section>

        {/* ================= where they are on the way ================= */}
        {journey.length > 0 && (
          <section className="wrap pt-12 sm:pt-20" aria-labelledby="journey-title">
            <p className="mono text-accent">{home.journeyEyebrow}</p>
            <h2 id="journey-title" className="disp mt-4 text-[clamp(2.6rem,5vw,4.5rem)]">{home.journeyTitle}</h2>
            <ol ref={stepsRef} className="c-steps mt-10">
              {journey.map((s, i) => {
                const you = s.for.includes(id)
                return (
                  <li key={s.id} className={`c-step ${you ? 'is-you' : ''}`} aria-current={you ? 'step' : undefined}>
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="mono text-muted">{String(i + 1).padStart(2, '0')}</span>
                      {you && <span className="mono text-accent">You are here</span>}
                    </div>
                    <h3 className={`disp mt-4 text-4xl font-semibold ${you ? 'text-accent' : ''}`}>{s.title}</h3>
                    <p className="mt-3 text-base leading-relaxed text-muted">{s.text}</p>
                    <p className="mono mt-5">{s.programme}</p>
                  </li>
                )
              })}
            </ol>
          </section>
        )}

        <OffersSection persona={id} only plural={p.plural} />
        <EventsList persona={id} />

        <div className="pt-28 sm:pt-40" />
        <ContactSection current={p} />

        {/* ================= the other paths ================= */}
        <section className="c-dark" aria-labelledby="others-title">
          <div className="wrap border-t border-white/15 pb-20 pt-16">
            <h2 id="others-title" className="mono text-white/70">I’m someone else</h2>
            <ul className="mt-6 grid gap-x-10 sm:grid-cols-2 lg:grid-cols-4">
              {others.map((o) => (
                <li key={o.id} className="border-b border-white/15">
                  <button type="button" onClick={(e) => visitor.go(o, { x: e.clientX, y: e.clientY })}
                    className="c-hover c-hover-light slide-link flex w-full items-baseline justify-between gap-4 py-5 text-left">
                    <span>
                      <span className="disp block text-3xl font-semibold">{o.pathLabel}</span>
                      <span className="mt-1 block text-white/65">{o.pathText}</span>
                    </span>
                    <span className="slide-arrow"><Arrow /></span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>

      <Footer onReset={visitor.forget} />
      <NameDialog persona={p} />
    </div>
  )
}
