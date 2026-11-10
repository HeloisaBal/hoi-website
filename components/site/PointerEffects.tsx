'use client'

import { useEffect, useRef } from 'react'

/* ------------------------------------------------------------
   Pointer engine for the whole site. Mount once per page, inside
   the themed root (so the trail picks up the persona colours).

   Effects:
   1  Magnetic   .btn-primary, .btn-secondary, .chip, [data-magnetic]
   2  Spotlight  [data-spotlight]="light" | "accent"  (sets --mx / --my)
   3  Tilt       [data-tilt]                           (sets --rx / --ry)
   6  Trail      little houses (the logo's "o") and dots in the persona
                 colours, drawn on one fixed canvas behind the normal cursor

   Devices:
   - Mouse/trackpad: everything above.
   - Touch: no magnetic; spotlight follows the finger on
     press; cards tilt gently with scroll position instead; a tap
     makes a small burst of houses and dots.
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

    /* ---------- 6 trail ---------- */
    const canvas = trailRef.current
    const ctx = canvas?.getContext('2d')
    if (canvas && ctx && !reduced) {
      type Bit = { x: number; y: number; vx: number; vy: number; size: number; house: boolean; color: string; born: number; life: number }
      let bits: Bit[] = []
      let frame = 0
      let lastSpawn = 0
      const resize = () => {
        const dpr = Math.min(window.devicePixelRatio || 1, 2)
        canvas.width = window.innerWidth * dpr
        canvas.height = window.innerHeight * dpr
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      }
      resize()
      on('resize', resize)
      // persona colours, read from the themed page root so they follow persona changes
      const palette = () => {
        const cs = getComputedStyle(canvas)
        return ['--c1', '--c2', '--c3'].map((v) => cs.getPropertyValue(v).trim() || '#9a00ff')
      }
      const house = (x: number, y: number, s: number) => {
        // the logo's "o": a little house with a roof sloping down to the right
        ctx.beginPath()
        ctx.moveTo(x - s, y - s)
        ctx.lineTo(x + s, y - s * 0.7)
        ctx.lineTo(x + s, y + s)
        ctx.lineTo(x - s, y + s)
        ctx.closePath()
        ctx.fill()
      }
      const draw = (t: number) => {
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)
        bits = bits.filter((b) => t - b.born < b.life)
        for (const b of bits) {
          const k = (t - b.born) / b.life
          const s = b.size * (1 - k * 0.6)
          const x = b.x + b.vx * k
          const y = b.y + b.vy * k
          ctx.globalAlpha = 1 - k
          ctx.fillStyle = b.color
          if (b.house) house(x, y, s)
          else { ctx.beginPath(); ctx.arc(x, y, s, 0, Math.PI * 2); ctx.fill() }
        }
        ctx.globalAlpha = 1
        frame = bits.length ? requestAnimationFrame(draw) : 0
      }
      // spread 0: a trail shape that just drifts down; above 0: a burst outwards
      const spawn = (x: number, y: number, n: number, spread: number) => {
        const cols = palette()
        const now = performance.now()
        for (let i = 0; i < n; i++) {
          const a = Math.random() * Math.PI * 2
          bits.push({
            x, y,
            vx: Math.cos(a) * spread * Math.random(),
            vy: Math.sin(a) * spread * Math.random() + 18, // drift down a little
            size: 5 + Math.random() * 6,
            house: Math.random() < 0.55,
            color: cols[(Math.random() * cols.length) | 0],
            born: now,
            life: 900,
          })
        }
        if (bits.length > 160) bits = bits.slice(-160) // keep it light
        if (!frame) frame = requestAnimationFrame(draw)
      }
      const skip = (e: PointerEvent) =>
        e.target instanceof Element && !!e.target.closest('input, textarea, select, [contenteditable="true"]')
      if (fine) {
        on('pointermove', (e) => {
          if (e.pointerType !== 'mouse' || skip(e)) return
          const now = performance.now()
          if (now - lastSpawn < 28) return
          lastSpawn = now
          spawn(e.clientX, e.clientY, 1, 0)
        }, { passive: true })
      } else {
        on('pointerdown', (e) => { if (!skip(e)) spawn(e.clientX, e.clientY, 10, 56) }, { passive: true })
      }
      cleanups.push(() => cancelAnimationFrame(frame))
    }

    return () => cleanups.forEach((fn) => fn())
  }, [])

  return <canvas ref={trailRef} className="cursor-trail" aria-hidden="true" />
}
