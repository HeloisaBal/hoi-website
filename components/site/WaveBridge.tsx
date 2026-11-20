'use client'

import { useRef } from 'react'
import { clamp, motionAllowed, useScrollFrame } from './useScrollFrame'

/* ------------------------------------------------------------
   The wave moment between the hero and "What hoi offers": while the
   visitor scrolls, three big waves in the path colours rise one after
   the other, starting the moment this section comes up from the
   bottom of the screen (no empty gap after the hero), then the offers
   slide up over them (the section after this one has a wavy top edge,
   see globals.css). Reduced motion: not shown.
   ------------------------------------------------------------ */

// big swells: each wave rises and falls across the full width
const WAVES = [
  'M0,22 C16,2 34,2 50,18 S84,38 100,8 L100,100 L0,100 Z',
  'M0,10 C18,32 40,32 56,14 S86,0 100,22 L100,100 L0,100 Z',
  'M0,24 C24,0 46,4 62,20 S88,36 100,10 L100,100 L0,100 Z',
]
// where each wave's top edge stops (% of its own height): four even stripes
const WAVE_STOP = [-2, 20, 42] // tops at about 0, 30 and 60% of the screen (waves are 150% tall)

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
    // 0 when the section's top enters at the bottom of the screen, 1 at its end
    const r = section.getBoundingClientRect()
    const p = clamp((window.innerHeight - r.top) / r.height, 0, 1)
    const waveP = clamp(p / 0.6, 0, 1) // all three are up by 60% of the way
    bandRefs.current.forEach((band, k) => {
      if (!band) return
      // one after the other, all four in place before the offers arrive
      // the first wave is already up when the section arrives, so it joins the hero without a gap
      const t = k === 0 ? 1 : easeOut(clamp((waveP - (k - 1) * 0.3) / 0.5, 0, 1))
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
