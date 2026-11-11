import { HoiHome } from '@/components/site/HoiHome'
import { getHighlight } from '@/sanity/lib/highlight'

// look for new content from Sanity at most once a minute
export const revalidate = 60

export default async function Page() {
  return <HoiHome highlight={await getHighlight()} />
}
