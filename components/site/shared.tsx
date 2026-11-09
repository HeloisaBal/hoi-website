'use client'

import type { Theme } from './data'

/* Helpers shared by the homepage and the other pages. */

/**
 * Font size for a big uppercase heading: the design size (`max`), but never
 * bigger than what lets its longest word fit the screen. `gutter` is the
 * horizontal space taken by padding around the heading.
 */
export function fit(text: string, max: string, gutter: string): React.CSSProperties {
  const longest = Math.max(4, ...text.split(/\s+/).map((w) => w.length))
  return { fontSize: `min(${max}, calc((100vw - ${gutter}) / ${(longest * 0.8).toFixed(2)}))` }
}

/* ------------------------------------------------------------
   Remembering the visitor. Stored only in their own browser.
   ------------------------------------------------------------ */
export const KEY_PERSONA = 'hoi.persona'
export const KEY_NAME = 'hoi.name'

export function load(key: string) {
  try { return window.localStorage.getItem(key) } catch { return null }
}
export function save(key: string, value: string | null) {
  try {
    if (value) window.localStorage.setItem(key, value)
    else window.localStorage.removeItem(key)
  } catch { /* private mode etc. — personalisation just won't persist */ }
}

export function WaveHand() {
  return (
    <svg viewBox="0 0 24 24" className="wave h-[0.9em] w-[0.9em]" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 11V6a2 2 0 0 0-4 0v1M14 10V4a2 2 0 0 0-4 0v2M10 10.5V6a2 2 0 0 0-4 0v8" />
      <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.9-6-2.4l-3.6-3.6a2 2 0 0 1 2.8-2.8L7 15" />
    </svg>
  )
}

/** Animation delay for the staggered fade-up on entry. */
export function rise(i: number): React.CSSProperties {
  return { animationDelay: `${(0.08 * i).toFixed(2)}s` }
}

/** Split a headline so its second half can carry the brand gradient. */
export function splitHeadline(text: string): [string, string] {
  const m = text.match(/^(.+?[.?!])\s+(.+)$/)
  if (m) return [m[1], m[2]]
  const words = text.split(' ')
  if (words.length < 4) return [text, '']
  return [words.slice(0, -2).join(' '), words.slice(-2).join(' ')]
}

export function Arrow() {
  return (
    <svg viewBox="0 0 20 20" className="h-[1.05em] w-[1.05em] transition-transform duration-300 ease-out group-hover:translate-x-1" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 10h12M11 5l5 5-5 5" />
    </svg>
  )
}

/** CSS variables that colour a page in a persona's theme. */
export function themeVars(theme: Theme): React.CSSProperties {
  return {
    ['--c1' as string]: theme.c1, ['--c2' as string]: theme.c2, ['--c3' as string]: theme.c3,
    ['--accent' as string]: theme.accent, ['--tint' as string]: theme.tint,
  } as React.CSSProperties
}
