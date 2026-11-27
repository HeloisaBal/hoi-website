'use client'

import { useRef, useState } from 'react'
import { DEFAULT_THEME, MAIN_PATHS, type PersonaId } from './data'
import { useContent } from './ContentContext'
import { Arrow, stegaClean, themeVars } from './shared'
import { askHoi } from './chat/ask'
import { Header } from './Header'
import { Footer } from './Footer'
import { PointerEffects } from './PointerEffects'
import { AnnouncementBar } from './AnnouncementBar'
import { PathWorld } from './PathWorld'
import { OffersSection } from './OffersSection'
import { WhoWeAre } from './WhoWeAre'
import { EventsList } from './EventsList'

/* ------------------------------------------------------------
   Homepage, clean direction (branch clean-design).
   1. Hero: hoi's line in big type and who hoi is, in one sentence.
   2. The 3D map: pick your path (founder, investor, company), or
      researcher / student below it. The page then puts that path's
      programmes first. Nothing is stored in the browser.
   3. Programmes, who we are, events, partners, contact.
   All texts come from Sanity (same fields as the main branch).
   ------------------------------------------------------------ */

/** "Im Norden gründen – mit Rückenwind!" → two lines, split at the dash */
function heroLines(text: string): [string, string] {
  const m = text.match(/^(.+?)\s+[–—-]\s+(.+)$/)
  return m ? [m[1], m[2]] : [text, '']
}

export function HoiHome() {
  const { personas, partners, team, home, settings, highlight, chatbot } = useContent()
  const [persona, setPersona] = useState<PersonaId | null>(null)
  const chosenRef = useRef<HTMLDivElement>(null)

  const current = personas.find((p) => p.id === persona) ?? null
  const mainPaths = MAIN_PATHS.flatMap((id) => personas.filter((p) => p.id === id))
  const otherPaths = personas.filter((p) => !MAIN_PATHS.includes(p.id))
  const [line1, line2] = heroLines(home.heroPill)
  const names = partners.map((p) => stegaClean(p.name))
  const showAbout = home.aboutPhotos.some(Boolean)

  function choose(id: PersonaId) {
    setPersona(id)
    window.setTimeout(() => chosenRef.current?.focus({ preventScroll: true }), 50)
  }

  return (
    <div className="clean" style={themeVars(DEFAULT_THEME)}>
      <PointerEffects />
      <AnnouncementBar highlight={highlight} />
      <Header active="home" />

      <main>
        {/* ================= hero ================= */}
        <section id="top" className="wrap pb-16 pt-14 sm:pb-24 sm:pt-24" aria-labelledby="hero-title">
          <p className="mono text-accent">{home.whoTitle}</p>
          <h1 id="hero-title" className="disp c-hero-title mt-6">
            <span className="block">{line1}</span>
            {line2 && <span className="block text-accent">{line2}</span>}
          </h1>
          <div className="mt-10 grid gap-8 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] md:items-end">
            <p className="c-lede max-w-xl">{home.generalLine}</p>
            <a href="#paths" className="mono slide-link c-under w-full max-w-xs md:justify-self-end">
              {home.generalCta} <span className="slide-arrow"><Arrow /></span>
            </a>
          </div>
        </section>

        {/* ================= the 3D map: pick a path ================= */}
        <section id="paths" className="scroll-mt-20" aria-labelledby="paths-title">
          <div className="wrap flex flex-wrap items-end justify-between gap-4 pb-6">
            <h2 id="paths-title" className="disp text-[clamp(2.4rem,4.6vw,4rem)]">{home.pathPrompt}</h2>
            <p className="mono text-muted">{home.pathHint}</p>
          </div>
          <PathWorld paths={mainPaths} selected={persona} hint="" cursorLabel={home.cursorSail}
            onChoose={(id) => choose(id)} top={null} bottom={null} />
          <div className="wrap flex flex-wrap items-center gap-x-8 gap-y-3 py-6 text-lg">
            <span className="text-muted">{home.pathMore}</span>
            {otherPaths.map((p) => (
              <button key={p.id} type="button" aria-pressed={persona === p.id} onClick={() => choose(p.id)}
                className={`slide-link underline decoration-1 underline-offset-[6px] ${persona === p.id ? 'text-accent' : ''}`}>
                {p.pathLabel}
              </button>
            ))}
            <a href="#offers" className="mono slide-link ml-auto text-muted">{home.pathSkip} <span className="slide-arrow"><Arrow /></span></a>
          </div>

          {/* the chosen path, in a sentence, with its next step */}
          {current && (
            <div ref={chosenRef} tabIndex={-1} aria-live="polite" className="wrap outline-none">
              <div className="c-rows grid gap-6 py-10 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] md:items-end">
                <div>
                  <p className="mono text-accent">{home.ticketRoute} · {current.pathLabel}</p>
                  <p className="disp mt-4 text-[clamp(2.4rem,4.6vw,4rem)]">{current.headline}</p>
                  <p className="c-lede mt-5 max-w-xl text-muted">{current.line}</p>
                </div>
                <div className="flex flex-col gap-4 md:items-end">
                  <a href="#offers" className="mono slide-link c-under w-full max-w-xs">{current.cta} <span className="slide-arrow"><Arrow /></span></a>
                  <button type="button" onClick={() => setPersona(null)} className="mono text-muted underline underline-offset-4 hover:text-ink">
                    {home.pathSkip}
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>

        <OffersSection persona={persona} />
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

        {/* ================= contact ================= */}
        <section id="contact" className="c-dark scroll-mt-20" aria-labelledby="contact-title" data-no-highlight>
          <div className="wrap grid gap-16 pb-24 pt-24 sm:pt-32 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
            <div>
              <h2 id="contact-title" className="disp text-[clamp(3.4rem,8.5vw,8.5rem)]">{home.contactTitle}</h2>
              <p className="c-lede mt-8 max-w-lg text-white/80">{home.contactText}</p>
              <a href={`mailto:${settings.email}`} className="mt-10 inline-block break-all text-[clamp(1.4rem,2.6vw,2.3rem)] underline decoration-1 underline-offset-8 hover:text-teal-400">
                {settings.email}
              </a>
              <div className="mt-14 grid max-w-2xl gap-8 sm:grid-cols-2">
                <a href={`mailto:${settings.email}`} className="slide-link c-under text-xl hover:!text-teal-400">
                  {home.contactButton} <span className="slide-arrow"><Arrow /></span>
                </a>
                {chatbot.enabled && (
                  <button type="button" onClick={() => askHoi('')} className="slide-link c-under text-left text-xl hover:!text-teal-400">
                    {chatbot.buttonLabel} <span className="slide-arrow"><Arrow /></span>
                  </button>
                )}
              </div>
            </div>
            <ul className="grid grid-cols-2 gap-5 self-end">
              {team.slice(0, 4).map((t) => (
                <li key={t.name}>
                  {t.photoUrl && (
                    <img src={`${t.photoUrl}?w=480&h=600&fit=crop&auto=format`} alt={t.photoAlt || t.name}
                      className="mb-4 aspect-[4/5] w-full object-cover grayscale" loading="lazy" />
                  )}
                  <p className="text-xl">{t.name}</p>
                  <p className="mono mt-1 text-white/60">{t.role}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>

      <Footer onReset={persona ? () => setPersona(null) : undefined} />
    </div>
  )
}
