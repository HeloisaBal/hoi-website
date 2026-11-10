'use client'

import Link from 'next/link'
import { useRef } from 'react'
import type { HoiEvent, PersonaId } from './data'
import { EventCard } from './EventCard'
import { Arrow, fit } from './shared'
import { clamp, motionAllowed, sectionProgress, useScrollFrame } from './useScrollFrame'

/* ------------------------------------------------------------
   Homepage events as a pinned "scroll story" (from scroll-story.html):
   - cards fly in from below with a tilt and land on a messy stack
   - the background blends towards each event's colour
   - giant text slides left behind the cards, a counter shows 01 / 04
   - at the end, wave bands rise and hand over to the next section
   With reduced motion it is a plain grid.
   ------------------------------------------------------------ */

const ROT_FROM = [0, 14, -12, 10, -8, 12]
const ROT_REST = [0, -3, 2.5, -1.5, 2, -2]
const CARDS_SHARE = 0.78 // first 78% of the scroll: cards; the rest: waves

const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)
const hex = (s: string) => (s.match(/#[0-9a-f]{6}/i)?.[0] ?? '#9a00ff')
const rgb = (h: string) => (h.match(/\w\w/g) ?? []).map((x) => parseInt(x, 16))
const mix = (a: string, b: string, t: number) => {
  const pa = rgb(a), pb = rgb(b)
  return `rgb(${pa.map((v, i) => Math.round(lerp(v, pb[i], t))).join(',')})`
}

export function EventStack({ events, persona, plural }: { events: HoiEvent[]; persona: PersonaId | null; plural?: string }) {
  const sectionRef = useRef<HTMLElement>(null)
  const pinRef = useRef<HTMLDivElement>(null)
  const marqueeRef = useRef<HTMLDivElement>(null)
  const counterRef = useRef<HTMLSpanElement>(null)
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])
  const bandRefs = useRef<(HTMLDivElement | null)[]>([])

  // soft background per event: its main colour mixed with white
  const colours = events.map((e) => mix(hex(e.gradient).slice(1), 'ffffff', 0.8))
  const title = plural ? `Next up for ${plural}` : 'Next up at hoi'
  const n = events.length

  useScrollFrame(() => {
    const section = sectionRef.current
    const pin = pinRef.current
    if (!section || !pin || !motionAllowed()) return
    const progress = sectionProgress(section)
    const cardsP = clamp(progress / CARDS_SHARE, 0, 1)
    const waveP = clamp((progress - CARDS_SHARE) / (1 - CARDS_SHARE), 0, 1)
    const seg = cardsP * (n - 1)
    const arrived = events.map((_, i) => (i === 0 ? 1 : clamp((seg - (i - 1)) * 1.3, 0, 1)))

    cardRefs.current.forEach((card, i) => {
      if (!card) return
      const t = easeOut(arrived[i])
      let covered = 0
      for (let j = i + 1; j < n; j++) covered += arrived[j]
      const y = lerp(130, 0, t)
      const rot = lerp(ROT_FROM[i % ROT_FROM.length], ROT_REST[i % ROT_REST.length], t)
      card.style.transform = `translateY(calc(${y.toFixed(2)}% + ${(-covered * 4).toFixed(2)}%)) rotate(${rot.toFixed(2)}deg) scale(${(1 - covered * 0.05).toFixed(3)})`
      card.style.filter = `brightness(${(1 - covered * 0.08).toFixed(3)})`
    })

    const idx = Math.min(Math.floor(seg), n - 2)
    const frac = clamp(seg - idx, 0, 1)
    pin.style.backgroundColor = n > 1 ? mix(rgbToHex(colours[idx]), rgbToHex(colours[idx + 1]), easeOut(frac)) : colours[0]
    if (marqueeRef.current) marqueeRef.current.style.transform = `translate(${(-cardsP * 45).toFixed(2)}%, -50%)`
    if (counterRef.current) counterRef.current.textContent = `${String(Math.min(n, Math.round(seg) + 1)).padStart(2, '0')} / ${String(n).padStart(2, '0')}`

    bandRefs.current.forEach((band, k) => {
      if (!band) return
      const t = easeOut(clamp((waveP - k * 0.18) / 0.64, 0, 1))
      band.style.transform = `translateY(${lerp(110, -15, t).toFixed(2)}%)`
    })
  })

  return (
    <section id="events" ref={sectionRef} className="event-stack" aria-labelledby="events-title">
      <div ref={pinRef} className="event-stack-pin" style={{ backgroundColor: colours[0] }}>
        <div ref={marqueeRef} className="event-stack-marquee" aria-hidden="true">
          WHAT’S ON · IM NORDEN GRÜNDEN · WHAT’S ON · MIT RÜCKENWIND ·
        </div>

        <div className="container-x event-stack-head">
          <div>
            <p className="eyebrow">What’s on</p>
            <h2 id="events-title" key={title} className="swap-in mt-2 font-black uppercase leading-none"
              style={fit(title, 'clamp(2.1rem, 5vw, 3.75rem)', '2.75rem')}>{title}</h2>
          </div>
          <Link href="/events" className="group inline-flex items-center gap-1.5 font-semibold text-accent">
            See all events <Arrow />
          </Link>
        </div>

        <div className="event-stack-cards">
          {events.map((ev, i) => (
            <div key={ev.id} ref={(el) => { cardRefs.current[i] = el }} className="event-stack-card" style={{ zIndex: i + 1 }}>
              <EventCard ev={ev} picked={!!persona && ev.for.includes(persona)} style={{ height: '100%' }} />
            </div>
          ))}
        </div>

        <span ref={counterRef} className="event-stack-counter" aria-hidden="true">01 / {String(n).padStart(2, '0')}</span>

        {['band-1', 'band-2', 'band-3'].map((cls, k) => (
          <div key={cls} ref={(el) => { bandRefs.current[k] = el }} className={`event-stack-band ${cls}`} style={{ zIndex: 20 + k }} aria-hidden="true">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none">
              <path fill="currentColor" d={[
                'M0,10 C20,0 35,0 50,8 S80,18 100,6 L100,100 L0,100 Z',
                'M0,6 C20,16 40,16 55,8 S85,0 100,10 L100,100 L0,100 Z',
                'M0,10 C25,0 45,2 60,9 S85,16 100,6 L100,100 L0,100 Z',
              ][k]} />
            </svg>
          </div>
        ))}
      </div>
    </section>
  )
}

function rgbToHex(c: string) {
  const m = c.match(/\d+/g) ?? ['0', '0', '0']
  return m.slice(0, 3).map((v) => Number(v).toString(16).padStart(2, '0')).join('')
}
