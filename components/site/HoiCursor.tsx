'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

/* ------------------------------------------------------------
   The hoi cursor (computers with a mouse only).
   - Everywhere: a hoi-purple arrow, with a teal dot over links and
     buttons. Plain CSS cursors (app/globals.css), so they never lag.
   - Over anything marked data-cursor="Label" (the 3D islands, the
     boarding pass): a little sailboat with that label follows the
     mouse instead, like a "click to launch" hint.
   Touch screens and keyboards don't see any of it. Mounted once in
   the root layout. Decoration only (aria-hidden): the elements under
   it have their own accessible labels.
   ------------------------------------------------------------ */

export function HoiCursor() {
  const ref = useRef<HTMLDivElement>(null)
  const [label, setLabel] = useState<string | null>(null)
  const studio = usePathname()?.startsWith('/studio') ?? false

  useEffect(() => {
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)')
    if (!fine.matches || studio) return
    const root = document.documentElement
    root.classList.add('has-hoi-cursor')
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let x = -100, y = -100, cx = -100, cy = -100, raf = 0, current: string | null = null

    const draw = () => {
      raf = 0
      // a soft follow; reduced motion: no trailing
      cx = reduced ? x : cx + (x - cx) * 0.35
      cy = reduced ? y : cy + (y - cy) * 0.35
      if (ref.current) ref.current.style.transform = `translate3d(${cx.toFixed(1)}px, ${cy.toFixed(1)}px, 0)`
      if (Math.abs(x - cx) + Math.abs(y - cy) > 0.3) raf = requestAnimationFrame(draw)
    }
    const move = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      x = e.clientX; y = e.clientY
      const el = (e.target as Element | null)?.closest?.('[data-cursor]')
      const next = el?.getAttribute('data-cursor') || null
      if (next !== current) {
        current = next
        setLabel(next)
        if (next && cx < 0) { cx = x; cy = y } // appear where the mouse is, not fly in
      }
      if (!raf) raf = requestAnimationFrame(draw)
    }
    const leave = () => { current = null; setLabel(null) }

    window.addEventListener('pointermove', move, { passive: true })
    window.addEventListener('pointerover', move, { passive: true })
    document.addEventListener('pointerleave', leave)
    return () => {
      root.classList.remove('has-hoi-cursor')
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerover', move)
      document.removeEventListener('pointerleave', leave)
    }
  }, [studio])

  return (
    <div ref={ref} className={`hoi-cursor ${label ? 'is-on' : ''}`} aria-hidden="true">
      <svg viewBox="0 0 48 48" className="hoi-cursor-boat">
        <path d="M24 4 L24 30 L40 30 Z" fill="#2ceccd" stroke="#170a2b" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M21 9 L21 30 L9 30 Z" fill="#fff" stroke="#170a2b" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M5 33 H43 L37 42 H11 Z" fill="#8a00e6" stroke="#170a2b" strokeWidth="2.5" strokeLinejoin="round" />
      </svg>
      <span className="hoi-cursor-label">{label}</span>
    </div>
  )
}
