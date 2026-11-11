'use client'

/* Sanity Studio, the editing screen hoi uses, served at /studio.
   - Structure: the menu with every editable part of the site
   - Presentation: the site itself, live, with click-to-edit (needs the read token) */

import { defineConfig } from 'sanity'
import { defineLocations, presentationTool } from 'sanity/presentation'
import { structureTool } from 'sanity/structure'
import { dataset, projectId } from './sanity/env'
import { SINGLETONS, schema } from './sanity/schemaTypes'
import { structure } from './sanity/structure'

const FIXED = new Set<string>([...SINGLETONS, 'persona'])
const home = { title: 'Homepage', href: '/' }
const eventsPage = { title: 'Events page', href: '/events' }

export default defineConfig({
  basePath: '/studio',
  title: 'hoi website',
  projectId: projectId || 'not-connected',
  dataset,
  schema: {
    ...schema,
    // one-of-a-kind documents can't be created again from the "+" menu
    templates: (templates) => templates.filter((t) => !FIXED.has(t.schemaType)),
  },
  document: {
    // ...nor deleted or duplicated
    actions: (actions, { schemaType }) =>
      FIXED.has(schemaType) ? actions.filter((a) => !['delete', 'duplicate', 'unpublish'].includes(a.action ?? '')) : actions,
  },
  plugins: [
    structureTool({ structure, title: 'Content' }),
    presentationTool({
      title: 'Live preview',
      previewUrl: { previewMode: { enable: '/api/draft-mode/enable' } },
      resolve: {
        locations: {
          homePage: defineLocations({ locations: [home] }),
          eventsPage: defineLocations({ locations: [eventsPage] }),
          siteSettings: defineLocations({ locations: [home, eventsPage] }),
          highlight: defineLocations({ locations: [home, eventsPage] }),
          event: defineLocations({ locations: [home, eventsPage] }),
          persona: defineLocations({ locations: [home] }),
          journeyStage: defineLocations({ locations: [home] }),
          partner: defineLocations({ locations: [home] }),
          teamMember: defineLocations({ locations: [home] }),
        },
      },
    }),
  ],
})
