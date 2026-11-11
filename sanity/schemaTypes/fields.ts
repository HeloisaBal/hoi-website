import { defineField } from 'sanity'
import { CITIES, EVENT_COLOURS, personas } from '../../components/site/data'

/* Field building blocks shared by the document types. The limits keep
   what editors type within what the design can show. */

export const personaList = personas.map((p) => ({ title: p.chip.replace(/^an? /, ''), value: p.id }))
export const cityList = Object.entries(CITIES).map(([value, c]) => ({ title: c.name, value }))
export const colourList = Object.entries(EVENT_COLOURS).map(([value, c]) => ({ title: c.title, value }))

/** A short text with a character limit (shown to the editor). */
export const text = (name: string, title: string, max: number, opts: { description?: string; required?: boolean; rows?: number; group?: string } = {}) =>
  defineField({
    name, title, group: opts.group,
    type: opts.rows ? 'text' : 'string',
    rows: opts.rows,
    description: [opts.description, `Max ${max} characters.`].filter(Boolean).join(' '),
    validation: (r) => (opts.required ? r.required().max(max) : r.max(max)),
  })

/** A photo with its description for screen readers. */
export const photo = (name: string, title: string, opts: { description?: string; group?: string } = {}) =>
  defineField({
    name, title, group: opts.group, type: 'image', description: opts.description,
    options: { hotspot: true },
    fields: [defineField({
      name: 'alt', title: 'What is in the photo? (for screen readers)', type: 'string',
      validation: (r) => r.max(120).custom((alt, ctx) => {
        const parent = ctx.parent as { asset?: unknown } | undefined
        return parent?.asset && !alt ? 'Please describe the photo' : true
      }),
    })],
  })

/** A list of short words or lines. */
export const words = (name: string, title: string, maxItems: number, maxLength: number, opts: { group?: string; description?: string } = {}) =>
  defineField({
    name, title, group: opts.group, description: opts.description, type: 'array',
    of: [{ type: 'string', validation: (r) => r.max(maxLength) }],
    validation: (r) => r.max(maxItems),
  })

/** Link to a page on this site ("/events") or another site ("https://…"). */
export const link = (name: string, title: string, group?: string) =>
  defineField({
    name, title, group, type: 'url',
    description: 'A page on this site ("/events", "/#contact") or a full address ("https://…").',
    validation: (r) => r.uri({ scheme: ['http', 'https', 'mailto'], allowRelative: true }),
  })

/** Position in a list: lower numbers come first. */
export const order = defineField({
  name: 'order', title: 'Position', type: 'number', initialValue: 10,
  description: 'Lower numbers come first.',
  validation: (r) => r.integer().min(0).max(999),
})

export const forPersonas = (title = 'For who') =>
  defineField({
    name: 'for', title, type: 'array', of: [{ type: 'string' }],
    options: { list: personaList, layout: 'grid' },
  })
