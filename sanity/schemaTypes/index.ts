import type { SchemaTypeDefinition } from 'sanity'
import { chatbot } from './chatbot'
import { impressum, legalSection, privacyPolicy } from './legal'
import { event } from './event'
import { eventsPage } from './eventsPage'
import { highlight } from './highlight'
import { homePage } from './homePage'
import { journeyStage } from './journeyStage'
import { partner } from './partner'
import { persona } from './persona'
import { siteSettings } from './siteSettings'
import { teamMember } from './teamMember'

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [homePage, eventsPage, siteSettings, highlight, event, persona, journeyStage, partner, teamMember, chatbot, legalSection, impressum, privacyPolicy],
}

/** One-of-a-kind documents: no "create new", no delete (see structure.ts). */
export const SINGLETONS = ['homePage', 'eventsPage', 'siteSettings', 'chatbot', 'impressum', 'privacyPolicy'] as const
