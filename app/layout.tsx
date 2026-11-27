import type { Metadata } from 'next'
import { Big_Shoulders, DM_Mono, Newsreader } from 'next/font/google'
import './globals.css'
import { draftMode } from 'next/headers'
import { VisualEditing } from 'next-sanity/visual-editing'
import { SanityLive } from '@/sanity/lib/live'

/* Clean direction: a condensed display face for headlines, a serif for
   reading and a mono for labels (same pairing as GroundUp's Largo). */
const bigShoulders = Big_Shoulders({
  subsets: ['latin', 'latin-ext'],
  weight: 'variable',
  axes: ['opsz'],
  display: 'swap',
  variable: '--font-big-shoulders',
})

const newsreader = Newsreader({
  subsets: ['latin', 'latin-ext'],
  weight: 'variable',
  style: ['normal', 'italic'],
  axes: ['opsz'],
  display: 'swap',
  variable: '--font-newsreader',
})

const dmMono = DM_Mono({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500'],
  display: 'swap',
  variable: '--font-dm-mono',
})

export const metadata: Metadata = {
  title: 'hoi startup factory — Harbour of ideas',
  description:
    'Im Norden gründen – mit Rückenwind! hoi verbindet Startups mit Wirtschaft und Wissenschaft im Nordwesten.',
  // Work in progress: keep it out of search engines until launch.
  robots: { index: false, follow: false },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const preview = (await draftMode()).isEnabled
  return (
    <html lang="en" className={`${bigShoulders.variable} ${newsreader.variable} ${dmMono.variable}`}>
      <body>
        {children}
        {/* Studio preview only: drafts appear as the editor types, with click-to-edit outlines */}
        {preview && SanityLive && <SanityLive />}
        {preview && <VisualEditing />}
      </body>
    </html>
  )
}
