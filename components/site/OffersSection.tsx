'use client'

import { useContent } from './ContentContext'
import type { PersonaId } from './data'
import { askHoi } from './chat/ask'
import { Arrow, fit } from './shared'

/* ------------------------------------------------------------
   "What hoi offers you": the heart of the homepage. Every offer
   (Sanity → Offers), with the ones for the visitor's path first and
   marked "For you". Each card can open the chatbot with a question
   about that offer.
   ------------------------------------------------------------ */

export function OffersSection({ persona, plural }: { persona: PersonaId | null; plural?: string }) {
  const { offers, home } = useContent()
  if (!offers.length) return null
  const mine = (forWho: PersonaId[]) => !!persona && forWho.includes(persona)
  const sorted = persona ? [...offers].sort((a, b) => Number(mine(b.for)) - Number(mine(a.for))) : offers
  const title = plural ? `${home.offersTitle} ${plural}` : home.offersTitle

  return (
    <section id="offers" className="container-x pt-24 sm:pt-28" aria-labelledby="offers-title">
      <div className="reveal max-w-3xl">
        <p className="eyebrow">{home.offersEyebrow}</p>
        <h2 id="offers-title" className="mt-2 font-black uppercase leading-none" style={fit(title, 'clamp(2.1rem, 5vw, 3.75rem)', '2.75rem')}>
          {title}
        </h2>
        <p className="mt-5 text-lg leading-relaxed text-muted">{home.offersIntro}</p>
      </div>

      <ul className="offers-grid mt-12">
        {sorted.map((o) => {
          const forYou = mine(o.for)
          return (
            <li key={o.id} className={`offer-card reveal ${forYou ? 'is-mine' : ''}`}>
              <div className="flex items-start justify-between gap-3">
                <h3 className="offer-name">{o.name}</h3>
                {forYou && <span className="offer-tag">{home.forYouLabel}</span>}
              </div>
              <p className="offer-tagline">{o.tagline}</p>
              <p className="offer-text">{o.text}</p>
              {o.points.length > 0 && (
                <ul className="offer-points">
                  {o.points.map((pt) => <li key={pt}>{pt}</li>)}
                </ul>
              )}
              <button type="button" className="offer-ask group" onClick={() => askHoi(`Tell me more about ${o.name}`)}>
                {home.askLabel} <Arrow />
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
