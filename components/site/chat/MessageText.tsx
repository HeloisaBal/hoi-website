'use client'

import { Linkify } from '../LinkedText'

/* A chatbot or visitor message as plain text, with links. Never rendered as HTML. */
export function MessageText({ text }: { text: string }) {
  return <p className="whitespace-pre-line break-words"><Linkify text={text} linkClass="chat-link" /></p>
}
