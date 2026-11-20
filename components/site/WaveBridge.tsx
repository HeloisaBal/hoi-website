'use client'

import { useRef } from 'react'
import { clamp, motionAllowed, useScrollFrame } from './useScrollFrame'

/*
  The wave moment between the hero and the offers, with the same logic as
  the GroundUp showcase ("wave bands rise and hand over"):
  - a pinned stage sits over the end of the hero, but never draws over the
    3D map: everything above the map's bottom edge is cut off;
  - the teal band comes up as a full wave right under the map (its crests
    touch the map's bottom edge) and scrolls up with it;
  - the other three bands rise from the bottom one shortly after another
    (starting once you have scrolled a bit past the map), so several are
    moving at once and the screen is never one flat colour;
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
// the rise starts when the end of the hero is this far down the screen
const WAVE_START = 0.6

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
    // 0 when the end of the hero has scrolled a bit up the screen, 1 once the stack is complete
    const dist = window.innerWidth < 760 ? WAVE_DIST_PHONE : WAVE_DIST
    const wp = clamp((vh * WAVE_START - heroBottom) / (vh * dist), 0, 1)
    // nothing is drawn over the map
    const pin = section.firstElementChild as HTMLElement | null
    if (pin) pin.style.clipPath = heroBottom > pinTop ? `inset(${(heroBottom - pinTop).toFixed(1)}px 0 0 0)` : ''

    let prevTop = -Infinity
    bandRefs.current.forEach((band, k) => {
      if (!band) return
      const h = band.offsetHeight
      let top: number
      if (k === 0) {
        // the teal wave's crests touch the map's bottom edge and follow it up
        top = Math.max(heroBottom, (h * BAND_STOP[0]) / 100)
      } else {
        const e = easeOut(clamp((wp - (k - 1) * 0.14) / 0.58, 0, 1))
        top = (h * (110 + (BAND_STOP[k] - 110) * e)) / 100 + pinTop
        // never overtake the band before it, and leave each colour a stripe below the map
        // (on phones the rise is quick), so every colour stays visible
        top = Math.max(top, prevTop + h * 0.17, heroBottom + h * 0.1 * k)
      }
      prevTop = top
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
