'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { events, partners, personas, programmes, type PersonaId } from './data'

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

const DEFAULT_HEADLINE = 'Im Norden gründen – mit Rückenwind!'

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
  const [returning, setReturning] = useState(false)
  const [motion, setMotion] = useState(false)
  const heroRef = useRef<HTMLDivElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  /* restore a returning visitor (after hydration, so server and client HTML match) */
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    const p = load(KEY_PERSONA) as PersonaId | null
    const n = load(KEY_NAME)
    if (p && personas.some((x) => x.id === p)) { setPersona(p); setReturning(true) }
    if (n) setName(n)
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
  const firstName = name.trim().split(/\s+/)[0] ?? ''

  function pick(id: PersonaId) {
    const next = persona === id ? null : id
    setPersona(next)
    setReturning(false)
    save(KEY_PERSONA, next)
  }

  function changeName(v: string) {
    const clean = v.slice(0, 40)
    setName(clean)
    save(KEY_NAME, clean.trim() || null)
  }

  function forget() {
    setPersona(null); setName(''); setReturning(false)
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

  return (
    <div ref={rootRef} data-motion={motion ? 'on' : 'off'}>
      {/* ================= HEADER ================= */}
      <header className="sticky top-0 z-50 border-b border-line/70 bg-white/85 backdrop-blur-md">
        <div className="container-x flex flex-wrap items-center justify-between gap-4 py-3.5">
          <a href="#top" aria-label="hoi startup factory, to the top">
            <img src="/logo.png" alt="hoi startup factory" className="h-9 w-auto" />
          </a>
          <nav aria-label="Main" className="flex flex-wrap items-center gap-x-7 gap-y-2 text-[15px] font-semibold">
            <a href="#events" className="hover:text-brand-500">Events</a>
            <a href="#programmes" className="hidden hover:text-brand-500 sm:inline">Programmes</a>
            <a href="#about" className="hidden hover:text-brand-500 sm:inline">About</a>
            <span className="flex gap-1 rounded-full border border-line p-1 text-xs">
              <button type="button" className="rounded-full px-2.5 py-1.5 text-muted hover:text-ink">DE</button>
              <button type="button" aria-pressed="true" className="rounded-full bg-ink px-2.5 py-1.5 text-white">EN</button>
            </span>
            <a href="#contact"
              className="rounded-full bg-brand-500 px-5 py-2.5 text-white transition hover:-translate-y-0.5 hover:bg-brand-600">
              Say hoi
            </a>
          </nav>
        </div>
      </header>

      {/* ================= HERO ================= */}
      <section id="top" className="container-x pt-5">
        <div
          ref={heroRef}
          onPointerMove={onPointerMove}
          className="hero-bg relative overflow-hidden rounded-[2rem] px-6 pb-8 pt-14 text-white sm:px-12 sm:pb-12 sm:pt-20"
        >
          <div className="hero-glow pointer-events-none absolute inset-0" aria-hidden="true" />
          <svg className="rings pointer-events-none absolute -right-40 -top-32 h-[560px] w-[560px] opacity-20"
            viewBox="0 0 520 520" fill="none" stroke="white" strokeWidth="2" aria-hidden="true">
            <circle cx="260" cy="260" r="250" /><circle cx="260" cy="260" r="185" strokeDasharray="6 14" />
            <circle cx="260" cy="260" r="120" /><circle cx="260" cy="10" r="9" fill="white" />
          </svg>

          <div className="relative">
            <span className="pill border border-white/50">Harbour of ideas · Bremen · Oldenburg · Nordwesten</span>

            {returning && current && (
              <p className="swap-in mt-6 inline-flex flex-wrap items-center gap-x-3 gap-y-1 rounded-full bg-white/15 px-4 py-2 text-sm font-medium">
                Welcome back{firstName ? `, ${firstName}` : ''}! Here’s what’s new for {current.plural}.
                <button type="button" onClick={forget} className="underline underline-offset-2 opacity-80 hover:opacity-100">
                  Not you?
                </button>
              </p>
            )}

            <p key={`g-${firstName}`} className="swap-in mt-8 flex items-center gap-2 font-display text-2xl font-extrabold sm:text-3xl">
              Hoi{firstName ? `, ${firstName}` : ''}! <WaveHand />
            </p>
            <h1 key={persona ?? 'none'}
              className="swap-in mt-3 max-w-5xl text-[clamp(2.6rem,6.6vw,5.8rem)] font-black uppercase leading-[0.95] tracking-[-0.02em] text-balance">
              {current ? current.headline : DEFAULT_HEADLINE}
            </h1>
            <p key={`l-${persona}`} className="swap-in mt-6 max-w-2xl text-lg leading-relaxed text-white/90 sm:text-xl">
              {current
                ? current.line
                : 'We connect startups with business and science for sustainable innovation. Tell us who you are, and we’ll show you where to start.'}
            </p>

            {/* ---- the picker ---- */}
            <div className="mt-10 max-w-5xl rounded-3xl bg-white p-5 text-ink shadow-2xl shadow-ink/20 sm:p-7">
              <p className="font-display text-2xl font-extrabold sm:text-3xl" id="who">I’m…</p>
              <div role="group" aria-labelledby="who" className="mt-4 flex flex-wrap gap-2.5">
                {personas.map((p) => {
                  const on = p.id === persona
                  return (
                    <button key={p.id} type="button" aria-pressed={on} onClick={() => pick(p.id)}
                      className={`min-h-12 rounded-full border-2 px-5 text-base font-semibold transition duration-300 ${
                        on
                          ? 'scale-[1.04] border-brand-500 bg-brand-500 text-white shadow-lg shadow-brand-500/30'
                          : 'border-line bg-white hover:-translate-y-0.5 hover:border-brand-500 hover:text-brand-600'
                      }`}>
                      {p.chip}
                    </button>
                  )
                })}
              </div>

              <div className="mt-6 flex flex-wrap items-end justify-between gap-5 border-t border-line pt-5">
                <label className="block min-w-[240px] flex-1">
                  <span className="text-sm font-semibold">What should we call you? <span className="font-normal text-muted">(optional)</span></span>
                  <input
                    value={name}
                    onChange={(e) => changeName(e.target.value)}
                    placeholder="Your first name"
                    autoComplete="given-name"
                    className="mt-2 block w-full max-w-sm rounded-xl border-2 border-line px-4 py-3 text-base outline-none transition focus:border-brand-500"
                  />
                  <span className="mt-1.5 block text-xs text-muted">Only saved in your browser, so we can greet you next time.</span>
                </label>
                <a href={current ? '#events' : '#programmes'}
                  className="group inline-flex min-h-12 items-center gap-2 rounded-full bg-ink px-6 font-semibold text-white transition hover:bg-brand-600">
                  {current ? current.cta : 'See what hoi offers'}
                  <span className="transition group-hover:translate-x-1" aria-hidden="true">→</span>
                </a>
              </div>
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
          <a href="#events" className="font-semibold text-brand-600 hover:underline">See all events →</a>
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
                <h3 lang="de" className="mt-3 text-[clamp(1.45rem,2.1vw,1.85rem)] font-extrabold uppercase leading-none hyphens-auto [overflow-wrap:anywhere]">{ev.title}</h3>
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
                className={`lift group block rounded-[1.4rem] border-2 p-7 ${match ? 'border-brand-500 bg-brand-50' : 'border-line bg-white'}`}>
                <div className="flex items-center justify-between">
                  <span className="block h-2 w-12 rounded-full" style={{ background: p.color }} />
                  {match && <span className="swap-in text-xs font-bold uppercase tracking-wider text-brand-600">For you</span>}
                </div>
                <h3 className="mt-6 text-2xl font-extrabold leading-tight">{p.title}</h3>
                <p className="mt-3 leading-relaxed text-muted">{p.text}</p>
                <span className="mt-6 inline-block font-semibold text-brand-600 transition group-hover:translate-x-1">Learn more →</span>
              </a>
            )
          })}
        </div>
      </section>

      {/* ================= PEOPLE ================= */}
      <section id="about" className="container-x pt-28">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="reveal grid grid-cols-2 gap-4">
            <div className="lift flex aspect-[3/4] items-center justify-center rounded-[1.4rem] bg-brand-50 p-4 text-center text-sm text-muted">
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
            <a href="#contact" className="mt-7 inline-block font-semibold text-brand-600 hover:underline">Meet our startups →</a>
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
        <div className="reveal grid items-center gap-10 rounded-[2rem] bg-ink p-8 text-white sm:p-14 lg:grid-cols-2">
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
              className="mt-8 inline-flex min-h-12 items-center rounded-full bg-brand-500 px-7 font-semibold transition hover:-translate-y-0.5 hover:bg-brand-600">
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
