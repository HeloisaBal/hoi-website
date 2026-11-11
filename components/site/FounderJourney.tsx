'use client'

import { useRef } from 'react'
import type { PersonaId } from './data'
import { useContent } from './ContentContext'
import { Arrow, fit } from './shared'
import { motionAllowed, sectionProgress, useScrollFrame } from './useScrollFrame'

/* ------------------------------------------------------------
   Scroll idea S1: the founder journey, sideways.
   - Desktop/tablet (768px+): the section pins and scrolling down
     slides the stages to the left.
   - Phones, or reduced motion: a normal swipeable row.
   The stage for the visitor's persona is marked "You are here".
   ------------------------------------------------------------ */

const PINNED = '(min-width: 768px) and (prefers-reduced-motion: no-preference)'

export function FounderJourney({ persona }: { persona: PersonaId | null }) {
  const { journey, home } = useContent()
  const TITLE = home.journeyTitle
  const sectionRef = useRef<HTMLElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLOListElement>(null)
  const barRef = useRef<HTMLSpanElement>(null)
  const stepsRef = useRef<HTMLOListElement>(null)

  const pinned = () => window.matchMedia(PINNED).matches

  /** Mark the stage in view and fill the progress bar. */
  const show = (p: number) => {
    const items = trackRef.current?.children
    const steps = stepsRef.current?.children
    if (!items || !steps || !barRef.current) return
    const now = Math.round(p * (items.length - 1))
    barRef.current.style.transform = `scaleX(${p.toFixed(3)})`
    Array.from(items).forEach((el, i) => el.classList.toggle('is-now', i === now))
    Array.from(steps).forEach((el, i) => el.classList.toggle('is-on', i <= now))
  }

  useScrollFrame(() => {
    const section = sectionRef.current
    const track = trackRef.current
    const viewport = viewportRef.current
    if (!section || !track || !viewport) return
    if (!pinned()) { track.style.transform = ''; return }
    const p = sectionProgress(section)
    const max = Math.max(0, track.scrollWidth - viewport.clientWidth)
    track.style.transform = `translate3d(${(-p * max).toFixed(1)}px, 0, 0)`
    show(p)
  })

  /* phones: the bar follows the sideways swipe */
  const onSwipe = () => {
    const v = viewportRef.current
    if (!v || pinned()) return
    const max = v.scrollWidth - v.clientWidth
    show(max > 0 ? v.scrollLeft / max : 0)
  }

  /** Bring stage `i` into view (step buttons and keyboard focus). */
  const goTo = (i: number, smooth = true) => {
    const section = sectionRef.current
    const viewport = viewportRef.current
    const item = trackRef.current?.children[i] as HTMLElement | undefined
    if (!section || !viewport || !item) return
    const behavior: ScrollBehavior = smooth && motionAllowed() ? 'smooth' : 'auto'
    if (pinned()) {
      const top = section.getBoundingClientRect().top + window.scrollY
      const span = section.offsetHeight - window.innerHeight
      window.scrollTo({ top: top + (i / (journey.length - 1)) * span, behavior })
    } else {
      viewport.scrollTo({ left: item.offsetLeft - parseFloat(getComputedStyle(trackRef.current!).paddingLeft), behavior })
    }
  }

  return (
    <section id="programmes" ref={sectionRef} className="journey" aria-labelledby="journey-title">
      <div className="journey-sticky">
        <div className="container-x">
          <p className="eyebrow">{home.journeyEyebrow}</p>
          <h2 id="journey-title" className="mt-2 font-black uppercase leading-none" style={fit(TITLE, 'clamp(2.1rem, 5vw, 3.75rem)', '2.75rem')}>
            {TITLE}
          </h2>
          <ol ref={stepsRef} className="journey-steps" aria-label="Stages">
            {journey.map((s, i) => (
              <li key={s.id}>
                <button type="button" onClick={() => goTo(i)}>{s.title}</button>
              </li>
            ))}
          </ol>
        </div>

        <div ref={viewportRef} className="journey-viewport" onScroll={onSwipe}>
          <ol ref={trackRef} className="journey-track">
            {journey.map((s, i) => {
              const you = !!persona && s.for.includes(persona)
              return (
                <li key={s.id} className={`journey-stage ${you ? 'is-you' : ''}`}
                  data-spotlight={you ? 'light' : 'accent'} onFocus={() => goTo(i, false)}>
                  {you && <span className="journey-you">You are here</span>}
                  <span className="journey-num" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                  <h3 className="journey-title">{s.title}</h3>
                  <p className="journey-text">{s.text}</p>
                  <div className="journey-foot">
                    <span className="journey-prog">{s.programme}</span>
                    <a href="#contact" className="journey-link group">
                      Learn more <Arrow />
                    </a>
                  </div>
                </li>
              )
            })}
          </ol>
        </div>

        <div className="container-x">
          <span className="journey-bar" aria-hidden="true"><span ref={barRef} /></span>
        </div>
      </div>
    </section>
  )
}
