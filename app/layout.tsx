import type { Metadata } from 'next'
import { Archivo, Inter } from 'next/font/google'
import './globals.css'
import { draftMode } from 'next/headers'
import { VisualEditing } from 'next-sanity/visual-editing'
import { SectionJump } from '@/components/site/SectionJump'
import { SanityLive } from '@/sanity/lib/live'

const archivo = Archivo({
  subsets: ['latin'],
  weight: ['600', '700', '800', '900'],
  display: 'swap',
  variable: '--font-archivo',
})

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
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
    <html lang="en" className={`${archivo.variable} ${inter.variable}`}>
      <body>
        {children}
        <SectionJump />
        {/* Studio preview only: drafts appear as the editor types, with click-to-edit outlines */}
        {preview && SanityLive && <SanityLive />}
        {preview && <VisualEditing />}
      </body>
    </html>
  )
}
