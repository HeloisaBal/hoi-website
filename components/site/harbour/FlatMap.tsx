'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { CITIES, type HoiEvent } from '../data'
import { useContent } from '../ContentContext'
import { EventCard } from '../EventCard'
import { clamp } from '../useScrollFrame'

/* ------------------------------------------------------------
   The flat harbour map: shown instead of the 3D one when the
   browser can't do 3D (WebGL). Drag in any direction (mouse,
   finger, arrow keys), zoom with the buttons, tap pins to see the
   event. Pins come from each event's "Place on the map" in Sanity.
   ------------------------------------------------------------ */

const WORLD_W = 1600
const WORLD_H = 1100
const TOWNS = Object.values(CITIES).filter((c) => c.name !== 'Bremen')
const HQ = { name: 'Bremen · hoi', x: CITIES.bremen.x, y: CITIES.bremen.y }
// pins around their city, so several events in one place don't sit on top of each other
const AROUND = [{ x: 30, y: -40 }, { x: -110, y: 60 }, { x: 90, y: 90 }, { x: -60, y: -110 }, { x: 150, y: -10 }, { x: -170, y: -20 }]
/** world position as CSS variables (runtime values, see AGENTS.md) */
const at = (p: { x: number; y: number }) => ({ '--x': `${p.x}px`, '--y': `${p.y}px` }) as CSSProperties

export function FlatMap() {
  const { events } = useContent()
  const perCity: Record<string, number> = {}
  const pins = events.flatMap((ev) => {
    if (!ev.city) return []
    const k = perCity[ev.city] = (perCity[ev.city] ?? -1) + 1
    const c = CITIES[ev.city]
    const d = AROUND[k % AROUND.length]
    return [{ ev, x: c.x + d.x, y: c.y + d.y }]
  })
  const mapRef = useRef<HTMLDivElement>(null)
  const worldRef = useRef<HTMLDivElement>(null)
  const view = useRef({ x: 0, y: 0, z: 0.9 })
  const [open, setOpen] = useState<HoiEvent | null>(null)

  useEffect(() => {
    const map = mapRef.current
    const world = worldRef.current
    if (!map || !world) return
    const v = view.current
    let drag: { x: number; y: number; t: number } | null = null
    let vx = 0
    let vy = 0
    let glide = 0

    const apply = () => {
      v.x = clamp(v.x, Math.min(0, map.clientWidth - WORLD_W * v.z), 0)
      v.y = clamp(v.y, Math.min(0, map.clientHeight - WORLD_H * v.z), 0)
      world.style.transform = `translate3d(${v.x.toFixed(1)}px, ${v.y.toFixed(1)}px, 0) scale(${v.z.toFixed(3)})`
    }
    const centreOn = (wx: number, wy: number, z: number) => {
      v.z = z
      v.x = map.clientWidth / 2 - wx * z
      v.y = map.clientHeight / 2 - wy * z
      apply()
    }
    const home = () => centreOn(980, 720, map.clientWidth < 640 ? 0.6 : 0.9)
    home()

    const down = (e: PointerEvent) => {
      if ((e.target as Element).closest('button')) return
      cancelAnimationFrame(glide)
      map.setPointerCapture(e.pointerId)
      drag = { x: e.clientX, y: e.clientY, t: performance.now() }
      vx = vy = 0
    }
    const move = (e: PointerEvent) => {
      if (!drag) return
      const now = performance.now()
      const dx = e.clientX - drag.x
      const dy = e.clientY - drag.y
      const dt = Math.max(1, now - drag.t)
      v.x += dx
      v.y += dy
      vx = (dx / dt) * 16
      vy = (dy / dt) * 16
      drag = { x: e.clientX, y: e.clientY, t: now }
      apply()
    }
    const up = () => {
      if (!drag) return
      drag = null
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
      const step = () => {
        vx *= 0.92
        vy *= 0.92
        v.x += vx
        v.y += vy
        apply()
        if (Math.abs(vx) + Math.abs(vy) > 0.3) glide = requestAnimationFrame(step)
      }
      glide = requestAnimationFrame(step)
    }
    const key = (e: KeyboardEvent) => {
      const d = ({ ArrowLeft: [60, 0], ArrowRight: [-60, 0], ArrowUp: [0, 60], ArrowDown: [0, -60] } as Record<string, number[]>)[e.key]
      if (!d) return
      e.preventDefault()
      v.x += d[0]
      v.y += d[1]
      apply()
    }
    const zoom = (e: Event) => {
      const b = (e.target as Element).closest<HTMLButtonElement>('[data-zoom]')
      if (!b) return
      if (b.dataset.zoom === 'reset') return home()
      const cx = (map.clientWidth / 2 - v.x) / v.z
      const cy = (map.clientHeight / 2 - v.y) / v.z
      centreOn(cx, cy, clamp(v.z * (b.dataset.zoom === 'in' ? 1.25 : 0.8), 0.45, 1.8))
    }

    map.addEventListener('pointerdown', down)
    map.addEventListener('pointermove', move)
    map.addEventListener('pointerup', up)
    map.addEventListener('pointercancel', up)
    map.addEventListener('keydown', key)
    map.addEventListener('click', zoom)
    const ro = new ResizeObserver(apply)
    ro.observe(map)
    return () => {
      cancelAnimationFrame(glide)
      map.removeEventListener('pointerdown', down)
      map.removeEventListener('pointermove', move)
      map.removeEventListener('pointerup', up)
      map.removeEventListener('pointercancel', up)
      map.removeEventListener('keydown', key)
      map.removeEventListener('click', zoom)
      ro.disconnect()
    }
  }, [])

  return (
      <div ref={mapRef} className="hmap" tabIndex={0} aria-label="Map of hoi events in the Northwest. Use the arrow keys to move around.">
        <div ref={worldRef} className="hmap-world">
          <svg viewBox={`0 0 ${WORLD_W} ${WORLD_H}`} width={WORLD_W} height={WORLD_H} aria-hidden="true">
            <text className="hmap-sea" x="520" y="190">North Sea</text>
            <path className="hmap-land" d="M0 470 C120 440 200 470 300 430 S520 380 640 400 C680 420 690 470 720 480 C760 470 770 410 820 380 S960 330 1000 340 C1030 360 1040 380 1060 360 S1200 300 1300 320 S1500 300 1600 310 L1600 1100 L0 1100 Z" />
            <path className="hmap-river" d="M1045 372 C1060 500 1100 600 1150 820 S1220 1000 1260 1100" />
          </svg>
          {TOWNS.map((c) => (
            <span key={c.name} className="hmap-city" style={at(c)}><i /><span>{c.name}</span></span>
          ))}
          <span className="hmap-city is-hq" style={at(HQ)}><i /><span>{HQ.name}</span></span>
          {pins.map(({ ev, x, y }) => {
            return (
              <button key={ev.id} type="button" className="hmap-pin" style={at({ x, y })}
                aria-expanded={open?.id === ev.id} onClick={() => setOpen(ev)}>
                {ev.title.replace(/­/g, '')}
              </button>
            )
          })}
        </div>

        <div className="hmap-ui">
          <button type="button" data-zoom="in" aria-label="Zoom in">+</button>
          <button type="button" data-zoom="out" aria-label="Zoom out">−</button>
          <button type="button" data-zoom="reset" aria-label="Reset map">⟲</button>
        </div>
        {open && (
          <div className="hmap-card">
            <EventCard ev={open} showAsk />
            <button type="button" className="hmap-close" onClick={() => setOpen(null)} aria-label="Close">×</button>
          </div>
        )}
        <span className="hmap-note">Drag to explore</span>
      </div>
  )
}
