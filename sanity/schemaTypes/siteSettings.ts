import { defineField, defineType } from 'sanity'
import { text } from './fields'

export const siteSettings = defineType({
  name: 'siteSettings', title: 'Contact & links', type: 'document',
  fields: [
    defineField({
      name: 'email', title: 'Contact email', type: 'string',
      description: 'Used by every "Get in touch" and "Ask about this" button.',
      validation: (r) => r.required().email(),
    }),
    text('address', 'Address (footer)', 80),
    defineField({ name: 'instagram', title: 'Instagram link', type: 'url', validation: (r) => r.uri({ scheme: ['https'] }) }),
    defineField({ name: 'linkedin', title: 'LinkedIn link', type: 'url', validation: (r) => r.uri({ scheme: ['https'] }) }),
  ],
  preview: { prepare: () => ({ title: 'Contact & links' }) },
})
