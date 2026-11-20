import 'server-only'
import type { NextRequest } from 'next/server'

/* Shared checks for the public API routes (chat, contact). */

/**
 * Only this website may call the API (not other sites through a visitor's
 * browser). Allowed: the site's own address, plus any listed in
 * ALLOWED_ORIGINS (comma-separated, e.g. the final domain and a preview URL).
 * This is not a lock against scripts (they can fake the header); the rate
 * limit and the input checks are what protect against those.
 */
export function isAllowedOrigin(req: NextRequest): boolean {
  const origin = req.headers.get('origin')
  if (!origin) return false
  const extra = (process.env.ALLOWED_ORIGINS ?? '').split(',').map((s) => s.trim()).filter(Boolean)
  return origin === req.nextUrl.origin || extra.includes(origin)
}

/** The visitor's IP as reported by Vercel's proxy (only used as a rate-limit key, never stored). */
export function clientIp(req: NextRequest): string {
  return req.headers.get('x-real-ip') ?? req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
}

/** Reads a JSON body of at most `maxBytes`; null when too big or not JSON. */
export async function readJson(req: NextRequest, maxBytes: number): Promise<unknown | null> {
  if (!req.headers.get('content-type')?.includes('application/json')) return null
  const declared = Number(req.headers.get('content-length') ?? 0)
  if (declared > maxBytes) return null
  try {
    const text = await req.text()
    return text.length > maxBytes ? null : JSON.parse(text)
  } catch {
    return null
  }
}

export const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } })
