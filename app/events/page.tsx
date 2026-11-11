import type { Metadata } from 'next'
import { ContentProvider } from '@/components/site/ContentContext'
import { EventsPage } from '@/components/site/EventsPage'
import { getContent } from '@/sanity/lib/content'

// new content shows within seconds through <SanityLive /> (layout); this is the safety net
export const revalidate = 60

export const metadata: Metadata = {
  title: 'Events — hoi startup factory',
  description: 'Meetups, programmes, funding calls and learning formats across Bremen, Oldenburg and the Northwest.',
}

export default async function Page() {
  return (
    <ContentProvider content={await getContent()}>
      <EventsPage />
    </ContentProvider>
  )
}
