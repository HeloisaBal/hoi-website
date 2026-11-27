'use client'

import { useState } from 'react'
import { useContent } from './ContentContext'
import type { PersonaId } from './data'
import { askHoi } from './chat/ask'
import { Arrow } from './shared'

/* ------------------------------------------------------------
   What hoi offers (clean direction): a numbered list, like an
   index. Each programme opens in place to show what it is, what
   you get and a button that asks the chatbot about it. The ones
   for the visitor's path come first, marked "For you".
   Content: Sanity → Offers, texts under Homepage → Offers.
   ------------------------------------------------------------ */

export function OffersSection({ persona, open: openProp, onOpen }: {
  persona: PersonaId | null
  /** which programme is open, when the page controls it (the chosen path opens its first one) */
  open?: string | null
  onOpen?: (id: string | null) => void
}) {
  const { offers, home } = useContent()
  const [openLocal, setOpenLocal] = useState<string | null>(null)
  const open = openProp !== undefined ? openProp : openLocal
  const setOpen = onOpen ?? setOpenLocal
  if (!offers.length) return null
  const mine = (forWho: PersonaId[]) => !!persona && forWho.includes(persona)
  const sorted = persona ? [...offers].sort((a, b) => Number(mine(b.for)) - Number(mine(a.for))) : offers

  return (
    <section id="offers" className="wrap scroll-mt-24 pt-28 sm:pt-40" aria-labelledby="offers-title">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.9fr)] lg:gap-24">
        <div>
          <p className="mono text-accent">{home.offersEyebrow}</p>
          <h2 id="offers-title" className="disp mt-4 text-[clamp(3.4rem,7.5vw,7.5rem)]">{home.offersTitle}</h2>
          <p className="c-lede mt-7 max-w-md">{home.offersIntro}</p>
        </div>

        <ol className="c-rows">
          {sorted.map((o, i) => {
            const isOpen = open === o.id
            const panel = `offer-${o.id}`
            return (
              <li key={o.id} id={`programme-${o.id}`} className="c-row scroll-mt-28">
                <h3>
                  <button type="button" className="c-row-btn" aria-expanded={isOpen} aria-controls={panel}
                    onClick={() => setOpen(isOpen ? null : o.id)}>
                    <span className="mono text-sm text-muted">{String(i + 1).padStart(2, '0')}</span>
                    <span>
                      <span className="disp c-row-name">
                        {o.name}
                        {mine(o.for) && <span className="mono c-tag">{home.forYouLabel}</span>}
                      </span>
                      <span className="mt-2 block font-sans text-lg italic normal-case text-muted">{o.tagline}</span>
                    </span>
                    <span className="c-row-sign" aria-hidden="true">+</span>
                  </button>
                </h3>
                <div id={panel} hidden={!isOpen} className="pb-8 md:pl-[5.5rem]">
                  <p className="max-w-2xl text-lg leading-relaxed">{o.text}</p>
                  {o.points.length > 0 && (
                    <ul className="mt-5 grid max-w-2xl gap-2">
                      {o.points.map((pt) => (
                        <li key={pt} className="flex gap-3 text-lg"><span className="mt-[.7em] h-1.5 w-1.5 shrink-0 bg-accent" aria-hidden="true" />{pt}</li>
                      ))}
                    </ul>
                  )}
                  <button type="button" className="mono slide-link c-under mt-7 w-full max-w-xs" onClick={() => askHoi(`Tell me more about ${o.name}`)}>
                    {home.askLabel} <span className="slide-arrow"><Arrow /></span>
                  </button>
                </div>
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}
