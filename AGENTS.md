<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Project rules (GroundUp)

These apply to every change in this repo, by any person or agent.

## Workflow
- Agents change files only. Heloisa reviews (`git diff`, `npm run dev`) and commits and pushes herself. Never commit or push on her behalf.
- Every change must pass `npx tsc --noEmit`, `npm run lint` and `npm run build` before it is handed over.
- Check visual changes at desktop (1440px) and phone (390px and 360px) widths.

## Security
- Never hardcode API keys, tokens or credentials. Use environment variables (`.env.local` locally, Vercel project settings in production). `.env*` files are git-ignored and must stay that way.
- Validate and sanitize all user input on the client and again on the server. Never render user or CMS content as raw HTML.
- Restrict CORS to known origins. Store auth tokens in `httpOnly`, `Secure`, `SameSite` cookies, never in `localStorage`.
- Keep security headers in `next.config.ts`. Any change to them must state what it allows and why.
- `localStorage` is only for non-sensitive visitor preferences (first name, persona), and must fail silently.

## Architecture
- Small, single-purpose, typed components. Shared helpers live in `components/site/shared.tsx`; don't duplicate them.
- No inline styles for static design values; use Tailwind classes or `app/globals.css`. Inline `style` is allowed only for runtime values passed as CSS variables (persona colours, animation delays, fitted sizes).
- Design tokens (colours, fonts) live in `app/globals.css`. Persona themes live in `components/site/data.ts`.
- Pin dependency upgrades deliberately; run `npm audit` before and after.

## Accessibility & SEO
- Semantic HTML: one `<h1>` per page, headings in order, real `<button>` and `<a>` elements, labels on every input.
- Everything must work by keyboard with a visible focus ring. Respect `prefers-reduced-motion`.
- Images need meaningful `alt` text (empty `alt` only for decoration).

## Changes that can break things
- Before changing shared components, data shapes or config, list what depends on them and say so in the handover.
