import type { Metadata } from 'next'
import { EventsPage } from '@/components/site/EventsPage'
import { getHighlight } from '@/sanity/lib/highlight'

// look for new content from Sanity at most once a minute
export const revalidate = 60

export const metadata: Metadata = {
  title: 'Events — hoi startup factory',
  description: 'Meetups, programmes, funding calls and learning formats across Bremen, Oldenburg and the Northwest.',
}

export default async function Page() {
  return <EventsPage highlight={await getHighlight()} />
}
