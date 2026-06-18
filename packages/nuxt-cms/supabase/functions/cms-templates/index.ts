import { createAnonClient } from '../cms-page/lib/auth.ts'
import { createTemplate } from '../cms-page/lib/createTemplate.ts'
import { deleteTemplate } from '../cms-page/lib/deleteTemplate.ts'
import { fetchTemplateList } from '../cms-page/lib/fetchTemplateList.ts'
import { corsPreflight, errorResponse } from '../cms-page/lib/response.ts'
import type { CreateTemplateBody } from '../cms-page/lib/types.ts'
import { parseJsonBody, requireAuth } from '../cms-page/lib/writeAuth.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return corsPreflight()

  const params = new URL(req.url).searchParams
  const siteKey = params.get('site_key')
  const templateKey = params.get('template_key')

  if (!siteKey) {
    return errorResponse('site_key query parameter is required', 400)
  }

  if (req.method === 'GET') {
    const supabase = createAnonClient()
    return fetchTemplateList(supabase, siteKey)
  }

  if (req.method === 'POST') {
    const bodyOrError = await parseJsonBody<CreateTemplateBody>(req)
    if (bodyOrError instanceof Response) return bodyOrError

    const { key, label } = bodyOrError

    if (!key || !label) {
      return errorResponse('email, password, key, and label are required', 400)
    }

    const clientOrError = await requireAuth(bodyOrError)
    if (clientOrError instanceof Response) return clientOrError

    return createTemplate(clientOrError, siteKey, { key, label })
  }

  if (req.method === 'DELETE') {
    if (!templateKey) {
      return errorResponse('site_key and template_key query parameters are required', 400)
    }

    const bodyOrError = await parseJsonBody<{ email: string; password: string }>(req)
    if (bodyOrError instanceof Response) return bodyOrError

    const clientOrError = await requireAuth(bodyOrError)
    if (clientOrError instanceof Response) return clientOrError

    return deleteTemplate(clientOrError, siteKey, templateKey)
  }

  return errorResponse('Method not allowed', 405)
})
