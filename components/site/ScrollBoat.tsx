'use client'

import { useRef } from 'react'
import { clamp, useScrollFrame } from './useScrollFrame'

/* ------------------------------------------------------------
   Scroll idea S8: the hoi house that shows how far down the page
   you are. Wide screens: it sails down a winding route on the right
   edge to the "hoi" harbour. Narrower screens: a thin bar at the
   bottom. Decorative only (hidden from screen readers).
   ------------------------------------------------------------ */

/** The hoi house from the logo: slanted roof with the window cut out. */
function Boat() {
  return (
    <svg viewBox="0 0 100 100" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M0 0 L100 14 L100 100 L0 100 Z M44 42 H56 V66 H44 Z" />
    </svg>
  )
}

export function ScrollBoat() {
  const routeRef = useRef<HTMLDivElement>(null)
  const pathRef = useRef<SVGPathElement>(null)
  const boatRef = useRef<HTMLSpanElement>(null)
  const barRef = useRef<HTMLDivElement>(null)
  const barBoatRef = useRef<HTMLSpanElement>(null)

  useScrollFrame(() => {
    const doc = document.documentElement
    const p = clamp(window.scrollY / (doc.scrollHeight - window.innerHeight || 1), 0, 1)

    const route = routeRef.current
    const path = pathRef.current
    const boat = boatRef.current
    if (route && path && boat && route.getClientRects().length) { // fixed elements have no offsetParent
      const len = path.getTotalLength()
      const pt = path.getPointAtLength(p * len)
      const x = (pt.x / 34) * route.clientWidth
      const y = (pt.y / 100) * route.clientHeight
      boat.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`
    }

    const bar = barRef.current
    const barBoat = barBoatRef.current
    if (bar && barBoat && bar.offsetParent) {
      barBoat.style.transform = `translateX(${(p * bar.clientWidth).toFixed(1)}px)`
    }
  })

  return (
    <>
      <div ref={routeRef} className="boat-route" aria-hidden="true">
        <svg viewBox="0 0 34 100" preserveAspectRatio="none">
          <path ref={pathRef} d="M17 0 C30 12 4 24 17 36 S30 60 17 72 S4 90 17 100" vectorEffect="non-scaling-stroke" />
        </svg>
        <span className="boat-harbour">hoi</span>
        <span ref={boatRef} className="boat"><Boat /></span>
      </div>
      <div className="boat-bar" aria-hidden="true">
        <div ref={barRef} className="boat-bar-line">
          <span ref={barBoatRef} className="boat boat-small"><Boat /></span>
        </div>
      </div>
    </>
  )
}
