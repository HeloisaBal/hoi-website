'use client'

import { useContent } from './ContentContext'
import { fit } from './shared'

/* "Who we are": who hoi is and why it exists, in a few lines
   (Sanity → Homepage → Who we are). */

export function WhoWeAre() {
  const { home } = useContent()
  return (
    <section id="who" className="container-x pt-24 sm:pt-28" aria-labelledby="who-title">
      <div className="who-card reveal grid items-center gap-10 rounded-[2rem] p-8 sm:p-12 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <p className="eyebrow">{home.whoEyebrow}</p>
          <h2 id="who-title" className="mt-2 font-black uppercase leading-none" style={fit(home.whoTitle, 'clamp(2rem, 4.4vw, 3.4rem)', '6rem')}>
            {home.whoTitle}
          </h2>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">{home.whoText}</p>
        </div>
        <ol className="who-points">
          {home.whoPoints.map((pt, i) => (
            <li key={pt}><span className="who-num" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>{pt}</li>
          ))}
        </ol>
      </div>
    </section>
  )
}
