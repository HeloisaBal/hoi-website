'use client'

import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { DEFAULT_THEME } from './data'
import { prefersReducedMotion, useEffects } from './effects'

/* ------------------------------------------------------------
   Going to a section ("/#about", "#events", ...) or another page
   ("/events") should not just cut or scroll past everything. Instead:
     1. cover:  persona colours burst out of the clicked link and fill the screen
     2. jump:   behind the colour, the page jumps straight to the section,
                or the new page loads and starts at the top
     3. reveal: the colour explodes open from the middle onto the section
   Mounted once in the root layout so it survives page changes.
   Reduced motion: links behave normally (instant jump, no animation).
   ------------------------------------------------------------ */

const COVER_MS = 520
const REVEAL_MS = 750
const WAIT_MAX_MS = 2500
/** marks "start of the page" when the link has no #section */
const TOP = ''
const PAGE_LABELS: Record<string, string> = {
  '/': 'hoi',
  '/events': 'What’s on',
}
const LABELS: Record<string, string> = {
  top: 'hoi',
  events: 'What’s on',
  programmes: 'Programmes',
  about: 'About us',
  contact: 'Say hoi',
}

type Jump = { key: number; x: number; y: number; colours: string[]; word: string; phase: 'cover' | 'reveal' }

/** The persona colours currently on the page (they live on the `.themed` root). */
function pageColours() {
  const root = document.querySelector('.themed')
  const css = root ? getComputedStyle(root) : null
  const read = (name: string, fallback: string) => css?.getPropertyValue(name).trim() || fallback
  return [read('--c1', DEFAULT_THEME.c1), read('--c2', DEFAULT_THEME.c2), read('--c3', DEFAULT_THEME.c3), read('--accent', DEFAULT_THEME.accent)]
}

/** Resolves with the element once it exists (a new page may still be rendering). */
function waitFor(id: string) {
  return new Promise<HTMLElement | null>((resolve) => {
    if (id === TOP) return resolve(null)
    const start = performance.now()
    const look = () => {
      const el = document.getElementById(id)
      if (el || performance.now() - start > WAIT_MAX_MS) resolve(el)
      else requestAnimationFrame(look)
    }
    look()
  })
}

export function SectionJump() {
  const router = useRouter()
  const pathname = usePathname()
  const { burst, layer } = useEffects()
  const [jump, setJump] = useState<Jump | null>(null)
  const pending = useRef<string | null>(null)
  const timers = useRef<number[]>([])
  const colours = useRef<string[]>([])

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  /* jump to the section behind the colour, then explode the colour open */
  const land = useCallback(async (id: string, push: boolean) => {
    const el = await waitFor(id)
    if (id === TOP) {
      document.documentElement.style.scrollBehavior = 'auto'
      window.scrollTo({ top: 0, behavior: 'instant' })
      document.documentElement.style.scrollBehavior = ''
    } else if (el) {
      const html = document.documentElement
      html.style.scrollBehavior = 'auto'
      window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY, behavior: 'instant' })
      html.style.scrollBehavior = ''
      if (push) history.pushState(null, '', `#${id}`)
      // keyboard and screen reader users continue from the section
      if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1')
      el.focus({ preventScroll: true })
    }
    requestAnimationFrame(() => requestAnimationFrame(() => {
      setJump((j) => (j ? { ...j, phase: 'reveal' } : j))
      burst(window.innerWidth / 2, window.innerHeight / 2, ['#ffffff', ...colours.current], 64)
      timers.current.push(window.setTimeout(() => setJump(null), REVEAL_MS))
    }))
  }, [burst])

  /* coming from another page: land once the new page is on screen */
  useEffect(() => {
    const id = pending.current
    if (id === null) return
    pending.current = null
    land(id, false)
  }, [pathname, land])

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      if (prefersReducedMotion()) return
      const a = (e.target as Element | null)?.closest<HTMLAnchorElement>('a[href]')
      if (!a || (a.target && a.target !== '_self') || a.hasAttribute('download')) return
      const url = new URL(a.href, location.href)
      if (url.origin !== location.origin) return
      const samePage = url.pathname === location.pathname
      const id = url.hash.length > 1 ? decodeURIComponent(url.hash.slice(1)) : TOP
      // a section on this page that exists, or another page of the site
      if (samePage && (id === TOP || !document.getElementById(id))) return
      if (!samePage && /\.[a-z0-9]+$/i.test(url.pathname)) return // files, not pages

      e.preventDefault()
      const keyboard = e.clientX === 0 && e.clientY === 0
      const r = a.getBoundingClientRect()
      const x = keyboard ? r.left + r.width / 2 : e.clientX
      const y = keyboard ? r.top + r.height / 2 : e.clientY
      colours.current = pageColours()
      setJump({ key: Date.now(), x, y, colours: colours.current, word: (id === TOP ? PAGE_LABELS[url.pathname] : LABELS[id]) ?? (a.textContent?.trim().slice(0, 16) || 'hoi'), phase: 'cover' })
      burst(x, y, colours.current, 48)

      timers.current.push(window.setTimeout(() => {
        if (samePage) land(id, true)
        else {
          pending.current = id
          router.push(`${url.pathname}${id === TOP ? url.search : url.hash}`, { scroll: false })
        }
      }, COVER_MS))
    }
    // capture phase: runs before Next's <Link> handles the click
    window.addEventListener('click', onClick, true)
    return () => window.removeEventListener('click', onClick, true)
  }, [burst, land, router])

  return (
    <>
      {jump && (
        <div key={jump.key} className={`jump is-${jump.phase}`} aria-hidden="true"
          style={{
            '--x': `${jump.x}px`, '--y': `${jump.y}px`,
            '--j1': jump.colours[0], '--j2': jump.colours[1], '--j3': jump.colours[2],
          } as CSSProperties}>
          <span className="jump-word font-display font-black uppercase text-white"
            style={{ fontSize: `min(clamp(3.5rem, 13vw, 11rem), calc(90vw / ${((jump.word.length + 1) * 0.8).toFixed(2)}))` }}>
            {jump.word}.
          </span>
        </div>
      )}
      {layer}
    </>
  )
}
