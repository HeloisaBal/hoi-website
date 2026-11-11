import { defineType } from 'sanity'
import { photo, text, words } from './fields'

/* All texts on the homepage, grouped by section (tabs at the top of the form).
   Anything left empty shows the built-in text. */

const g = (name: string, title: string) => ({ name, title })

export const homePage = defineType({
  name: 'homePage', title: 'Homepage', type: 'document',
  groups: [
    g('intro', '1 · Intro & hero'), g('events', '2 · What’s on'), g('journey', '3 · Journey'), g('map', '4 · Map'),
    g('sb', '5 · Science & business'), g('about', '6 · Founders'), g('partners', '7 · Partners'), g('contact', '8 · Contact'),
  ],
  fields: [
    text('introTitle', 'Intro: big title in the house window', 40, { group: 'intro', rows: 2, description: 'A line break starts a new line.' }),
    text('introSub', 'Intro: line under it', 60, { group: 'intro' }),
    text('heroPill', 'Hero: small label above “Hoi!”', 45, { group: 'intro' }),
    text('namePrompt', 'Hero: name question', 40, { group: 'intro' }),
    photo('heroPhoto', 'Hero: photo in the house shape', { group: 'intro', description: 'Shown after a visitor picks who they are. Portrait photos work best.' }),

    text('eventsEyebrow', 'Small label', 25, { group: 'events' }),
    text('eventsTitle', 'Title', 40, { group: 'events', description: 'When a visitor picked who they are, it says “Next up for founders” etc.' }),
    text('eventsMarquee', 'Big moving text behind the cards', 90, { group: 'events' }),

    text('journeyEyebrow', 'Small label', 25, { group: 'journey' }),
    text('journeyTitle', 'Title', 40, { group: 'journey', description: 'The stages themselves are under “Journey stages”.' }),

    text('mapEyebrow', 'Small label', 25, { group: 'map' }),
    text('mapTitle', 'Title', 40, { group: 'map' }),
    text('mapText', 'Text', 140, { group: 'map', rows: 2, description: 'The pins come from each event’s “Place on the map”.' }),

    text('sbEyebrow', 'Small label', 25, { group: 'sb' }),
    text('sbTitle', 'Title', 40, { group: 'sb' }),
    words('scienceWords', 'Science side (left column)', 8, 22, { group: 'sb' }),
    words('businessWords', 'Business side (right column)', 8, 22, { group: 'sb' }),

    text('aboutEyebrow', 'Small label', 25, { group: 'about' }),
    text('quote', 'Founder quote', 160, { group: 'about', rows: 3, description: 'Without quotation marks, they are added automatically.' }),
    text('quoteBy', 'Who said it', 70, { group: 'about', description: 'e.g. “Name · Startup · Programme”.' }),
    photo('aboutPhoto1', 'Photo 1', { group: 'about' }),
    photo('aboutPhoto2', 'Photo 2', { group: 'about' }),
    text('aboutLinkText', 'Link text', 30, { group: 'about' }),

    text('partnersTitle', 'Line above the partner logos', 70, { group: 'partners', description: 'The partners themselves are under “Partners”.' }),

    text('contactTitle', 'Title', 40, { group: 'contact', description: 'When the visitor gave their name it says “Hoi Anna, we’re listening.”' }),
    text('contactText', 'Text', 140, { group: 'contact', rows: 2 }),
    text('contactButton', 'Button', 24, { group: 'contact', description: 'The people shown next to it are under “Team”.' }),
  ],
  preview: { prepare: () => ({ title: 'Homepage' }) },
})
