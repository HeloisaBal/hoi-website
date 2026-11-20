# hoi startup factory — website

Custom-built website for hoi startup factory by GroundUp (Next.js + Tailwind).
Separate from the Sanity/Storyblok CMS demos.

- `app/globals.css` — brand tokens (current branding; swap when the new branding lands)
- `components/site/data.ts` — personas, events, programmes, partners (moves to Sanity later)
- `components/site/HoiHome.tsx` — homepage with persona-based personalisation

```bash
npm install
npm run dev
```

## Chatbot ("Ask hoi")

Bottom-right on every page. Answers from the website's content plus the
questions and answers in Sanity → **Chatbot**, and lets visitors send hoi a
message by email. Nothing visitors type is stored on the site.

- `components/site/chat/` — the chat window and contact form
- `app/api/chat` — asks the AI (OpenAI GPT-4o mini, or Claude; `lib/server/ai.ts`); `lib/chat/knowledge.ts` has the bot's rules and what it knows
- `app/api/contact` — emails the message with Resend to the address in Sanity → Contact & links

Settings (`.env.local` locally, Vercel → Project → Settings → Environment Variables in production):

| Variable | Required | What |
|---|---|---|
| `OPENAI_API_KEY` | yes (or the Anthropic key) | platform.openai.com → API keys |
| `OPENAI_MODEL` | no | defaults to `gpt-4o-mini` |
| `ANTHROPIC_API_KEY` | no | use Claude instead (console.anthropic.com → API keys) |
| `ANTHROPIC_MODEL` | no | defaults to `claude-haiku-5-5` |
| `CHAT_PROVIDER` | no | `openai` or `anthropic`; without it OpenAI is used when its key is set |
| `RESEND_API_KEY` | yes, for the contact form | resend.com → API keys |
| `CONTACT_FROM` | yes, for the contact form | sender on a domain verified in Resend, e.g. `hoi website <website@hoi-startup-factory.de>` |
| `CONTACT_TO` | no | send messages here instead of the Sanity address (handy while testing) |
| `ALLOWED_ORIGINS` | no | extra site addresses allowed to call the API, comma-separated (the site's own address is always allowed) |

### Setting it up (once)

1. **OpenAI:** platform.openai.com → API keys → Create new secret key. Copy it. (The account needs credit under Billing.)
2. **Resend:** resend.com → sign up → Domains → Add domain (`hoi-startup-factory.de`, or a subdomain like `mail.hoi-startup-factory.de`) → add the DNS records it shows at Hoi's domain provider (ask Hoi) → wait until it says Verified. Then API keys → Create key (permission: Sending access). Copy it.
3. **Locally:** add to `.env.local`:
   ```
   OPENAI_API_KEY=sk-...
   RESEND_API_KEY=re_...
   CONTACT_FROM=hoi website <website@hoi-startup-factory.de>
   CONTACT_TO=your-own@email.com
   ```
   (`CONTACT_TO` sends test messages to you instead of Hoi; remove it when going live.) Restart `npm run dev` and try the chat.
4. **Vercel:** Project → Settings → Environment Variables → add the same variables (without `CONTACT_TO`) for Production and Preview → redeploy.
5. **Studio:** Chatbot → add questions and answers → Publish.

Until the Resend domain is verified, the chat itself works; only the contact form shows the error message with Hoi's email address.

