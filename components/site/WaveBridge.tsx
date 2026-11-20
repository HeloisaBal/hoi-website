'use client'

import { useRef } from 'react'
import { clamp, motionAllowed, useScrollFrame } from './useScrollFrame'

/*
  The wave moment between the hero and the offers.
  The stage sits over the hero and stays pinned while you scroll: the
  waves rise from the bottom one after another and stack on top of each
  other, like the original event-stack effect. The first wave never
  drops below the bottom of the hero, so there is no empty gap.
*/

const WAVES = [
  'M0,22 C16,2 34,2 50,18 S84,38 100,8 L100,100 L0,100 Z',
  'M0,10 C18,32 40,32 56,14 S86,0 100,22 L100,100 L0,100 Z',
  'M0,24 C24,0 46,4 62,20 S88,36 100,10 L100,100 L0,100 Z',
]
// where each wave's box settles, as a share of the screen height (the wave line itself
// sits a little lower, inside the box)
const WAVE_STOP = [-0.45, 0.1, 0.42]
// when each wave starts rising (share of the pinned scroll) and how long it takes
const WAVE_START = [0, 0.34, 0.6]
const WAVE_LENGTH = 0.3

const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)

export function WaveBridge() {
  const sectionRef = useRef<HTMLElement>(null)
  const bandRefs = useRef<(HTMLDivElement | null)[]>([])

  useScrollFrame(() => {
    const section = sectionRef.current
    if (!section || !motionAllowed()) return
    const vh = window.innerHeight
    const r = section.getBoundingClientRect()
    const p = clamp(-r.top / Math.max(1, r.height - vh), 0, 1)
    const hero = section.previousElementSibling as HTMLElement | null
    const heroBottom = hero ? hero.getBoundingClientRect().bottom : vh
    // the stage's own top on screen (0 while pinned)
    const pinTop = Math.max(0, r.top)

    bandRefs.current.forEach((band, k) => {
      if (!band) return
      const t = easeOut(clamp((p - WAVE_START[k]) / WAVE_LENGTH, 0, 1))
      let top = lerp(vh * 1.05, vh * WAVE_STOP[k], t)
      // the first wave follows the hero up, so nothing blank shows under it
      if (k === 0) top = Math.min(top, Math.max(heroBottom, vh * WAVE_STOP[0]))
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
            className={`event-stack-band wave-bridge-band band-${k + 1}`}
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
