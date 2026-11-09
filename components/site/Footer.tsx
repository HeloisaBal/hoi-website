'use client'

import Link from 'next/link'

export function Footer({ onReset }: { onReset?: () => void }) {
  return (
    <footer className="container-x flex flex-wrap items-center justify-between gap-6 py-14 text-sm text-muted">
      <div className="flex items-center gap-5">
        <Link href="/"><img src="/logo.png" alt="hoi startup factory" className="h-7 w-auto" /></Link>
        <span>Arberger Hafendamm 1 · 28309 Bremen</span>
      </div>
      <div className="flex flex-wrap gap-6">
        <Link href="/events" className="hover:text-ink">Events</Link>
        <a href="https://www.instagram.com/hoi_startup_factory/" className="hover:text-ink">Instagram</a>
        <a href="https://www.linkedin.com/company/hoi-startup-factory/" className="hover:text-ink">LinkedIn</a>
        <a href="#" className="hover:text-ink">Impressum</a>
        <a href="#" className="hover:text-ink">Datenschutz</a>
        {onReset && (
          <button type="button" onClick={onReset} className="hover:text-ink">Reset personalisation</button>
        )}
      </div>
    </footer>
  )
}
