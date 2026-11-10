'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Arrow } from './shared'
import { useSlidingIndicator } from './useSlidingIndicator'

const links = [
  { href: '/events', label: 'Events', key: 'events' },
  { href: '/#programmes', label: 'Programmes', key: 'programmes' },
  { href: '/#about', label: 'About', key: 'about' },
  { href: '/#contact', label: 'Contact', key: 'contact' },
] as const

function LangSwitch({ className = '' }: { className?: string }) {
  return (
    <span className={`flex gap-0.5 rounded-full border border-line bg-white/70 p-1 text-xs font-semibold ${className}`}>
      <button type="button" className="rounded-full px-2.5 py-1 text-muted transition-colors hover:text-ink">DE</button>
      <button type="button" aria-pressed="true" className="rounded-full bg-ink px-2.5 py-1 text-white">EN</button>
    </span>
  )
}

/* Links in the full-screen phone menu, with the sliding highlight (effect 4).
   Its own component so the highlight attaches when the menu opens. */
function MobileLinks({ active, onNavigate }: { active?: string; onNavigate: () => void }) {
  const listRef = useSlidingIndicator<HTMLUListElement>('.menu-link')
  return (
    <ul ref={listRef} className="relative isolate flex flex-col">
      <span data-indicator aria-hidden="true" className="menu-indicator" />
      {links.map((l, i) => (
        <li key={l.key} className="rise border-b border-line" style={{ animationDelay: `${0.05 + i * 0.06}s` }}>
          <Link href={l.href} onClick={onNavigate} aria-current={active === l.key ? 'page' : undefined}
            className={`menu-link group flex items-center justify-between px-3 py-5 font-display text-[2.1rem] font-black uppercase leading-none tracking-[-0.03em] transition-colors hover:text-accent ${active === l.key ? 'text-accent' : 'text-ink'}`}>
            {l.label}
            <span className="text-2xl text-muted transition group-hover:translate-x-1 group-hover:text-accent"><Arrow /></span>
          </Link>
        </li>
      ))}
    </ul>
  )
}

/* Site header: transparent over the hero, frosted once the page scrolls.
   On phones the links move into a full-screen menu behind a menu button. */
export function Header({ active }: { active?: 'home' | 'events' }) {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const navRef = useSlidingIndicator<HTMLDivElement>('.nav-link')

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  /* while the menu is open: no page scrolling behind it, Esc closes it,
     and it closes by itself if the screen gets wide enough for the full nav */
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    const wide = window.matchMedia('(min-width: 640px)')
    const onWide = () => { if (wide.matches) setOpen(false) }
    window.addEventListener('keydown', onKey)
    wide.addEventListener('change', onWide)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
      wide.removeEventListener('change', onWide)
    }
  }, [open])

  const close = () => setOpen(false)

  return (
    <header className={`site-header sticky top-0 z-50 ${scrolled || open ? 'is-scrolled' : ''}`}>
      <div className="container-x flex h-16 items-center justify-between gap-3 sm:h-[72px]">
        <Link href="/" aria-label="hoi startup factory, home" className="shrink-0" onClick={close}>
          <img src="/logo.png" alt="hoi startup factory" className="h-8 w-auto sm:h-9" />
        </Link>

        <nav aria-label="Main" className="flex items-center gap-2 text-[15px] font-medium sm:gap-1">
          <div ref={navRef} className="nav-links relative hidden items-center sm:flex">
            <span data-indicator aria-hidden="true" className="nav-indicator" />
            {links.slice(0, 3).map((l) => (
              <Link key={l.key} href={l.href} aria-current={active === l.key ? 'page' : undefined}
                className={`nav-link relative ${active === l.key ? 'is-active' : ''}`}>{l.label}</Link>
            ))}
          </div>
          <LangSwitch className="mx-3 hidden sm:flex" />
          <Link href="/#contact" className="btn-primary h-10 px-4 text-sm sm:px-5" onClick={close}>Say hoi</Link>

          {/* menu button, phones only */}
          <button type="button" onClick={() => setOpen((o) => !o)}
            aria-expanded={open} aria-controls="mobile-menu" aria-label={open ? 'Close menu' : 'Open menu'}
            className={`burger sm:hidden ${open ? 'is-open' : ''}`}>
            <span /><span />
          </button>
        </nav>
      </div>

      {open && (
        <div id="mobile-menu" className="menu-panel sm:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <nav aria-label="Mobile" className="container-x flex flex-1 flex-col pt-6">
            <MobileLinks active={active} onNavigate={close} />

            <div className="rise mt-auto flex items-center justify-between gap-4 pb-8 pt-10" style={{ animationDelay: '0.32s' }}>
              <LangSwitch />
              <div className="flex gap-5 text-sm font-medium text-muted">
                <a href="https://www.instagram.com/hoi_startup_factory/" className="hover:text-ink">Instagram</a>
                <a href="https://www.linkedin.com/company/hoi-startup-factory/" className="hover:text-ink">LinkedIn</a>
              </div>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
