import { defineType } from 'sanity'
import { order, photo, text } from './fields'

export const teamMember = defineType({
  name: 'teamMember', title: 'Team member', type: 'document',
  fields: [
    text('name', 'Name', 40, { required: true }),
    text('role', 'Role', 40, { required: true }),
    photo('photo', 'Photo', { description: 'Square photos work best.' }),
    order,
  ],
  orderings: [{ title: 'Position', name: 'orderAsc', by: [{ field: 'order', direction: 'asc' }] }],
  preview: { select: { title: 'name', subtitle: 'role', media: 'photo' } },
})
