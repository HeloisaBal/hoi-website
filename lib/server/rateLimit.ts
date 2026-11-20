import 'server-only'

/* A simple per-visitor request limit, kept in the server's memory.
   On Vercel each running instance keeps its own count, so this slows down
   abuse rather than stopping it completely; Vercel's firewall rate limiting
   (project settings) is the stronger second layer. IPs are only held in
   memory for the length of the window, never written anywhere. */

type Bucket = { count: number; resetAt: number }

export function rateLimiter({ limit, windowMs }: { limit: number; windowMs: number }) {
  const buckets = new Map<string, Bucket>()

  return function hit(key: string): { ok: boolean; retryAfter: number } {
    const now = Date.now()
    if (buckets.size > 5000) for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k)
    const b = buckets.get(key)
    if (!b || b.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs })
      return { ok: true, retryAfter: 0 }
    }
    b.count += 1
    return { ok: b.count <= limit, retryAfter: Math.ceil((b.resetAt - now) / 1000) }
  }
}
