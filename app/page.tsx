import { ContentProvider } from '@/components/site/ContentContext'
import { HoiHome } from '@/components/site/HoiHome'
import { getContent } from '@/sanity/lib/content'

// new content shows within seconds through <SanityLive /> (layout); this is the safety net
export const revalidate = 60

export default async function Page() {
  return (
    <ContentProvider content={await getContent()}>
      <HoiHome />
    </ContentProvider>
  )
}
