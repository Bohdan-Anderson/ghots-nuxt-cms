import type { SupabaseClient } from 'npm:@supabase/supabase-js@2'
import { resolveSiteId } from './fetchPage.ts'
import type { TemplateRow } from './types.ts'
import { errorResponse, jsonResponse, mapDbError } from './response.ts'

/**
 * Fetches all template rows for a site.
 */
export async function fetchTemplateList(
  supabase: SupabaseClient,
  siteKey: string,
): Promise<Response> {
  const siteId = await resolveSiteId(supabase, siteKey)
  if (siteId instanceof Response) return siteId

  const { data, error } = await supabase
    .from('templates')
    .select('*')
    .eq('site_id', siteId)
    .order('key', { ascending: true })

  if (error) {
    const mapped = mapDbError(error)
    return errorResponse(mapped.message, mapped.status)
  }

  return jsonResponse((data ?? []) as TemplateRow[])
}
