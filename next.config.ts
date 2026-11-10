import type { NextConfig } from 'next'

/**
 * Security headers sent with every response.
 *
 * The Content-Security-Policy below is deliberately limited to directives
 * that cannot break page rendering (framing, plugins, base URL, form targets).
 * A full script/style CSP needs per-request nonces and is planned as a
 * separate step.
 *
 * NOTE for the Sanity step: Sanity's visual editing (Presentation tool) shows
 * the site inside an iframe in the Studio. When we add it, `frame-ancestors`
 * must allow the Studio's origin, or the preview will be blank.
 */
const contentSecurityPolicy = [
  "frame-ancestors 'none'", // nobody may embed the site in an iframe (clickjacking)
  "object-src 'none'", // no Flash/plugins
  "base-uri 'self'", // injected <base> tags can't redirect relative URLs
  "form-action 'self'", // forms can only submit to this site
].join('; ')

const securityHeaders = [
  { key: 'Content-Security-Policy', value: contentSecurityPolicy },
  { key: 'X-Frame-Options', value: 'DENY' }, // older browsers that ignore frame-ancestors
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
