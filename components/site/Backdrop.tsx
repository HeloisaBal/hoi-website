'use client'

import { useEffect, useRef } from 'react'

/* ------------------------------------------------------------
   Ambient background for the hero: a light canvas with a few
   soft, slow-moving colour glows (in the persona's colours).
   The glows drift slightly with the mouse for depth.
   ------------------------------------------------------------ */
export function HeroBackdrop() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let frame = 0
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const el = ref.current
        if (!el) return
        el.style.setProperty('--px', ((e.clientX / window.innerWidth) * 2 - 1).toFixed(3))
        el.style.setProperty('--py', ((e.clientY / window.innerHeight) * 2 - 1).toFixed(3))
      })
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => { window.removeEventListener('pointermove', onMove); cancelAnimationFrame(frame) }
  }, [])

  return (
    <div ref={ref} aria-hidden="true" className="ambient pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="ambient-layer" style={{ ['--depth' as string]: '28px' }}>
        <div className="glow glow-a" />
      </div>
      <div className="ambient-layer" style={{ ['--depth' as string]: '-36px' }}>
        <div className="glow glow-b" />
      </div>
      <div className="ambient-layer" style={{ ['--depth' as string]: '18px' }}>
        <div className="glow glow-c" />
      </div>
      {/* fine grain keeps the gradients from banding and adds a subtle texture */}
      <div className="grain absolute inset-0" />
    </div>
  )
}
