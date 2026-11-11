import { defineType } from 'sanity'
import { text } from './fields'

export const eventsPage = defineType({
  name: 'eventsPage', title: 'Events page', type: 'document',
  fields: [
    text('pill', 'Small label at the top', 30),
    text('titleLine1', 'Title, first line', 20),
    text('titleLine2', 'Title, second line (in colour)', 20),
    text('intro', 'Text under the title', 160, { rows: 2 }),
    text('ctaTitle', 'Bottom block: title', 40),
    text('ctaText', 'Bottom block: text', 160, { rows: 2 }),
  ],
  preview: { prepare: () => ({ title: 'Events page' }) },
})
