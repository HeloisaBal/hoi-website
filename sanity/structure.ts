import type { StructureResolver } from 'sanity/structure'
import { personas } from '../components/site/data'

/* The menu on the left of the Studio, in the order of the website. */

export const PERSONA_DOC = (id: string) => `persona-${id}`

export const structure: StructureResolver = (S) =>
  S.list()
    .title('hoi website')
    .items([
      S.listItem().title('Homepage').id('homePage')
        .child(S.document().schemaType('homePage').documentId('homePage').title('Homepage')),
      S.listItem().title('Events page').id('eventsPage')
        .child(S.document().schemaType('eventsPage').documentId('eventsPage').title('Events page')),
      S.divider(),
      S.documentTypeListItem('highlight').title('Highlights (floating card)'),
      S.documentTypeListItem('event').title('Events'),
      S.documentTypeListItem('journeyStage').title('Journey stages'),
      S.listItem().title('Visitor types').id('personas').child(
        S.list().title('Visitor types').items(
          personas.map((p) =>
            S.listItem().title(p.plural.charAt(0).toUpperCase() + p.plural.slice(1)).id(p.id)
              .child(S.document().schemaType('persona').documentId(PERSONA_DOC(p.id)).title(p.plural)),
          ),
        ),
      ),
      S.documentTypeListItem('partner').title('Partners'),
      S.documentTypeListItem('teamMember').title('Team'),
      S.divider(),
      S.listItem().title('Contact & links').id('siteSettings')
        .child(S.document().schemaType('siteSettings').documentId('siteSettings').title('Contact & links')),
    ])
