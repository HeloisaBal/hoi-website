import { defineField, defineType } from 'sanity'

/* ------------------------------------------------------------
   Highlight: the announcement bar at the top of every page
   (a partnership, a new programme, news). Start and end dates
   make it appear and disappear by itself. Limits keep the text
   short enough to fit on a phone.
   ------------------------------------------------------------ */

export const highlight = defineType({
  name: 'highlight',
  title: 'Highlight',
  type: 'document',
  fields: [
    defineField({
      name: 'title', title: 'Headline', type: 'string',
      description: 'One short line, e.g. "We’re partnering with TEDx". Max 70 characters.',
      validation: (r) => r.required().max(70),
    }),
    defineField({
      name: 'label', title: 'Label', type: 'string',
      description: 'Small tag before the headline, e.g. "Partnership" or "New". Max 20 characters.',
      validation: (r) => r.max(20),
    }),
    defineField({
      name: 'text', title: 'Extra line (optional)', type: 'string',
      description: 'Shown on wider screens only. Max 90 characters.',
      validation: (r) => r.max(90),
    }),
    defineField({
      name: 'link', title: 'Link (optional)', type: 'url',
      description: 'A page on this site ("/events") or a full address ("https://…").',
      validation: (r) => r.uri({ scheme: ['http', 'https'], allowRelative: true }),
    }),
    defineField({
      name: 'linkText', title: 'Link text', type: 'string',
      description: 'e.g. "Find out more". Max 24 characters.',
      initialValue: 'Find out more',
      validation: (r) => r.max(24),
    }),
    defineField({
      name: 'logo', title: 'Partner logo (optional)', type: 'image',
      description: 'Only use logos you are allowed to use (for TEDx: the logo the organisers give you).',
      fields: [defineField({ name: 'alt', title: 'Logo name for screen readers', type: 'string', validation: (r) => r.required() })],
    }),
    defineField({
      name: 'startAt', title: 'Show from', type: 'datetime',
      initialValue: () => new Date().toISOString(),
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'endAt', title: 'Hide after (optional)', type: 'datetime',
      description: 'Leave empty to keep it up until you remove it.',
      validation: (r) => r.custom((end, ctx) => {
        const start = (ctx.document as { startAt?: string } | undefined)?.startAt
        return !end || !start || end > start ? true : 'Must be after "Show from"'
      }),
    }),
    defineField({
      name: 'priority', title: 'Priority', type: 'number',
      description: 'If several highlights are live at once, the highest number is shown.',
      initialValue: 0,
      validation: (r) => r.integer().min(0).max(10),
    }),
  ],
  orderings: [{ title: 'Newest first', name: 'startDesc', by: [{ field: 'startAt', direction: 'desc' }] }],
  preview: {
    select: { title: 'title', label: 'label', startAt: 'startAt', endAt: 'endAt', media: 'logo' },
    prepare: ({ title, label, startAt, endAt, media }) => ({
      title,
      media,
      subtitle: [label, startAt && `from ${String(startAt).slice(0, 10)}`, endAt && `until ${String(endAt).slice(0, 10)}`].filter(Boolean).join(' · '),
    }),
  },
})
