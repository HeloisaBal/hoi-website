'use client'

import { useContent } from './ContentContext'

/* "Who we are" (clean direction): one statement in large serif, the
   points as a plain list beside it (Sanity → Homepage → Who we are). */

export function WhoWeAre() {
  const { home } = useContent()
  return (
    <section id="who" className="wrap scroll-mt-24 pt-28 sm:pt-40" aria-labelledby="who-title">
      <p className="mono text-accent">{home.whoEyebrow}</p>
      <div className="mt-6 grid gap-12 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:gap-24">
        <div>
          <h2 id="who-title" className="disp text-[clamp(2.6rem,5vw,4.5rem)]">{home.whoTitle}</h2>
          <p className="mt-8 text-[clamp(1.35rem,2.2vw,1.9rem)] leading-snug">{home.whoText}</p>
        </div>
        <ul className="c-rows self-end">
          {home.whoPoints.map((pt) => (
            <li key={pt} className="c-row py-4 text-lg">{pt}</li>
          ))}
        </ul>
      </div>
    </section>
  )
}
