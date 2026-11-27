import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ChatWidget } from '@/components/site/chat/ChatWidget'
import { ContentProvider } from '@/components/site/ContentContext'
import { PersonaPage } from '@/components/site/PersonaPage'
import { personas as builtInPersonas, type PersonaId } from '@/components/site/data'
import { stegaClean } from 'next-sanity'
import { isEmailConfigured } from '@/lib/server/email'
import { getContent } from '@/sanity/lib/content'

/* One page per path: /for/founder, /for/investor, /for/company, /for/researcher, /for/student.
   The list of personas is fixed in code (data.ts); their texts come from Sanity. */

// new content shows within seconds through <SanityLive /> (layout); this is the safety net
export const revalidate = 60
export const dynamicParams = false

const IDS = builtInPersonas.map((p) => p.id)
const isPersona = (v: string): v is PersonaId => (IDS as string[]).includes(v)

export function generateStaticParams() {
  return IDS.map((persona) => ({ persona }))
}

export async function generateMetadata({ params }: { params: Promise<{ persona: string }> }): Promise<Metadata> {
  const { persona } = await params
  if (!isPersona(persona)) return {}
  const p = (await getContent()).personas.find((x) => x.id === persona)
  if (!p) return {}
  return {
    title: `${stegaClean(p.pathLabel)} · hoi startup factory`,
    description: stegaClean(`${p.headline} ${p.line}`),
  }
}

export default async function Page({ params }: { params: Promise<{ persona: string }> }) {
  const { persona } = await params
  if (!isPersona(persona)) notFound()
  const content = await getContent()
  if (!content.personas.some((p) => p.id === persona)) notFound()
  return (
    <ContentProvider content={content}>
      <PersonaPage id={persona} />
      <ChatWidget contactForm={isEmailConfigured()} />
    </ContentProvider>
  )
}
