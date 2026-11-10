'use client'

import { useEffect, useRef } from 'react'

/**
 * Runs `fn` once per animation frame while the page scrolls or resizes
 * (and once on mount). The callback should only write to the DOM through
 * refs, never set React state, so scrolling never re-renders the page.
 */
export function useScrollFrame(fn: () => void) {
  const fnRef = useRef(fn)
  useEffect(() => { fnRef.current = fn })

  useEffect(() => {
    let frame = 0
    const run = () => { frame = 0; fnRef.current() }
    const request = () => { if (!frame) frame = requestAnimationFrame(run) }
    window.addEventListener('scroll', request, { passive: true })
    window.addEventListener('resize', request)
    request()
    return () => {
      window.removeEventListener('scroll', request)
      window.removeEventListener('resize', request)
      cancelAnimationFrame(frame)
    }
  }, [])
}

export const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

/** How far a tall pinned section has been scrolled through: 0 at its top, 1 at its end. */
export function sectionProgress(el: HTMLElement) {
  const r = el.getBoundingClientRect()
  const total = r.height - window.innerHeight
  return total > 0 ? clamp(-r.top / total, 0, 1) : 0
}

/** True when scroll-driven motion should run (no reduced-motion preference). */
export function motionAllowed() {
  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
