'use client'

import { useRef } from 'react'
import { motionAllowed, useScrollFrame } from './useScrollFrame'

/* ------------------------------------------------------------
   Hero shapes that drift at different speeds as you scroll
   (from scroll-story.html). Built from the hoi logo: the house,
   the "i" dot, the "h" stem, a small dot. Persona colours.
   ------------------------------------------------------------ */

const shapes = [
  { cls: 'ps-house', speed: 0.45 },
  { cls: 'ps-ring', speed: -0.3 },
  { cls: 'ps-stem', speed: 0.25 },
  { cls: 'ps-dot', speed: -0.55 },
]

export function ParallaxShapes() {
  const boxRef = useRef<HTMLDivElement>(null)
  const refs = useRef<(HTMLSpanElement | null)[]>([])

  useScrollFrame(() => {
    if (!motionAllowed() || !boxRef.current) return
    // how far the hero has scrolled past the top of the screen
    const y = Math.max(0, -boxRef.current.getBoundingClientRect().top)
    refs.current.forEach((el, i) => {
      if (el) el.style.transform = `translate3d(0, ${(y * shapes[i].speed).toFixed(1)}px, 0)`
    })
  })

  return (
    <div ref={boxRef} className="parallax-shapes" aria-hidden="true">
      {shapes.map((s, i) => (
        <span key={s.cls} ref={(el) => { refs.current[i] = el }} className={`ps ${s.cls}`} />
      ))}
    </div>
  )
}
