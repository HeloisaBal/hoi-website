import { defineField, defineType } from 'sanity'
import { order, text } from './fields'

export const partner = defineType({
  name: 'partner', title: 'Partner', type: 'document',
  fields: [
    text('name', 'Name', 50, { required: true }),
    defineField({
      name: 'logo', title: 'Logo (optional)', type: 'image',
      description: 'Without a logo the name is shown. Only use logos you are allowed to use.',
    }),
    defineField({ name: 'href', title: 'Website (optional)', type: 'url', validation: (r) => r.uri({ scheme: ['https', 'http'] }) }),
    order,
  ],
  orderings: [{ title: 'Position', name: 'orderAsc', by: [{ field: 'order', direction: 'asc' }] }],
  preview: { select: { title: 'name', media: 'logo' } },
})
