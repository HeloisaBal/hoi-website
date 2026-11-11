import { draftMode } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'

/* Leaves preview mode (shows published content again). POST only, see the Next.js draft mode guide. */
export async function POST(request: NextRequest) {
  ;(await draftMode()).disable()
  return NextResponse.redirect(new URL('/', request.url), 303)
}
