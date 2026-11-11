'use client'

import { useEffect, useRef, useState } from 'react'
import { CITIES, type CityId, type HoiEvent } from './data'
import { useContent } from './ContentContext'
import { FlatMap } from './harbour/FlatMap'
import type { HarbourScene, Palette } from './harbour/scene'
import { Arrow, fit, stegaClean } from './shared'

/* ------------------------------------------------------------
   Scroll idea S6, inspired by thelaend.de: the Northwest as a small
   3D world. Drag to look around (two fingers on phones), tap a town
   to fly there and see its events in a panel.

   three.js (~150 KB) only loads when the section is about to come
   into view. Without WebGL, the flat map (harbour/FlatMap.tsx) shows
   instead. Reduced motion: no flying, no moving ships or turbines.
   The pins come from each event's "Place on the map" in Sanity.
   ------------------------------------------------------------ */

const ORDER: CityId[] = ['emden', 'wilhelmshaven', 'bremerhaven', 'oldenburg', 'bremen']

function readPalette(el: Element): Palette {
  const css = getComputedStyle(el)
  const v = (n: string, f: string) => css.getPropertyValue(n).trim() || f
  return { c1: v('--c1', '#00d7b8'), c2: v('--c2', '#003efe'), c3: v('--c3', '#9a00ff'), accent: v('--accent', '#8a00e6'), tint: v('--tint', '#f8f0ff') }
}

