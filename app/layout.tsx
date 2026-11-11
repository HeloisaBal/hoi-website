import type { Metadata } from 'next'
import { Archivo, Inter } from 'next/font/google'
import './globals.css'
import { SectionJump } from '@/components/site/SectionJump'

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${archivo.variable} ${inter.variable}`}>
      <body>
        {children}
        <SectionJump />
      </body>
    </html>
  )
}
