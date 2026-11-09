'use client'

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { DEFAULT_THEME, events, partners, personas, programmes, type PersonaId } from './data'
import { centreOf, prefersReducedMotion, useEffects } from './effects'
import { HeroBackdrop } from './Backdrop'

type Step = 'name' | 'loading' | 'persona' | 'done'

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

export function HoiHome() {
  const [persona, setPersona] = useState<PersonaId | null>(null)
  const [name, setName] = useState('')
  const [draft, setDraft] = useState('')
  const [step, setStep] = useState<Step>('name')
  const [returning, setReturning] = useState(false)
  const [motion, setMotion] = useState(false)
  const heroRef = useRef<HTMLDivElement>(null)
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
        burst(x, y, ['#ffffff', theme.c1, theme.c2, theme.c3, '#2ceccd'], 56)
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
      burst(c.x, c.y, ['#ffffff', p.theme.c1, p.theme.c2, p.theme.c3], 48)
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

  /* glow follows the pointer across the hero */
  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const el = heroRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    el.style.setProperty('--gx', `${((e.clientX - r.left) / r.width) * 100}%`)
    el.style.setProperty('--gy', `${((e.clientY - r.top) / r.height) * 100}%`)
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
      <header className="sticky top-0 z-50 border-b border-line/70 bg-white/85 backdrop-blur-md">
        <div className="container-x flex flex-wrap items-center justify-between gap-4 py-3.5">
          <a href="#top" aria-label="hoi startup factory, to the top">
            <img src="/logo.png" alt="hoi startup factory" className="h-9 w-auto" />
          </a>
          <nav aria-label="Main" className="flex flex-wrap items-center gap-x-7 gap-y-2 text-[15px] font-semibold">
            <a href="#events" className="hover:text-accent">Events</a>
            <a href="#programmes" className="hidden hover:text-accent sm:inline">Programmes</a>
            <a href="#about" className="hidden hover:text-accent sm:inline">About</a>
            <span className="flex gap-1 rounded-full border border-line p-1 text-xs">
              <button type="button" className="rounded-full px-2.5 py-1.5 text-muted hover:text-ink">DE</button>
              <button type="button" aria-pressed="true" className="rounded-full bg-ink px-2.5 py-1.5 text-white">EN</button>
            </span>
            <a href="#contact"
              className="rounded-full bg-accent px-5 py-2.5 text-white transition hover:-translate-y-0.5 hover:brightness-110">
              Say hoi
            </a>
          </nav>
        </div>
      </header>

      {/* ================= HERO ================= */}
      <section id="top" className="relative isolate pt-5">
        <HeroBackdrop />
        <div className="container-x">
        <div
          ref={heroRef}
          onPointerMove={onPointerMove}
          className="hero-bg relative flex min-h-[min(720px,88vh)] items-center justify-center overflow-hidden rounded-[2rem] px-5 py-16 text-center text-white sm:px-12"
        >
          <div className="hero-glow pointer-events-none absolute inset-0" aria-hidden="true" />
          <svg className="rings pointer-events-none absolute -right-40 -top-32 h-[560px] w-[560px] opacity-20"
            viewBox="0 0 520 520" fill="none" stroke="white" strokeWidth="2" aria-hidden="true">
            <circle cx="260" cy="260" r="250" /><circle cx="260" cy="260" r="185" strokeDasharray="6 14" />
            <circle cx="260" cy="260" r="120" /><circle cx="260" cy="10" r="9" fill="white" />
          </svg>
          <svg className="rings pointer-events-none absolute -bottom-48 -left-40 h-[420px] w-[420px] opacity-15 [animation-direction:reverse]"
            viewBox="0 0 520 520" fill="none" stroke="white" strokeWidth="2" aria-hidden="true">
            <circle cx="260" cy="260" r="250" strokeDasharray="4 18" /><circle cx="260" cy="260" r="160" />
          </svg>

          <div className="relative mx-auto w-full max-w-5xl" aria-live="polite">
            {/* ---------- STEP 1: the name, centre stage ---------- */}
            {step === 'name' && (
              <form key="name" onSubmit={submitName} className="step-in flex flex-col items-center">
                <span className="pill border border-white/50">Im Norden gründen – mit Rückenwind!</span>
                <h1 className="mt-8 flex items-center justify-center gap-3 text-[clamp(3.2rem,9vw,7.5rem)] font-black uppercase leading-[0.9] tracking-[-0.02em]">
                  Hoi! <WaveHand />
                </h1>
                <label htmlFor="hoi-name" className="mt-5 font-display text-2xl font-bold sm:text-4xl">
                  What should we call you?
                </label>
                <input
                  id="hoi-name"
                  ref={inputRef}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Your first name"
                  autoComplete="given-name"
                  maxLength={40}
                  className="name-input mt-8 w-full max-w-xl border-b-4 border-white/60 bg-transparent pb-3 text-center font-display text-[clamp(2.2rem,6vw,4rem)] font-extrabold outline-none transition focus:border-white"
                />
                <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
                  <button type="submit"
                    className="group inline-flex min-h-14 items-center gap-2 rounded-full bg-white px-8 text-lg font-bold text-accent shadow-xl shadow-black/15 transition hover:-translate-y-0.5 hover:shadow-2xl">
                    {draft.trim() ? 'Let’s go' : 'Continue'}
                    <span className="transition group-hover:translate-x-1" aria-hidden="true">→</span>
                  </button>
                </div>
                <p className="mt-5 text-sm text-white/75">Optional. Only saved in your browser, so we can greet you next time.</p>
              </form>
            )}

            {/* ---------- loading: setting sail ---------- */}
            {step === 'loading' && (
              <div key="loading" className="step-in flex flex-col items-center" role="status">
                <div className="flex gap-3" aria-hidden="true">
                  <span className="dot h-5 w-5 rounded-full bg-white" />
                  <span className="dot h-5 w-5 rounded-full bg-white" />
                  <span className="dot h-5 w-5 rounded-full bg-white" />
                </div>
                <p className="mt-8 font-display text-3xl font-extrabold sm:text-4xl">Setting sail, {draft.trim().split(/\s+/)[0]}…</p>
              </div>
            )}

            {/* ---------- STEP 2: who are you? ---------- */}
            {step === 'persona' && (
              <div key="persona" className="step-in flex flex-col items-center">
                <h1 className="text-[clamp(3rem,8.5vw,7rem)] font-black uppercase leading-[0.92] tracking-[-0.02em]">
                  {firstName ? (
                    <span aria-label={`Hoi, ${firstName}!`}>
                      {Array.from(`Hoi, ${firstName}!`).map((ch, i) => (
                        <span key={i} aria-hidden="true" className="pop" style={{ animationDelay: `${0.04 * i}s` }}>
                          {ch === ' ' ? ' ' : ch}
                        </span>
                      ))}
                    </span>
                  ) : 'Hoi!'}
                </h1>
                <p id="who" className="mt-6 font-display text-2xl font-bold sm:text-4xl">
                  {firstName ? 'Nice to meet you. So, you’re…' : 'Tell us who you are. You’re…'}
                </p>
                <div role="group" aria-labelledby="who" className="mt-9 flex max-w-4xl flex-wrap justify-center gap-3">
                  {personas.map((p, i) => (
                    <button key={p.id} type="button" onClick={(e) => pick(p.id, e)}
                      className="step-in min-h-14 rounded-full border-2 border-white/55 bg-white/10 px-6 text-lg font-semibold backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:scale-105 hover:border-white hover:bg-white hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                      style={{ animationDelay: `${0.35 + i * 0.07}s` }}>
                      {p.chip}
                    </button>
                  ))}
                </div>
                <button type="button" onClick={editName} className="mt-8 text-sm text-white/75 underline underline-offset-4 hover:text-white">
                  {firstName ? `Not ${firstName}? Change your name` : 'Add your name'}
                </button>
              </div>
            )}

            {/* ---------- STEP 3: their page ---------- */}
            {step === 'done' && current && (
              <div key={`done-${persona}`} className="step-in flex flex-col items-center">
                {returning ? (
                  <span className="pill border border-white/50">Welcome back{firstName ? `, ${firstName}` : ''}</span>
                ) : (
                  <span className="pill border border-white/50">For {current.plural}</span>
                )}
                <p className="mt-7 flex items-center gap-2 font-display text-2xl font-extrabold sm:text-3xl">
                  Hoi{firstName ? `, ${firstName}` : ''}! <WaveHand />
                </p>
                <h1 className="mt-4 max-w-5xl text-[clamp(2.6rem,6.6vw,5.8rem)] font-black uppercase leading-[0.95] tracking-[-0.02em] text-balance">
                  {current.headline}
                </h1>
                <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/90 sm:text-xl">{current.line}</p>
                <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                  <a href="#events"
                    className="group inline-flex min-h-14 items-center gap-2 rounded-full bg-white px-8 text-lg font-bold text-accent shadow-xl shadow-black/15 transition hover:-translate-y-0.5">
                    {current.cta}
                    <span className="transition group-hover:translate-x-1" aria-hidden="true">→</span>
                  </a>
                  <button type="button" onClick={() => setStep('persona')}
                    className="inline-flex min-h-14 items-center rounded-full border-2 border-white/60 px-7 font-semibold transition hover:bg-white/15">
                    I’m someone else
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        </div>
      </section>

      {/* ================= EVENTS ================= */}
      <section id="events" className="container-x pt-28">
        <div className="reveal mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">What’s on</p>
            <h2 key={persona ?? 'all'} className="swap-in mt-2 text-4xl font-black uppercase leading-none sm:text-6xl">
              {current ? `Next up for ${current.plural}` : 'Next up at hoi'}
            </h2>
          </div>
          <a href="#events" className="font-semibold text-accent hover:underline">See all events →</a>
        </div>

        <div className="reveal grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {sortedEvents.map((ev) => {
            const match = persona ? ev.for.includes(persona) : true
            return (
              <article key={ev.id}
                className={`lift relative flex min-h-[380px] flex-col rounded-[1.4rem] p-6 text-white ${match ? '' : 'opacity-55 saturate-50'}`}
                style={{ background: ev.gradient }}>
                <div className="flex items-start justify-between gap-3">
                  <span className="rounded-md border-[1.5px] border-white/80 px-2.5 py-1 text-sm font-bold">{ev.partner}</span>
                  {persona && match && (
                    <span className="swap-in rounded-full bg-white px-2.5 py-1 text-xs font-bold text-ink">Picked for you</span>
                  )}
                </div>
                <span className="pill mt-auto self-start">{ev.label}</span>
                <h3 lang="de" className="mt-3 text-[clamp(1.45rem,2.1vw,1.85rem)] font-extrabold uppercase leading-none hyphens-auto">{ev.title}</h3>
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
          <h2 className="mt-2 max-w-3xl text-4xl font-black uppercase leading-none sm:text-6xl">From lab idea to company</h2>
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
            <h2 key={`c-${firstName}`} className="swap-in text-4xl font-black uppercase leading-none sm:text-6xl">
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
