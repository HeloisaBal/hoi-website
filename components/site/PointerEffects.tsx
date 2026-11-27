'use client'

import { useEffect, useRef } from 'react'
import { startSparkleTrail } from './sparkleTrail'

/* ------------------------------------------------------------
   Pointer engine for the whole site. Mount once per page, inside
   the themed root (so the trail picks up the persona colours).

   Effects:
   1  Magnetic   .btn-primary, .btn-secondary, .chip, [data-magnetic]
   2  Spotlight  [data-spotlight]="light" | "accent"  (sets --mx / --my)
   3  Tilt       [data-tilt]                           (sets --rx / --ry)
   6  Trail      small dots in hoi teal, blue and purple that drift and
                 fade behind the normal cursor (the GroundUp sparkle,
                 see sparkleTrail.ts)

   Devices:
   - Mouse/trackpad: everything above.
   - Touch: no magnetic, no trail; spotlight follows the finger on
     press; cards tilt gently with scroll position instead.
   - prefers-reduced-motion: no magnetic, no tilt, no trail.
   ------------------------------------------------------------ */

const MAGNETIC = '.btn-primary, .btn-secondary, .chip, [data-magnetic]'

export function PointerEffects() {
  const trailRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const fine = window.matchMedia('(pointer: fine)').matches
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const cleanups: (() => void)[] = []
    const on = <K extends keyof WindowEventMap>(type: K, fn: (e: WindowEventMap[K]) => void, opts?: AddEventListenerOptions) => {
      window.addEventListener(type, fn, opts)
      cleanups.push(() => window.removeEventListener(type, fn, opts))
    }

    /* ---------- 2 spotlight + 3 tilt (mouse) ---------- */
    let hoverCard: HTMLElement | null = null
    const resetTilt = (el: HTMLElement | null) => {
      if (!el) return
      el.style.removeProperty('--rx')
      el.style.removeProperty('--ry')
    }
    function onCardMove(e: PointerEvent) {
      const target = e.target instanceof Element ? e.target : null
      const card = target?.closest<HTMLElement>('[data-spotlight], [data-tilt]') ?? null
      if (card !== hoverCard) { resetTilt(hoverCard); hoverCard = card }
      if (!card) return
      const r = card.getBoundingClientRect()
      const x = e.clientX - r.left
      const y = e.clientY - r.top
      if (card.hasAttribute('data-spotlight')) {
        card.style.setProperty('--mx', `${Math.round(x)}px`)
        card.style.setProperty('--my', `${Math.round(y)}px`)
      }
      if (card.hasAttribute('data-tilt') && !reduced && e.pointerType === 'mouse') {
        const tx = (x / r.width) * 2 - 1
        const ty = (y / r.height) * 2 - 1
        card.style.setProperty('--ry', `${(tx * 7).toFixed(2)}deg`)
        card.style.setProperty('--rx', `${(-ty * 6).toFixed(2)}deg`)
      }
    }
    on('pointermove', onCardMove, { passive: true })
    on('pointerdown', onCardMove, { passive: true }) // touch: light appears where the finger lands

    /* ---------- 3 tilt (touch): gentle tilt from scroll position ---------- */
    if (!fine && !reduced) {
      let frame = 0
      const update = () => {
        frame = 0
        const vh = window.innerHeight
        document.querySelectorAll<HTMLElement>('[data-tilt]').forEach((el) => {
          const r = el.getBoundingClientRect()
          if (r.bottom < 0 || r.top > vh) return
          const pos = (r.top + r.height / 2) / vh - 0.5 // -0.5 .. 0.5
          el.style.setProperty('--rx', `${(pos * 9).toFixed(2)}deg`)
        })
      }
      on('scroll', () => { if (!frame) frame = requestAnimationFrame(update) }, { passive: true })
      update()
    }

    /* ---------- 1 magnetic (mouse only) ---------- */
    if (fine && !reduced) {
      let frame = 0
      let px = 0
      let py = 0
      const pulled = new Set<HTMLElement>()
      const update = () => {
        frame = 0
        const now = new Set<HTMLElement>()
        document.querySelectorAll<HTMLElement>(MAGNETIC).forEach((el) => {
          const r = el.getBoundingClientRect()
          if (!r.width) return
          const dx = px - (r.left + r.width / 2)
          const dy = py - (r.top + r.height / 2)
          // pull zone: the button plus a margin around it
          if (Math.abs(dx) < r.width / 2 + 28 && Math.abs(dy) < r.height / 2 + 24) {
            el.style.translate = `${(dx * 0.22).toFixed(1)}px ${(dy * 0.3).toFixed(1)}px`
            now.add(el)
          }
        })
        pulled.forEach((el) => { if (!now.has(el)) el.style.translate = '' })
        pulled.clear()
        now.forEach((el) => pulled.add(el))
      }
      on('pointermove', (e) => {
        if (e.pointerType !== 'mouse') return
        px = e.clientX
        py = e.clientY
        if (!frame) frame = requestAnimationFrame(update)
      }, { passive: true })
      cleanups.push(() => pulled.forEach((el) => { el.style.translate = '' }))
    }

    /* ---------- 6 trail: GroundUp sparkles in hoi colours (sparkleTrail.ts) ---------- */
    if (trailRef.current) cleanups.push(startSparkleTrail(trailRef.current))

    return () => cleanups.forEach((fn) => fn())
  }, [])

  return <canvas ref={trailRef} className="cursor-trail" aria-hidden="true" />
}
