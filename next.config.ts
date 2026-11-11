import type { NextConfig } from 'next'

/**
 * Security headers sent with every response.
 *
 * The Content-Security-Policy below is deliberately limited to directives
 * that cannot break page rendering (framing, plugins, base URL, form targets).
 * A full script/style CSP needs per-request nonces and is planned as a
 * separate step.
 *
 * Framing: the Sanity Studio lives on this same site (/studio) and shows the
 * site inside an iframe for its live preview, so pages may be framed by this
 * site itself ('self' / SAMEORIGIN), and by nobody else.
 */
const contentSecurityPolicy = [
  "frame-ancestors 'self'", // only this site may embed it (the Studio preview); stops clickjacking
  "object-src 'none'", // no Flash/plugins
  "base-uri 'self'", // injected <base> tags can't redirect relative URLs
  "form-action 'self'", // forms can only submit to this site
].join('; ')

const securityHeaders = [
  { key: 'Content-Security-Policy', value: contentSecurityPolicy },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' }, // older browsers that ignore frame-ancestors
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()' },
  // HTTPS only, for 2 years. No `preload`: that's a long-term commitment to
  // make once Hoi's final domain is live.
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
]

const nextConfig: NextConfig = {
  poweredByHeader: false, // don't advertise the framework
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }]
  },
}

export default nextConfig
