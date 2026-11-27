'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { DEFAULT_THEME, MAIN_PATHS, type PersonaId } from './data'
import { useContent } from './ContentContext'
import { Arrow, KEY_NAME, KEY_PERSONA, KEY_REMEMBER, load, save, stegaClean, themeVars } from './shared'
import { prefersReducedMotion } from './effects'
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
   1. Hero: hoi's line in big type, who hoi is in one sentence, and
      "What should we call you?". The name is used across the page
      from then on (the map, the chosen path, contact).
   2. The 3D map: pick your path (founder, investor, company). The
      page scrolls to that path: a greeting, what hoi does for them,
      and their programmes, the first one opened.
   3. Programmes, who we are, events, partners, contact.
   Name and path stay in this browser only with "Remember me"
   ticked (consent, § 25 TDDDG); otherwise they are gone on reload.
   All texts come from Sanity (same fields as the main branch).
   ------------------------------------------------------------ */

/** "Im Norden gründen – mit Rückenwind!" → two lines, split at the dash */
function heroLines(text: string): [string, string] {
  const m = text.match(/^(.+?)\s+[–—-]\s+(.+)$/)
  return m ? [m[1], m[2]] : [text, '']
}

const scrollTo = (el: Element | null) =>
  el?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' })

export function HoiHome() {
  const { personas, partners, team, home, settings, highlight, chatbot, offers } = useContent()
  const [persona, setPersona] = useState<PersonaId | null>(null)
  const [name, setName] = useState('')
  const [draft, setDraft] = useState('')
  const [editing, setEditing] = useState(true)
  const [remember, setRemember] = useState(false)
  const [openOffer, setOpenOffer] = useState<string | null>(null)
  const chosenRef = useRef<HTMLDivElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)
  const goToChosen = useRef(false)

  /* a returning visitor who ticked "Remember me": name and path come back before the first paint */
  useLayoutEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (load(KEY_REMEMBER) !== '1') { save(KEY_NAME, null); save(KEY_PERSONA, null); return }
    setRemember(true)
    const n = load(KEY_NAME)
    if (n) { setName(n); setDraft(n); setEditing(false) }
    const p = load(KEY_PERSONA) as PersonaId | null
    if (p && personas.some((x) => x.id === p)) setPersona(p)
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [personas])

  /* after a path is picked on the map: go to it */
  useEffect(() => {
    if (!persona || !goToChosen.current) return
    goToChosen.current = false
    scrollTo(chosenRef.current)
    chosenRef.current?.focus({ preventScroll: true })
  }, [persona])

  const current = personas.find((p) => p.id === persona) ?? null
  const mainPaths = MAIN_PATHS.flatMap((id) => personas.filter((p) => p.id === id))
  const [line1, line2] = heroLines(home.heroPill)
  const names = partners.map((p) => stegaClean(p.name))
  const showAbout = home.aboutPhotos.some(Boolean)
  const rawFirst = name.trim().split(/\s+/)[0] ?? ''
  const firstName = rawFirst.charAt(0).toLocaleUpperCase() + rawFirst.slice(1)
  const myOffers = current ? offers.filter((o) => o.for.includes(current.id)) : []
  const mailSubject = encodeURIComponent(
    stegaClean(`Hoi! ${firstName ? `I'm ${firstName}, ` : ''}${current ? current.chip : 'a question'}`),
  )

  function submitName(e: React.FormEvent) {
    e.preventDefault()
    const clean = draft.trim().slice(0, 40)
    setName(clean)
    setEditing(!clean)
    save(KEY_REMEMBER, remember ? '1' : null)
    save(KEY_NAME, remember ? clean || null : null)
    save(KEY_PERSONA, remember ? persona : null)
    // after the greeting has replaced the form, so the page has its final height
    window.setTimeout(() => scrollTo(document.getElementById('paths')), 60)
  }

  function editName() {
    setEditing(true)
    window.setTimeout(() => nameRef.current?.focus(), 30)
  }

  function choose(id: PersonaId) {
    goToChosen.current = true
    setPersona(id)
    setOpenOffer(offers.find((o) => o.for.includes(id))?.id ?? null)
    if (load(KEY_REMEMBER) === '1') save(KEY_PERSONA, id)
  }

  function clearPath() {
    setPersona(null)
    setOpenOffer(null)
    if (load(KEY_REMEMBER) === '1') save(KEY_PERSONA, null)
    scrollTo(document.getElementById('paths'))
  }

  function forget() {
    setPersona(null); setName(''); setDraft(''); setEditing(true); setRemember(false); setOpenOffer(null)
    save(KEY_PERSONA, null); save(KEY_NAME, null); save(KEY_REMEMBER, null)
    scrollTo(document.getElementById('top'))
    window.setTimeout(() => nameRef.current?.focus({ preventScroll: true }), 400)
  }

  function openProgramme(id: string) {
    setOpenOffer(id)
    window.setTimeout(() => scrollTo(document.getElementById(`programme-${id}`)), 30)
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

            {editing ? (
              <form onSubmit={submitName} className="w-full max-w-md md:justify-self-end">
                <label htmlFor="hoi-name" className="mono block text-accent">{home.namePrompt}</label>
                <div className="mt-3 flex flex-wrap items-end gap-x-4 gap-y-5">
                  <input id="hoi-name" ref={nameRef} value={draft} onChange={(e) => setDraft(e.target.value)}
                    placeholder="Your first name" autoComplete="given-name" maxLength={40} className="c-name-input min-w-[12rem] flex-1" />
                  <button type="submit" className="c-pill mono shrink-0">
                    {draft.trim() ? home.cursorGo : home.generalCta} <span className="ml-2"><Arrow /></span>
                  </button>
                </div>
                <label className="mt-4 inline-flex cursor-pointer items-center gap-2.5 text-sm text-muted">
                  <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="c-check" />
                  <span>{home.rememberLabel}</span>
                </label>
              </form>
            ) : (
              <div className="w-full max-w-md md:justify-self-end" aria-live="polite">
                <p className="disp text-[clamp(2.4rem,4.4vw,3.6rem)]">Hoi {firstName}!</p>
                <div className="mono mt-4 flex flex-wrap gap-x-6 gap-y-2">
                  <a href="#paths" className="slide-link">{home.generalCta} <span className="slide-arrow"><Arrow /></span></a>
                  <button type="button" onClick={editName} className="text-muted underline underline-offset-4 hover:text-ink">Not {firstName}?</button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ================= the 3D map: pick a path ================= */}
        <section id="paths" className="scroll-mt-32" aria-labelledby="paths-title">
          <div className="wrap flex flex-wrap items-end justify-between gap-4 pb-6">
            <div>
              {firstName && <p className="mono text-accent">Hoi {firstName}</p>}
              <h2 id="paths-title" className="disp mt-2 text-[clamp(2.4rem,4.6vw,4rem)]">{home.pathPrompt}</h2>
            </div>
            <p className="mono text-muted">{home.pathHint}</p>
          </div>
          <PathWorld paths={mainPaths} selected={persona} hint="" cursorLabel={home.cursorSail}
            onChoose={(id) => choose(id)} top={null} bottom={null} />
          <div className="wrap flex justify-end py-5">
            <a href="#offers" className="mono slide-link text-muted">{home.pathSkip} <span className="slide-arrow"><Arrow /></span></a>
          </div>

          {/* where a path leads: a greeting, what hoi does for them, their programmes */}
          {current && (
            <div ref={chosenRef} tabIndex={-1} aria-live="polite" className="wrap scroll-mt-24 outline-none">
              <div className="c-rows grid gap-10 py-12 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
                <div>
                  <p className="mono text-accent">{firstName ? `Hoi ${firstName} · ` : ''}{home.ticketRoute} · {current.pathLabel}</p>
                  <p className="disp mt-4 text-[clamp(2.6rem,5vw,4.6rem)]">{current.headline}</p>
                  <p className="c-lede mt-6 max-w-xl text-muted">{current.line}</p>
                  <button type="button" onClick={clearPath} className="mono mt-8 text-muted underline underline-offset-4 hover:text-ink">
                    {home.generalCta}
                  </button>
                </div>
                {myOffers.length > 0 && (
                  <div>
                    <p className="mono text-muted">{current.cta}</p>
                    <ul className="c-rows mt-4">
                      {myOffers.map((o) => (
                        <li key={o.id} className="c-row">
                          <button type="button" onClick={() => openProgramme(o.id)}
                            className="slide-link flex w-full items-baseline justify-between gap-4 py-4 text-left">
                            <span>
                              <span className="disp block text-3xl font-semibold">{o.name}</span>
                              <span className="mt-1 block italic text-muted">{o.tagline}</span>
                            </span>
                            <span className="slide-arrow text-xl"><Arrow /></span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        <OffersSection persona={persona} open={openOffer} onOpen={setOpenOffer} />
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
              <h2 id="contact-title" className="disp text-[clamp(3.4rem,8.5vw,8.5rem)]">
                {firstName ? `Hoi ${firstName}, we’re listening.` : home.contactTitle}
              </h2>
              <p className="c-lede mt-8 max-w-lg text-white/80">
                {current ? `Tell us about yourself. We talk to ${current.plural} every week and love hearing new ideas.` : home.contactText}
              </p>
              <a href={`mailto:${settings.email}?subject=${mailSubject}`} className="mt-10 inline-block break-all text-[clamp(1.4rem,2.6vw,2.3rem)] underline decoration-1 underline-offset-8 hover:text-teal-400">
                {settings.email}
              </a>
              <div className="mt-14 grid max-w-2xl gap-8 sm:grid-cols-2">
                <a href={`mailto:${settings.email}?subject=${mailSubject}`} className="slide-link c-under text-xl hover:!text-teal-400">
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

      <Footer onReset={persona || name ? forget : undefined} />
    </div>
  )
}
