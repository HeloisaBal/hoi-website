import type { NextConfig } from 'next'

/**
 * Security headers sent with every response.
 *
 * The Content-Security-Policy below is deliberately limited to directives
 * that cannot break page rendering (framing, plugins, base URL, form targets).
 * A full script/style CSP needs per-request nonces and is planned as a
 * separate step.
 *
 * Framing (who may show this site inside an iframe):
 * - this site itself: the Studio at /studio shows the site in its live preview
 * - sanity.io: Sanity's dashboard opens the Studio inside its own page, and
 *   the live preview then sits inside that
 * Nobody else, so other sites can't overlay it (clickjacking).
 */
const SANITY_DASHBOARD = 'https://www.sanity.io https://sanity.io'

const contentSecurityPolicy = [
  `frame-ancestors 'self' ${SANITY_DASHBOARD}`,
  "object-src 'none'", // no Flash/plugins
  "base-uri 'self'", // injected <base> tags can't redirect relative URLs
  "form-action 'self'", // forms can only submit to this site
].join('; ')

const sharedHeaders = [
  { key: 'Content-Security-Policy', value: contentSecurityPolicy },
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
    return [
      // The site: also X-Frame-Options for older browsers that ignore frame-ancestors.
      // (Modern browsers follow frame-ancestors and ignore this when both are set.)
      {
        source: '/((?!studio).*)',
        headers: [...sharedHeaders, { key: 'X-Frame-Options', value: 'SAMEORIGIN' }],
      },
      // The Studio: no X-Frame-Options, because it can't allow sanity.io (only frame-ancestors can).
      { source: '/studio', headers: sharedHeaders },
      { source: '/studio/:path*', headers: sharedHeaders },
    ]
  },
}

export default nextConfig
