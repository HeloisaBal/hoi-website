'use client'

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { DEFAULT_THEME, events, partners, personas, programmes, type PersonaId } from './data'
import { centreOf, prefersReducedMotion, useEffects } from './effects'
import { HeroBackdrop } from './Backdrop'

type Step = 'name' | 'loading' | 'persona' | 'done'

/**
 * Font size for a big uppercase heading: the design size (`max`), but never
 * bigger than what lets its longest word fit the screen. `gutter` is the
 * horizontal space taken by padding around the heading.
 */
function fit(text: string, max: string, gutter: string): React.CSSProperties {
  const longest = Math.max(4, ...text.split(/\s+/).map((w) => w.length))
  return { fontSize: `min(${max}, calc((100vw - ${gutter}) / ${(longest * 0.8).toFixed(2)}))` }
}

/* ------------------------------------------------------------
   Remembering the visitor. Stored only in their own browser.
   ------------------------------------------------------------ */
const KEY_PERSONA = 'hoi.persona'
const KEY_NAME = 'hoi.name'

function load(key: string) {
  try { return window.localStorage.getItem(key) } catch { return null }
}
function save(key: string, value: string | null) {
  try {
    if (value) window.localStorage.setItem(key, value)
    else window.localStorage.removeItem(key)
  } catch { /* private mode etc. — personalisation just won't persist */ }
}

function WaveHand() {
  return (
    <svg viewBox="0 0 24 24" className="wave h-[0.9em] w-[0.9em]" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 11V6a2 2 0 0 0-4 0v1M14 10V4a2 2 0 0 0-4 0v2M10 10.5V6a2 2 0 0 0-4 0v8" />
      <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.9-6-2.4l-3.6-3.6a2 2 0 0 1 2.8-2.8L7 15" />
    </svg>
  )
}

/** Animation delay for the staggered fade-up on entry. */
function rise(i: number): React.CSSProperties {
  return { animationDelay: `${(0.08 * i).toFixed(2)}s` }
}

/** Split a headline so its second half can carry the brand gradient. */
function splitHeadline(text: string): [string, string] {
  const m = text.match(/^(.+?[.?!])\s+(.+)$/)
  if (m) return [m[1], m[2]]
  const words = text.split(' ')
  if (words.length < 4) return [text, '']
  return [words.slice(0, -2).join(' '), words.slice(-2).join(' ')]
}

function Arrow() {
  return (
    <svg viewBox="0 0 20 20" className="h-[1.05em] w-[1.05em] transition-transform duration-300 ease-out group-hover:translate-x-1" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 10h12M11 5l5 5-5 5" />
    </svg>
  )
}

