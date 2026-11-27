'use client'

import Link from 'next/link'
import { DEFAULT_THEME, MAIN_PATHS, type PersonaId } from './data'
import { useContent } from './ContentContext'
import { personaHref, useVisitor } from './VisitorContext'
import { Arrow, stegaClean, themeVars } from './shared'
import { prefersReducedMotion } from './effects'
import { Header } from './Header'
import { Footer } from './Footer'
import { PointerEffects } from './PointerEffects'
import { AnnouncementBar } from './AnnouncementBar'
import { PathWorld } from './PathWorld'
import { OffersSection } from './OffersSection'
import { WhoWeAre } from './WhoWeAre'
import { EventsList } from './EventsList'
import { ContactSection } from './ContactSection'

/* ------------------------------------------------------------
   Homepage, clean direction (branch clean-design).
   1. Hero: hoi's line in big type and who hoi is in one sentence.
      (The name is asked on the persona page, right after the path.)
   2. The 3D map: pick your path (founder, investor, company). The
      camera flies to the district, the path's colour covers the
      screen and the visitor lands on their persona page
      (/for/<persona>, PersonaPage.tsx) with a burst.
   3. Programmes, who we are, events, partners, contact.
   Name and path live in VisitorContext (root layout).
   All texts come from Sanity (same fields as the main branch).
   ------------------------------------------------------------ */

/** "Im Norden gründen – mit Rückenwind!" → two lines, split at the dash */
function heroLines(text: string): [string, string] {
  const m = text.match(/^(.+?)\s+[–—-]\s+(.+)$/)
  return m ? [m[1], m[2]] : [text, '']
}

const scrollToId = (id: string) =>
  document.getElementById(id)?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' })

export function HoiHome() {
  const { personas, partners, home, highlight } = useContent()
  const visitor = useVisitor()
  const mainPaths = MAIN_PATHS.flatMap((id) => personas.filter((p) => p.id === id))
  const mine = personas.find((p) => p.id === visitor.persona) ?? null
  const [line1, line2] = heroLines(home.heroPill)
  const names = partners.map((p) => stegaClean(p.name))
  const showAbout = home.aboutPhotos.some(Boolean)

  function choose(id: PersonaId, from: { x: number; y: number }) {
    const p = personas.find((x) => x.id === id)
    if (p) visitor.go(p, from)
  }

  return (
    <div className="clean" style={themeVars(DEFAULT_THEME)}>
      <PointerEffects />
      <AnnouncementBar highlight={highlight} />
      <Header active="home" />

      <main>
        {/* ================= hero + the name ================= */}
        <section id="top" className="wrap pb-16 pt-14 sm:pb-24 sm:pt-24" aria-labelledby="hero-title">
          <p className="mono text-accent">{home.whoTitle}</p>
          <h1 id="hero-title" className="disp c-hero-title mt-6">
            <span className="block">{line1}</span>
            {line2 && <span className="block text-accent">{line2}</span>}
          </h1>
          <div className="mt-10 grid gap-10 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] md:items-end">
            <p className="c-lede max-w-xl">{home.generalLine}</p>
            <a href="#paths" className="mono slide-link c-under w-full max-w-xs md:justify-self-end"
              onClick={(e) => { e.preventDefault(); scrollToId('paths') }}>
              {home.generalCta} <span className="slide-arrow"><Arrow /></span>
            </a>
          </div>
        </section>

        {/* ================= the 3D map: pick a path ================= */}
        <section id="paths" className="scroll-mt-32" aria-labelledby="paths-title">
          <div className="wrap flex flex-wrap items-end justify-between gap-4 pb-6">
            <div>
              {visitor.firstName && <p className="mono text-accent">Hoi {visitor.firstName}</p>}
              <h2 id="paths-title" className="disp mt-2 text-[clamp(2.4rem,4.6vw,4rem)]">{home.pathPrompt}</h2>
            </div>
            <p className="mono text-muted">{home.pathHint}</p>
          </div>
          <PathWorld paths={mainPaths} selected={visitor.persona} hint="" cursorLabel={home.cursorSail} backLabel={home.generalCta}
            onChoose={choose} top={null} bottom={null} />
          <div className="wrap flex flex-wrap items-center justify-between gap-4 py-5">
            {mine ? (
              <Link href={personaHref(mine.id)} className="mono slide-link text-accent">
                {home.ticketRoute} · {mine.pathLabel} <span className="slide-arrow"><Arrow /></span>
              </Link>
            ) : <span />}
            <a href="#offers" className="mono slide-link text-muted">{home.pathSkip} <span className="slide-arrow"><Arrow /></span></a>
          </div>
        </section>

        <OffersSection persona={visitor.persona} />
        <WhoWeAre />
        <EventsList />

        {/* ================= founders (only once there are photos in Sanity) ================= */}
        {showAbout && (
          <section id="about" className="wrap pt-28 sm:pt-40" aria-labelledby="about-title">
            <div className="grid items-end gap-12 lg:grid-cols-2">
              <div className="grid grid-cols-2 gap-4">
                {home.aboutPhotos.map((ph, i) => ph && (
                  <img key={i} src={`${ph.url}?w=600&h=800&fit=crop&auto=format`} alt={ph.alt}
                    className="aspect-[3/4] w-full object-cover" loading="lazy" />
                ))}
              </div>
              <figure>
                <p id="about-title" className="mono text-accent">{home.aboutEyebrow}</p>
                <blockquote className="mt-6 text-[clamp(1.6rem,2.6vw,2.4rem)] leading-snug">“{home.quote}”</blockquote>
                <figcaption className="mono mt-6 text-muted">{home.quoteBy}</figcaption>
              </figure>
            </div>
          </section>
        )}

        {/* ================= partners, as one sentence ================= */}
        {names.length > 0 && (
          <section className="wrap pb-28 pt-28 sm:pb-40 sm:pt-40" aria-labelledby="partners-title">
            <h2 id="partners-title" className="mono text-muted">{home.partnersTitle}</h2>
            <p className="mt-6 max-w-5xl text-[clamp(1.7rem,3vw,2.8rem)] leading-tight">{names.join(', ')}.</p>
          </section>
        )}

        <ContactSection current={mine} />
      </main>

      <Footer onReset={visitor.persona || visitor.name ? visitor.forget : undefined} />
    </div>
  )
}
