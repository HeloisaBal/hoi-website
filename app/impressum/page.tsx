import type { Metadata } from 'next'
import { ContentProvider } from '@/components/site/ContentContext'
import { ChatWidget } from '@/components/site/chat/ChatWidget'
import { ImpressumPage } from '@/components/site/LegalPage'
import { isEmailConfigured } from '@/lib/server/email'
import { getContent } from '@/sanity/lib/content'

// new content shows within seconds through <SanityLive /> (layout); this is the safety net
export const revalidate = 60

export const metadata: Metadata = { title: 'Impressum — hoi startup factory' }

export default async function Page() {
  return (
    <ContentProvider content={await getContent()}>
      <ImpressumPage />
      <ChatWidget contactForm={isEmailConfigured()} />
    </ContentProvider>
  )
}
