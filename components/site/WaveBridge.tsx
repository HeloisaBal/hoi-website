'use client'

import { useRef } from 'react'
import { clamp, motionAllowed, sectionProgress, useScrollFrame } from './useScrollFrame'

/* ------------------------------------------------------------
   The wave moment between the hero and "What hoi offers": while the
   visitor scrolls, the screen warms into their path's colour and four
   big waves in the path colours rise one after the other, then the
   offers slide up over them (the section after this one has a wavy
   top edge, see globals.css). Reduced motion: not shown.
   ------------------------------------------------------------ */

// big swells: each wave rises and falls across the full width
const WAVES = [
  'M0,22 C16,2 34,2 50,18 S84,38 100,8 L100,100 L0,100 Z',
  'M0,10 C18,32 40,32 56,14 S86,0 100,22 L100,100 L0,100 Z',
  'M0,24 C24,0 46,4 62,20 S88,36 100,10 L100,100 L0,100 Z',
  'M0,12 C20,30 38,30 54,12 S82,0 100,20 L100,100 L0,100 Z',
]
// where each wave's top edge stops (% of its own height): four even stripes
const WAVE_STOP = [-4, 13, 30, 47] // tops at about 0, 20, 45 and 70% of the screen (waves are 150% tall)
const WARM_SHARE = 0.25 // first part of the scroll: the colour warms up

const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)

export function WaveBridge() {
  const sectionRef = useRef<HTMLElement>(null)
  const pinRef = useRef<HTMLDivElement>(null)
  const bandRefs = useRef<(HTMLDivElement | null)[]>([])

  useScrollFrame(() => {
    const section = sectionRef.current
    const pin = pinRef.current
    if (!section || !pin || !motionAllowed()) return
    const p = sectionProgress(section)
    pin.style.setProperty('--warm', clamp(p / WARM_SHARE, 0, 1).toFixed(3))
    const waveP = clamp((p - 0.05) / 0.55, 0, 1) // all four are up by 60% of the scroll
    bandRefs.current.forEach((band, k) => {
      if (!band) return
      // one after the other, all four in place before the offers arrive
      const t = easeOut(clamp((waveP - k * 0.2) / 0.4, 0, 1))
      band.style.transform = `translateY(${lerp(110, WAVE_STOP[k], t).toFixed(2)}%)`
    })
  })

  return (
    <section ref={sectionRef} className="wave-bridge" aria-hidden="true">
      <div ref={pinRef} className="wave-bridge-pin">
        {WAVES.map((d, k) => (
          <div key={k} ref={(el) => { bandRefs.current[k] = el }} className={`event-stack-band wave-bridge-band band-${k + 1}`} style={{ zIndex: 20 + k }}>
            <svg viewBox="0 0 100 100" preserveAspectRatio="none"><path fill="currentColor" d={d} /></svg>
          </div>
        ))}
      </div>
    </section>
  )
}
