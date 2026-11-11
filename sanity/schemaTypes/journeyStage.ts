import { defineType } from 'sanity'
import { forPersonas, order, text } from './fields'

export const journeyStage = defineType({
  name: 'journeyStage', title: 'Journey stage', type: 'document',
  fields: [
    text('title', 'Stage', 20, { required: true, description: 'One or two words, e.g. “Lab”.' }),
    text('text', 'Text', 140, { required: true, rows: 3 }),
    text('programme', 'hoi offer for this stage', 40, { required: true }),
    forPersonas('Shows “You are here” for'),
    order,
  ],
  orderings: [{ title: 'Position', name: 'orderAsc', by: [{ field: 'order', direction: 'asc' }] }],
  preview: { select: { title: 'title', subtitle: 'programme' } },
})
