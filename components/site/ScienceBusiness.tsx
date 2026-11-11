'use client'

import { useRef } from 'react'
import { fit } from './shared'
import { useContent } from './ContentContext'
import { motionAllowed, sectionProgress, useScrollFrame } from './useScrollFrame'

/* ------------------------------------------------------------
   Scroll idea S3: Science <-> Business. Two columns move in opposite
   directions as you scroll and meet at hoi in the middle.
   Words and titles are edited in Sanity (Homepage → Science & business).
   Reduced motion: a still, three-column layout.
   ------------------------------------------------------------ */


export function ScienceBusiness() {
  const { home } = useContent()
  const TITLE = home.sbTitle
  const sectionRef = useRef<HTMLElement>(null)
  const leftRef = useRef<HTMLUListElement>(null)
  const rightRef = useRef<HTMLUListElement>(null)
  const hubRef = useRef<HTMLDivElement>(null)

  useScrollFrame(() => {
    const section = sectionRef.current
    if (!section || !leftRef.current || !rightRef.current || !hubRef.current || !motionAllowed()) return
    const p = sectionProgress(section)
    const shift = (p - 0.5) * window.innerHeight * 0.9
    leftRef.current.style.transform = `translate3d(0, ${(-shift).toFixed(1)}px, 0)`
    rightRef.current.style.transform = `translate3d(0, ${shift.toFixed(1)}px, 0)`
    hubRef.current.style.transform = `scale(${(0.7 + Math.sin(p * Math.PI) * 0.55).toFixed(3)}) rotate(${((p - 0.5) * 40).toFixed(1)}deg)`
  })

  return (
    <section ref={sectionRef} className="sb" aria-labelledby="sb-title">
      <div className="sb-pin">
        <div className="container-x sb-head">
          <p className="eyebrow">{home.sbEyebrow}</p>
          <h2 id="sb-title" className="mt-2 font-black uppercase leading-none" style={fit(TITLE, 'clamp(2.1rem, 5vw, 3.75rem)', '2.75rem')}>{TITLE}</h2>
        </div>
        <div className="sb-cols">
          <div className="sb-col sb-left">
            <h3>Science</h3>
            <div className="sb-track"><ul ref={leftRef}>{home.scienceWords.map((w, i) => <li key={i}>{w}</li>)}</ul></div>
          </div>
          <div ref={hubRef} className="sb-hub" aria-hidden="true">hoi</div>
          <div className="sb-col sb-right">
            <h3>Business</h3>
            <div className="sb-track"><ul ref={rightRef}>{home.businessWords.map((w, i) => <li key={i}>{w}</li>)}</ul></div>
          </div>
        </div>
      </div>
    </section>
  )
}
