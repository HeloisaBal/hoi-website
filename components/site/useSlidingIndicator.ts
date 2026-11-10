'use client'

import { useEffect, useRef } from 'react'

/**
 * Effect 4: a highlight that slides between the items of a menu.
 *
 * Put `ref` on the container (position: relative) and render
 * `<span data-indicator aria-hidden="true" />` inside it. Items are the
 * container's elements matching `itemSelector`; the item with
 * `aria-current="page"` is where the highlight rests. With no current item
 * the highlight fades out when the pointer leaves.
 *
 * Moves on hover, keyboard focus and touch (pointerdown), so it works
 * with a mouse, a keyboard and a finger.
 */
export function useSlidingIndicator<T extends HTMLElement>(itemSelector: string) {
  const ref = useRef<T>(null)

  useEffect(() => {
    const box = ref.current
    const bar = box?.querySelector<HTMLElement>('[data-indicator]')
    if (!box || !bar) return

    const current = () => box.querySelector<HTMLElement>(`${itemSelector}[aria-current="page"]`)
    const place = (item: HTMLElement | null, animate = true) => {
      if (!item) { bar.style.opacity = '0'; return }
      if (!animate) bar.style.transition = 'none'
      // measured from the boxes on screen, so animated or transformed
      // parents (like the menu's entry animation) don't throw it off
      const b = box.getBoundingClientRect()
      const r = item.getBoundingClientRect()
      bar.style.opacity = '1'
      bar.style.left = `${r.left - b.left - box.clientLeft}px`
      bar.style.top = `${r.top - b.top - box.clientTop}px`
      bar.style.width = `${r.width}px`
      bar.style.height = `${r.height}px`
      if (!animate) { void bar.offsetWidth; bar.style.transition = '' }
    }
    const itemFrom = (e: Event) =>
      e.target instanceof Element ? e.target.closest<HTMLElement>(itemSelector) : null
    const move = (e: Event) => { const item = itemFrom(e); if (item && box.contains(item)) place(item) }
    const rest = () => place(current())

    place(current(), false)
    box.addEventListener('pointerover', move)
    box.addEventListener('pointerdown', move)
    box.addEventListener('focusin', move)
    box.addEventListener('pointerleave', rest)
    box.addEventListener('focusout', rest)
    const ro = new ResizeObserver(() => place(current(), false))
    ro.observe(box)

    return () => {
      box.removeEventListener('pointerover', move)
      box.removeEventListener('pointerdown', move)
      box.removeEventListener('focusin', move)
      box.removeEventListener('pointerleave', rest)
      box.removeEventListener('focusout', rest)
      ro.disconnect()
    }
  }, [itemSelector])

  return ref
}
