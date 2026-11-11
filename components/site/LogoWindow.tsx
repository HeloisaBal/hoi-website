'use client'

import { useRef } from 'react'
import { clamp, motionAllowed, sectionProgress, useScrollFrame } from './useScrollFrame'

/* ------------------------------------------------------------
   Scroll idea S4: fly through the window of the hoi "house"
   (the teal "o" from the logo) into the next section.
   With reduced motion it is a plain banner, no zoom.
   `intro`: used as the very first thing on the homepage, under the
   header, before the hero asks for the visitor's name.
   ------------------------------------------------------------ */

// the window inside the house, as a share of the house's width (viewBox 0..100)
const WIN_W = 0.12
const WIN_H = 0.24

const smooth = (t: number) => t * t * (3 - 2 * t)

export function LogoWindow({ intro = false, title = 'Welcome to the\nharbour of ideas', sub = 'Im Norden gründen – mit Rückenwind.' }: {
  intro?: boolean
  /** a line break in the text starts a new line */
  title?: string
  sub?: string
}) {
  const sectionRef = useRef<HTMLElement>(null)
  const houseRef = useRef<HTMLDivElement>(null)
  const afterRef = useRef<HTMLDivElement>(null)
  const hintRef = useRef<HTMLParagraphElement>(null)

  useScrollFrame(() => {
    const section = sectionRef.current
    const house = houseRef.current
    const after = afterRef.current
    const hint = hintRef.current
    if (!section || !house || !after || !hint || !motionAllowed()) return
    const p = sectionProgress(section)
    const t = smooth(clamp(p / 0.8, 0, 1))
    // offsetWidth is the house's real size, unaffected by the zoom itself
    const w = house.offsetWidth
    if (!w) return
    // scale at which the window covers the whole screen
    const full = Math.max((window.innerWidth * 1.15) / (w * WIN_W), (window.innerHeight * 1.15) / (w * WIN_H))
    const scale = Math.pow(full, t)
    house.style.transform = `scale(${scale.toFixed(3)})`
    house.style.opacity = p > 0.88 ? '0' : '1'
    after.style.opacity = clamp((p - 0.04) / 0.3, 0, 1).toFixed(2)
    hint.style.opacity = (1 - clamp(p / 0.12, 0, 1)).toFixed(2)
  })

  return (
    <section ref={sectionRef} className={`logo-window ${intro ? 'logo-window--intro' : ''}`} aria-labelledby="window-title">
      <div className="logo-window-sticky">
        <div ref={afterRef} className="logo-window-after">
          <div>
            <h2 id="window-title" className="logo-window-title">
              {title.split('\n').map((l, i) => <span key={i} className="block">{l}</span>)}
            </h2>
            <p className="logo-window-sub">{sub}</p>
            {intro && <p className="logo-window-next" aria-hidden="true">Keep scrolling to say hoi ↓</p>}
          </div>
        </div>
        <div ref={houseRef} className="logo-window-house" aria-hidden="true">
          <svg viewBox="0 0 100 100">
            <path fillRule="evenodd" d="M0 0 L100 14 L100 100 L0 100 Z M44 42 H56 V66 H44 Z" />
          </svg>
        </div>
        <p ref={hintRef} className="logo-window-hint" aria-hidden="true">{intro ? 'Scroll to step inside' : 'Step inside'} <span className="logo-window-arrow">↓</span></p>
      </div>
    </section>
  )
}
