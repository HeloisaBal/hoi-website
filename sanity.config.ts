'use client'

/* Sanity Studio, the editing screen hoi uses, served at /studio. */

import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { dataset, projectId } from './sanity/env'
import { schema } from './sanity/schemaTypes'

export default defineConfig({
  basePath: '/studio',
  title: 'hoi website',
  projectId: projectId || 'not-connected',
  dataset,
  schema,
  plugins: [structureTool()],
})
