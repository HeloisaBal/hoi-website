'use client'

import { useEffect, useRef } from 'react'
import { startSparkleTrail } from './sparkleTrail'

/* ------------------------------------------------------------
   The one pointer effect of the clean direction: GroundUp's
   sparkle trail in hoi teal, blue and purple (sparkleTrail.ts).
   Mouse only; nothing on touch screens or with reduced motion.
   Mount once per page.
   ------------------------------------------------------------ */

export function PointerEffects() {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => (ref.current ? startSparkleTrail(ref.current) : undefined), [])
  return <canvas ref={ref} className="sparkles" aria-hidden="true" />
}
