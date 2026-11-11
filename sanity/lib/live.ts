import 'server-only'
import { defineLive } from 'next-sanity/live'
import { client } from './client'

/* Live content: published changes appear on the site within seconds, and
   inside the Studio's preview ("Presentation") editors see their drafts as
   they type, with click-to-edit outlines on the texts.

   Click-to-edit works by hiding invisible markers in texts while previewing.
   Only plain display texts get them (the list below); ids, links, colours,
   persona keys and places stay untouched so nothing that the code compares
   or uses as a link can break. */

const TEXT_FIELDS = new Set([
  'title', 'text', 'headline', 'line', 'cta', 'chip', 'word', 'programme', 'partner', 'name', 'role',
  'quote', 'quoteBy', 'intro', 'pill', 'linkText', 'label', 'details',
  'introTitle', 'introSub', 'heroPill', 'namePrompt', 'eventsEyebrow', 'eventsTitle', 'eventsMarquee',
  'journeyEyebrow', 'journeyTitle', 'mapEyebrow', 'mapTitle', 'mapText', 'sbEyebrow', 'sbTitle',
  'scienceWords', 'businessWords', 'aboutEyebrow', 'aboutLinkText', 'partnersTitle',
  'contactTitle', 'contactText', 'contactButton', 'titleLine1', 'titleLine2', 'ctaTitle', 'ctaText', 'address',
])

const token = process.env.SANITY_API_READ_TOKEN || undefined

const live = client
  ? defineLive({
    client: client.withConfig({
      stega: {
        studioUrl: '/studio',
        filter: (props) => props.sourcePath.some((seg) => typeof seg === 'string' && TEXT_FIELDS.has(seg))
          && !props.sourcePath.includes('for') && props.filterDefault(props),
      },
    }),
    // the Viewer token can only read; it reaches the browser only in preview mode,
    // which only logged-in Studio users can switch on
    serverToken: token,
    browserToken: token,
  })
  : null

export const sanityFetch = live?.sanityFetch ?? null
export const SanityLive = live?.SanityLive ?? null
