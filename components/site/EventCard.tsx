'use client'

import type { HoiEvent } from './data'
import { Arrow, stegaClean } from './shared'
import { useContent } from './ContentContext'

/**
 * One event, styled like hoi's Instagram announcement posts.
 * `match`: fits the visitor's persona (others are faded).
 * `picked`: show the "Picked for you" tag.
 * `row`: narrower card used in the homepage's swipe row on phones.
 */
export function EventCard({ ev, match = true, picked = false, row = false, showAsk = false, style }: {
  ev: HoiEvent
  match?: boolean
  picked?: boolean
  row?: boolean
  showAsk?: boolean
  style?: React.CSSProperties
}) {
  const { settings } = useContent()
  const size = row
    ? 'min-h-[320px] w-[80%] shrink-0 snap-start sm:min-h-[380px] sm:w-auto'
    : 'min-h-[360px] sm:min-h-[400px]'
  return (
    <article data-spotlight="light" data-tilt
      className={`lift relative flex flex-col rounded-[1.4rem] p-6 text-white ${size} ${match ? '' : 'opacity-55 saturate-50'}`}
      style={{ background: ev.gradient, ...style }}>
      <div className="flex items-start justify-between gap-3">
        <span className="rounded-md border-[1.5px] border-white/80 px-2.5 py-1 text-sm font-bold">{ev.partner}</span>
        {picked && match && (
          <span className="swap-in shrink-0 whitespace-nowrap rounded-full bg-white px-2.5 py-1 text-xs font-bold text-ink">Picked for you</span>
        )}
      </div>
      <span className="pill mt-auto self-start">{ev.label}</span>
      <h3 lang="de" className="mt-3 text-[clamp(1.45rem,2.1vw,1.85rem)] font-extrabold uppercase leading-none hyphens-auto">{ev.title}</h3>
      <p className="mt-5 text-sm leading-relaxed text-white/90">
        {ev.meta.map((m) => <span key={m} className="block">{m}</span>)}
      </p>
      {showAsk && (
        <div className="mt-6 flex flex-wrap gap-2">
          {ev.link && (
            <a href={ev.link} {...(ev.link.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              className="group inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:-translate-y-0.5">
              More info <Arrow />
            </a>
          )}
          <a href={`mailto:${settings.email}?subject=${encodeURIComponent(stegaClean(ev.title).replace(/\u00ad/g, ''))}`}
            className="group inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold backdrop-blur-sm transition hover:bg-white hover:text-ink">
            Ask about this <Arrow />
          </a>
        </div>
      )}
    </article>
  )
}
