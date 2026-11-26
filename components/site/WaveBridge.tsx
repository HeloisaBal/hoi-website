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

// the same wave lines, band heights, stops and timing as the Maré showcase
const WAVES = [
  'M0,10 C20,0 35,0 50,8 S80,18 100,6 L100,100 L0,100 Z',
  'M0,6 C20,16 40,16 55,8 S85,0 100,10 L100,100 L0,100 Z',
  'M0,10 C25,0 45,2 60,9 S85,16 100,6 L100,100 L0,100 Z',
  'M0,7 C18,15 38,15 52,7 S84,0 100,9 L100,100 L0,100 Z',
]
// where each band settles (translateY in % of its own height); the teal stripe is a bit
// shorter than on Maré
const BAND_STOP = [-6, 13, 35, 57.7]
// how much scroll the rise takes, in screen heights (shorter on phones, like Maré)
const WAVE_DIST = 1.1
const WAVE_DIST_PHONE = 0.62

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
    const dist = window.innerWidth < 760 ? WAVE_DIST_PHONE : WAVE_DIST
    const wp = clamp((vh * 0.92 - heroBottom) / (vh * dist), 0, 1)

    bandRefs.current.forEach((band, k) => {
      if (!band) return
      const e = easeOut(clamp((wp - k * 0.14) / 0.58, 0, 1))
      const h = band.offsetHeight
      let top = (h * (110 + (BAND_STOP[k] - 110) * e)) / 100 + pinTop
      // the first band follows the end of the hero. While the hero still fills the
      // screen the band waits just below it, so the map is never covered; once the
      // hero starts to scroll away the band tucks up under it until its wave line
      // (lowest point 18% into the band) no longer dips below the hero's end
      if (k === 0) {
        const tuck = clamp((vh - heroBottom) / (h * 0.18), 0, 1)
        top = Math.min(top, Math.max(heroBottom - h * 0.18 * tuck, (h * BAND_STOP[0]) / 100))
      }
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
