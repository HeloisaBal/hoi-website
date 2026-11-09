'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

/* Site header: transparent over the hero, frosted once the page scrolls. */
export function Header({ active }: { active?: 'home' | 'events' }) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={`site-header sticky top-0 z-50 ${scrolled ? 'is-scrolled' : ''}`}>
      <div className="container-x flex h-16 items-center justify-between gap-3 sm:h-[72px]">
        <Link href="/" aria-label="hoi startup factory, home" className="shrink-0">
          <img src="/logo.png" alt="hoi startup factory" className="h-8 w-auto sm:h-9" />
        </Link>
        <nav aria-label="Main" className="flex items-center gap-2 text-[15px] font-medium sm:gap-1">
          <Link href="/events" aria-current={active === 'events' ? 'page' : undefined}
            className={`nav-link hidden sm:inline-flex ${active === 'events' ? 'is-active' : ''}`}>Events</Link>
          <Link href="/#programmes" className="nav-link hidden sm:inline-flex">Programmes</Link>
          <Link href="/#about" className="nav-link hidden sm:inline-flex">About</Link>
          <span className="mx-1 flex gap-0.5 rounded-full border border-line bg-white/70 p-1 text-xs font-semibold sm:mx-3">
            <button type="button" className="rounded-full px-2.5 py-1 text-muted transition-colors hover:text-ink">DE</button>
            <button type="button" aria-pressed="true" className="rounded-full bg-ink px-2.5 py-1 text-white">EN</button>
          </span>
          <Link href="/#contact" className="btn-primary h-10 px-4 text-sm sm:px-5">Say hoi</Link>
        </nav>
      </div>
    </header>
  )
}
