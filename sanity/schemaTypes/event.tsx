import { defineField, defineType } from 'sanity'
import { EVENT_COLOURS, type EventColour } from '../../components/site/data'
import { cityList, colourList, forPersonas, link, text } from './fields'

export const event = defineType({
  name: 'event', title: 'Event', type: 'document',
  fields: [
    text('title', 'Title', 50, { required: true }),
    text('partner', 'Organiser (tag at the top of the card)', 30, { required: true, description: 'e.g. “hoi”, “GO!”, “hallig hanken”.' }),
    text('label', 'Type', 30, { required: true, description: 'e.g. “Ecosystem event”, “Incubator programme”. Also used as a filter on the events page, so reuse the same wording.' }),
    defineField({
      name: 'details', title: 'Details (one per line)', type: 'array', of: [{ type: 'string', validation: (r) => r.max(45) }],
      description: 'e.g. “12 November 2026 · 16:00” and “@ hallig hanken”. Up to 3 lines.',
      validation: (r) => r.max(3),
    }),
    defineField({
      name: 'colour', title: 'Card colour', type: 'string', initialValue: 'teal-blue',
      options: { list: colourList, layout: 'radio' }, validation: (r) => r.required(),
    }),
    forPersonas('Who is it for? (they see it first, marked “Picked for you”)'),
    defineField({
      name: 'city', title: 'Place on the map', type: 'string', options: { list: cityList },
      description: 'Leave empty to keep it off the map.',
    }),
    link('link', 'More info link (optional)'),
    defineField({ name: 'date', title: 'Date (for the order)', type: 'date', description: 'Events are shown soonest first. Undated ones come last.' }),
    defineField({ name: 'hideAfter', title: 'Hide after (optional)', type: 'datetime', description: 'Removes it from the site automatically.' }),
  ],
  orderings: [{ title: 'Date', name: 'dateAsc', by: [{ field: 'date', direction: 'asc' }] }],
  preview: {
    select: { title: 'title', label: 'label', date: 'date', colour: 'colour' },
    prepare: ({ title, label, date, colour }) => ({
      title,
      subtitle: [label, date].filter(Boolean).join(' · '),
      media: () => <span style={{ display: 'block', width: '100%', height: '100%', background: EVENT_COLOURS[colour as EventColour]?.gradient }} />,
    }),
  },
})
