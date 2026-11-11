'use client'

import { createContext, useContext } from 'react'
import { defaultContent, type SiteContent } from './content'

/* Hands the site content (from Sanity, or the defaults) to every component. */

const ContentContext = createContext<SiteContent>(defaultContent)

export function ContentProvider({ content, children }: { content: SiteContent; children: React.ReactNode }) {
  return <ContentContext.Provider value={content}>{children}</ContentContext.Provider>
}

export function useContent() {
  return useContext(ContentContext)
}
