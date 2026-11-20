import { defineArrayMember, defineField, defineType } from 'sanity'
import { LEGAL_LIMITS as L } from '../../lib/legal/limits'

/* ------------------------------------------------------------
   Legal pages (German law): Impressum (§ 5 DDG, § 18 MStV) and
   Datenschutzerklärung (Art. 13 GDPR). Plain text only.
   Have both checked by Hoi's legal or data protection advisor;
   the built-in draft is a starting point, not legal advice.
   ------------------------------------------------------------ */

const plain = 'Plain text. An empty line starts a new paragraph, a line starting with "- " becomes a list item. Web and email addresses become links.'

/** A heading with text, used for the free sections of both pages. */
export const legalSection = defineType({
  name: 'legalSection', title: 'Section', type: 'object',
  fields: [
    defineField({ name: 'heading', title: 'Heading', type: 'string', validation: (r) => r.required().max(L.heading) }),
    defineField({ name: 'text', title: 'Text', type: 'text', rows: 8, description: `${plain} Max ${L.text} characters.`, validation: (r) => r.required().max(L.text) }),
  ],
  preview: { select: { title: 'heading', subtitle: 'text' } },
})

const line = (name: string, title: string, max: number, description?: string, rows?: number) =>
  defineField({
    name, title, type: rows ? 'text' : 'string', rows,
    description: [description, `Max ${max} characters.`].filter(Boolean).join(' '),
    validation: (r) => r.max(max),
  })

export const impressum = defineType({
  name: 'impressum', title: 'Impressum', type: 'document',
  description: 'Required by German law on every business website (§ 5 DDG). Use the exact data from the commercial register.',
  fields: [
    line('organisation', 'Name and legal form', 120, 'Exactly as registered, e.g. "hoi startup factory GmbH".'),
    line('address', 'Address', 200, 'Street, postcode and city of the registered office. No P.O. box.', 3),
    line('representedBy', 'Represented by', 200, 'The managing directors (Geschäftsführer:innen) or board, e.g. "Vorname Name, Vorname Name".'),
    line('email', 'Email', 120, 'Leave empty to use the address under "Contact & links".'),
    line('phone', 'Phone', 40, 'Recommended: a second quick way to reach you.'),
    line('register', 'Register entry', 150, 'e.g. "Amtsgericht Bremen, HRB 12345 HB". Leave empty if not registered.'),
    line('vatId', 'VAT ID (USt-IdNr.)', 30, 'e.g. "DE123456789". Leave empty if there is none.'),
    line('responsible', 'Responsible for content (§ 18 Abs. 2 MStV)', 200, 'Name and address of one person.', 3),
    defineField({ name: 'sections', title: 'Further sections', type: 'array', of: [defineArrayMember({ type: 'legalSection' })], validation: (r) => r.max(L.sections) }),
  ],
  preview: { prepare: () => ({ title: 'Impressum' }) },
})

export const privacyPolicy = defineType({
  name: 'privacyPolicy', title: 'Datenschutzerklärung', type: 'document',
  description: 'Who is responsible is taken from the Impressum. Update this whenever the website starts using a new service.',
  fields: [
    defineField({ name: 'updated', title: 'Last updated (Stand)', type: 'date', validation: (r) => r.required() }),
    line('intro', 'Introduction', 600, undefined, 4),
    defineField({ name: 'sections', title: 'Sections', type: 'array', of: [defineArrayMember({ type: 'legalSection' })], validation: (r) => r.max(L.sections) }),
  ],
  preview: { prepare: () => ({ title: 'Datenschutzerklärung' }) },
})
