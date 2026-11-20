'use client'

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { DEFAULT_THEME, MAIN_PATHS, type PersonaId } from './data'
import { useContent } from './ContentContext'
import { HighlightCard } from './HighlightCard'
import { centreOf, prefersReducedMotion, useEffects } from './effects'
import { HeroBackdrop } from './Backdrop'
import { Arrow, KEY_NAME, KEY_PERSONA, KEY_REMEMBER, WaveHand, fit, load, rise, save, splitHeadline, stegaClean, themeVars } from './shared'
import { Header } from './Header'
import { Footer } from './Footer'
import { PointerEffects } from './PointerEffects'
import { ScrollBoat } from './ScrollBoat'
import { LogoWindow } from './LogoWindow'
import { FounderJourney } from './FounderJourney'
import { NextEvents } from './NextEvents'
import { ParallaxShapes } from './ParallaxShapes'
import { ScienceBusiness } from './ScienceBusiness'
import { PathWorld } from './PathWorld'
import { DotField } from './DotField'

/* Landing: 1. pick a path (or skip), 2. optional first name, 3. the hero for that path */
type Step = 'persona' | 'name' | 'loading' | 'done'

export function HoiHome() {
  const { personas, events, partners, team, home, settings, highlight } = useContent()
  const [persona, setPersona] = useState<PersonaId | null>(null)
  const [name, setName] = useState('')
  const [draft, setDraft] = useState('')
  /* "Remember me": name and persona are only saved in the browser when ticked */
  const [remember, setRemember] = useState(false)
  const [step, setStep] = useState<Step>('persona')
  const [returning, setReturning] = useState(false)
  const [motion, setMotion] = useState(false)
  const heroRef = useRef<HTMLElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { burst, colourWipe, layer } = useEffects()

  /* restore a returning visitor before the first paint, so there's no flash of the name step */
  useLayoutEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    // anything saved without the "Remember me" tick (older versions of the site) is removed
    if (load(KEY_REMEMBER) !== '1') { save(KEY_NAME, null); save(KEY_PERSONA, null) }
    else setRemember(true)
    const p = load(KEY_PERSONA) as PersonaId | null
    const n = load(KEY_NAME)
    if (n) { setName(n); setDraft(n) }
    if (p && personas.some((x) => x.id === p)) { setPersona(p); setReturning(true); setStep('done') }
    else if (n) { setReturning(true); setStep('done') } // remembered, but chose "Just looking around"
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [personas])

  /* scroll reveal */
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMotion(true)
    const els = root.querySelectorAll('.reveal')
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target) }
      }),
      { rootMargin: '0px 0px -10% 0px' },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  const current = personas.find((p) => p.id === persona) ?? null
  const mainPaths = MAIN_PATHS.flatMap((id) => personas.filter((p) => p.id === id))
  const heroHeadline = current?.headline ?? home.generalHeadline
  const heroLine = current?.line ?? home.generalLine
  const theme = current?.theme ?? DEFAULT_THEME
  const rawFirst = name.trim().split(/\s+/)[0] ?? ''
  const firstName = rawFirst.charAt(0).toLocaleUpperCase() + rawFirst.slice(1)

  function heroCentre() {
    const c = centreOf(heroRef.current)
    return { x: c.x, y: Math.min(c.y, window.innerHeight * 0.45) }
  }

  /* step 1 → 2: the name */
  function submitName(e: React.FormEvent) {
    e.preventDefault()
    const clean = draft.trim().slice(0, 40)
    const finish = () => {
      setName(clean)
      // saved only with consent; unticking removes anything saved before
      save(KEY_REMEMBER, remember ? '1' : null)
      save(KEY_NAME, remember ? clean || null : null)
      save(KEY_PERSONA, remember ? persona : null)
      setStep('done')
      if (clean) {
        const { x, y } = heroCentre()
        burst(x, y, [theme.c1, theme.c2, theme.c3, theme.accent], 56)
      }
    }
    if (!clean || prefersReducedMotion()) { finish(); return }
    setStep('loading')
    window.setTimeout(finish, 1100)
  }

  /* step 2 → 3: who they are. The page turns their colour. */
  function pick(id: PersonaId, from: Element | { x: number; y: number }) {
    const p = personas.find((x) => x.id === id)!
    const { x, y } = from instanceof Element ? centreOf(from) : from
    const apply = () => {
      setPersona(id)
      setReturning(false)
      if (load(KEY_REMEMBER) === '1') save(KEY_PERSONA, id)
      // first visit: ask for the name next; someone switching paths goes straight to their hero
      if (name) setStep('done')
      else { setStep('name'); window.setTimeout(() => inputRef.current?.focus(), 80) }
    }
    if (prefersReducedMotion()) { apply(); return }
    colourWipe(x, y, p.theme.c1, p.theme.c3, p.word)
    window.setTimeout(apply, 480)
    window.setTimeout(() => {
      const c = heroCentre()
      burst(c.x, c.y, [p.theme.c1, p.theme.c2, p.theme.c3, p.theme.accent], 48)
    }, 900)
  }

  function forget() {
    setPersona(null); setName(''); setDraft(''); setReturning(false); setStep('persona')
    save(KEY_PERSONA, null); save(KEY_NAME, null); save(KEY_REMEMBER, null); setRemember(false)
  }

  /* soft spotlight that follows the pointer across the hero */
  function onPointerMove(e: React.PointerEvent<HTMLElement>) {
    const el = heroRef.current
    if (!el || e.pointerType === 'touch') return
    const r = el.getBoundingClientRect()
    el.style.setProperty('--gx', `${Math.round(e.clientX - r.left)}px`)
    el.style.setProperty('--gy', `${Math.round(e.clientY - r.top)}px`)
    el.style.setProperty('--spot', '1')
    // -1..1 across the hero, for the photo's 3D tilt
    el.style.setProperty('--tx', (((e.clientX - r.left) / r.width) * 2 - 1).toFixed(3))
    el.style.setProperty('--ty', (((e.clientY - r.top) / r.height) * 2 - 1).toFixed(3))
  }
  function onPointerLeave() {
    const el = heroRef.current
    if (!el) return
    el.style.setProperty('--spot', '0')
    el.style.setProperty('--tx', '0')
    el.style.setProperty('--ty', '0')
  }

  const sortedEvents = useMemo(() => {
    if (!persona) return events
    return [...events].sort((a, b) => Number(b.for.includes(persona)) - Number(a.for.includes(persona)))
  }, [persona, events])

  const mailSubject = encodeURIComponent(
    stegaClean(`Hoi! ${firstName ? `I'm ${firstName}, ` : ''}${current ? `${current.chip}` : 'a question'}`),
  )

  return (
    <div ref={rootRef} data-motion={motion ? 'on' : 'off'} className="themed" style={themeVars(theme)}>
      {layer}
      <PointerEffects />
      <ScrollBoat />
      <Header active="home" />
      <HighlightCard highlight={highlight} afterSection="#programmes" />

      {/* ================= S4: fly through the logo window, first thing on landing ================= */}
      <LogoWindow intro title={home.introTitle} sub={home.introSub} />

      {/* ================= HERO ================= */}
      <section id="top" ref={heroRef} onPointerMove={onPointerMove} onPointerLeave={onPointerLeave}
        className={`hero relative isolate flex items-center ${step === 'persona' ? 'is-world' : 'min-h-[100svh]'}`}>
        <HeroBackdrop />
        <ParallaxShapes />
        <div className="spotlight pointer-events-none absolute inset-0 -z-10" aria-hidden="true" />

        {/* ---------- STEP 1: which path? The whole screen is the map ---------- */}
        {step === 'persona' && (
          <PathWorld paths={mainPaths} selected={persona} hint={home.pathHint} cursorLabel={home.cursorSail}
            onChoose={(id, from) => pick(id, from)}
            top={
              <div className="path-question rise" style={rise(0)}>
                <h1 className="flex items-center justify-center gap-[0.18em] font-black uppercase leading-[0.88] tracking-[-0.04em] text-ink"
                  style={{ fontSize: 'clamp(2rem, 4.2vw, 3.4rem)' }}>
                  Hoi! <WaveHand />
                </h1>
                <p id="path-question" className="mt-2 font-display text-lg font-semibold tracking-[-0.01em] text-ink sm:text-2xl">
                  {home.pathPrompt}
                </p>
              </div>
            }
            bottom={null} />
        )}

        {step !== 'persona' && (
        <div className="container-x py-20 sm:py-28 lg:py-32">
          <div className={step === 'done' ? 'w-full' : 'mx-auto flex max-w-5xl flex-col items-center text-center'} aria-live="polite">

            {/* ---------- STEP 2: the name (optional) ---------- */}
            {step === 'name' && (
              <form key="name" onSubmit={submitName} className="flex w-full flex-col items-center">
                <span className="hero-pill rise" style={rise(0)}>
                  <span className="pill-dot" aria-hidden="true" />{home.heroPill}
                </span>
                <h1 className="rise mt-8 flex items-center justify-center gap-[0.18em] font-black uppercase leading-[0.88] tracking-[-0.04em] text-ink"
                  style={{ ...rise(1), fontSize: 'clamp(3.4rem, 10vw, 8.5rem)' }}>
                  Hoi! <WaveHand />
                </h1>
                <label htmlFor="hoi-name" className="rise mt-6 font-display text-2xl font-semibold tracking-[-0.01em] text-ink sm:text-[2rem]" style={rise(2)}>
                  {home.namePrompt}
                </label>
                <div className="rise mt-10 w-full max-w-lg" style={rise(3)}>
                  <input
                    id="hoi-name"
                    ref={inputRef}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="Your first name"
                    autoComplete="given-name"
                    maxLength={40}
                    className="name-field w-full bg-transparent pb-3 text-center font-display text-[clamp(2rem,5.5vw,3.25rem)] font-bold tracking-[-0.02em] text-ink outline-none"
                  />
                  <span className="name-line" aria-hidden="true" />
                </div>
                <div className="rise mt-10" style={rise(4)}>
                  <button type="submit" className="btn-primary group h-14 px-8 text-base sm:text-lg">
                    {draft.trim() ? 'Let’s go' : 'Continue'}
                    <Arrow />
                  </button>
                </div>
                <label className="rise mt-6 inline-flex cursor-pointer items-center gap-2.5 text-left text-sm text-muted" style={rise(5)}>
                  <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="remember-box" />
                  <span>{home.rememberLabel}</span>
                </label>
              </form>
            )}

            {/* ---------- loading: setting sail ---------- */}
            {step === 'loading' && (
              <div key="loading" className="flex flex-col items-center" role="status">
                <div className="flex gap-2.5" aria-hidden="true">
                  <span className="dot h-3.5 w-3.5 rounded-full bg-accent" />
                  <span className="dot h-3.5 w-3.5 rounded-full bg-accent" />
                  <span className="dot h-3.5 w-3.5 rounded-full bg-accent" />
                </div>
                <p className="rise mt-8 font-display text-3xl font-bold tracking-[-0.02em] text-ink sm:text-4xl">
                  Setting sail, {draft.trim().split(/\s+/)[0]}…
                </p>
              </div>
            )}

            {/* ---------- STEP 3: their boarding pass to the harbour of ideas; the stub is the one thing to click ---------- */}
            {step === 'done' && (
              <div key={`done-${persona ?? 'all'}`} className="flex w-full flex-col items-center">
                <article className="ticket rise" style={rise(0)} aria-labelledby="ticket-title">
                  <div className="ticket-main">
                    <p className="ticket-kicker">
                      <span className="pill-dot" aria-hidden="true" />
                      {home.ticketLabel}
                    </p>
                    <h1 id="ticket-title" className="ticket-title">
                      {(() => {
                        const [a, b] = splitHeadline(heroHeadline)
                        return <>{a}{b && <> <span className="grad-text">{b}</span></>}</>
                      })()}
                    </h1>
                    <p className="ticket-line">
                      {firstName && returning && <span className="font-semibold text-ink">{`Welcome back, ${firstName}. `}</span>}
                      {heroLine}
                    </p>
                    <dl className="ticket-meta">
                      <div>
                        <dt>{home.ticketPassenger}</dt>
                        <dd>{firstName || home.ticketGuest}</dd>
                      </div>
                      <div>
                        <dt>{home.ticketRoute}</dt>
                        <dd>{current ? current.pathLabel : home.ticketOpenRoute}</dd>
                      </div>
                    </dl>
                  </div>

                  {current ? (
                    <a href="#programmes" className="ticket-stub group" data-cursor={home.cursorGo}>
                      <span className="ticket-stub-label">{current.cta}</span>
                      <span className="ticket-stub-go" aria-hidden="true"><Arrow /></span>
                      <span className="ticket-barcode" aria-hidden="true" />
                    </a>
                  ) : (
                    <button type="button" onClick={() => setStep('persona')} className="ticket-stub group" data-cursor={home.cursorGo}>
                      <span className="ticket-stub-label">{home.generalCta}</span>
                      <span className="ticket-stub-go" aria-hidden="true"><Arrow /></span>
                      <span className="ticket-barcode" aria-hidden="true" />
                    </button>
                  )}
                </article>

                <div className="rise mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm font-medium text-muted" style={rise(2)}>
                  {current && (
                    <button type="button" onClick={() => setStep('persona')}
                      className="underline decoration-line underline-offset-4 transition-colors hover:text-accent hover:decoration-accent">
                      I’m someone else
                    </button>
                  )}
                  {returning && (
                    <button type="button" onClick={forget}
                      className="underline decoration-line underline-offset-4 transition-colors hover:text-accent hover:decoration-accent">
                      {firstName ? `Not ${firstName}? Start over` : 'Start over'}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        )}
      </section>

      {/* ================= S1: the founder journey (programmes) ================= */}
      <FounderJourney persona={persona} />

      <ScienceBusiness />

      {/* ================= EVENTS: hoi's own next events, one element among many ================= */}
      <NextEvents events={sortedEvents} persona={persona} plural={current?.plural} />

      {/* ================= PEOPLE ================= */}
      <section id="about" className="container-x pt-28">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="reveal grid grid-cols-2 gap-4">
            {home.aboutPhotos.map((ph, i) => (
              <div key={i} className={`lift aspect-[3/4] overflow-hidden rounded-[1.4rem] ${i === 1 ? 'mt-12 bg-[#e3f9f5] text-teal-700' : 'bg-white text-muted'}`}>
                {ph ? (
                  <img src={`${ph.url}?w=600&h=800&fit=crop&auto=format`} alt={ph.alt} className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  <span className="flex h-full items-center justify-center p-4 text-center text-sm">
                    {i === 0 ? 'Photo: founder welcomed with flowers' : 'Photo: pitch at the whiteboard'}
                  </span>
                )}
              </div>
            ))}
          </div>
          <div className="reveal">
            <p className="eyebrow">{home.aboutEyebrow}</p>
            <blockquote className="mt-4 font-display text-3xl font-extrabold leading-tight sm:text-4xl">
              “{home.quote}”
            </blockquote>
            <p className="mt-5 text-muted">{home.quoteBy}</p>
            <a href="#contact" className="mt-7 inline-block font-semibold text-accent hover:underline">{home.aboutLinkText} →</a>
          </div>
        </div>
      </section>

      {/* ================= PARTNERS ================= */}
      <section className="pt-28">
        <p className="reveal container-x text-center text-xs font-bold uppercase tracking-[0.14em] text-muted">
          {home.partnersTitle}
        </p>
        <div className="marquee-mask mt-8 overflow-hidden" aria-label="Partners">
          <ul className="animate-marquee flex w-max gap-4">
            {[...partners, ...partners].map((p, i) => {
              const inner = p.logoUrl
                ? <img src={`${p.logoUrl}?h=96&fit=max&auto=format`} alt={p.name} className="max-h-10 w-auto max-w-[160px] object-contain" loading="lazy" />
                : p.name
              const copy = i >= partners.length
              return (
                <li key={i} aria-hidden={copy}
                  className="flex h-20 min-w-[220px] items-center justify-center rounded-2xl border border-line px-6 text-sm font-semibold text-muted">
                  {p.href
                    ? <a href={p.href} target="_blank" rel="noopener noreferrer" tabIndex={copy ? -1 : undefined} className="flex items-center hover:text-ink">{inner}</a>
                    : inner}
                </li>
              )
            })}
          </ul>
        </div>
      </section>

      {/* ================= CONTACT ================= */}
      <section id="contact" className="container-x pt-28" data-no-highlight>
        <div className="contact-card reveal grid items-center gap-10 rounded-[2rem] p-8 text-white sm:p-14 lg:grid-cols-2">
          <DotField />
          <div className="relative">
            <h2 key={`c-${firstName}`} className="swap-in font-black uppercase leading-none"
              style={fit(firstName ? `Hoi ${firstName}, we’re listening.` : home.contactTitle, 'clamp(2.1rem, 5vw, 3.75rem)', '7rem')}>
              {firstName ? `Hoi ${firstName}, we’re listening.` : home.contactTitle}
            </h2>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-white/80">
              {current
                ? `Tell us about yourself. We talk to ${current.plural} every week and love hearing new ideas.`
                : home.contactText}
            </p>
            <a href={`mailto:${settings.email}?subject=${mailSubject}`} data-magnetic
              className="mt-8 inline-flex min-h-12 items-center rounded-full bg-accent px-7 font-semibold transition hover:-translate-y-0.5 hover:brightness-110">
              {home.contactButton}
            </a>
          </div>
          <div className="relative grid grid-cols-2 gap-5">
            {team.slice(0, 4).map((t) => (
              <div key={t.name}>
                {t.photoUrl
                  ? <img src={`${t.photoUrl}?w=400&h=400&fit=crop&auto=format`} alt={t.photoAlt || t.name} className="aspect-square w-full rounded-2xl object-cover" loading="lazy" />
                  : <div className="flex aspect-square items-center justify-center rounded-2xl bg-white/10 text-sm text-white/60">Photo</div>}
                <p className="mt-3 font-semibold">{t.name}</p>
                <p className="text-sm text-white/65">{t.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer onReset={persona || name ? forget : undefined} />
    </div>
  )
}
