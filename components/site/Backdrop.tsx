'use client'

import { useEffect, useRef } from 'react'

/* ------------------------------------------------------------
   Full-width living background behind the hero:
   drifting colour clouds (they follow the persona colours),
   a soft dot grid, and floating shapes in the side gutters
   that drift with a little parallax as the mouse moves.
   ------------------------------------------------------------ */

type Floater = {
  left: string
  top: string
  size: number
  shape: 'ring' | 'dot' | 'square' | 'plus' | 'pill'
  color: string
  depth: number // parallax strength in px
  dur: number // float animation length in s
  delay: number
}

const floaters: Floater[] = [
  // left side
  { left: '3%', top: '18%', size: 64, shape: 'ring', color: 'var(--c1)', depth: 26, dur: 9, delay: 0 },
  { left: '9%', top: '42%', size: 18, shape: 'dot', color: 'var(--accent)', depth: 14, dur: 7, delay: 1.2 },
  { left: '5%', top: '66%', size: 34, shape: 'square', color: 'var(--c2)', depth: 34, dur: 11, delay: 0.6 },
  { left: '12%', top: '84%', size: 26, shape: 'plus', color: 'var(--c3)', depth: 20, dur: 8, delay: 2 },
  { left: '1.5%', top: '92%', size: 14, shape: 'dot', color: 'var(--c1)', depth: 10, dur: 6, delay: 0.3 },
  { left: '13%', top: '10%', size: 40, shape: 'pill', color: 'var(--c3)', depth: 18, dur: 10, delay: 1.6 },
  // right side
  { left: '93%', top: '14%', size: 22, shape: 'square', color: 'var(--c3)', depth: 22, dur: 8, delay: 0.9 },
  { left: '88%', top: '34%', size: 72, shape: 'ring', color: 'var(--c2)', depth: 30, dur: 12, delay: 0.2 },
  { left: '96%', top: '55%', size: 16, shape: 'dot', color: 'var(--c1)', depth: 12, dur: 6.5, delay: 1.8 },
  { left: '90%', top: '74%', size: 30, shape: 'plus', color: 'var(--accent)', depth: 26, dur: 9.5, delay: 0.5 },
  { left: '85%', top: '92%', size: 44, shape: 'pill', color: 'var(--c1)', depth: 16, dur: 11, delay: 2.4 },
  { left: '97%', top: '86%', size: 12, shape: 'dot', color: 'var(--c3)', depth: 8, dur: 7, delay: 1 },
]

function Shape({ f }: { f: Floater }) {
  const common = { width: f.size, height: f.size }
  switch (f.shape) {
    case 'ring':
      return <span className="block rounded-full" style={{ ...common, border: `3px solid ${f.color}`, opacity: 0.7 }} />
    case 'dot':
      return <span className="block rounded-full" style={{ ...common, background: f.color }} />
    case 'square':
      return <span className="block rounded-md" style={{ ...common, background: f.color, opacity: 0.85 }} />
    case 'pill':
      return <span className="block rounded-full" style={{ width: f.size, height: f.size * 0.42, background: f.color, opacity: 0.8 }} />
    case 'plus':
      return (
        <svg width={f.size} height={f.size} viewBox="0 0 24 24" fill="none" style={{ color: f.color }}>
          <path d="M12 3v18M3 12h18" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
        </svg>
      )
  }
}

export function HeroBackdrop() {
  const ref = useRef<HTMLDivElement>(null)

  /* mouse parallax: -1..1 across the window, smoothed with rAF */
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let frame = 0
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const el = ref.current
        if (!el) return
        el.style.setProperty('--px', String((e.clientX / window.innerWidth) * 2 - 1))
        el.style.setProperty('--py', String((e.clientY / window.innerHeight) * 2 - 1))
      })
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => { window.removeEventListener('pointermove', onMove); cancelAnimationFrame(frame) }
  }, [])

  return (
    <div ref={ref} aria-hidden="true" className="backdrop pointer-events-none absolute inset-x-0 -top-24 -bottom-40 -z-10 overflow-hidden">
      <div className="blob blob-a" />
      <div className="blob blob-b" />
      <div className="blob blob-c" />
      <div className="blob blob-d" />
      <div className="dotgrid absolute inset-0" />
      {floaters.map((f, i) => (
        <div key={i} className="parallax absolute" style={{ left: f.left, top: f.top, ['--depth' as string]: `${f.depth}px` }}>
          <div className="floater" style={{ animationDuration: `${f.dur}s`, animationDelay: `${f.delay}s` }}>
            <Shape f={f} />
          </div>
        </div>
      ))}
    </div>
  )
}
