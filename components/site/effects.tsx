'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

/* ------------------------------------------------------------
   Visual moments: particle bursts and the full-screen colour wipe.
   Both skip themselves when the visitor prefers reduced motion.
   ------------------------------------------------------------ */

type Particle = { dx: number; dy: number; size: number; rot: number; color: string; shape: 'dot' | 'square' | 'ring' | 'bar'; delay: number }
type BurstT = { id: number; x: number; y: number; particles: Particle[] }
type WipeT = { id: number; x: number; y: number; from: string; to: string; word: string }

export function prefersReducedMotion() {
  if (typeof window === 'undefined') return true
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** Centre of an element, in viewport coordinates. */
export function centreOf(el: Element | null) {
  if (!el) return { x: window.innerWidth / 2, y: window.innerHeight / 2 }
  const r = el.getBoundingClientRect()
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
}

export function useEffects() {
  const [bursts, setBursts] = useState<BurstT[]>([])
  const [wipe, setWipe] = useState<WipeT | null>(null)
  const id = useRef(0)
  const timers = useRef<number[]>([])

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const burst = useCallback((x: number, y: number, colors: string[], count = 42) => {
    if (prefersReducedMotion()) return
    const shapes: Particle['shape'][] = ['dot', 'square', 'ring', 'bar']
    const particles: Particle[] = Array.from({ length: count }, () => {
      const angle = Math.random() * Math.PI * 2
      const dist = 110 + Math.random() * 260
      return {
        dx: Math.cos(angle) * dist,
        dy: Math.sin(angle) * dist - 40,
        size: 6 + Math.random() * 12,
        rot: (Math.random() - 0.5) * 720,
        color: colors[Math.floor(Math.random() * colors.length)],
        shape: shapes[Math.floor(Math.random() * shapes.length)],
        delay: Math.random() * 0.08,
      }
    })
    const b = { id: ++id.current, x, y, particles }
    setBursts((list) => [...list, b])
    timers.current.push(window.setTimeout(() => setBursts((list) => list.filter((it) => it.id !== b.id)), 1400))
  }, [])

  const colourWipe = useCallback((x: number, y: number, from: string, to: string, word: string) => {
    if (prefersReducedMotion()) return
    const w = { id: ++id.current, x, y, from, to, word }
    setWipe(w)
    timers.current.push(window.setTimeout(() => setWipe((cur) => (cur?.id === w.id ? null : cur)), 1200))
  }, [])

  const layer = (
    <>
      {wipe && (
        <div key={wipe.id} className="wipe" aria-hidden="true"
          style={{
            ['--x' as string]: `${wipe.x}px`, ['--y' as string]: `${wipe.y}px`,
            background: `linear-gradient(118deg, ${wipe.from}, ${wipe.to})`,
          }}>
          <span className="wipe-word font-display text-[clamp(4rem,14vw,12rem)] font-black uppercase text-white">
            {wipe.word}.
          </span>
        </div>
      )}
      {bursts.map((b) => (
        <div key={b.id} className="burst" style={{ left: b.x, top: b.y }} aria-hidden="true">
          {b.particles.map((p, i) => (
            <span key={i} className="particle"
              style={{
                ['--dx' as string]: `${p.dx}px`, ['--dy' as string]: `${p.dy}px`, ['--rot' as string]: `${p.rot}deg`,
                animationDelay: `${p.delay}s`,
                width: p.shape === 'bar' ? p.size * 0.45 : p.size,
                height: p.shape === 'bar' ? p.size * 1.6 : p.size,
                borderRadius: p.shape === 'dot' || p.shape === 'ring' ? '999px' : '3px',
                background: p.shape === 'ring' ? 'transparent' : p.color,
                border: p.shape === 'ring' ? `2.5px solid ${p.color}` : undefined,
              }} />
          ))}
        </div>
      ))}
    </>
  )

  return { burst, colourWipe, layer }
}
