'use client'

import { useRef } from 'react'
import { clamp, motionAllowed, useScrollFrame } from './useScrollFrame'

/*
  The wave moment between the hero and the offers, with the same logic as
  the GroundUp showcase ("wave bands rise and hand over"):
  - a pinned stage sits over the end of the hero;
  - four bands rise from the bottom, one shortly after another, so
    several are moving at once and the screen is never one flat colour;
  - they settle as stacked stripes, and the last band has the colour of
    the next section, so the offers simply continue from it.
*/

const WAVES = [
  'M0,16 C20,0 35,0 50,13 S80,29 100,10 L100,100 L0,100 Z',
  'M0,10 C20,26 40,26 55,13 S85,0 100,16 L100,100 L0,100 Z',
  'M0,16 C25,0 45,3 60,14 S85,26 100,10 L100,100 L0,100 Z',
  'M0,11 C18,24 38,24 52,11 S84,0 100,14 L100,100 L0,100 Z',
]
// where each band settles (translateY in % of its own height), as in the showcase
const BAND_STOP = [-6, 19.2, 38.5, 57.7]
// how much scroll the rise takes, in screen heights
const WAVE_DIST = 1.1

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)

export function WaveBridge() {
  const sectionRef = useRef<HTMLElement>(null)
  const bandRefs = useRef<(HTMLDivElement | null)[]>([])

  useScrollFrame(() => {
    const section = sectionRef.current
    if (!section || !motionAllowed()) return
    const vh = window.innerHeight
    const hero = section.previousElementSibling as HTMLElement | null
    const heroBottom = hero ? hero.getBoundingClientRect().bottom : section.getBoundingClientRect().top + vh
    const pinTop = Math.max(0, section.getBoundingClientRect().top)
    // 0 when the end of the hero is near the bottom of the screen, 1 once the stack is complete
    const wp = clamp((vh * 0.92 - heroBottom) / (vh * WAVE_DIST), 0, 1)

    bandRefs.current.forEach((band, k) => {
      if (!band) return
      const e = easeOut(clamp((wp - k * 0.14) / 0.58, 0, 1))
      const h = band.offsetHeight
      let top = (h * (110 + (BAND_STOP[k] - 110) * e)) / 100 + pinTop
      // the first band never drops below the end of the hero, so nothing blank shows
      if (k === 0) top = Math.min(top, Math.max(heroBottom, (h * BAND_STOP[0]) / 100))
      band.style.transform = `translate3d(0, ${(top - pinTop).toFixed(1)}px, 0)`
    })
  })

  return (
    <section ref={sectionRef} className="wave-bridge" aria-hidden="true">
      <div className="wave-bridge-pin">
        {WAVES.map((d, k) => (
          <div
            key={k}
            ref={(el) => {
              bandRefs.current[k] = el
            }}
            className={`event-stack-band wave-bridge-band wave-bridge-band-${k + 1}`}
            style={{ zIndex: 20 + k }}
          >
            <svg viewBox="0 0 100 100" preserveAspectRatio="none">
              <path fill="currentColor" d={d} />
            </svg>
          </div>
        ))}
      </div>
    </section>
  )
}