function webglAvailable() {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

export function HarbourMap() {
  const { events, home, settings } = useContent()
  const TITLE = home.mapTitle
  const boxRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const labelRefs = useRef<Partial<Record<CityId, HTMLButtonElement | null>>>({})
  const sceneRef = useRef<HarbourScene | null>(null)
  const panelRef = useRef<HTMLHeadingElement>(null)
  const [mode, setMode] = useState<'loading' | '3d' | 'flat'>('loading')
  const [city, setCity] = useState<CityId | null>(null)

  const byCity = (id: CityId) => events.filter((e) => e.city === id)

  /* load three.js and build the world once the section is near the screen */
  useEffect(() => {
    const box = boxRef.current
    const canvas = canvasRef.current
    if (!box || !canvas) return
    let cancelled = false
    let raf = 0
    let visible = false
    let started = false
    let scene: HarbourScene | null = null
    let lastPalette = ''

    const placeLabels = () => {
      if (!scene) return
      const pos = scene.labelPositions()
      for (const id of ORDER) {
        const el = labelRefs.current[id]
        const p = pos[id]
        if (!el) continue
        el.classList.toggle('is-off', !p)
        if (!p) continue
        // keep labels inside the map's edges
        const half = el.offsetWidth / 2 + 8
        const x = Math.min(box.clientWidth - half, Math.max(half, p.x))
        el.style.transform = `translate3d(${x.toFixed(1)}px, ${p.y.toFixed(1)}px, 0) translate(-50%, -100%)`
      }
    }

    let tick = 0
    const loop = (now: number) => {
      raf = 0
      if (!scene || !visible || document.hidden) return
      scene.frame(now)
      placeLabels()
      // follow the persona colours when the visitor picks who they are
      if (++tick % 30 === 0) {
        const pal = readPalette(box)
        const key = JSON.stringify(pal)
        if (key !== lastPalette) { lastPalette = key; scene.setPalette(pal) }
      }
      raf = requestAnimationFrame(loop)
    }
    const wake = () => { if (!raf && visible && scene) raf = requestAnimationFrame(loop) }

    const start = async () => {
      started = true
      if (!webglAvailable()) { setMode('flat'); return }
      try {
        const { createHarbourScene } = await import('./harbour/scene')
        if (cancelled) return
        const light = window.matchMedia('(max-width: 767px), (pointer: coarse)').matches
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        const pal = readPalette(box)
        lastPalette = JSON.stringify(pal)
        scene = createHarbourScene(canvas, pal, { light, reduced })
        sceneRef.current = scene
        scene.resize(box.clientWidth, box.clientHeight)
        setMode('3d')
        wake()
      } catch {
        setMode('flat')
      }
    }

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting
      if (visible && !started) start()
      wake()
    }, { rootMargin: '400px 0px' })
    io.observe(box)
    const ro = new ResizeObserver(() => { scene?.resize(box.clientWidth, box.clientHeight); wake() })
    ro.observe(box)
    document.addEventListener('visibilitychange', wake)

    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      io.disconnect()
      ro.disconnect()
      document.removeEventListener('visibilitychange', wake)
      scene?.dispose()
      sceneRef.current = null
    }
  }, [])

  /* fly to the town and move focus to its panel */
  const open = (id: CityId) => {
    setCity(id)
    const box = boxRef.current
    const phone = !!box && box.clientWidth < 640
    sceneRef.current?.setPanel(box ? (phone ? { side: 'bottom', size: box.clientHeight * 0.62 } : { side: 'right', size: 412 }) : null)
    sceneRef.current?.flyTo(id)
    window.setTimeout(() => panelRef.current?.focus(), 60)
  }
  const close = () => {
    const was = city
    setCity(null)
    sceneRef.current?.setPanel(null)
    sceneRef.current?.flyTo(null)
    if (was) labelRefs.current[was]?.focus()
  }

  useEffect(() => {
    if (!city) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const shown = city ? byCity(city) : []

  return (
    <section className="container-x pt-28" aria-labelledby="map-title">
      <p className="eyebrow">{home.mapEyebrow}</p>
      <h2 id="map-title" className="mt-2 font-black uppercase leading-none" style={fit(TITLE, 'clamp(2.1rem, 5vw, 3.75rem)', '2.75rem')}>{TITLE}</h2>
      <p className="mt-4 max-w-xl text-lg leading-relaxed text-muted">{home.mapText}</p>

      <div className="mt-8">
        {mode === 'flat' ? <FlatMap /> : (
          <div ref={boxRef} data-no-highlight className={`world ${mode === 'loading' ? 'is-loading' : ''} ${city ? 'has-panel' : ''}`}
            role="region" aria-label="3D map of hoi across the Northwest. Choose a town to see its events.">
            <canvas ref={canvasRef} className="world-canvas" aria-hidden="true" />

            {ORDER.map((id) => {
              const n = byCity(id).length
              return (
                <button key={id} type="button" ref={(el) => { labelRefs.current[id] = el }}
                  className={`world-label ${id === 'bremen' ? 'is-hq' : ''} ${city === id ? 'is-on' : ''} is-off`}
                  aria-pressed={city === id} onClick={() => (city === id ? close() : open(id))}>
                  {id === 'bremen' ? <><b>hoi</b> Bremen</> : CITIES[id].name}
                  {n > 0 && <span className="world-count">{n}</span>}
                </button>
              )
            })}

            {mode === 'loading' && <p className="world-loading">Loading the map…</p>}

            <div className="world-ui">
              <button type="button" onClick={() => sceneRef.current?.zoom(0.75)} aria-label="Zoom in">+</button>
              <button type="button" onClick={() => sceneRef.current?.zoom(1.33)} aria-label="Zoom out">−</button>
              <button type="button" onClick={close} aria-label="Show the whole map">⟲</button>
            </div>
            <p className="world-hint" aria-hidden="true">
              <span className="only-fine">Drag to look around · </span><span className="only-coarse">Two fingers to move · </span>tap a town
            </p>

            {city && (
              <aside className="world-panel" aria-labelledby="world-panel-title">
                <div className="world-panel-head">
                  <p className="world-panel-kicker">{city === 'bremen' ? 'hoi startup factory' : 'Northwest'}</p>
                  <h3 id="world-panel-title" ref={panelRef} tabIndex={-1}>{CITIES[city].name}</h3>
                  <button type="button" className="world-panel-close" onClick={close} aria-label="Close">×</button>
                </div>
                <div className="world-panel-body">
                  {city === 'bremen' && <p className="world-panel-hq">Our home: {settings.address}</p>}
                  <p className="world-panel-count">
                    {shown.length === 0 ? 'No events here right now.' : `${shown.length} ${shown.length === 1 ? 'event' : 'events'} here`}
                  </p>
                  <ul className="world-events">
                    {shown.map((ev) => <PanelEvent key={ev.id} ev={ev} email={settings.email} />)}
                  </ul>
                  <a href="/events" className="world-all group">See all events <Arrow /></a>
                </div>
              </aside>
            )}
          </div>
        )}
      </div>
    </section>
  )
}

function PanelEvent({ ev, email }: { ev: HoiEvent; email: string }) {
  const external = ev.link?.startsWith('http')
  return (
    <li className="world-event">
      <span className="world-event-bar" style={{ '--g': ev.gradient } as React.CSSProperties} aria-hidden="true" />
      <div className="min-w-0">
        <p className="world-event-label">{ev.label} · {ev.partner}</p>
        <p className="world-event-title" lang="de">{ev.title}</p>
        {ev.meta.length > 0 && <p className="world-event-meta">{ev.meta.join(' · ')}</p>}
        <div className="world-event-links">
          {ev.link && (
            <a href={ev.link} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>More info</a>
          )}
          <a href={`mailto:${email}?subject=${encodeURIComponent(stegaClean(ev.title))}`}>Ask about this</a>
        </div>
      </div>
    </li>
  )
}