export function HoiHome() {
  const [persona, setPersona] = useState<PersonaId | null>(null)
  const [name, setName] = useState('')
  const [draft, setDraft] = useState('')
  const [step, setStep] = useState<Step>('name')
  const [returning, setReturning] = useState(false)
  const [motion, setMotion] = useState(false)
  const heroRef = useRef<HTMLElement>(null)
  const [scrolled, setScrolled] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { burst, colourWipe, layer } = useEffects()

  /* restore a returning visitor before the first paint, so there's no flash of the name step */
  useLayoutEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    const p = load(KEY_PERSONA) as PersonaId | null
    const n = load(KEY_NAME)
    if (n) { setName(n); setDraft(n) }
    if (p && personas.some((x) => x.id === p)) { setPersona(p); setReturning(true); setStep('done') }
    else if (n) setStep('persona')
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [])

  /* header: transparent over the hero, solid once you scroll */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

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
  const theme = current?.theme ?? DEFAULT_THEME
  const firstName = name.trim().split(/\s+/)[0] ?? ''

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
      save(KEY_NAME, clean || null)
      setStep('persona')
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
  function pick(id: PersonaId, e: React.MouseEvent<HTMLButtonElement>) {
    const p = personas.find((x) => x.id === id)!
    const { x, y } = centreOf(e.currentTarget)
    const apply = () => {
      setPersona(id)
      setReturning(false)
      save(KEY_PERSONA, id)
      setStep('done')
    }
    if (prefersReducedMotion()) { apply(); return }
    colourWipe(x, y, p.theme.c1, p.theme.c3, p.word)
    window.setTimeout(apply, 480)
    window.setTimeout(() => {
      const c = heroCentre()
      burst(c.x, c.y, [p.theme.c1, p.theme.c2, p.theme.c3, p.theme.accent], 48)
    }, 900)
  }

  function editName() {
    setDraft(name)
    setStep('name')
    window.setTimeout(() => inputRef.current?.focus(), 50)
  }

  function forget() {
    setPersona(null); setName(''); setDraft(''); setReturning(false); setStep('name')
    save(KEY_PERSONA, null); save(KEY_NAME, null)
  }

  /* soft spotlight that follows the pointer across the hero */
  function onPointerMove(e: React.PointerEvent<HTMLElement>) {
    const el = heroRef.current
    if (!el || e.pointerType === 'touch') return
    const r = el.getBoundingClientRect()
    el.style.setProperty('--gx', `${Math.round(e.clientX - r.left)}px`)
    el.style.setProperty('--gy', `${Math.round(e.clientY - r.top)}px`)
    el.style.setProperty('--spot', '1')
  }
  function onPointerLeave() {
    heroRef.current?.style.setProperty('--spot', '0')
  }

  const sortedEvents = useMemo(() => {
    if (!persona) return events
    return [...events].sort((a, b) => Number(b.for.includes(persona)) - Number(a.for.includes(persona)))
  }, [persona])

  const sortedProgrammes = useMemo(() => {
    if (!persona) return programmes
    return [...programmes].sort((a, b) => Number(b.for.includes(persona)) - Number(a.for.includes(persona)))
  }, [persona])

  const mailSubject = encodeURIComponent(
    `Hoi! ${firstName ? `I'm ${firstName}, ` : ''}${current ? `${current.chip}` : 'a question'}`,
  )

  const themeVars = {
    ['--c1' as string]: theme.c1, ['--c2' as string]: theme.c2, ['--c3' as string]: theme.c3,
    ['--accent' as string]: theme.accent, ['--tint' as string]: theme.tint,
  } as React.CSSProperties

  return (
    <div ref={rootRef} data-motion={motion ? 'on' : 'off'} className="themed" style={themeVars}>
      {layer}
      {/* ================= HEADER ================= */}
      <header className={`site-header sticky top-0 z-50 ${scrolled ? 'is-scrolled' : ''}`}>
        <div className="container-x flex h-16 items-center justify-between gap-3 sm:h-[72px]">
          <a href="#top" aria-label="hoi startup factory, to the top" className="shrink-0">
            <img src="/logo.png" alt="hoi startup factory" className="h-8 w-auto sm:h-9" />
          </a>
          <nav aria-label="Main" className="flex items-center gap-2 text-[15px] font-medium sm:gap-1">
            <a href="#events" className="nav-link hidden sm:inline-flex">Events</a>
            <a href="#programmes" className="nav-link hidden sm:inline-flex">Programmes</a>
            <a href="#about" className="nav-link hidden sm:inline-flex">About</a>
            <span className="mx-1 flex gap-0.5 rounded-full border border-line bg-white/70 p-1 text-xs font-semibold sm:mx-3">
              <button type="button" className="rounded-full px-2.5 py-1 text-muted transition-colors hover:text-ink">DE</button>
              <button type="button" aria-pressed="true" className="rounded-full bg-ink px-2.5 py-1 text-white">EN</button>
            </span>
            <a href="#contact" className="btn-primary h-10 px-4 text-sm sm:px-5">Say hoi</a>
          </nav>
        </div>
      </header>

      {/* ================= HERO ================= */}
      <section id="top" ref={heroRef} onPointerMove={onPointerMove} onPointerLeave={onPointerLeave}
        className="hero relative isolate -mt-16 flex min-h-[100svh] items-center pt-16 sm:-mt-[72px] sm:pt-[72px]">
        <HeroBackdrop />
        <div className="spotlight pointer-events-none absolute inset-0 -z-10" aria-hidden="true" />

        <div className="container-x py-20 sm:py-28 lg:py-32">
          <div className="mx-auto flex max-w-5xl flex-col items-center text-center" aria-live="polite">

            {/* ---------- STEP 1: the name ---------- */}
            {step === 'name' && (
              <form key="name" onSubmit={submitName} className="flex w-full flex-col items-center">
                <span className="hero-pill rise" style={rise(0)}>
                  <span className="pill-dot" aria-hidden="true" />Im Norden gründen – mit Rückenwind!
                </span>
                <h1 className="rise mt-8 flex items-center justify-center gap-[0.18em] font-black uppercase leading-[0.88] tracking-[-0.04em] text-ink"
                  style={{ ...rise(1), fontSize: 'clamp(3.4rem, 10vw, 8.5rem)' }}>
                  Hoi! <WaveHand />
                </h1>
                <label htmlFor="hoi-name" className="rise mt-6 font-display text-2xl font-semibold tracking-[-0.01em] text-ink sm:text-[2rem]" style={rise(2)}>
                  What should we call you?
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
                <p className="rise mt-5 text-sm text-muted" style={rise(5)}>Optional. Only saved in your browser, so we can greet you next time.</p>
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

            {/* ---------- STEP 2: who are you? ---------- */}
            {step === 'persona' && (
              <div key="persona" className="flex flex-col items-center">
                <h1 className="font-black uppercase leading-[0.9] tracking-[-0.04em] text-ink"
                  style={fit(`Hoi, ${firstName}!`, 'clamp(3rem, 9vw, 7.5rem)', '2.75rem')}>
                  {firstName ? (
                    <span aria-label={`Hoi, ${firstName}!`}>
                      {['Hoi,', `${firstName}!`].map((word, w) => (
                        <span key={w} aria-hidden="true" className={`inline-block whitespace-nowrap ${w > 0 ? 'text-accent' : ''}`}>
                          {w > 0 && <span className="inline-block w-[0.26em]" />}
                          {Array.from(word).map((ch, i) => (
                            <span key={i} className="pop" style={{ animationDelay: `${0.035 * (i + w * 5)}s` }}>{ch}</span>
                          ))}
                        </span>
                      ))}
                    </span>
                  ) : <span className="rise inline-block">Hoi!</span>}
                </h1>
                <p id="who" className="rise mt-6 text-xl font-medium text-muted sm:text-2xl" style={rise(3)}>
                  {firstName ? 'Nice to meet you. So, you’re…' : 'Tell us who you are. You’re…'}
                </p>
                <div role="group" aria-labelledby="who" className="mt-10 flex max-w-3xl flex-wrap justify-center gap-2.5 sm:gap-3">
                  {personas.map((p, i) => (
                    <button key={p.id} type="button" onClick={(e) => pick(p.id, e)}
                      className="chip rise" style={rise(4 + i * 0.6)}>
                      {p.chip}
                    </button>
                  ))}
                </div>
                <button type="button" onClick={editName} className="rise mt-10 text-sm font-medium text-muted underline decoration-line underline-offset-4 transition-colors hover:text-accent hover:decoration-accent" style={rise(8)}>
                  {firstName ? `Not ${firstName}? Change your name` : 'Add your name'}
                </button>
              </div>
            )}

            {/* ---------- STEP 3: their page ---------- */}
            {step === 'done' && current && (
              <div key={`done-${persona}`} className="flex flex-col items-center">
                <span className="hero-pill rise" style={rise(0)}>
                  <span className="pill-dot" aria-hidden="true" />
                  {returning ? `Welcome back${firstName ? `, ${firstName}` : ''}` : `For ${current.plural}`}
                </span>
                <p className="rise mt-8 flex items-center gap-2 font-display text-xl font-semibold tracking-[-0.01em] text-ink sm:text-2xl" style={rise(1)}>
                  Hoi{firstName ? `, ${firstName}` : ''}! <span className="text-accent"><WaveHand /></span>
                </p>
                <h1 className="rise mt-5 max-w-5xl font-black uppercase leading-[0.9] tracking-[-0.04em] text-ink text-balance"
                  style={{ ...rise(2), ...fit(current.headline, 'clamp(2.5rem, 7vw, 6.25rem)', '2.75rem') }}>
                  {(() => {
                    const [a, b] = splitHeadline(current.headline)
                    return <>{a}{b && <> <span className="grad-text">{b}</span></>}</>
                  })()}
                </h1>
                <p className="rise mt-7 max-w-xl text-lg leading-relaxed text-muted sm:text-xl" style={rise(3)}>{current.line}</p>
                <div className="rise mt-11 flex flex-wrap items-center justify-center gap-3 sm:gap-4" style={rise(4)}>
                  <a href="#events" className="btn-primary group h-14 px-7 text-base sm:text-lg">
                    {current.cta}
                    <Arrow />
                  </a>
                  <button type="button" onClick={() => setStep('persona')} className="btn-secondary h-14 px-7 text-base">
                    I’m someone else
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ================= EVENTS ================= */}
      <section id="events" className="container-x pt-6 sm:pt-10">
        <div className="reveal mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">What’s on</p>
            <h2 key={persona ?? 'all'} className="swap-in mt-2 font-black uppercase leading-none"
              style={fit(current ? `Next up for ${current.plural}` : 'Next up at hoi', 'clamp(2.1rem, 5vw, 3.75rem)', '2.75rem')}>
              {current ? `Next up for ${current.plural}` : 'Next up at hoi'}
            </h2>
          </div>
          <a href="#events" className="font-semibold text-accent hover:underline">See all events →</a>
          <p className="w-full text-sm text-muted sm:hidden" aria-hidden="true">Swipe to see more →</p>
        </div>

        <div className="reveal no-scrollbar -mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-5 px-5 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4">
          {sortedEvents.map((ev) => {
            const match = persona ? ev.for.includes(persona) : true
            return (
              <article key={ev.id}
                className={`lift relative flex min-h-[320px] w-[80%] shrink-0 snap-start flex-col rounded-[1.4rem] p-6 text-white sm:min-h-[380px] sm:w-auto ${match ? '' : 'opacity-55 saturate-50'}`}
                style={{ background: ev.gradient }}>
                <div className="flex items-start justify-between gap-3">
                  <span className="rounded-md border-[1.5px] border-white/80 px-2.5 py-1 text-sm font-bold">{ev.partner}</span>
                  {persona && match && (
                    <span className="swap-in shrink-0 whitespace-nowrap rounded-full bg-white px-2.5 py-1 text-xs font-bold text-ink">Picked for you</span>
                  )}
                </div>
                <span className="pill mt-auto self-start">{ev.label}</span>
                <h3 lang="de" className="mt-3 text-[clamp(1.45rem,2.1vw,1.85rem)] font-extrabold uppercase leading-none hyphens-manual">{ev.title}</h3>
                <p className="mt-5 text-sm leading-relaxed text-white/90">
                  {ev.meta.map((m) => <span key={m} className="block">{m}</span>)}
                </p>
              </article>
            )
          })}
        </div>
      </section>

      {/* ================= PROGRAMMES ================= */}
      <section id="programmes" className="container-x pt-28">
        <div className="reveal">
          <p className="eyebrow">What we do</p>
          <h2 className="mt-2 max-w-3xl font-black uppercase leading-none" style={fit('From lab idea to company', 'clamp(2.1rem, 5vw, 3.75rem)', '2.75rem')}>From lab idea to company</h2>
        </div>
        <div className="reveal mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {sortedProgrammes.map((p) => {
            const match = persona ? p.for.includes(persona) : false
            return (
              <a key={p.id} href="#contact"
                className={`lift group block rounded-[1.4rem] border-2 p-7 ${match ? 'border-accent bg-white shadow-xl shadow-black/5' : 'border-line bg-white/60'}`}>
                <div className="flex items-center justify-between">
                  <span className="block h-2 w-12 rounded-full" style={{ background: p.color }} />
                  {match && <span className="swap-in text-xs font-bold uppercase tracking-wider text-accent">For you</span>}
                </div>
                <h3 className="mt-6 text-2xl font-extrabold leading-tight">{p.title}</h3>
                <p className="mt-3 leading-relaxed text-muted">{p.text}</p>
                <span className="mt-6 inline-block font-semibold text-accent transition group-hover:translate-x-1">Learn more →</span>
              </a>
            )
          })}
        </div>
      </section>

      {/* ================= PEOPLE ================= */}
      <section id="about" className="container-x pt-28">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="reveal grid grid-cols-2 gap-4">
            <div className="lift flex aspect-[3/4] items-center justify-center rounded-[1.4rem] bg-white p-4 text-center text-sm text-muted">
              Photo from Hoi’s Instagram:<br />founder welcomed with flowers
            </div>
            <div className="lift mt-12 flex aspect-[3/4] items-center justify-center rounded-[1.4rem] bg-[#e3f9f5] p-4 text-center text-sm text-teal-700">
              Photo from Hoi’s Instagram:<br />pitch at the whiteboard
            </div>
          </div>
          <div className="reveal">
            <p className="eyebrow">Founders at hoi</p>
            <blockquote className="mt-4 font-display text-3xl font-extrabold leading-tight sm:text-4xl">
              “A quote from one of the founders hoi supports goes here.”
            </blockquote>
            <p className="mt-5 text-muted">Name · Startup · Programme</p>
            <a href="#contact" className="mt-7 inline-block font-semibold text-accent hover:underline">Meet our startups →</a>
          </div>
        </div>
      </section>

      {/* ================= PARTNERS ================= */}
      <section className="pt-28">
        <p className="reveal container-x text-center text-xs font-bold uppercase tracking-[0.14em] text-muted">
          Backed by science and business in the Northwest
        </p>
        <div className="marquee-mask mt-8 overflow-hidden" aria-label="Partners">
          <ul className="animate-marquee flex w-max gap-4">
            {[...partners, ...partners].map((p, i) => (
              <li key={i} aria-hidden={i >= partners.length}
                className="flex h-20 min-w-[220px] items-center justify-center rounded-2xl border border-line px-6 text-sm font-semibold text-muted">
                {p}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ================= CONTACT ================= */}
      <section id="contact" className="container-x pt-28">
        <div className="reveal grid items-center gap-10 rounded-[2rem] p-8 text-white sm:p-14 lg:grid-cols-2" style={{ background: 'linear-gradient(135deg, #170a2b 35%, var(--c3))' }}>
          <div>
            <h2 key={`c-${firstName}`} className="swap-in font-black uppercase leading-none"
              style={fit(firstName ? `Hoi ${firstName}, we’re listening.` : 'Hoi cares. Say hoi.', 'clamp(2.1rem, 5vw, 3.75rem)', '7rem')}>
              {firstName ? `Hoi ${firstName}, we’re listening.` : 'Hoi cares. Say hoi.'}
            </h2>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-white/80">
              {current
                ? `Tell us about yourself. We talk to ${current.plural} every week and love hearing new ideas.`
                : 'Got an idea, a question or a startup? We’d love to hear from you.'}
            </p>
            <a href={`mailto:team@hoi-startup-factory.de?subject=${mailSubject}`}
              className="mt-8 inline-flex min-h-12 items-center rounded-full bg-accent px-7 font-semibold transition hover:-translate-y-0.5 hover:brightness-110">
              Get in touch
            </a>
          </div>
          <div className="grid grid-cols-2 gap-5">
            {[{ n: 'Sarah Fraikue', r: 'Co-CEO' }, { n: 'Arne Stehnken', r: 'Co-CEO' }].map((t) => (
              <div key={t.n}>
                <div className="flex aspect-square items-center justify-center rounded-2xl bg-white/10 text-sm text-white/60">Photo</div>
                <p className="mt-3 font-semibold">{t.n}</p>
                <p className="text-sm text-white/65">{t.r}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="container-x flex flex-wrap items-center justify-between gap-6 py-14 text-sm text-muted">
        <div className="flex items-center gap-5">
          <img src="/logo.png" alt="" className="h-7 w-auto" />
          <span>Arberger Hafendamm 1 · 28309 Bremen</span>
        </div>
        <div className="flex flex-wrap gap-6">
          <a href="https://www.instagram.com/hoi_startup_factory/" className="hover:text-ink">Instagram</a>
          <a href="https://www.linkedin.com/company/hoi-startup-factory/" className="hover:text-ink">LinkedIn</a>
          <a href="#" className="hover:text-ink">Impressum</a>
          <a href="#" className="hover:text-ink">Datenschutz</a>
          {(persona || name) && (
            <button type="button" onClick={forget} className="hover:text-ink">Reset personalisation</button>
          )}
        </div>
      </footer>
    </div>
  )
}
