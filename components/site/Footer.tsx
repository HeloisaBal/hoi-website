'use client'

import Link from 'next/link'
import { useContent } from './ContentContext'

/* Footer (clean direction): dark, continues the contact section above it. */
export function Footer({ onReset }: { onReset?: () => void }) {
  const { settings } = useContent()
  return (
    <footer data-no-highlight className="c-dark">
      <div className="wrap flex flex-wrap items-center justify-between gap-6 border-t border-white/15 py-10">
        <Link href="/" aria-label="hoi startup factory, home"><img src="/logo-white.png" alt="hoi startup factory" className="h-7 w-auto" /></Link>
        <div className="mono flex flex-wrap gap-x-7 gap-y-3 text-white/75">
          <span>{settings.address}</span>
          <Link href="/events" className="hover:text-white">Events</Link>
          <a href={settings.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-white">Instagram</a>
          <a href={settings.linkedin} target="_blank" rel="noopener noreferrer" className="hover:text-white">LinkedIn</a>
          <Link href="/impressum" className="hover:text-white">Impressum</Link>
          <Link href="/datenschutz" className="hover:text-white">Datenschutz</Link>
          {onReset && <button type="button" onClick={onReset} className="mono hover:text-white">Reset personalisation</button>}
        </div>
      </div>
    </footer>
  )
}
