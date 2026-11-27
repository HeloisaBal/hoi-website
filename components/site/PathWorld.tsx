'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { Persona, PersonaId } from './data'
import type { PathWorld as World } from './harbour/pathWorld'
import { Arrow, themeVars } from './shared'

/* ------------------------------------------------------------
   Choosing a path on landing: a full-screen 3D landscape (see
   harbour/pathWorld.ts) with one district per main path (founder,
   investor, company). Drag to look around, hover a district to lift
   it, click it (or its label) to fly there and choose that path.
   `top` and `bottom` float over the map (the question, the other
   options).

   The labels are real buttons, so it all works by keyboard and
   screen reader. three.js loads after the first paint; without
   WebGL the three path cards show instead. Reduced motion: no
   flying, drifting or sailing.
   ------------------------------------------------------------ */

function webglAvailable() {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

export function PathWorld({ paths, selected, hint, cursorLabel, backLabel, onChoose, top, bottom }: {
  paths: Persona[]
  /** label of the button that flies back to the overview after a district is chosen */
  backLabel?: string
  top: ReactNode
  bottom?: ReactNode
  selected: PersonaId | null
  hint: string
  /** label next to the hoi cursor over an island */
  cursorLabel: string
  /** called once the camera has arrived; `from` is where the colour change starts */
  onChoose: (id: PersonaId, from: { x: number; y: number }) => void
}) {
  const boxRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const worldRef = useRef<World | null>(null)
  const labelRefs = useRef<Partial<Record<PersonaId, HTMLButtonElement | null>>>({})
  const busy = useRef(false)
  const [mode, setMode] = useState<'loading' | '3d' | 'flat'>('loading')
  /** the camera is close to a chosen district (shows the "back to overview" button) */
  const [zoomed, setZoomed] = useState(false)

  useEffect(() => {
    const box = boxRef.current
    const canvas = canvasRef.current
    if (!box || !canvas) return
    let cancelled = false
    let raf = 0
    let visible = true
    let world: World | null = null

    const place = () => {
      if (!world) return
      const pos = world.labelPositions()
      for (const p of paths) {
        const el = labelRefs.current[p.id]
        const at = pos[p.id]
        if (!el || !at) continue
        const half = el.offsetWidth / 2 + 6
        const x = Math.min(box.clientWidth - half, Math.max(half, at.x))
        // keep labels clear of the question at the top and the options at the bottom
        const topBox = box.querySelector<HTMLElement>('.path-world-top')
        const bottomBox = box.querySelector<HTMLElement>('.path-world-bottom')
        const minY = (topBox ? topBox.offsetTop + topBox.offsetHeight : 0) + el.offsetHeight + 16
        const maxY = (bottomBox ? bottomBox.offsetTop : box.clientHeight) - 16
        const y = Math.min(maxY, Math.max(minY, at.y))
        el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -100%)`
      }
    }
    const loop = (now: number) => {
      raf = 0
      if (!world || !visible || document.hidden) return
      world.frame(now)
      place()
      raf = requestAnimationFrame(loop)
    }
    const wake = () => { if (!raf && visible && world) raf = requestAnimationFrame(loop) }

    ;(async () => {
      if (!webglAvailable()) { setMode('flat'); return }
      try {
        const { createPathWorld } = await import('./harbour/pathWorld')
        if (cancelled) return
        const light = window.matchMedia('(max-width: 767px), (pointer: coarse)').matches
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        const tall = box.clientWidth / box.clientHeight < 0.9
        // the haze on the horizon blends into the page background
        const fog = getComputedStyle(box).getPropertyValue('--tint').trim() || '#f8f0ff'
        world = createPathWorld(canvas, paths.map((p) => ({ id: p.id, theme: p.theme })), { light, reduced, tall, fog })
        worldRef.current = world
        world.resize(box.clientWidth, box.clientHeight)
        setMode('3d')
        wake()
      } catch {
        setMode('flat')
      }
    })()

    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; wake() })
    io.observe(box)
    const ro = new ResizeObserver(() => { world?.resize(box.clientWidth, box.clientHeight); wake() })
    ro.observe(box)
    document.addEventListener('visibilitychange', wake)
    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      io.disconnect()
      ro.disconnect()
      document.removeEventListener('visibilitychange', wake)
      world?.dispose()
      worldRef.current = null
    }
    // the world is built once; the paths come from Sanity and don't change while the page is open
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* the page cleared the path ("Just looking around", reset): fly back to the overview */
  useEffect(() => {
    if (selected) return
    worldRef.current?.flyTo(null)
    setZoomed(false) // eslint-disable-line react-hooks/set-state-in-effect -- follows the page's choice
  }, [selected])

  /** back to the whole map; the chosen path stays chosen */
  function overview() {
    worldRef.current?.flyTo(null, true)
    setZoomed(false)
  }

  function choose(id: PersonaId) {
    if (busy.current) return
    busy.current = true
    const label = labelRefs.current[id]
    const r = label?.getBoundingClientRect()
    const from = r ? { x: r.left + r.width / 2, y: r.bottom + 40 } : { x: window.innerWidth / 2, y: window.innerHeight / 2 }
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    worldRef.current?.flyTo(id)
    if (worldRef.current) setZoomed(true)
    window.setTimeout(() => { busy.current = false; onChoose(id, from) }, reduced || !worldRef.current ? 0 : 850)
  }

  /* clicks on the canvas: an island is chosen unless the visitor was dragging */
  const down = useRef<{ x: number; y: number } | null>(null)
  const rel = (e: React.PointerEvent) => {
    const r = canvasRef.current!.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }
  const [hot, setHot] = useState<PersonaId | null>(null)
  const setHover = (id: PersonaId | null) => {
    setHot(id)
    worldRef.current?.hover(id)
  }

  if (mode === 'flat') {
    return (
      <div className="container-x flex flex-col items-center py-16 text-center">
        {top}
        <div className="path-grid mt-10 w-full">
        {paths.map((p) => (
          <button key={p.id} type="button" onClick={() => onChoose(p.id, { x: window.innerWidth / 2, y: window.innerHeight / 2 })}
            aria-pressed={selected === p.id} className="path-card group" style={themeVars(p.theme)} data-cursor={cursorLabel}>
            <span className="path-word" aria-hidden="true">{p.word}</span>
            <span className="path-label">{p.pathLabel}</span>
            <span className="path-text">{p.pathText}</span>
            <span className="path-go" aria-hidden="true"><Arrow /></span>
          </button>
        ))}
        </div>
        {bottom}
      </div>
    )
  }

  return (
    <div ref={boxRef} className={`path-world ${mode === '3d' ? 'is-ready' : ''}`} data-cursor={hot ? cursorLabel : undefined}>
      <canvas ref={canvasRef} className="path-world-canvas" aria-hidden="true"
        onPointerDown={(e) => { down.current = rel(e) }}
        onPointerMove={(e) => {
          if (e.pointerType !== 'mouse' || !worldRef.current) return
          const { x, y } = rel(e)
          const id = worldRef.current.pickAt(x, y)
          if (id !== hot) setHover(id)
        }}
        onPointerLeave={() => setHover(null)}
        onPointerUp={(e) => {
          const start = down.current
          down.current = null
          if (!start || !worldRef.current) return
          const { x, y } = rel(e)
          if (Math.hypot(x - start.x, y - start.y) > 6) return
          const id = worldRef.current.pickAt(x, y)
          if (id) choose(id)
        }} />
      <div role="group" aria-label="Choose your path" className="path-world-labels">
        {paths.map((p, i) => (
          <button key={p.id} ref={(el) => { labelRefs.current[p.id] = el }} type="button" data-slot={i}
            className={`path-pin ${hot === p.id ? 'is-hot' : ''}`} style={themeVars(p.theme)} aria-pressed={selected === p.id}
            data-cursor={cursorLabel}
            onClick={() => choose(p.id)} onMouseEnter={() => setHover(p.id)} onMouseLeave={() => setHover(null)}
            onFocus={() => setHover(p.id)} onBlur={() => setHover(null)}>
            <span className="path-pin-label">{p.pathLabel}</span>
            <span className="path-pin-text">{p.pathText}</span>
            <span className="path-pin-go" aria-hidden="true"><Arrow /></span>
          </button>
        ))}
      </div>
      <div className="path-world-top">{top}</div>
      {mode === '3d' && (
        <div className="path-world-zoom" role="group" aria-label="Map zoom">
          <button type="button" aria-label="Zoom in" onClick={() => worldRef.current?.zoomBy(0.8)}>+</button>
          <button type="button" aria-label="Zoom out" onClick={() => worldRef.current?.zoomBy(1.25)}>−</button>
        </div>
      )}
      {zoomed && backLabel && (
        <button type="button" onClick={overview} className="path-world-back mono">
          <span aria-hidden="true">←</span> {backLabel}
        </button>
      )}
      <div className="path-world-bottom">
        {hint && <p className="path-world-hint" aria-hidden="true">{hint}</p>}
        {bottom}
      </div>
    </div>
  )
}
