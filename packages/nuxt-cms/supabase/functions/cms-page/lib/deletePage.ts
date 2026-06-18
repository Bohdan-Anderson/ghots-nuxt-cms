import type { SupabaseClient } from 'npm:@supabase/supabase-js@2'
import { resolvePage } from './fetchPage.ts'
import { normalizeSlug } from './slug.ts'
import type { DeleteResult } from './types.ts'
import { errorResponse, jsonResponse, mapDbError } from './response.ts'

/**
 * Deletes a page by site key and slug.
 */
export async function deletePage(
  supabase: SupabaseClient,
  siteKey: string,
  pageSlug: string,
): Promise<Response> {
  const slug = normalizeSlug(pageSlug)

  if (slug === '/') {
    return errorResponse('The home page cannot be deleted.', 400)
  }

  const page = await resolvePage(supabase, siteKey, slug)
  if (page instanceof Response) return page

  const { error } = await supabase.from('pages').delete().eq('id', page.id)

  if (error) {
    const mapped = mapDbError(error)
    return errorResponse(mapped.message, mapped.status)
  }

  const result: DeleteResult = {
    deleted: true,
    id: page.id,
    slug: page.slug,
  }

  return jsonResponse(result)
}
