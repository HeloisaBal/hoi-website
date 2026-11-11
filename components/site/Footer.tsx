'use client'

import Link from 'next/link'
import { useContent } from './ContentContext'

export function Footer({ onReset }: { onReset?: () => void }) {
  const { settings } = useContent()
  return (
    <footer data-no-highlight className="container-x flex flex-wrap items-center justify-between gap-6 py-14 text-sm text-muted">
      <div className="flex items-center gap-5">
        <Link href="/"><img src="/logo.png" alt="hoi startup factory" className="h-7 w-auto" /></Link>
        <span>{settings.address}</span>
      </div>
      <div className="flex flex-wrap gap-6">
        <Link href="/events" className="hover:text-ink">Events</Link>
        <a href={settings.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-ink">Instagram</a>
        <a href={settings.linkedin} target="_blank" rel="noopener noreferrer" className="hover:text-ink">LinkedIn</a>
        <a href="#" className="hover:text-ink">Impressum</a>
        <a href="#" className="hover:text-ink">Datenschutz</a>
        {onReset && (
          <button type="button" onClick={onReset} className="hover:text-ink">Reset personalisation</button>
        )}
      </div>
    </footer>
  )
}
