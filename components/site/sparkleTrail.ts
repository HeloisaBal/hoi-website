/* ------------------------------------------------------------
   Sparkle trail: the GroundUp pointer effect in hoi's colours.
   Every mouse move drops three small dots that drift outwards,
   float up, fall back with a little gravity and fade out.

   - Mouse/trackpad only: touch screens have no hover, so nothing
     is drawn and no loop runs.
   - Off with prefers-reduced-motion.
   - The animation loop stops as soon as the last dot is gone.
   - Ignores the pointer over text fields so typing stays calm.
   ------------------------------------------------------------ */

/** hoi brand palette: teal, electric blue, purple (light and deep of each). */
export const SPARKLE_COLOURS = ['#00d7b8', '#2ceccd', '#003efe', '#3f5cff', '#9a00ff', '#c261ff'] as const

type Dot = { x: number; y: number; vx: number; vy: number; life: number; size: number; colour: string }

/** Starts the trail on a full-screen canvas. Returns a cleanup function. */
export function startSparkleTrail(canvas: HTMLCanvasElement): () => void {
  const fine = window.matchMedia('(pointer: fine)').matches
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const ctx = canvas.getContext('2d')
  if (!fine || reduced || !ctx) return () => {}

  let dots: Dot[] = []
  let frame = 0

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = window.innerWidth * dpr
    canvas.height = window.innerHeight * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }
  resize()

  const draw = () => {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)
    for (const d of dots) {
      d.x += d.vx
      d.y += d.vy
      d.vy += 0.02 // gravity
      d.life -= 0.02 // about 50 frames
      ctx.globalAlpha = Math.max(d.life, 0)
      ctx.fillStyle = d.colour
      ctx.beginPath()
      ctx.arc(d.x, d.y, Math.max(d.size * d.life, 0), 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1
    dots = dots.filter((d) => d.life > 0)
    frame = dots.length ? requestAnimationFrame(draw) : 0
  }

  const onMove = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse') return
    if (e.target instanceof Element && e.target.closest('input, textarea, select, [contenteditable="true"]')) return
    for (let i = 0; i < 3; i++) {
      dots.push({
        x: e.clientX,
        y: e.clientY,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2 - 0.6, // a little lift
        life: 1,
        size: Math.random() * 2.5 + 1.5,
        colour: SPARKLE_COLOURS[(Math.random() * SPARKLE_COLOURS.length) | 0],
      })
    }
    if (dots.length > 240) dots = dots.slice(-240) // keep it light on long fast moves
    if (!frame) frame = requestAnimationFrame(draw)
  }

  window.addEventListener('pointermove', onMove, { passive: true })
  window.addEventListener('resize', resize)
  return () => {
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('resize', resize)
    cancelAnimationFrame(frame)
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)
  }
}
