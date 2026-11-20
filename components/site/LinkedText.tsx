'use client'

/* Plain text with web and email addresses turned into links. Never
   rendered as HTML, so text from Sanity or visitors can't inject markup.
   - <Linkify>: one piece of inline text
   - <TextBlocks>: paragraphs (empty line) and lists (lines starting "- ") */

const TOKEN = /(https?:\/\/[^\s<>"']+|[\w.+-]+@[\w-]+(?:\.[\w-]+)+)/g
const TRAILING = /[.,;:!?)\]]+$/

function AutoLink({ raw, className }: { raw: string; className: string }) {
  const trail = raw.match(TRAILING)?.[0] ?? ''
  const value = trail ? raw.slice(0, -trail.length) : raw
  const isUrl = /^https?:\/\//i.test(value)
  const internal = isUrl && typeof window !== 'undefined' && value.startsWith(window.location.origin)
  return (
    <>
      <a href={isUrl ? value : `mailto:${value}`} className={className}
        {...(isUrl && !internal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
        {isUrl ? value.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '') : value}
      </a>
      {trail}
    </>
  )
}

export function Linkify({ text, linkClass }: { text: string; linkClass: string }) {
  return (
    <>
      {text.split(TOKEN).map((part, i) => (i % 2 === 1 ? <AutoLink key={i} raw={part} className={linkClass} /> : part))}
    </>
  )
}

export function TextBlocks({ text, linkClass, className = '' }: { text: string; linkClass: string; className?: string }) {
  const blocks = text.trim().split(/\n\s*\n/)
  return (
    <div className={className}>
      {blocks.map((block, i) => {
        const lines = block.split('\n')
        const items = lines.filter((l) => l.trim().startsWith('- '))
        if (items.length && items.length === lines.length) {
          return <ul key={i}>{items.map((l, j) => <li key={j}><Linkify text={l.trim().slice(2)} linkClass={linkClass} /></li>)}</ul>
        }
        // a paragraph followed by list lines: render both
        const firstItem = lines.findIndex((l) => l.trim().startsWith('- '))
        if (firstItem > 0 && lines.slice(firstItem).every((l) => l.trim().startsWith('- '))) {
          return (
            <div key={i}>
              <p className="whitespace-pre-line"><Linkify text={lines.slice(0, firstItem).join('\n')} linkClass={linkClass} /></p>
              <ul>{lines.slice(firstItem).map((l, j) => <li key={j}><Linkify text={l.trim().slice(2)} linkClass={linkClass} /></li>)}</ul>
            </div>
          )
        }
        return <p key={i} className="whitespace-pre-line"><Linkify text={block} linkClass={linkClass} /></p>
      })}
    </div>
  )
}
