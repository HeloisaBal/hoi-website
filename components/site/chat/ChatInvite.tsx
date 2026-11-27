'use client'

import { useEffect, useState } from 'react'

/* ------------------------------------------------------------
   The chat invitation (clean direction): a little hoi figure (the
   house from the logo, with a face) pops up next to the chat button
   a few seconds after the page opens, waves and says the text from
   Sanity → Chatbot → "Invitation bubble". Clicking it opens the
   chat; × sends it away. Either way it stays away for the rest of
   the visit (sessionStorage), and it never shows while the chat is
   open. Reduced motion: it appears without popping or waving.
   ------------------------------------------------------------ */

const KEY_DONE = 'hoi.chat.invited'
const DELAY_MS = 4500

/** Ends the invitation for this visit (also called when the chat opens). */
export function inviteDone() {
  try { sessionStorage.setItem(KEY_DONE, '1') } catch { /* fine */ }
}

export function ChatInvite({ text, chatOpen, onOpen }: { text: string; chatOpen: boolean; onOpen: () => void }) {
  const [shown, setShown] = useState(false)

  useEffect(() => {
    try { if (sessionStorage.getItem(KEY_DONE) === '1') return } catch { /* storage blocked: still invite */ }
    const t = window.setTimeout(() => setShown(true), DELAY_MS)
    return () => window.clearTimeout(t)
  }, [])

  if (!shown || chatOpen || !text) return null

  const close = () => { setShown(false); inviteDone() }

  return (
    <div className="chat-invite">
      <button type="button" className="chat-invite-bubble" onClick={() => { close(); onOpen() }}>
        {text}
      </button>
      <button type="button" className="chat-invite-close" onClick={close} aria-label="Hide this invitation">
        <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
          <path d="M5 5l10 10M15 5L5 15" />
        </svg>
      </button>
      {/* the figure: hoi's house with a face and a waving arm */}
      <svg className="chat-invite-figure" viewBox="0 0 64 72" aria-hidden="true">
        <g className="chat-invite-arm">
          <path d="M50 40 C 56 34, 58 26, 57 18" fill="none" stroke="#170a2b" strokeWidth="4" strokeLinecap="round" />
          <circle cx="57" cy="16" r="4.5" fill="#170a2b" />
        </g>
        <path d="M10 22 L50 14 L50 66 L10 66 Z" fill="#00d7b8" stroke="#170a2b" strokeWidth="3" strokeLinejoin="round" />
        <circle cx="23" cy="38" r="3" fill="#170a2b" />
        <circle cx="37" cy="36" r="3" fill="#170a2b" />
        <path d="M22 47 Q 30 54, 38 46" fill="none" stroke="#170a2b" strokeWidth="3" strokeLinecap="round" />
        <path d="M14 66 L14 70 M46 66 L46 70" stroke="#170a2b" strokeWidth="3" strokeLinecap="round" />
      </svg>
    </div>
  )
}
