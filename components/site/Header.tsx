'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Arrow } from './shared'
import { useContent } from './ContentContext'

const links = [
  { href: '/#offers', label: 'Programmes', key: 'offers' },
  { href: '/events', label: 'Events', key: 'events' },
  { href: '/#who', label: 'About', key: 'who' },
] as const

/* DE/EN: German content is not set up yet, so EN is the only working option. */
function LangSwitch() {
  return (
    <span className="mono flex items-center gap-2 text-muted">
      <span>DE</span>
      <span aria-hidden="true">/</span>
      <span className="text-ink" aria-current="true">EN</span>
    </span>
  )
}

/* Site header (clean direction): logo, mono links, an outlined "Say hoi".
   A thin rule appears once the page scrolls. Phones: a full-screen menu. */
export function Header({ active }: { active?: string }) {
  const { settings } = useContent()
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  /* menu open: no page scroll behind it, Esc closes it, and it closes itself on wide screens */
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    const wide = window.matchMedia('(min-width: 768px)')
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
    <header className={`c-header ${scrolled ? 'is-scrolled' : ''}`}>
      <div className="wrap flex h-[4.5rem] items-center justify-between gap-4 sm:h-20">
        <Link href="/#top" aria-label="hoi startup factory, home" className="shrink-0" onClick={close}>
          <img src="/logo.png" alt="hoi startup factory" className="h-8 w-auto sm:h-9" />
        </Link>

        <nav aria-label="Main" className="mono flex items-center gap-8">
          <div className="hidden items-center gap-8 md:flex">
            {links.map((l) => (
              <Link key={l.key} href={l.href} aria-current={active === l.key ? 'page' : undefined} className="c-nav-link">{l.label}</Link>
            ))}
            <LangSwitch />
          </div>
          <Link href="/#contact" className="c-pill" onClick={close}>Say hoi</Link>
          <button type="button" onClick={() => setOpen((o) => !o)}
            aria-expanded={open} aria-controls="mobile-menu" aria-label={open ? 'Close menu' : 'Open menu'}
            className={`burger md:hidden ${open ? 'is-open' : ''}`}>
            <span /><span />
          </button>
        </nav>
      </div>

      {open && (
        <div id="mobile-menu" className="c-menu md:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="wrap flex h-[4.5rem] items-center justify-between">
            <img src="/logo.png" alt="" className="h-8 w-auto" />
            <button type="button" onClick={close} aria-label="Close menu" className="burger is-open"><span /><span /></button>
          </div>
          <nav aria-label="Mobile" className="wrap flex flex-1 flex-col pt-6">
            <ul className="c-rows">
              {links.map((l) => (
                <li key={l.key} className="c-row">
                  <Link href={l.href} onClick={close} className="slide-link flex items-baseline justify-between py-5">
                    <span className="disp text-5xl">{l.label}</span>
                    <span className="slide-arrow text-2xl"><Arrow /></span>
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mono mt-auto flex items-center justify-between gap-4 pb-8 pt-10">
              <LangSwitch />
              <div className="flex gap-5 text-muted">
                <a href={settings.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-ink">Instagram</a>
                <a href={settings.linkedin} target="_blank" rel="noopener noreferrer" className="hover:text-ink">LinkedIn</a>
              </div>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
