import { defineType } from 'sanity'
import { text } from './fields'

/* One document per visitor type (fixed list, see sanity/structure.ts).
   The colours of each persona stay in the code. */

export const persona = defineType({
  name: 'persona', title: 'Visitor type', type: 'document',
  fields: [
    text('chip', 'Button in the hero', 30, { required: true, description: 'Finishes “So, you’re…”, e.g. “a researcher with an idea”.' }),
    text('plural', 'Plural', 20, { required: true, description: 'Used in sentences: “Next up for researchers”.' }),
    text('word', 'One word for the colour change', 12, { required: true, description: 'Shown big when the page changes colour.' }),
    text('headline', 'Hero headline', 50, { required: true, description: 'The last words get the colour gradient.' }),
    text('line', 'Hero text', 160, { required: true, rows: 2 }),
    text('cta', 'Hero button', 28, { required: true }),
  ],
  preview: { select: { title: 'plural', subtitle: 'headline' } },
})
