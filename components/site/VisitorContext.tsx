'use client'

import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import type { Persona, PersonaId } from './data'
import { KEY_NAME, KEY_PERSONA, KEY_REMEMBER, load, save } from './shared'
import { prefersReducedMotion, useEffects } from './effects'

/* ------------------------------------------------------------
   The visitor (clean direction): their first name and their path,
   shared by every page. Lives in the root layout, so it survives
   moving between pages without being stored anywhere. Only with
   "Remember me" ticked are name and path kept in this browser
   (localStorage, consent per § 25 TDDDG).

   Also runs the move to a persona page, because it has to outlast
   the page change: the persona's colour grows over the screen with
   its word ("Build."), the persona page loads underneath, then the
   colour opens up from the middle with a burst of thin, empty bubbles.
   ------------------------------------------------------------ */

type Cover = { key: number; x: number; y: number; colour: string; word: string; burst: string[]; phase: 'cover' | 'reveal' }

type Visitor = {
  name: string
  /** "anna maria" → "Anna" */
  firstName: string
  persona: PersonaId | null
  remember: boolean
  setRemember: (on: boolean) => void
  setName: (name: string) => void
  setPersona: (id: PersonaId | null) => void
  forget: () => void
  /** go to a persona's page with the colour and burst transition; `from` is where the colour starts */
  go: (p: Persona, from?: { x: number; y: number }) => void
  /** a persona page calls this once it is on screen: the colour opens up and the burst plays */
  arrived: () => void
  /** the name question (NameDialog) is open */
  nameAsk: boolean
  /** open the name question; `auto`: only if we don't know the name and they haven't skipped it this visit */
  askName: (auto?: boolean) => void
  /** close it; `skipped`: they chose "Not now", so it doesn't come back by itself this visit */
  closeName: (skipped: boolean) => void
}

const VisitorContext = createContext<Visitor | null>(null)

export const personaHref = (id: PersonaId) => `/for/${id}`

const COVER_MS = 560 // the colour reaches the screen's corners
const REVEAL_MS = 800

export function VisitorProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const { burst, layer } = useEffects()
  const [name, setNameState] = useState('')
  const [persona, setPersonaState] = useState<PersonaId | null>(null)
  const [remember, setRememberState] = useState(false)
  const [cover, setCover] = useState<Cover | null>(null)
  const [nameAsk, setNameAsk] = useState(false)
  const skipped = useRef(false)
  const nameRef = useRef('')
  useEffect(() => { nameRef.current = name }, [name])
  const coverRef = useRef<Cover | null>(null)
  const timers = useRef<number[]>([])

  /* a returning visitor who ticked "Remember me" */
  useLayoutEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (load(KEY_REMEMBER) !== '1') { save(KEY_NAME, null); save(KEY_PERSONA, null); return }
    setRememberState(true)
    const n = load(KEY_NAME)
    if (n) setNameState(n)
    const p = load(KEY_PERSONA) as PersonaId | null
    if (p) setPersonaState(p)
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [])

  useEffect(() => () => timers.current.forEach(clearTimeout), [])
  useEffect(() => { coverRef.current = cover }, [cover])

  const setRemember = useCallback((on: boolean) => {
    setRememberState(on)
    save(KEY_REMEMBER, on ? '1' : null)
    if (!on) { save(KEY_NAME, null); save(KEY_PERSONA, null) }
  }, [])

  const setName = useCallback((n: string) => {
    const clean = n.trim().slice(0, 40)
    setNameState(clean)
    save(KEY_NAME, load(KEY_REMEMBER) === '1' ? clean || null : null)
    if (load(KEY_REMEMBER) === '1') save(KEY_PERSONA, persona)
  }, [persona])

  const setPersona = useCallback((id: PersonaId | null) => {
    setPersonaState(id)
    if (load(KEY_REMEMBER) === '1') save(KEY_PERSONA, id)
  }, [])

  const forget = useCallback(() => {
    setNameState(''); setPersonaState(null); setRememberState(false); skipped.current = false
    save(KEY_NAME, null); save(KEY_PERSONA, null); save(KEY_REMEMBER, null)
  }, [])

  const reveal = useCallback(() => {
    const c = coverRef.current
    if (!c || c.phase !== 'cover') return
    setCover({ ...c, phase: 'reveal' })
    burst(window.innerWidth / 2, window.innerHeight * 0.42, c.burst, 46, true)
    timers.current.push(window.setTimeout(() => setCover((cur) => (cur?.key === c.key ? null : cur)), REVEAL_MS))
  }, [burst])

  const go = useCallback((p: Persona, from?: { x: number; y: number }) => {
    const href = personaHref(p.id)
    setPersona(p.id)
    if (prefersReducedMotion()) { router.push(href); return }
    router.prefetch(href)
    const c: Cover = {
      key: Date.now(),
      x: from?.x ?? window.innerWidth / 2,
      y: from?.y ?? window.innerHeight / 2,
      colour: p.theme.accent,
      word: p.word,
      burst: [p.theme.c1, p.theme.c2, p.theme.c3, '#ffffff'],
      phase: 'cover',
    }
    coverRef.current = c
    setCover(c)
    timers.current.push(window.setTimeout(() => router.push(href, { scroll: true }), COVER_MS))
    // safety net: never leave the colour on screen if the page is slow to say it has arrived
    timers.current.push(window.setTimeout(() => { if (coverRef.current?.key === c.key) reveal() }, 4000))
  }, [router, setPersona, reveal])

  const arrived = useCallback(() => {
    // wait until the cover has fully grown before opening it
    timers.current.push(window.setTimeout(reveal, 80))
  }, [reveal])

  const askName = useCallback((auto = false) => {
    if (auto && (nameRef.current || skipped.current)) return
    setNameAsk(true)
  }, [])
  const closeName = useCallback((wasSkipped: boolean) => {
    if (wasSkipped) skipped.current = true
    setNameAsk(false)
  }, [])

  const rawFirst = name.trim().split(/\s+/)[0] ?? ''
  const firstName = rawFirst.charAt(0).toLocaleUpperCase() + rawFirst.slice(1)

  const value = useMemo<Visitor>(() => ({
    name, firstName, persona, remember, setRemember, setName, setPersona, forget, go, arrived, nameAsk, askName, closeName,
  }), [name, firstName, persona, remember, setRemember, setName, setPersona, forget, go, arrived, nameAsk, askName, closeName])

  return (
    <VisitorContext.Provider value={value}>
      {children}
      {cover && (
        <div key={cover.key} aria-hidden="true"
          className={`jump persona-cover ${cover.phase === 'cover' ? 'is-cover' : 'is-reveal'}`}
          style={{ ['--x' as string]: `${cover.x}px`, ['--y' as string]: `${cover.y}px`, ['--j1' as string]: cover.colour, ['--j2' as string]: cover.colour, ['--j3' as string]: cover.colour }}>
          <span className="jump-word disp text-white">{cover.word}.</span>
        </div>
      )}
      {layer}
    </VisitorContext.Provider>
  )
}

export function useVisitor() {
  const v = useContext(VisitorContext)
  if (!v) throw new Error('useVisitor needs <VisitorProvider> (app/layout.tsx)')
  return v
}
