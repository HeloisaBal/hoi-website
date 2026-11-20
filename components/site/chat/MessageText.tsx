'use client'

/* A chatbot or visitor message as plain text, with web addresses and email
   addresses turned into links. Never rendered as HTML. */

const TOKEN = /(https?:\/\/[^\s<>"']+|[\w.+-]+@[\w-]+(?:\.[\w-]+)+)/g
const TRAILING = /[.,;:!?)\]]+$/

function Link({ raw }: { raw: string }) {
  const trail = raw.match(TRAILING)?.[0] ?? ''
  const value = trail ? raw.slice(0, -trail.length) : raw
  const isUrl = /^https?:\/\//i.test(value)
  const internal = isUrl && typeof window !== 'undefined' && value.startsWith(window.location.origin)
  return (
    <>
      <a href={isUrl ? value : `mailto:${value}`} className="chat-link"
        {...(isUrl && !internal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
        {isUrl ? value.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '') : value}
      </a>
      {trail}
    </>
  )
}

export function MessageText({ text }: { text: string }) {
  const parts = text.split(TOKEN)
  return (
    <p className="whitespace-pre-line break-words">
      {parts.map((part, i) => (i % 2 === 1 ? <Link key={i} raw={part} /> : part))}
    </p>
  )
}
