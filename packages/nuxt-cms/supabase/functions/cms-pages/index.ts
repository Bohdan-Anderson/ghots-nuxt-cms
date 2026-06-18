import { createAnonClient } from '../cms-page/lib/auth.ts'
import { createPage } from '../cms-page/lib/createPage.ts'
import { deletePage } from '../cms-page/lib/deletePage.ts'
import { fetchPageList } from '../cms-page/lib/fetchPageList.ts'
import { corsPreflight, errorResponse } from '../cms-page/lib/response.ts'
import type { CreatePageBody } from '../cms-page/lib/types.ts'
import { parseJsonBody, requireAuth } from '../cms-page/lib/writeAuth.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return corsPreflight()

  const params = new URL(req.url).searchParams
  const siteKey = params.get('site_key')
  const pageSlug = params.get('page')

  if (!siteKey) {
    return errorResponse('site_key query parameter is required', 400)
  }

  if (req.method === 'GET') {
    const supabase = createAnonClient()
    return fetchPageList(supabase, siteKey)
  }

  if (req.method === 'POST') {
    const bodyOrError = await parseJsonBody<CreatePageBody>(req)
    if (bodyOrError instanceof Response) return bodyOrError

    const { slug, template_key, title } = bodyOrError

    if (!slug || !template_key) {
      return errorResponse('email, password, slug, and template_key are required', 400)
    }

    const clientOrError = await requireAuth(bodyOrError)
    if (clientOrError instanceof Response) return clientOrError

    return createPage(clientOrError, siteKey, {
      slug,
      templateKey: template_key,
      title,
    })
  }

  if (req.method === 'DELETE') {
    if (!pageSlug) {
      return errorResponse('site_key and page query parameters are required', 400)
    }

    const bodyOrError = await parseJsonBody<{ email: string; password: string }>(req)
    if (bodyOrError instanceof Response) return bodyOrError

    const clientOrError = await requireAuth(bodyOrError)
    if (clientOrError instanceof Response) return clientOrError

    return deletePage(clientOrError, siteKey, pageSlug)
  }

  return errorResponse('Method not allowed', 405)
})
