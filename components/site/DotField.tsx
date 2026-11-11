'use client'

import { useEffect, useRef } from 'react'

/* ------------------------------------------------------------
   Effect 11: a field of dots that bends away from the pointer (or
   finger) and settles back. Fills its positioned parent; draws only
   while visible on screen. Reduced motion: still dots.
   ------------------------------------------------------------ */

type Dot = { ox: number; oy: number; x: number; y: number }

export function DotField() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    const host = canvas?.parentElement
    if (!canvas || !ctx || !host) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const GAP = 22
    const RADIUS = 110
    let dots: Dot[] = []
    let w = 0
    let h = 0
    let px = -9999
    let py = -9999
    let visible = false
    let frame = 0

    const build = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = host.clientWidth
      h = host.clientHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      dots = []
      for (let y = GAP / 2; y < h; y += GAP) for (let x = GAP / 2; x < w; x += GAP) dots.push({ ox: x, oy: y, x, y })
      if (reduced) draw()
    }
    const draw = () => {
      const accent = getComputedStyle(canvas).getPropertyValue('--c1').trim() || '#00d7b8'
      ctx.clearRect(0, 0, w, h)
      let moving = false
      for (const d of dots) {
        let tx = d.ox
        let ty = d.oy
        const dx = d.ox - px
        const dy = d.oy - py
        const dist = Math.hypot(dx, dy)
        if (!reduced && dist < RADIUS) {
          const f = (1 - dist / RADIUS) * 30
          tx += (dx / (dist || 1)) * f
          ty += (dy / (dist || 1)) * f
        }
        d.x += (tx - d.x) * 0.15
        d.y += (ty - d.y) * 0.15
        const off = Math.hypot(d.x - d.ox, d.y - d.oy)
        if (Math.abs(tx - d.x) + Math.abs(ty - d.y) > 0.1) moving = true
        ctx.globalAlpha = off > 1 ? 0.95 : 0.22
        ctx.fillStyle = off > 1 ? accent : '#ffffff'
        ctx.beginPath()
        ctx.arc(d.x, d.y, off > 1 ? 2.6 : 1.6, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1
      return moving
    }
    const loop = () => {
      const moving = draw()
      frame = visible && (moving || px > -9000) ? requestAnimationFrame(loop) : 0
    }
    const wake = () => { if (!frame && visible && !reduced) frame = requestAnimationFrame(loop) }
    const onMove = (e: PointerEvent) => {
      const r = host.getBoundingClientRect()
      px = e.clientX - r.left
      py = e.clientY - r.top
      wake()
    }
    const onLeave = () => { px = -9999; py = -9999; wake() }

    build()
    draw()
    const ro = new ResizeObserver(() => { build(); draw() })
    ro.observe(host)
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) draw() })
    io.observe(host)
    host.addEventListener('pointermove', onMove, { passive: true })
    host.addEventListener('pointerdown', onMove, { passive: true })
    host.addEventListener('pointerleave', onLeave)
    host.addEventListener('pointercancel', onLeave)
    return () => {
      cancelAnimationFrame(frame)
      ro.disconnect()
      io.disconnect()
      host.removeEventListener('pointermove', onMove)
      host.removeEventListener('pointerdown', onMove)
      host.removeEventListener('pointerleave', onLeave)
      host.removeEventListener('pointercancel', onLeave)
    }
  }, [])

  return <canvas ref={canvasRef} className="dot-field" aria-hidden="true" />
}
