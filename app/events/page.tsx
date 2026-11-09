import type { Metadata } from 'next'
import { EventsPage } from '@/components/site/EventsPage'

export const metadata: Metadata = {
  title: 'Events — hoi startup factory',
  description: 'Meetups, programmes, funding calls and learning formats across Bremen, Oldenburg and the Northwest.',
}

export default function Page() {
  return <EventsPage />
}
