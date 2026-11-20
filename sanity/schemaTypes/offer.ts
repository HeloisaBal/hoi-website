import { defineArrayMember, defineField, defineType } from 'sanity'
import { forPersonas, order, text } from './fields'

/* One offer on the homepage ("What hoi offers you") — a programme or a
   kind of support. Visitors whose path is ticked under "For who" see it
   first, marked "For you". The chatbot knows these too. */

export const offer = defineType({
  name: 'offer', title: 'Offer', type: 'document',
  fields: [
    text('name', 'Name', 40, { required: true, description: 'e.g. “hoi venture studio”.' }),
    text('tagline', 'One line: what it is', 70, { required: true }),
    text('text', 'Description', 260, { required: true, rows: 3 }),
    defineField({
      name: 'points', title: 'What you get', type: 'array',
      description: '2 to 4 short points. Max 70 characters each.',
      of: [defineArrayMember({ type: 'string', validation: (r) => r.max(70) })],
      validation: (r) => r.max(4),
    }),
    forPersonas('For who (shown first for these visitors)'),
    order,
  ],
  orderings: [{ title: 'Position', name: 'order', by: [{ field: 'order', direction: 'asc' }] }],
  preview: { select: { title: 'name', subtitle: 'tagline' } },
})
