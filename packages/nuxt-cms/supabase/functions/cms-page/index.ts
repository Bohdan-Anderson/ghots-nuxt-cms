import { createAnonClient } from './lib/auth.ts'
import { fetchPage } from './lib/fetchPage.ts'
import { corsPreflight, errorResponse } from './lib/response.ts'
import type { WriteRequestBody } from './lib/types.ts'
import { parseJsonBody, requireAuth } from './lib/writeAuth.ts'
import { postPage, putPage } from './lib/writePage.ts'

/**
 * Parses site_key and page query parameters from the request URL.
 */
function parseQuery(url: string): { site_key: string | null; page: string | null } {
  const params = new URL(url).searchParams
  return {
    site_key: params.get('site_key'),
    page: params.get('page'),
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return corsPreflight()

  const { site_key, page } = parseQuery(req.url)

  if (!site_key || !page) {
    return errorResponse('site_key and page query parameters are required', 400)
  }

  if (req.method === 'GET') {
    const supabase = createAnonClient()
    return fetchPage(supabase, site_key, page)
  }

  if (req.method === 'PUT' || req.method === 'POST') {
    const bodyOrError = await parseJsonBody<WriteRequestBody>(req)
    if (bodyOrError instanceof Response) return bodyOrError

    const { content } = bodyOrError

    if (!content) {
      return errorResponse('email, password, and content are required', 400)
    }

    const clientOrError = await requireAuth(bodyOrError)
    if (clientOrError instanceof Response) return clientOrError

    return req.method === 'PUT'
      ? putPage(clientOrError, site_key, page, content)
      : postPage(clientOrError, site_key, page, content)
  }

  return errorResponse('Method not allowed', 405)
})
