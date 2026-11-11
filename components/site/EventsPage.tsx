'use client'

import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { DEFAULT_THEME, type PersonaId } from './data'
import { useContent } from './ContentContext'
import { HighlightCard } from './HighlightCard'
import { HeroBackdrop } from './Backdrop'
import { Header } from './Header'
import { Footer } from './Footer'
import { EventCard } from './EventCard'
import { PointerEffects } from './PointerEffects'
import { ScrollBoat } from './ScrollBoat'
import { Arrow, KEY_NAME, KEY_PERSONA, WaveHand, fit, load, rise, stegaClean, themeVars } from './shared'

type ForFilter = PersonaId | 'all'

const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

export function EventsPage() {
  const { events, personas, eventsPage: t, settings, highlight } = useContent()
  const TITLE = `${t.titleLine1} ${t.titleLine2}`
  const [saved, setSaved] = useState<PersonaId | null>(null)
  const [name, setName] = useState('')
  const [forWho, setForWho] = useState<ForFilter>('all')
  const [type, setType] = useState<string>('all')
  const heroRef = useRef<HTMLElement>(null)

  /* pick up who the visitor told us they are on the homepage */
  useLayoutEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    const p = load(KEY_PERSONA) as PersonaId | null
    const n = load(KEY_NAME)
    if (p && personas.some((x) => x.id === p)) { setSaved(p); setForWho(p) }
    if (n) setName(n.trim().split(/\s+/)[0])
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [personas])

  // labels compared without the Studio preview's invisible markers
  const types = useMemo(() => Array.from(new Set(events.map((e) => stegaClean(e.label)))), [events])
  const shown = events.filter((e) =>
    (type === 'all' || stegaClean(e.label) === type) && (forWho === 'all' || e.for.includes(forWho)))

  const forPersona = personas.find((p) => p.id === forWho) ?? null
  const theme = forPersona?.theme ?? (saved ? personas.find((p) => p.id === saved)!.theme : DEFAULT_THEME)

  function onPointerMove(e: React.PointerEvent<HTMLElement>) {
    const el = heroRef.current
    if (!el || e.pointerType === 'touch') return
    const r = el.getBoundingClientRect()
    el.style.setProperty('--gx', `${Math.round(e.clientX - r.left)}px`)
    el.style.setProperty('--gy', `${Math.round(e.clientY - r.top)}px`)
    el.style.setProperty('--spot', '1')
  }

  const resetFilters = () => { setForWho('all'); setType('all') }
  const filterKey = `${forWho}-${type}`

  return (
    <div className="themed" style={themeVars(theme)}>
      <PointerEffects />
      <ScrollBoat />
      <Header active="events" />
      <HighlightCard highlight={highlight} after={0.6} />

      {/* ================= PAGE HERO ================= */}
      <section ref={heroRef} onPointerMove={onPointerMove} onPointerLeave={() => heroRef.current?.style.setProperty('--spot', '0')}
        className="hero relative isolate -mt-16 pt-16 sm:-mt-[72px] sm:pt-[72px]">
        <HeroBackdrop />
        <div className="spotlight pointer-events-none absolute inset-0 -z-10" aria-hidden="true" />
        <div className="container-x pb-12 pt-16 text-center sm:pb-16 sm:pt-24">
          <span className="hero-pill rise" style={rise(0)}><span className="pill-dot" aria-hidden="true" />{t.pill}</span>
          {name && (
            <p className="rise mt-7 flex items-center justify-center gap-2 font-display text-xl font-semibold text-ink sm:text-2xl" style={rise(1)}>
              Hoi, {name}! <span className="text-accent"><WaveHand /></span>
            </p>
          )}
          <h1 className="rise mx-auto mt-5 max-w-4xl font-black uppercase leading-[0.9] tracking-[-0.04em] text-ink"
            style={{ ...rise(2), ...fit(TITLE, 'clamp(2.75rem, 7.5vw, 6.5rem)', '2.75rem') }}>
            {t.titleLine1}<br /><span className="grad-text">{t.titleLine2}</span>
          </h1>
          <p className="rise mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted sm:text-xl" style={rise(3)}>
            {t.intro}
          </p>
        </div>
      </section>

      {/* ================= FILTERS ================= */}
      <div className="filter-bar relative z-40 sm:sticky sm:top-[72px]">
        <div className="container-x flex flex-col gap-3 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-3">
            <FilterRow label="For">
              <Chip on={forWho === 'all'} onClick={() => setForWho('all')}>Everyone</Chip>
              {personas.map((p) => (
                <Chip key={p.id} on={forWho === p.id} onClick={() => setForWho(p.id)}>
                  {capital(p.plural)}
                  {saved === p.id && <span className="ml-1.5 rounded-full bg-current/10 px-1.5 text-[11px] font-bold uppercase tracking-wide opacity-80">you</span>}
                </Chip>
              ))}
            </FilterRow>
            <FilterRow label="Type">
              <Chip on={type === 'all'} onClick={() => setType('all')}>All types</Chip>
              {types.map((t) => <Chip key={t} on={type === t} onClick={() => setType(t)}>{t}</Chip>)}
            </FilterRow>
          </div>
          <p className="text-sm font-medium text-muted" aria-live="polite">
            {shown.length} {shown.length === 1 ? 'event' : 'events'}
            {forPersona ? ` for ${forPersona.plural}` : ''}
          </p>
        </div>
      </div>

      {/* ================= EVENTS ================= */}
      <section className="container-x pb-8 pt-10 sm:pt-12" aria-label="Events">
        {shown.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((ev, i) => (
              <div key={`${filterKey}-${ev.id}`} className="rise" style={rise(i)}>
                <EventCard ev={ev} picked={!!saved && ev.for.includes(saved)} showAsk />
              </div>
            ))}
          </div>
        ) : (
          <div key={filterKey} className="rise flex flex-col items-center rounded-[1.4rem] border-2 border-dashed border-line px-6 py-16 text-center">
            <p className="font-display text-2xl font-bold text-ink">Nothing here right now.</p>
            <p className="mt-2 max-w-md text-muted">
              No {type === 'all' ? 'events' : type.toLowerCase() + 's'}{forPersona ? ` for ${forPersona.plural}` : ''} at the moment. New ones are added all the time.
            </p>
            <button type="button" onClick={resetFilters} className="btn-secondary mt-7 h-12 px-6">Show all events</button>
          </div>
        )}
      </section>

      {/* ================= STAY IN THE LOOP ================= */}
      <section className="container-x pt-16 sm:pt-24" data-no-highlight>
        <div className="grid items-center gap-8 rounded-[2rem] p-8 text-white sm:p-14 lg:grid-cols-[1.4fr_1fr]"
          style={{ background: 'linear-gradient(135deg, #170a2b 35%, var(--c3))' }}>
          <div>
            <h2 className="font-black uppercase leading-none" style={fit(t.ctaTitle, 'clamp(2.1rem, 4.5vw, 3.5rem)', '7rem')}>
              {t.ctaTitle}
            </h2>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-white/80">
              {t.ctaText}
            </p>
          </div>
          <div className="flex flex-wrap gap-3 lg:justify-end">
            <a href={settings.instagram} target="_blank" rel="noopener noreferrer" className="btn-primary group h-14 px-7">
              Follow on Instagram <Arrow />
            </a>
            <a href={`mailto:${settings.email}?subject=Hosting%20an%20event%20with%20hoi`} data-magnetic
              className="inline-flex h-14 items-center rounded-full border border-white/30 px-7 font-semibold transition hover:-translate-y-0.5 hover:bg-white/10">
              Host an event
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-10 shrink-0 text-xs font-bold uppercase tracking-[0.12em] text-muted">{label}</span>
      <div className="no-scrollbar -mr-5 flex gap-2 overflow-x-auto pr-5 sm:mr-0 sm:flex-wrap sm:overflow-visible sm:pr-0" role="group" aria-label={`Filter by ${label.toLowerCase()}`}>
        {children}
      </div>
    </div>
  )
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" aria-pressed={on} onClick={onClick} className={`filter-chip ${on ? 'is-on' : ''}`}>
      {children}
    </button>
  )
}
