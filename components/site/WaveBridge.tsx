'use client'

import { useRef } from 'react'
import { useContent } from './ContentContext'
import { clamp, motionAllowed, sectionProgress, useScrollFrame } from './useScrollFrame'

/* ------------------------------------------------------------
   The wave moment between the hero and "What hoi offers": while the
   visitor scrolls, the screen warms into their path's colour, the
   names of hoi's offers slide past in giant letters, then four waves
   in the path colours rise and the offers slide up over them (the
   section after this one has a wavy top edge, see globals.css).
   The names come from Sanity → Offers. Reduced motion: not shown.
   ------------------------------------------------------------ */

const WAVES = [
  'M0,10 C20,0 35,0 50,8 S80,18 100,6 L100,100 L0,100 Z',
  'M0,6 C20,16 40,16 55,8 S85,0 100,10 L100,100 L0,100 Z',
  'M0,10 C25,0 45,2 60,9 S85,16 100,6 L100,100 L0,100 Z',
  'M0,7 C18,15 38,15 52,7 S84,0 100,9 L100,100 L0,100 Z',
]
// where each wave's top edge stops (% of its own height): four even stripes
const WAVE_STOP = [-6, 19.2, 38.5, 57.7]
const TEXT_SHARE = 0.55 // first part of the scroll: the colour and the text

const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)

export function WaveBridge() {
  const { offers } = useContent()
  const sectionRef = useRef<HTMLElement>(null)
  const pinRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLDivElement>(null)
  const bandRefs = useRef<(HTMLDivElement | null)[]>([])
  const words = offers.map((o) => o.name).join(' · ')

  useScrollFrame(() => {
    const section = sectionRef.current
    const pin = pinRef.current
    if (!section || !pin || !motionAllowed()) return
    const p = sectionProgress(section)
    const textP = clamp(p / TEXT_SHARE, 0, 1)
    const waveP = clamp((p - TEXT_SHARE) / (0.9 - TEXT_SHARE), 0, 1)
    pin.style.setProperty('--warm', textP.toFixed(3))
    if (textRef.current) textRef.current.style.transform = `translate(${(10 - textP * 70).toFixed(2)}%, -50%)`
    bandRefs.current.forEach((band, k) => {
      if (!band) return
      const t = easeOut(clamp((waveP - k * 0.14) / 0.58, 0, 1))
      band.style.transform = `translateY(${lerp(110, WAVE_STOP[k], t).toFixed(2)}%)`
    })
  })

  return (
    <section ref={sectionRef} className="wave-bridge" aria-hidden="true">
      <div ref={pinRef} className="wave-bridge-pin">
        <div ref={textRef} className="wave-bridge-text">{words} · {words}</div>
        {WAVES.map((d, k) => (
          <div key={k} ref={(el) => { bandRefs.current[k] = el }} className={`event-stack-band band-${k + 1}`} style={{ zIndex: 20 + k }}>
            <svg viewBox="0 0 100 100" preserveAspectRatio="none"><path fill="currentColor" d={d} /></svg>
          </div>
        ))}
      </div>
    </section>
  )
}
