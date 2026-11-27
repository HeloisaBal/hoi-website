'use client'

import { useContent } from './ContentContext'
import type { Persona } from './data'
import { useVisitor } from './VisitorContext'
import { askHoi } from './chat/ask'
import { Arrow, stegaClean } from './shared'

/* Contact (clean direction): dark block, personal once we know the
   visitor's name and path. Used on the homepage and persona pages. */

export function ContactSection({ current }: { current: Persona | null }) {
  const { home, settings, team, chatbot } = useContent()
  const { firstName } = useVisitor()
  const mailSubject = encodeURIComponent(
    stegaClean(`Hoi! ${firstName ? `I'm ${firstName}, ` : ''}${current ? current.chip : 'a question'}`),
  )
  const mail = `mailto:${settings.email}?subject=${mailSubject}`

  return (
    <section id="contact" className="c-dark scroll-mt-20" aria-labelledby="contact-title" data-no-highlight>
      <div className="wrap grid gap-16 pb-24 pt-24 sm:pt-32 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div>
          <h2 id="contact-title" className="disp text-[clamp(3.4rem,8.5vw,8.5rem)]">
            {firstName ? `Hoi ${firstName}, we’re listening.` : home.contactTitle}
          </h2>
          <p className="c-lede mt-8 max-w-lg text-white/80">
            {current ? `Tell us about yourself. We talk to ${current.plural} every week and love hearing new ideas.` : home.contactText}
          </p>
          <a href={mail} className="mt-10 inline-block break-all text-[clamp(1.4rem,2.6vw,2.3rem)] underline decoration-1 underline-offset-8 hover:text-teal-400">
            {settings.email}
          </a>
          <div className="mt-14 grid max-w-2xl gap-8 sm:grid-cols-2">
            <a href={mail} className="slide-link c-under text-xl hover:!text-teal-400">
              {home.contactButton} <span className="slide-arrow"><Arrow /></span>
            </a>
            {chatbot.enabled && (
              <button type="button" onClick={() => askHoi('')} className="slide-link c-under text-left text-xl hover:!text-teal-400">
                {chatbot.buttonLabel} <span className="slide-arrow"><Arrow /></span>
              </button>
            )}
          </div>
        </div>
        <ul className="grid grid-cols-2 gap-5 self-end">
          {team.slice(0, 4).map((t) => (
            <li key={t.name}>
              {t.photoUrl && (
                <img src={`${t.photoUrl}?w=480&h=600&fit=crop&auto=format`} alt={t.photoAlt || t.name}
                  className="mb-4 aspect-[4/5] w-full object-cover grayscale" loading="lazy" />
              )}
              <p className="text-xl">{t.name}</p>
              <p className="mono mt-1 text-white/60">{t.role}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
